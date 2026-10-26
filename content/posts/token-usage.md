---
title: 8 个 agent 的账本，能不能放进同一张账单
project: token-usage
slug: token-usage
date: 2026-10-13
category: project
tags: [用量统计, sqlite, zstandard, 数据归一化, 零依赖]
summary: 本机 8 个编码 agent 各记各的账，SQLite、JSONL、Zstandard 事件流混在一起，连 input_tokens 的含义都不统一。这篇写怎么把它们归一成一张能横向比较的账单，以及一个有明文密钥躺在数据库里的事。
stack: [Node.js, node:sqlite, node:zlib, Zstandard, 原生 HTML]
status: shipped
updated: 2026-10-26
---

用了半年多编码 agent 之后，我发现自己答不上一个很简单的问题：

**钱花在哪了？**

pi、codex、opencode、grokbuild、dsh desktop、dsh web、hermes、minimax code —— 八个东西各记各的账，两个在 SQLite 里，一个在 Zstandard 压缩的事件流里，一个在 NAS 的 docker 卷里，还有几个的原始目录**已经被它自己删掉了**。

所以这个项目的目标不是做报表，是做一件更前面的事：**把它们说成同一种语言。**

<figure>
  <img src="/media/token-usage/dashboard-top.png" alt="用量统计面板顶部：汇总卡、用量热力图、按 agent 排行的柱状图">
  <figcaption>面板顶部：10.72B tokens、64,995 次调用、费用 $146.262 + ¥48.273，右边是按 agent 的排行</figcaption>
</figure>

## 它长什么样

一页静态 HTML。聚合数字在上，往下是热力图（一个格子一天）、排行（agent / provider / 模型 / 会话 / 趋势）、明细表。

往下是三张表，各回答一个问题。

**哪些 agent 在花钱：**

<figure>
  <img src="/media/token-usage/tables-agent.png" alt="Agent 对比表：8 个 agent 的会话数、调用数、输入输出、缓存命中、合计与费用">
  <figcaption>agent 对比 —— pi tui 4.53B / hermes 2.02B / dsh desktop 1.36B，费用按各源自带的价格算</figcaption>
</figure>

**这些钱花在哪些项目上：**

<figure>
  <img src="/media/token-usage/tables-source.png" alt="会话来源表：按项目/来源统计的会话、调用、输入输出、合计与费用">
  <figcaption>会话来源 —— 前几名是 cli、青风山居、codex、wt-dev；这一列是把「谁在烧钱」落到具体项目上的关键</figcaption>
</figure>

**同一个模型被谁服务、各花多少：**

<figure>
  <img src="/media/token-usage/tables-model.png" alt="Top 模型表：provider、模型、调用数、输入输出、缓存命中、合计与费用">
  <figcaption>Top 模型 —— 一个模型一行；provider 一列被脱敏成 <code>(codex session 数据源)…</code>、<code>(未登记 provider)</code>，费用查不到价就写「未知」</figcaption>
</figure>

能回答三个问题：

1. 总共花了多少（token 与钱）？
2. 哪个 agent / provider / 模型在花？
3. 什么时候花的（按天）？

## 八个源，八套口径

难的不是读数据，是**这八套数据互相不认识**：

| Agent | 环境 | 数据源 | 麻烦在哪 |
|---|---|---|---|
| pi tui | Windows 11 | cc-switch `~/.cc-switch/cc-switch.db` | 请求级 token + 原生 USD 价格 |
| codex | Windows 11 | 同上（当前库 + 轮转备份） | 原始 `~/.codex/` **已被删**，备份是唯一副本 |
| opencode | Windows 11 | 同上 + 日聚合表 | 原始 `~/.local/share/opencode` **也没了** |
| grokbuild | Windows 11 | 同上 + 日聚合表 | 同上 |
| dsh desktop | Windows 11 | `~/.dsh/sessions/*/*/session.v4.jsonl.zstd` | 要从 Zstandard 多帧事件流还原 per-message usage |
| dsh web | WSL2 Ubuntu-24.04 | 同上，经 `wsl.exe` | 本机 `\\wsl.localhost\` 不可达 |
| hermes | NAS docker（群晖） | `[NAS]:\hermes\hermes_data\profiles\*\state.db` | 唯一自带 cost 列，含企微 bot 会话 |
| minimax code | Windows 11 | `~/.minimax/v2/sqlite/runtime-state.sqlite` | 账本行的 `model` 是 `NULL` |

先说三个不解决就没法看的口径问题。

### 一、`input_tokens` 在不同源里不是同一个东西

有的源把 `input_tokens` 算**含** cacheRead，有的算**不含**。cc-switch 有一个 `input_token_semantics` 列（1 / 2）专门标这件事。不看这一列直接加总，算出来的缓存命中率能差出一倍。

处理方式：采集时按列判断，统一归一成「输入 / 输出 / 缓存读 / 缓存写」四个桶，再用 cc-switch 自己的聚合表交叉验证。

### 二、同一个调用，两边记的模型名不一样

这是最早困惑我的一个差异。同一批调用，pi 那边和 cc-switch 那边对不上 —— 一度以为是漏采。

真相是字段语义：

| 字段 | 含义 | 用它做什么 |
|---|---|---|
| `request_model` | 我请求的模型 | **展示用这个**（和 pi 的 `message.model` 一致） |
| `model` | 实际服务的模型（responseModel） | 留着备查 |
| `pricing_model` | 计价时查表的 key | 算钱用这个 |

例：一次 `request_model = cline-pass/deepseek-v4.1-flash` 被服务成 `model = vmc/deepseek-v4p1-flash-contributor-fallbacks`。

**数据一条没少，只是名字不同。** 所以「一个模型一行」这件事得先做归一化，否则排行表里同一个模型会被拆成好几行。

### 三、有的账本自带价格，有的没有

hermes 的 `session_model_usage` 自带 cost 列，cc-switch 带原生 USD 价。剩下的消费方没有价，只能用 `pricing.json` 按模型查表估算 —— 查不到的就显示「未知」，**不摊、不猜、不分母**。

面板里那句 `27,029/45,309 次调用已计价（60%）` 就是这条规则的结果。

## 数据源会自己清理，所以得留底

这是开工前没想到的：**cc-switch 会滚动删除明细**，而 codex 和 opencode 的原始目录早就被各自的工具删干净了。

所以采集器读的不是「一个库」，而是三个来源的并集：

```
cc-switch 当前库  ∪  本地归档（凝练过的历史） ∪  轮转备份库
```

并且专门写了一个脚本来证明这件事没白做：

```bash
node scripts/verify-archive.mjs
# 把备份全删掉之后重跑，总量不变 → 说明归一化后的归档确实撑住了
```

同理，`scripts/cc-switch-backup-diff.mjs` 是拿来回答「cc-switch 到底清理掉了多少历史」的 —— 不问清楚，你就不知道自己的账单缺了哪一块。

## 一次安全发现：明文密钥躺在数据库里

接 cc-switch 的时候顺手扫了一遍列，发现：

> `proxy_request_logs.provider_id` 里存着一个**明文 API 密钥**（形如 `sk-…`），被 130 行引用，且这个 id **不在 `providers` 表里** —— 是个孤儿值。

这跟「用量统计」没关系，但它在这个库里，而我的采集器正准备读这个库。

三条处置：

1. adapter **只 select `providers.name`**，从不把 `provider_id` 的值读出来；
2. 加一层 `lib/sanitize.mjs`，所有 provider / model / task / channel / title / cwd 出站前过一遍；
3. 事后自查 —— 因为第一次跑的时候，那条密钥**真的被写进了 `snapshot.json`**。修完重新生成，现在的验收是：

```bash
grep -c 'sk-' out/snapshot.json   # 0
```

脱敏层自己也闹过一次笑话：早期判据是「高熵字符串就是密钥」，结果把 `vmc/deepseek-v4p1-flash-contributor-fallbacks` 这种长模型名判成了密钥 —— **532 条假阳性**。改成「不含 `-` `/` `.` `:` 才算高熵」之后才正常。

教训很直白：**脱敏规则的误伤，会静默地把你的数据改坏**；而漏放，会静默地把密钥发出去。两个方向都得有验收。

## 零依赖，零常驻

这台 PC 同时还要打游戏，所以 PRODUCT.md 里写死了一条约束：**不依赖任何后台常驻服务**。

落成这样：

- 采集器只用 Node 内置模块（`node:sqlite` / `node:zlib` / `node:fs`），**零 npm 依赖**，没有构建步骤；
- 面板是**单文件原生 HTML**（`public/index.html`，2000 行，无框架），构建时把 snapshot 内联进 `<script type="application/json" id="snapshot-data">`；
- 所以 `out/index.html` **双击就能看**，不需要服务在跑；如果它是从 HTTP 上打开的，还会自动轮询刷新；
- 写 snapshot 用「写临时文件 + `rename`」，因为页面在轮询这个文件，绝不能让页面读到一半的内容。

想要个域名的话（`[NAS]` 是挂到本机的网络盘符，具体字母不写）：

```
# C:\Windows\System32\drivers\etc\hosts
127.0.0.1 token.use
```

```bash
node serve.mjs --dir [NAS]:/hermes/opt_data/tokens-usage --port 80
# 打开 http://token.use/
```

自启是 `start-token-use-hidden.vbs` 以隐藏窗口跑服务，**不需要提权**（实测 Windows 上普通用户能监听 80 端口）。

## 规模

| 指标 | 数值 |
|---|---|
| 采集源 | 8 个 agent |
| 采集器 | `collect.mjs` 550 行 + `lib/` 744 行 + `sources/` 1726 行 |
| 面板 | 单文件 HTML 2000 行，零框架 |
| 探针 / 验收脚本 | 15 个（都在 `scripts/`，一条命令可复现） |
| 一次全量采集 | 28,858 ms，849 会话 / 64,995 次调用 / 10.72B tokens |
| 依赖 | 0 个 npm 包（Node ≥ 22.5，实测 24） |

## 几个具体的坑

**① hermes 有两个 `state.db`，只有一个是对的。** 真正的主体在 `profiles/enderiose/state.db`（目录 999 MB，98 个 session）；`hermes_data/state.db` 只有 1 个 session，是个诱人的错误答案。

**② minimax 的账本行 `model` 是 `NULL`。** 它只记 token，不记模型名 —— 模型名得去会话表的 `extra_data_json.effectiveModel` 里取。这类「表里有个看起来该有值的列，其实永远是 NULL」的字段，不加断言就会静默算错。

**③ Zstandard 是多帧的，不是一整块。** dsh 的 `session.v4.jsonl.zstd` 由多个 frame 拼成，只解第一帧会少一大截。做完之后的对账是 177/177 与 `projcache` 的 totals 精确相等 —— 对不上就是还有帧没解。

**④ `\\wsl.localhost\` 从这台机器上不可达。** dsh web 的数据在 WSL2 里，路径能看见但读不动，最后走 `wsl.exe` 把命令送进去读。

**⑤ 页面用 `file://` 打不开。** 因为它要 `fetch('snapshot.json')`，跨 origin 直接失败。所以才有「把 snapshot 内联进 HTML」这一步 —— 顺带解决了「不想常驻服务」的需求。

## 回头看

**第一件，口径比数据重要。**

八个源里没有一个的数据是错的，但直接加在一起就是错的 —— `input_tokens` 语义不同、模型名指向不同层、有的带价有的不带。做这类项目，前半程基本都在做一件事：**确定每个字段到底在说什么**，并给每个判断配一条能复现的验证脚本。

那句「一个不能复现的结论，价值是零」在这是很具体的：`scripts/` 下 15 个脚本不是测试，是**我对每个口径判断的举证材料**。

**第二件，别人的库也会给你意外。**

明文密钥那件事不在需求里。但如果我按「只读需要的列」写 adapter，就永远不会发现它；反过来，如果我把整行 dump 出来图省事，那条密钥就会安静地出现在输出文件里 —— 而且第一版真的出现了。

所以现在的顺序是反的：**先想清楚哪些列绝不读出，再写读取。**

**第三件，抗清理比解析难。**

解析 zstd、解 SQLite、还原 per-message usage，这些都有确定答案；难的是数据源**在我脚下自己删东西**。所以采集器从一开始就按「当前库只是三个来源之一」来写，并且专门写脚本证明「备份删光了总量也不变」。

一个小项目做下来，最大的收获反而是两条纪律：**能不常驻就不常驻**（这台 PC 还要打游戏），**能举证就别断言**。

---

**项目信息**

- 项目：token-usage
- 类型：多端 agent token 用量采集器 + 静态面板
- 规模：`collect.mjs` 550 行 + `lib/` 744 行 + `sources/` 1726 行 · 面板 2000 行 · 15 个探针脚本 · 8 次提交
- 约束：零 npm 依赖、零常驻进程、单文件页面
- 入口：`node collect.mjs` → `out/index.html`
- 状态：日常在用（本地服务 `http://token.use/`）
