---
title: 给一个 Lua 插件配八道闸门
slug: lua-plugin-gates
date: 2026-09-13
category: pitfall
tags: [lua, ci, 门禁, 工程化, node]
summary: 没有单元测试的 WoW 插件，怎么保证 Agent 改完不出事？答案是把所有「静态可判定」的东西全部自动化。八道闸门的诞生过程，以及入库时踩的两个坑。
stack: [Node.js, luaparse, git hooks]
status: shipped
---

`AO_AccountOverview` 没有单元测试，而且**不可能有**。

WoW 插件的运行环境是游戏客户端：全局 API 只在游戏里存在，UI 对象必须在渲染帧里创建，很多行为只能靠 `/reload` 观察。想给它写单元测试，你得先造一个 WoW 运行时。

所以问题变成：

> Agent 改完代码，我怎么知道它没写错？

我的答案是：**把所有「静态可判定」的错误全部自动化拦下来**，剩下真正需要运行期验证的部分，才留给游戏内手动测试。

## 什么算「静态可判定」

我列了一遍 Agent 最容易犯、又完全不需要跑起来的错误：

| 错误类型 | 例子 | 能否静态判定 |
|---|---|---|
| 语法错误 | 少个 `end` | ✅ |
| 未定义引用 | 调了不存在的函数 | ✅（有盲区） |
| 跨插件符号 | 裸调 `BG.PlaySound` | ✅ |
| 编码问题 | UTF-8 BOM、CRLF | ✅ 按字节判 |
| i18n 缺键 | 三语文件不成对 | ✅ |
| 口径漂移 | 新增货币没进版本表 | ✅（可对比基线） |
| 旧写法回流 | 又写了 `for column = 1, 12` | ✅（模式匹配） |
| 打包漏文件 | 白名单外的文件进了包 | ✅ |
| **数据采集对不对** | 金币数取错了字段 | ❌ 只能跑 |
| **UI 排布正不正** | 列宽溢出 | ❌ 只能看 |

前 8 行就是闸门的职责边界。第 9、10 行是游戏内手动测试的保留地。

**关键认识**：闸门不追求覆盖一切，它追求的是「把不需要人看的部分全部消化掉」，好让人（和 Agent）的注意力集中在真正需要判断的地方。

## 八道闸门

`tools/` 下的 8 个脚本，由 `gates.js` 按固定顺序串起来：

```bash
node tools\gates.js          # 全跑
node tools\gates.js -q       # 只打失败
node tools\gates.js --list   # 看清单
```

顺序是 `luaparse → names → i18n → encoding → upstream → currency → checkbox`。

顺序不是随便定的 —— 语法错了后面全都没意义，所以 luaparse 排第一。

### 1. luaparse-check —— 语法唯一入口

```js
require('luaparse')  // luaVersion: "5.1"
```

递归扫全部 `.lua`，跳过 `.git`、`node_modules`、`tmp`。

**为什么要有「唯一入口」这个概念**：如果语法检查散落在多个地方，各用各的版本、各配各的跳过清单，迟早会出现「A 报错 B 不报」的分裂。唯一入口意味着**只有一个真相**。

### 2. undefined-name-check —— 三段机制

这是最复杂的一道，因为它要处理 Lua 的动态性：

1. **收集**：扫出所有定义的符号（local、全局、`C_` 命名空间成员）
2. **比对**：找出被引用但没被定义的
3. **白名单**：WoW 客户端的全局 API 由外部提供，必须放行

**它的已知盲区**（写在文档里，不装作不存在）：

- **chunk 根 local 整文件放行**。所以「函数 A 调用定义在它下面的 local B」查不出来 —— 载入不报错，运行期 `attempt to call a nil value`
- **只校 `C_命名空间.成员`，裸全局不在覆盖内**。因为数据源只能证明 API「存在」，不能证明「不存在」

第二条的代价我付过：`GetFriendshipReputation` 在 MoP Classic 5.5.4 **没有裸全局**，只有 `C_GossipInfo.GetFriendshipReputation`，而且后者返回**表**、前者历史上返回多值。只探裸全局的写法**不报错，只是整段静默短路** —— 比崩溃更难发现。

### 3. i18n-check —— 四段判据

`locales/` 下 zhCN / zhTW / enUS 三份，各 270 键，必须严格成对。

```bash
node tools\i18n-check.js --list-cjk   # 列出代码里剩余硬编码中文
```

四段判据覆盖：三语键集合是否一致、有没有孤儿键、代码里硬编码中文的分布、豁免区间（`i18n-exempt-start` / `i18n-exempt-end`）是否合法。

### 4. encoding-check —— 按字节判

两段范围：`.lua` 递归 + `tools/*.js` 与 `.githooks/*` 不递归。

逐文件按**字节**判 UTF-8 BOM 与 CRLF，`--fix` 就地剥 BOM、CRLF 转 LF（全程 Buffer）。

### 5. upstream-api-check —— 断链闸门

按 `.toc` 的加载清单取运行时文件，断言**零跨插件引用**。

这条对应红线 14：禁止把上游连接接回来。`.toc` 不得出现 `RequiredDeps` / `OptionalDeps`，源码不得引用 `BG.*` / `BiaoGe.*` / `BIAOGE_*`。

为什么这么狠？因为跨插件符号在文件作用域裸调，**上游小版本删掉那个公共函数，就是载入期整页报错** —— 而用户只会以为插件没装。

### 6. currency-gate-check —— 口径回归

从 `database.lua` **现场解析** `VERSIONS`、`CURRENCY_VERSION_LINEAGE`、`RESOURCE_DEFAULTS`，比较新旧口径的增删。

当前基线：`mop +19`、`cata +13`、`titan 0/0`。

这类闸门解决的是**口径漂移**：Agent 加了个新货币，忘了登记版本，跨角色显示就不一致。

### 7. checkbox-gate-check —— 拦旧写法

三段判据，专门拦「每个调用方各拼一套列预算」这种旧写法。旧写法一律报 FAIL，强制走唯一的 `GetProgressColumnState()`。

### 8. pack.js —— 打包回读校验

白名单生成发布集，打完用 `7z l -slt -ba` **回读**校验。当前基线 54 个文件。

「打完再读回来数一遍」这一步很重要 —— 打包脚本自己说「我打对了」是不可信的。

## 两道钩子：本地 CI

闸门要跑才有用。挂在 git 钩子上：

```bash
git config core.hooksPath .githooks
```

- `.githooks/pre-commit` —— `git diff --cached --check`（暂存区空白校验）+ 全闸门，失败挡提交
- `.githooks/pre-push` —— 再跑一遍全闸门，失败挡 push

两道保险的意义：**pre-commit 挡的是「我知道有问题但还是想提交」，pre-push 挡的是「我在分支上攒了一堆提交」**。

`core.hooksPath` 这个配置**不跟仓库走**，所以每台机器、每个 clone 都要挂一次。这一点写在了 `DEV.md` 的「快速命令」里。

## 入库时踩的两个坑

### 坑一：`.gitignore` 排目录要排内容

闸门脚本一开始被 `.gitignore` 排除。我想把它们纳进来，写了：

```gitignore
tools/
!tools/*.js
```

**没用。** git 不会重新纳入被排除目录里的文件。

正确写法是先排内容、再排除外：

```gitignore
tools/*
!tools/*.js
!tools/wow-api-snapshot.json
```

`.vscode` 同理。这个规则反直觉，而且**加多少 `!` 都不会生效**，容易在错误的方向上反复试。

### 坑二：改了字节，闸门全绿，内容是乱码

`encoding-check` 的第二段已经覆盖了 `tools/*.js` 和 `.githooks/*` 的 BOM / CRLF。

但它**查不出乱码** —— 乱码不是编码位问题。

`latin1` 读 + 默认 `utf8` 写，会把中文注释编成乱码，而且**全绿**。

所以规则是：**改 `tools/*.js` 的字节仍要自己看一眼内容**。闸门能管的和不能管的，必须写清楚。

## 判据要靠文档传承

入库只解决「脚本还在不在」。**判据本身仍然只靠文档传承。**

所以 `docs/DEV.md` 里有「模块职责速查（tools/）」表格，每个脚本一行说明；改完闸门必须同步更新那里。

`gates.js` 自己也有一行说明值得记：

> ⚠ 所有闸门以 `process.cwd()` 为扫描根，本脚本用 `cwd: ROOT` 显式 spawn。

如果哪天从子目录跑 `gates.js`，不加这一行就会扫错地方。

## 这套东西的代价与收益

**代价**：

- 8 个脚本，每个都要维护判据、处理边界、写文档
- 闸门本身也会出错，需要「闸门的闸门」（比如 `encoding-check` 查不出乱码这件事，只能靠人）
- 每次新增约束，都要想清楚「它能不能静态判定」，否则会写出一个永远 FAIL 或者永远 PASS 的假闸门

**收益**：

- Agent 改完代码，一条 `node tools\gates.js` 就能筛掉绝大多数低级错误
- 我可以把注意力放在「这个功能设计对不对」而不是「有没有写错符号」
- 321 次提交里，**没有一次是因为低级错误进到游戏里才发现**

最后一条是真正的价值。Agent 的产出速度太快了，如果验证跟不上，快就是负资产。

## 后来

这套东西我原样搬到了后面的每个项目上。语言不同、工具不同，但结构是一样的：

1. 先列出**静态可判定的错误清单**
2. 每个错误配一道闸门
3. 用一条命令串起来
4. 挂在 git 钩子上
5. **把闸门的盲区写进文档**，不要假装它没有

第 5 条最容易被跳过，也最重要。一道不说清自己盲区的闸门，会让人产生「全绿 = 没问题」的错觉 —— 而那正是最危险的时刻。
