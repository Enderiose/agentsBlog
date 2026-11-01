---
title: 9 个 agent 的账本，能不能放进同一张账单
project: token-usage
slug: token-usage
date: 2026-10-13
category: project
tags: [用量统计, sqlite, zstandard, 数据归一化, 零依赖]
summary: 本机 9 个编码 agent 各记各的账，SQLite、JSONL、Zstandard 事件流混在一起，连 input_tokens 的含义都不统一，provider 和模型名还有两套写法。这篇写怎么把它们归一成一张能横向比较的账单：12.42B tokens、73,346 次调用，以及一个有明文密钥躺在数据库里的事。
stack: [Node.js, node:sqlite, node:zlib, Zstandard, 原生 HTML]
status: shipped
updated: 2026-11-01
---

用了半年多编码 agent 之后，我发现自己答不上一个很简单的问题：

**钱花在哪了？**

pi、codex、opencode、opencode tui、grokbuild、dsh desktop、dsh web、hermes、minimax code —— 九个东西各记各的账：有的在 SQLite 里，有的在 Zstandard 压缩的事件流里，有的在 NAS 的 docker 卷里，还有几个的原始目录**已经被它自己删掉了**。

所以这个项目的目标不是做报表，是做一件更前面的事：**把它们说成同一种语言。**

<figure>
  <img src="/media/token-usage/dashboard-top.png" alt="用量统计面板顶部：汇总卡、用量热力图、按 agent 排行的柱状图">
  <figcaption>面板顶部：12.42B tokens、73,346 次调用、费用 $166.202 + ¥48.273，右边是按 agent 的排行</figcaption>
</figure>

## 它长什么样

一页静态 HTML。聚合数字在上，往下是热力图（一个格子一天）、排行（agent / provider / 模型 / 会话 / 趋势）、明细表。

往下是三张表，各回答一个问题。

**哪些 agent 在花钱：**

<figure>
  <img src="/media/token-usage/tables-agent.png" alt="Agent 对比表：8 个 agent 的会话数、调用数、输入输出、缓存命中、合计与费用">
  <figcaption>agent 对比 —— pi tui 5.08B / hermes 2.14B / dsh desktop 1.36B，费用按各源自带的价格算</figcaption>
</figure>

**这些钱花在哪些项目上：**

<figure>
  <img src="/media/token-usage/tables-source.png" alt="会话来源表：按项目/来源统计的会话、调用、输入输出、合计与费用">
  <figcaption>会话来源 —— 前几名是 cli（11,038 次调用）、青风山居（6,139）、(未标注)（6,186）、codex；这一列是把「谁在烧钱」落到具体项目上的关键</figcaption>
</figure>

**同一个模型被谁服务、各花多少：**

<figure>
  <img src="/media/token-usage/tables-model.png" alt="Top 模型表：provider、模型、调用数、输入输出、缓存命中、合计与费用">
  <figcaption>Top 模型 —— 一个模型一行，provider 一列把同一模型的所有中转站并列（<code>B.AI · cline-pass 等 7 家</code>）；费用查不到价就写「未知」</figcaption>
</figure>

能回答三个问题：

1. 总共花了多少（token 与钱）？
2. 哪个 agent / provider / 模型在花？
3. 什么时候花的（按天）？

## 九个源，九套口径

难的不是读数据，是**这九套数据互相不认识**：

| Agent | 环境 | 数据源 | 麻烦在哪 |
|---|---|---|---|
| pi tui | Windows 11 | cc-switch `~/.cc-switch/cc-switch.db` | 请求级 token + 原生 USD 价格 |
| codex | Windows 11 | 同上（当前库 + 轮转备份） | 原始 `~/.codex/` **已被删**，备份是唯一副本 |
| opencode | Windows 11 | 同上 + 日聚合表 | 原始 `~/.local/share/opencode` **也没了** |
| grokbuild | Windows 11 | 同上 + 日聚合表 | 同上 |
| opencode tui | Windows 11 | `~/.local/share/opencode/opencode.db` | OpenCode **自带账本**：逐条 assistant 消息的 token + 原生 USD cost |
| dsh desktop | Windows 11 | `~/.dsh/sessions/*/*/session.v4.jsonl.zstd` | 要从 Zstandard 多帧事件流还原 per-message usage |
| dsh web | WSL2 Ubuntu-24.04 | 同上，经 `wsl.exe` | 本机 `\\wsl.localhost\` 不可达；WSL 内也是 187 个 session 文件（数据与桌面端不同，数字纯属巧合） |
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

归一化在 `lib/model.mjs` 里，只折三层：厂商命名空间（`cline-pass/`）、端点前缀（`global:` / `cn:`）、尾部发布日期（`-1017` / `-20251017`）。折完再计价（价目表按原始拼法匹配），原始拼法保留在 `rawModel` 和快照的 `modelAliases` 里。

效果是模型榜从 **78 行降到 38 行**（后来又接了两个源，现在 45 行）：`deepseek-v4.1-flash` 的三个拼法合成一行 —— 现在 47,851 次调用、8.84B tokens，provider 一列并列七家。

但归一化不能过头：`step-5-preview`、`mimo-v2.5-pro` 这些名字相近的确实是不同模型；大小写也一律不折，因为 `qwen2.5-coder:7b-instruct-q4_K_M` 是本地模型的 tag，大小写敏感。

### 三、有的账本自带价格，有的没有

hermes 的 `session_model_usage` 自带 cost 列，cc-switch 带原生 USD 价。剩下的消费方没有价，只能用 `pricing.json` 按模型查表估算 —— 查不到的就显示「未知」，**不摊、不猜、不分母**。

面板里那句 `36,800/73,346 次调用已计价（50%）` 就是这条规则的结果。

### 四、provider 也是各写各的

模型名归一完，排行榜还是不对：同一家 provider 在三个源里叫三个名字。

- cc-switch 里自定义厂商存成 `custom:workbuddy`，hermes 里叫 `workbuddy`；
- 有的流量 provider 是 `(unknown)`，看模型能认出是 B.AI；
- 小米的三条计费线名字不同，其实是同一个 token 套餐；
- 最麻烦的是三个 `provider_id` 是裸 UUID —— 它们在 `providers` 表里没有记录，是孤儿值。

所以有 `lib/provider.mjs`：按 `(provider, model)` 的归属规则匹配，`providers.json` 里写死映射；UUID 型的 id 取 sha256 指纹的前几位当替身（既不丢失区分度，也不会把密钥类的值带出去）。

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
- 面板是**单文件原生 HTML**（`public/index.html`，2025 行，无框架），构建时把 snapshot 内联进 `<script type="application/json" id="snapshot-data">`；
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
| 采集器 | `collect.mjs` 560 行 + `lib/` 744 行 + `sources/` 2185 行 |
| 面板 | 单文件 HTML 2025 行，零框架 |
| 探针 / 验收脚本 | 16 个，合计 1416 行（都在 `scripts/`，一条命令可复现） |
| 一次全量采集 | 32.6 s，915 会话 / 73,346 次调用 / 12.42B tokens / 71 天 |
| 依赖 | 0 个 npm 包（Node ≥ 22.5，实测 24） |

## 几个具体的坑

**① hermes 有两个 `state.db`，只有一个是对的。** 真正的主体在 `profiles/enderiose/state.db`（目录 999 MB，98 个 session）；`hermes_data/state.db` 只有 1 个 session，是个诱人的错误答案。

**② minimax 的账本行 `model` 是 `NULL`。** 它只记 token，不记模型名 —— 模型名得去会话表的 `extra_data_json.effectiveModel` 里取。这类「表里有个看起来该有值的列，其实永远是 NULL」的字段，不加断言就会静默算错。

**③ Zstandard 是多帧的，不是一整块。** dsh 的 `session.v4.jsonl.zstd` 由多个 frame 拼成，只解第一帧会少一大截。做完之后的对账是 177/177 与 `projcache` 的 totals 精确相等 —— 对不上就是还有帧没解。

**④ `\\wsl.localhost\` 从这台机器上不可达。** dsh web 的数据在 WSL2 里，路径能看见但读不动，最后走 `wsl.exe` 把命令送进去读。

**⑤ 页面用 `file://` 打不开。** 因为它要 `fetch('snapshot.json')`，跨 origin 直接失败。所以才有「把 snapshot 内联进 HTML」这一步 —— 顺带解决了「不想常驻服务」的需求。

**⑥ opencode tui 的「消息判别字段」取错了地方。** 这个源刚接上时只认出 5 条消息，模型分布全归到「会话当前模型」。原因是判别字段在 `session_message.type` 这一列上，不在 `data` JSON 里；而且旧预筛用了 `like '%assistant%'`，实测 130 条 assistant 消息里只有 36 条文本含这个词，**三分之二的用量被 SQL 层直接筛掉了**。修成 `like '%"tokens"%'` + 从列取值之后，调用数从 5 变成 140，现在是 3,687。另外两张表（`session_v2`/`session`、`session_message`/`message`）里存在同 id 同 token 的重复行，必须按 id 去重。

**⑦ hermes 的会话是跨天的，一行不能记在第一天。** `session_model_usage` 一行代表一个会话在一个模型上的**累计**，时间范围是 `first_seen` → `last_seen`。一个活了一周的会话，整行的 token 全记到 `first_seen` 那天，那天就会虚高、后面几天全是 0 —— 这是这份数据里**日级误差的最大来源**。修法：按会话的 assistant 消息时间戳把这行摊到各天（宽一天的窗口，取不到就退回整个会话），成本也按同样的比例拆。

**⑧ 会话数不能用计数器。** 面板一开始在每个维度上累加「会话 +1」，结果 workbuddy 报 207 个会话，而实际参与统计的只有 137 个 —— 因为一个会话可能通过多个 provider、多个模型到达同一个维度。改成 `Set<sessionId>` 之后数字才对得上，`均 80 次/会话` 这类派生指标也才有意义。

## 现状与欠债

- **一半的调用没有价。** 36,800/73,346 有显式价目（50%），剩下的按规则显示「未知」。dsh 两个源完全没有价格字段，hermes 只有一部分行带 cost；补价只能靠猜，所以我选择不猜。
- **指标条上的「已计价」比例刚修过一次。** 原来是按会话列表累加 `costSource`，只统计了有模型归属的调用（22,378 条调用被漏掉），显示 65%；改成按每个 agent 的 totals 累加才与顶部「调用」口径一致（50%）。
- **面板没有自动化测试。** 16 个探针都在采集侧，面板本身只有肉眼验收 —— 上面那条比例 bug 就是肉眼看不出来的那种。
- **归档依赖 cc-switch 的轮转备份。** 如果哪天它把备份也清了，codex / opencode / grokbuild 的历史就只剩已经生成过的 snapshot。

## 回头看

**第一件，口径比数据重要。**

九个源里没有一个的数据是错的，但直接加在一起就是错的 —— `input_tokens` 语义不同、模型名指向不同层、provider 各写各的、有的带价有的不带。做这类项目，前半程基本都在做一件事：**确定每个字段到底在说什么**，并给每个判断配一条能复现的验证脚本。

那句「一个不能复现的结论，价值是零」在这是很具体的：`scripts/` 下 16 个脚本不是测试，是**我对每个口径判断的举证材料**。

**第二件，别人的库也会给你意外。**

明文密钥那件事不在需求里。但如果我按「只读需要的列」写 adapter，就永远不会发现它；反过来，如果我把整行 dump 出来图省事，那条密钥就会安静地出现在输出文件里 —— 而且第一版真的出现了。

所以现在的顺序是反的：**先想清楚哪些列绝不读出，再写读取。**

**第三件，归一化的危险在「折多了」。**

模型名和 provider 都是同一个问题：数据里没有唯一真源，只有一堆写法。折得不够，榜单一堆一行一个拼法；折得过头，两个真不一样的模型会被合并成一行，而且**合并后的数字看起来更漂亮**，你不会发现。所以每条折法都得配反例：日期后缀可以折，`step-5-preview` 的 `-preview` 不能折；`custom:workbuddy` 可以折掉前缀，`qwen2.5-coder:7b-instruct-q4_K_M` 的大小写不能动。

**第四件，抗清理比解析难。**

解析 zstd、解 SQLite、还原 per-message usage，这些都有确定答案；难的是数据源**在我脚下自己删东西**。所以采集器从一开始就按「当前库只是三个来源之一」来写，并且专门写脚本证明「备份删光了总量也不变」。

一个小项目做下来，最大的收获反而是两条纪律：**能不常驻就不常驻**（这台 PC 还要打游戏），**能举证就别断言**。

---

**项目信息**

- 项目：token-usage
- 类型：多端 agent token 用量采集器 + 静态面板
- 规模：`collect.mjs` 560 行 + `lib/` 744 行 + `sources/` 2185 行 · 面板 2025 行 · 16 个探针脚本 · 11 次提交
- 约束：零 npm 依赖、零常驻进程、单文件页面
- 入口：`node collect.mjs` → `out/index.html`
- 状态：日常在用（本地服务 `http://token.use/`）
