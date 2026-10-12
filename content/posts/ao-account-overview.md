---
title: AO_AccountOverview — 我的第一个 Agent 项目
slug: ao-account-overview
date: 2026-08-31
category: project
tags: [wow, lua, codex, 插件, 工程化]
summary: 一个魔兽怀旧服的账号级角色概览插件。18 天、321 次提交、3.4 万行 Lua，从 codex 起步，最后长成了一套自带闸门和子代理的完整工程。
stack: [Lua 5.1, WoW API, Node.js, codex, pi]
status: shipped
featured: true
---

这是起点。

在它之前，我对「让 AI 写代码」的理解还停留在补全和改错。在它之后，我才知道自己真正在搭的是一套**让 Agent 能长期干活的工程**。

## 它是什么

`AO_AccountOverview` 是一个魔兽世界怀旧服的插件。解决的问题很朴素：

> 我有十几个角色，每次想知道「谁的金币最多」「谁的团本 CD 还锁着」「谁的裁缝洗布好了」，都得挨个登录一遍。

插件的做法是：**每个角色登录时，把等级、装等、金币、货币、副本进度、专业 CD 存进账号级存档**，然后在概览窗口里跨角色汇总显示。

鼠标悬停小地图图标就展开概览窗口，或者 `/bgao`。左键开合，右键进设置页。

关键约束是：**独立运行，不依赖也不读取其它插件**。它只做只读观察，不加载也不修改别人。

## 规模

| 指标 | 数值 |
|---|---|
| 起始日期 | 2026-08-31 |
| 最后一次提交 | 2026-09-17 |
| 提交数 | 321 |
| Lua 代码 | 34,715 行 |
| 首次开发工具 | codex |

18 天，321 次提交 —— 平均每天 18 次。这个密度不是我手速快，而是 Agent 把「写代码」这一步的成本压到了接近零，代价是**验证成了唯一瓶颈**。

## 架构：一个数据层，五扇窗口

插件的加载顺序由 `.toc` 定义，不可随意调换：

```lua
-- AO_AccountOverview.toc（节选）
core\version.lua
core\locale.lua
Libs\embeds.xml
core\database.lua      -- 数据定义 + 迁移 + 采集 + 校验 + 声望
core\core.lua          -- 概览窗口与刷新逻辑
core\widgets.lua       -- UI 控件工厂
core\options.lua       -- 设置页壳 + 事件调度
core\options_utils.lua
core\options_resource.lua
core\options_progress.lua
core\options_detection.lua
```

数据层 `database.lua` 有 **2879 行**，一个文件干完了一个数据层的活：定义、迁移、采集、校验、声望。全仓最大。

设置页原本是**单个 3500 行的 `options.lua`** —— 直到撞上 Lua 5.1 的硬上限：**单个文件最多 200 个 local 变量**。于是按职责拆成 5 个文件：

```
options_utils.lua     (400 行)
options_detection.lua (883 行)
options_resource.lua  (421 行)
options_progress.lua  (915 行)
options.lua          (1467 行)  ← 壳 + 首页 + 角色页 + 事件调度
```

这个限制在写代码前根本想不到。它不是「代码风格问题」，是**编译期直接失败**，而且报错信息不会告诉你是 local 数量超了。

## 工程化：闸门、钩子、子代理

这是这个项目里最有价值的部分，也是我后来所有 Agent 项目的模板。

### 八道闸门，一条命令

`tools/` 下有 8 个校验脚本，`gates.js` 按固定顺序串起来跑：

```bash
# 一键跑全部闸门（推荐入口）
node tools\gates.js

# -q 只打失败，--list 看清单
node tools\gates.js -q
```

顺序是 `luaparse → names → i18n → encoding → upstream → currency → checkbox`。

| 闸门 | 管什么 |
|---|---|
| `luaparse-check.js` | Lua 5.1 语法校验，唯一入口 |
| `undefined-name-check.js` | 名字闸门：未定义引用、跨插件符号、`C_` 命名空间存在性 |
| `i18n-check.js` | 三语文件是否成对、代码里还有多少硬编码中文 |
| `encoding-check.js` | UTF-8 BOM 与 CRLF（按字节判，`--fix` 就地修） |
| `upstream-api-check.js` | 断链闸门：断言零跨插件引用 |
| `currency-gate-check.js` | 货币版本口径增删回归 |
| `checkbox-gate-check.js` | 勾选入口筛子，拦旧写法 |
| `pack.js` | 发布打包，打完用 `7z l -slt -ba` 回读校验 |

### 两道钩子，本地 CI

```bash
# 每台机器 / 每个 clone 挂一次（配置不跟仓库走）
git config core.hooksPath .githooks
```

- `pre-commit`：`git diff --cached --check` + 全闸门，失败挡提交
- `pre-push`：再跑一遍全闸门，失败挡推送

### 子代理分工

`.pi/agents/` 下三个只读子代理，`.codex/agents/` 下两个：

- `ao-code` —— 本仓库代码检索专家：「X 在哪 / 谁调用 X / 这段逻辑走什么口径」，返回压缩结论 + `file:line` 证据
- `wow-api` —— WoW API 查询
- `wowdata` —— 游戏数据（Spell / Item / Creature）查询

约定是**禁止猜测，必须查证**。Agent 最容易犯的错就是「这个 API 应该长这样」，然后在运行期静默失败。

### 文档即规格

```
docs/
├── SPEC.md      项目地图：加载顺序、数据模型、事件流、列预算、17 条红线
├── PLAN.md      功能排期：已排期 / 已否决
├── DEV.md       开发者操作手册：闸门判据、编码约定、i18n 工作流
├── CHANGELOG.md 上游 BGLite 同步记录
└── handoff.md   会话交接
```

`AGENTS.md` 是索引，14KB。其中 **§9「踩过的坑」** 是硬性要求：

> 踩过的坑每次都要更新在这里，简洁明了的总结，不易长篇大论。

这一条规则，是整个项目里我最庆幸写下的。

## 踩过的坑

下面每一条都是真金白银换的，原文记在 `AGENTS.md` §9 和 `docs/SPEC.md` 的 17 条红线里。

### 1. 做完一版才发现：它就是现有表的转置

2026-09-14，我想加一个「周常矩阵」面板：**行 = 角色，列 = 本周事项**。

做完一版才反应过来 —— 概览本身就是这张表。`RefreshOverview` 就是「行 = 角色 × 列 = 勾选的进度条目」，而 MoP 团本又是周锁，格子里的 `x/y` 就是「本周打到第几个」。

换排布 = 给同一个 `progress` 字段多开一个渲染出口，**以后改判据必漏一边**。

功能已撤销，代码当作放弃。留下的判据是：

> **判据不是「看起来不一样」，而是「数据源与判据函数是不是同一批」。**

### 2. 两扇窗的列预算不能共用一份实测列宽

概览有两扇窗：进度窗和资源窗。我一开始让资源窗复用了进度窗的平均列宽。

结果：进度勾得少时平均列宽虚高，资源上限被带到 10 以下；反过来把进度+声望的**列数**加进资源闸门，进度勾多了资源直接锁死。两个方向都错。

还有一个更隐的坑：尺寸层返回前会把 `extraWidth` 摊到第 2..n 列上填满窗口，**摊平后的列宽不能拿来推预算** —— 只勾 3 列时一列被算成 ~190px，反推预算 = 3，越勾不上越算不出来。

正解：用 `naturalDataColumnWidth`，两扇窗各自一份实测值。

### 3. Lua 的函数定义顺序，载入期不报错

Lua 函数体按**编译时的词法作用域**绑 upvalue：

```lua
local function A()
  B()          -- B 定义在 A 下面 → 这里是「全局读」
end
local function B() end
```

载入不报错，运行期 `attempt to call a nil value`。而名字闸门对 chunk 根 local 是**整文件放行**的，报不出来。

两种正确写法：定义挪到被调用者之后，或者**前向声明 + 后面赋值**：

```lua
local F
F = function() ... end
```

别把被调函数往上搬 —— 会牵动它自己的依赖。

### 4. `wow-api-snapshot.json` 只能判「名字在不在」

我拿它判断 API 的返回结构，被误导了一次 —— 派出去的 `wow-api` 子代理还超时了 30 分钟。

两个陷阱：

- 它只压了**名字集合**，没有返回结构
- `bare` 段是从 `functions[].Name` 收的，**带命名空间的函数其裸名也会混进 `bare`**。`GetFriendshipReputation` 在里面出现，并不代表裸全局存在

正解是**先读本地静态包**（30 秒出结果，不会超时）：

```
tmp/wowapimcp/package/data/{classic,live,classic_era,classic_anniversary}.json
```

里面有 `functions[].Arguments / Returns` 与 `tables[].Fields`。

### 5. 整块重建的表，加字段必须同步加进表字面量

`SaveCurrentCharacterInternal` 是**整块重建** `data.characters[key]`：

```lua
data.characters[key] = { ... }   -- 表字面量
```

给它加持久化字段，必须**同时**加进那张表字面量。没列进去的字段，下一次角色保存就被抹掉。

`reputationFormat` 就这么丢过 —— 存档里 5 个角色全无这个键，设置页的版本号判据因此形同不存在。

排查手法：直接读 `WTF/Account/<账号>/SavedVariables/AO_AccountOverview.lua`，花括号配对切块比对。

### 6. `.gitignore` 排目录要排内容

```gitignore
# 错：加多少 ! 都没用
tools/
!tools/*.js

# 对
tools/*
!tools/*.js
```

git **不会重新纳入被排除目录里的文件**。这条坑了我一次，`.vscode` 同理。

### 7. 改 `tools/*.js` 的字节，闸门全绿但内容是乱码

`encoding-check` 管 BOM 和 CRLF，但**查不出乱码** —— 乱码不是编码位问题。

`latin1` 读 + 默认 `utf8` 写，会把中文注释编成乱码，而且全绿。

### 8. 子代理定义里的两个字段会直接顶掉启动

`.pi/agents/*.md` 的 frontmatter 里：

- `thinking: low` 被拼成 `模型:low`
- `async: false`（前台子代理不加载 ambient 扩展）让自定义 provider 解析不到

两者报的都是 `Model not found`，看起来像模型表坏了。**删掉字段就好。**

验「有没有被发现」用 `subagent({action:"list",capabilities:true})`，不要靠猜。

## 17 条红线

项目最后沉淀出 17 条红线，写在 `docs/SPEC.md` 里。挑几条最能说明问题的：

> **1. 禁止全局轮询** —— 资源检查必须事件驱动。获取窗口期（30 秒）内允许 3 秒定向轮询兜底。

> **6. 战斗中禁止写库/刷新 UI** —— 战斗事件只标记 pending，`PLAYER_REGEN_ENABLED` 后统一处理。

> **8. 持久化时间戳统一用 `NowSeconds()`** —— 写入与比较必须同源，本地时钟与服务器时钟混用会把「本周击杀」判错。

> **11. 概览行/列一律按需生成，截断必须可见** —— 禁止 `for column = 1, 12`、`table.remove` 这类静默砍尾。

> **15. 裸全局 API 必须做客户端可用性守卫** —— 老式 WoW 全局（`UnitBuff` 一类）在新客户端可能整体消失，直接调用抛 `attempt to call a nil value`，而且**载入期不报错、闸门也看不见**。

> **16. 设置页改勾选必须自己刷概览窗口** —— 漏了就是用户报的「勾了 11 列、表里只有 7 列」。

> **17. `SaveCurrentCharacterInternal` 是整块重建表** —— 加字段必须同时加进那张表，没列进去的下一次保存就被抹掉。

红线的价值不在于「记录正确做法」，而在于**它们是 Agent 不会自动知道的隐性约束**。写下来，Agent 才不会在下一次改动里重新踩一遍。

## 已知的债

诚实记录，不粉饰：

- `database.lua`（2879 行）仍然是「一个文件干了一个数据层」，全仓最大
- `locales/` 三语各 270 键严格成对，但 `database.lua` 里还有 **228 处硬编码简体中文**。多数是货币名兜底值 —— 改造成本高（228 处 × 3 语）而收益低，所以留着
- **无测试框架**。验证方式只有 luaparse 语法检查 + 游戏内 `/reload` 手动测试
- `Libs/` 还躺在仓库里，但 `.toc` 早已不加载其中任何一份

最后一条最值得说：**这个项目没有单元测试，但它有八道闸门**。

闸门替代不了测试，但它覆盖了 Agent 最容易犯的那类错：语法、未定义引用、编码、跨插件断链、口径漂移。这些都是**静态可判**的。

而真正需要运行期验证的（数据采集对不对、UI 排布正不正），只能靠游戏内 `/reload`。这是这个技术栈的物理限制，没有绕过去的办法。

## 回头看

18 天，从「用 codex 写个插件」到「一套自带闸门、钩子、子代理和完整文档的工程」。

真正的转折点是某一次会话里我意识到：**Agent 写完代码就跑，而我不知道它写的东西对不对**。

于是我开始做两件事：

1. **把能静态判定的东西全部自动化** —— 这就是八道闸门
2. **把不能静态判定的东西写下来** —— 这就是 17 条红线和 §9 踩坑记录

这两件事后来成了我所有 Agent 项目的底座。这个博客本身，也是从这套东西里长出来的。

---

**项目信息**

- 类型：WoW 怀旧服插件（Lua 5.1）
- 规模：34,715 行 / 321 commits / 18 天
- 状态：已交付并持续维护
