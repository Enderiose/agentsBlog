---
title: 把 Hermes 装进手机：没有 Gradle 的 131945 字节 Android 客户端
slug: hermes-mobile-apk
date: 2026-10-12
category: project
tags: [android, webview, 工程化, 测试, 教训]
summary: 为了在手机上用自己的 Hermes，我绕开 Android Studio 和 Gradle，用 aapt2 + javac + d8 手搓了一个 WebView 客户端。这篇记录它的构建链和六个真实的坑。
stack: [Android WebView, Java, JavaScript, aapt2/d8, Playwright]
status: shipped
featured: false
---

起因很小：我白天在电脑上跟 Hermes（我自建的 agent）干活，晚上人挪到沙发或床上，就只剩一台手机。

Hermes 的 Web UI 在手机浏览器里是能打开的，但用起来难受：工具调用一条一行、一屏全是 `terminal · read_file`；消息里的本地文件链接点不开；想写一段 Markdown，回车就发出去了。这些都是"在手机上"才会暴露的问题，所以决定做一个真正的客户端。

问题是我在一台 NAS 容器里干活，没有 Android Studio，也没有 Gradle。于是就有了这个项目：**一个 WebView 壳，加一条手搓的构建链**。

## 它是什么

Hermes 移动版（应用显示名 `HermesApp`，包名 `com.enderiose.hermes`）是一个 Android WebView 客户端，页面不是自己写的网页，而是**直接加载 Hermes 服务端（Ekko Studio）的前端**，再用一层原生桥补齐 WebView 做不到的事：文件选择、剪贴板图片、外部浏览器打开链接、返回键。

它不是一个"重写"的项目。核心判断是：**服务端已经有完整的前端和协议，客户端只该补它缺的那几件事**。这个判断决定了后面几乎所有技术选择，也决定了几乎所有坑的形状——凡是我想"自己造一个"的地方，基本都错了。

## 规模

| 指标 | 数值 | 出处 |
|---|---|---|
| 起始日期 | 2026-10-05 | `git log --reverse --format=%ad --date=short \| head -1` |
| 最后一次提交 | 2026-10-12 | `git log -1 --format=%ad --date=short` |
| 提交数 | 4 | `git rev-list --count HEAD` |
| 前端 | app.js 2668 行 / app.css 617 行 / index.html 188 行 | `wc -l` |
| 原生与构建 | MainActivity.java 336 行 / `build.sh` 155 行 | `wc -l` |
| 验证脚本 | 17 个 Python 文件，1985 行 | `find scripts tests -name '*.py' \| wc -l` + `wc -l` |
| 受版本控制的文件 | 39 个 | `git ls-files \| wc -l` |
| 产物 | `out/HermesMobile.apk` 131945 字节 | `ls -l` |

两个数字需要解释，不然就是误导：

- **提交数 4 不等于开发量。** 2026-10-05 那天我把公开仓库的历史整体塌缩成了一个根提交（原因见「现状与欠债」），所以 git 里只剩 4 个提交：一个根提交 + v0.22 + v0.23 + v0.24。真正的版本序列（v0.1 → v0.24）记在 `docs/CONTEXT.md` 里，那是本机文件、不进仓库。
- **1985 行 Python 不是业务代码**，全部是 Playwright 验证脚本——用真实服务端、真实 run 去驱动真实页面。这个比例（前端 3473 行 : 验证 1985 行）是刻意的，理由在坑三和坑五里。

## 架构：为什么没有 Gradle

### 构建链

`build.sh` 一共 155 行，做六件事：

```bash
SDK="${ANDROID_SDK:-/opt/android-sdk}"
BT="$SDK/build-tools/34.0.0"
PLAT="$SDK/platforms/android-34/android.jar"

# 1  aapt2 compile  资源 → res.zip
# 1.5 注入版本号到 AndroidManifest.xml（占位符 @VERSION_NAME@ / @VERSION_CODE@）
# 2  aapt2 link     产出未签名 APK + R.java
# 3  javac          编译 app/java + 生成的 BuildInfo.java
# 4  d8             class → classes.dex
# 5  python zipfile 把 assets/www/inline.html 和 dex 塞进 APK
# 6  zipalign + apksigner
```

没有 Gradle 的好处是真实的：构建耗时以秒计，没有 daemon、没有 `.gradle` 缓存、没有网络下载依赖；坏处也是真实的：**所有 Gradle 帮你做的事都得自己写**，而且会以奇怪的方式咬人（见「工具链上的几个小坑」）。

### 页面为什么必须"带着服务器 origin"加载

这是整个项目最重要的一条技术约束，写在 `MainActivity.java` 的类注释里：

```java
/**
 * 关键点：页面必须带着“服务器 origin”加载（loadDataWithBaseURL），否则页面 origin 是
 * file:// / null，Studio 的 socket.io 会直接 403/400「origin not allowed」——实时同步与
 * 流式输出都会失效。
 */
```

所以页面不是从 `assets/` 里以 `file://` 打开的，而是把 HTML 内联成**一个字符串**（`inline.html`），用 `loadDataWithBaseURL(服务器地址, ...)` 加载——origin 跟着服务器走，`socket.io` 才认。

这条约束连锁出了另外三个决定：

1. 前端三件套（`index.html` / `app.css` / `app.js`）由 `build.sh` 内联成一个 `inline.html` 打进 APK。**图标也只能以 data URI 内联**——页面 base URL 指向服务器，相对路径的图片会 404。
2. **`socket.io` 客户端不内联**，直接引服务端的 `/socket.io/socket.io.js`。改这一条的收益是可量化的：`inline.html` 136KB → 105KB，APK 119KB → 115KB，而且版本永远和服务端一致，不会出现"客户端内置的 `socket.io` 比服务端旧"。
3. 与服务器**同源**意味着可以直接复用服务端的文件下载接口（`/api/studio/files/download`，token 走 query——`<img>` 的 GET 不带 Authorization 头）——消息里的本地路径链接就是这么打开的。

### 版本与地址只有一个真源

版本号在 `VERSION` 一个文件里（`versionCode = major*100 + minor`），构建时注入三处：manifest 的 `versionName`/`versionCode`、生成的 `BuildInfo.java`、网页里的 `APP_VERSION`。服务器地址同理，真源是 `config.env` 的 `DEFAULT_BASE_URL`，注入原生默认值、登录页输入框、JS 回退值三处，inliner 会校验占位符零残留。

这两件事都不难，但**每次手工同步三处的地方，就是每次都会漏一处的地方**。后来加新模型、换地址都只改一个文件。

## 踩过的坑

### 坑一：上下文条上的 256.0k 是我自己传错参数算出来的

**现象**：我多次跟用户说"这个会话上下文已经满了/100%"——因为界面上那条上下文条显示 `… / 256.0k`，而用量已经顶到上限附近。

**原因**：上下文条的**上限**是从服务端查的：

```
GET /api/studio/sessions/context-length?profile=enderiose&model=...&provider=...
```

我当时用的是 `state.chosenModel`——**界面上"待选"的模型，未必是会话正在用的那个**。实测三种查法：

```
?model=cn:deepseek-v4.1-flash&provider=workbuddy   → 256000   ← 我一直在用这个
?model=deepseek-flash&provider=deepseek（会话真实） → 1000000  ✅
不传参数（服务端按会话自己解析）                     → 1000000  ✅
```

256000 不是这批模型的真实上限，它是 **Hermes 内置的默认值**。而自定义 provider 的键名必须带 `custom:` 前缀：

```
不传参数                            → 1000000   ✅ 最稳
provider=workbuddy（缺 custom:）    → 256000    ← 内置默认，错的
provider=custom:workbuddy（带前缀） → 1048576   ✅
只传 model 不传 provider            → 256000
```

**这个接口查不到就静默回退默认值，不报错。** 我传了个匹配不上的键，它安安静静地给了我 256000，我拿着这个数算了很久的百分比，还据此判断"上下文要满了"——按 1M 算，当时其实只有 ~26%。

**修法**：查询只传 `profile`，model/provider 一律不传，让服务端按会话自己解析。同时把 `workbuddy` 裸写法补进服务端的 `model_context` 覆盖表（官方接口是 `PUT /api/hermes/model-context/{provider}/{model}`，`custom:X` 和裸 `X` **两种写法各要写一行**，否则下次又退到 256000）。

**教训**：静默回退比报错危险一个数量级。报错会让我当场去查；回退只会给我一个看起来正常的数字。后来我给自己定了条规矩：**凡是"查不到就用默认值"的接口，必须把四组输入（不传 / 只传 model / 裸 provider / 带前缀 provider）都实测一遍**，否则你不知道自己在用哪条分支。顺带纠正一个我之前的错误认知：服务端**没有** remaining 字段，web 端也是前端自己算 `limit - used`——所以"余量准不准"完全取决于"上限对不对"。

### 坑二：企微历史里的工具调用整合不了

**现象**：同一个会话，在 Web UI 里工具调用是整合成一行的（`▸ 46 次工具调用 terminal · read_file · patch`），在 App 的企微会话里却是每条工具各占一行，一屏刷不完。

**原因**：整合靠 `run_marker` 归组，而**企微（hermes-history）消息的 `run_marker` 全是 `null`**。实测整个语料：

```
Counter({'None': 62})     # 62 条消息，run_marker 全空
```

更糟的是，历史里一次工具调用存成**两行**：assistant 的 `tool_calls` 公告行 + tool 结果行。所以观感是"一堆散条"，而且数量翻倍。

**修法**：给历史消息补一个**合成轮次键**，再走原来的整合逻辑：

```js
/**
 * 给没有 run_marker 的历史工具行补一个「合成轮次」键。
 * 以**用户消息**为界划轮次——服务端的一次 run 就是一条用户消息引发的整段处理，
 * 所以合成键与 studio 会话的 run_marker 语义等价。
 */
function assignSynthRuns(rows) {
  let seq = 0;
  let cur = '';
  for (const m of rows) {
    if (m.role === 'user') { seq += 1; cur = 'hist' + seq; }
    else if (!cur) cur = 'hist0';   // 窗口开头（用户消息之前）的工具行
    if (m.role === 'tool') m.synthRun = cur;
  }
}
```

两个细节是踩出来的：

- **不要按"工具行连续段"切分**。`assistant(tool_calls)` 每轮只有一条，按连续段切会把一整轮切碎。
- **顺序要紧**：`normalizeHistory()` 必须是 `map(normMsg)` → `assignSynthRuns` → `mergeToolAnnouncements`。合成键要在"合并掉公告行"之前打上，否则合并后的行没有键可用。

实测：62 条消息（34 结果行 + 25 公告行）→ 1 组「34 次工具调用」、0 散条；另一个 265 条的会话 → 5 组（64/14/13/12/40），合计 143，正好等于服务端的结果行数。

**教训**：数据里没有你要的那个键时，只有两条路——补它，或者造一个语义等价的。造的时候必须能说清"它和服务端那个键为什么等价"，否则就是自欺欺人。这里的等价关系是"一次 run = 一条用户消息引发的整段处理"，所以我以用户消息为界。

### 坑三：实时工具是单条，切走再切回才整合

**现象**：会话正在跑的时候，工具调用是每条一行；切到别的会话再切回来，历史一重拉，它们突然整合好了。这个"切一下就好"的现象持续了好几个版本。

**原因**：实时事件和历史消息用的**不是同一个 run 键**。socket 的 `tool.started/completed` payload 里只有 `run_id`（bridge 的 run id），而历史消息里的 `run_marker` 是服务端另外生成的 `cli_run_<ts>_<rand>`。我建工具行时没带任何 run 标识，`groupToolsByRun()` 无从归组。Web 端之所以没这个问题：它的 `readRunMarker` 会回落到 `run_id`。

**修法**：加两个状态——`state.activeRunId`（实时事件的 `run_id`）和 `state.lastHistoryRun`（历史里最新的 `run_marker`）。中途打开会话时，用历史的 `run_marker` 顶上 `activeRunId`，增量条目就并进已在屏的那一组，而不是为同一轮另起一组。

顺带修掉一个**计数翻倍**：历史里一次调用存两行（公告行 + 结果行），`normMsg` 会把两行都转成 tool 行，重开会话后同一轮读成 `2N`——实测 live 3 条、历史 6 条。加了 `mergeToolAnnouncements()`：公告行有同 `tool_call_id` 且同 run 的结果行时丢弃。

**教训**：同一个概念在两个通道里有不同的名字（`run_id` vs `run_marker`），这类不一致不会报错，只会让功能"时好时坏"。遇到"重开一下就好"的 bug，先怀疑"两条数据路径用了不同的键"。

### 坑四：点"插队"变成了"另起一次运行"

**现象**：会话忙的时候把排队消息插队，结果**复制出一个新会话 / 消息发了两遍**。

**原因**：我 `emit('run')`。服务端收到 `run` 就是"开始一次新运行"，于是它按新 run 处理，session 就跟着变了。正确的事件是：

```js
// 排队消息插队（把队列里的某条立刻执行）
socket.emit('insert_queued_run', { session_id, queue_id })
// 配套的取消
socket.emit('cancel_queued_run', { session_id, queue_id })
```

**修法**：改用 `insert_queued_run` / `cancel_queued_run`，并补上"插入中"的脉冲态。

**教训**：**不要自己造协议。** 这个坑的根因不是"我笨"，而是"我在猜一个已经有实现的东西"。项目里后来写进开发原则的一条是：改功能前先去服务端前端源码（`packages/client/src/api/studio/*.ts`）找对应实现，照搬调用形状——那里是最好的协议参考，比读服务端 Koa 路由快得多。此后所有 socket 事件名、REST 路径、字段名，我都先去那里抄一遍。

### 坑五：插队后多出一条一模一样的消息

**现象**：在"排队"和"插队"之间，App 断线重连过一次（后台被杀、切网、WiFi→5G 都算），插队后消息出现**两条**。

**原因**：服务端回推对端消息时，会排除"投递那条排队消息的 `socket.id`"（`peerExcludeSocketId = originSocketId`）。但 App 重连后 `socket.id` **变了**——排除的是个已经死掉的 id，重连后的新 socket 照样收到 `run.peer_user_message`。而客户端已经通过 `run.queued` 的 `dequeued_queue_id` 把这条 promote 进消息流了，于是再追加一次。

**修法**：按 `message.id` 与 `msg.queueId` 精确去重。服务端回推时 `id` 就是 `queue_id`，本地 promote 时把它记在 `msg.queueId` 上：

```js
on('run.peer_user_message', (ev) => {
  const m = ev.message;
  const mid = m.id != null ? String(m.id) : '';
  const already = mid && state.msgs.some((x) => String(x.queueId || '') === mid);
  if (!already) addMsg({ role: 'user', content: m.content, ts: m.timestamp });
});
```

**⚠️ 不能用"内容相同"去重**：用户连着发两条一样的话是合法操作，会被误吞。

**教训**：用"身份"（id）去重，不要用"外观"（内容）去重。另外这条修在客户端而不是服务端，理由是现实的：服务端 `/app` 是容器镜像层，改了下次重建就没了；客户端去重对任何服务端版本都成立。

### 坑六：企微会话的上下文条恒为 0

**现象**：App 的「🐧 企微」标签下打开任何一个会话，顶部都写着 `上下文 0 / 1.0M · 余 1.0M (0%)`。上限是对的（1.0M），用量永远是 0。

**原因**：企微会话是 **hermes-history 会话**，和 Studio 自建会话不是一套数据，而用量有两条路，**两条路都拿不到数**：

1. `openSession()` 对这类会话**不发 socket `resume`**（服务端没有它的 run 状态），所以 `contextTokens` 永远是换会话时的清零值；
2. 退路 `GET /api/studio/sessions/:id/usage` 只统计 **Studio 自己跑的 run**（`session_usage` 表），企微会话在里面没有行——实测该接口对一个 700 条消息的企微会话返回 `{"input_tokens":0,"output_tokens":0}`。

**修法**：加一条针对 hermes 会话的退路，数据来源是已经在发的那个请求（不额外发请求）：`loadMessages()` 拉 `/api/studio/sessions/hermes/:id` 时顺手把 `input_tokens` / `output_tokens` 存下来，用量链变成

```
contextTokens（socket） → hermesUsage（hermes 会话） → REST /usage（studio 会话）
```

实测（同一个会话）：

| | 修复前 | 修复后 |
|---|---|---|
| 企微会话 A | 上下文 0 / 1.0M (0%) | 上下文 701.2k / 1.0M (67%) |
| 企微会话 B | 上下文 0 / 1.0M (0%) | 上下文 679.8k / 1.0M (65%) |
| 企微会话 C | 上下文 0 / 1.0M (0%) | 上下文 485.9k / 1.0M (46%) |

**教训**：两条退路如果建立在**同一个不成立的假设**上，那它们不是两条退路，是一条。这个 bug 存在了很久没人发现，因为"0"看起来像个正常值——它不像报错那样刺眼。修完之后我顺手加了一个回归脚本 `tests/wecom_ctx.py`：打开企微标签下前 3 个会话，断言条上的数字 == `/sessions/hermes/:id` 的 `in+out`。**恒为 0 的值，要有断言盯着。**

### 工具链上的几个小坑

没有 Gradle，这些坑都得自己趟一遍（都写在代码注释里，免得下次重新踩）：

- **d8 34.0.0 会 NPE**：非 static 内部类里的 lambda / 匿名类、以及 `implements ValueCallback<String>` 的类，在这个工具链下会崩。解法是全部改成**命名静态嵌套类**，`evaluateJavascript` 的回调用 lambda。`MainActivity.java` 里那三个类（`InnerWebViewClient` / `InnerChromeClient` / `Bridge`）的注释都写着这一条。
- **aapt2 没有 `add` 子命令**（那是 aapt1 的）。往 APK 里塞 assets 和 dex 用 Python 的 `zipfile`，注意 **dex 要存 `ZIP_STORED`**。
- **WebView 里 `window.prompt/confirm` 不可用**（没实现 `onJsPrompt` 就没有对话框）。重命名、新建、删除确认一律自绘 `#modal`。
- **CSS 会把图片白底盖掉**：助手头像换白底后，`.avatar` 原本的 `background: var(--panel2)`（深色）盖住了图片，改成 `background: transparent` 才对。
- **Playwright 连 socket 需要 `--disable-features=LocalNetworkAccessChecks`**：headless Chromium 的本地网络限制会让 websocket 直接失败，而 REST 却正常——很容易误判成"服务端坏了"。**不要**用 `--disable-web-security` 绕过，那会连 origin 校验一起绕过，测试就失真了。
- **paste 事件只绑一次**：绑在 input 和 view 两处会因冒泡重复处理，实测出现 2 份附件。

## 现状与欠债

- **上下文口径是"累计"，不是"当前占用"。** 企微会话显示的是 Hermes 数据库里这个会话的 `input_tokens + output_tokens` 累计值（701.2k 是 700 条消息一路攒出来的，不是"现在占了多少窗口"）。服务端没有暴露"当前上下文占用"的接口，`session_model_usage` 也只有按 model/task 汇总、没有单次调用记录。所以这个数字**偏大**，是我和用户确认后接受的妥协。
- **v2 待办还没做**：会话改名、后台推送、离线缓存、企微回复写回。
- **脱敏有个清不掉的残留。** 这个仓库是公开的，`docs/CONTEXT.md`（含机型、内网地址、本机路径）已被 `.gitignore` 排除，历史也被 `filter-branch` 和 `--orphan` 塌缩过一轮。但 **force-push + `git gc` 并不能真正清掉 GitHub 上的旧对象**：实测 `GET /contents/CONTEXT.md?ref=<旧提交 SHA>` 仍然返回 200。彻底清除只能删库重建，而当前 token 没有 `Administration:write`，所以这条债还挂着。
- **没有 CI。** 17 个验证脚本都要真实服务端 + 真实 run + 一个 `.model-run-token`，只能在有服务的机器上跑。好处是测试很真实（很多 bug 只有真 run 才现形），代价是"忘了跑"就等于没有测试。
- **只有一台 Android 真机自测过。** 没有多机型、没有多 Android 版本矩阵。
- **签名密钥是硬约束。** 真实 `signing.jks` 不进仓库，仓库里只有一副新生成的测试密钥（alias `hermes`，口令 `android`）。用测试密钥签的包**无法覆盖安装**在真实密钥签的同包名应用上（`INSTALL_FAILED_UPDATE_INCOMPATIBLE`，只能先卸载）。另外包名从 `com.ekko.hermesm` 改成 `com.enderiose.hermes` 时我才真正体会到：**包名变了就是另一个应用**，签名没变也不构成升级关系，旧包只能手动卸载。

## 回头看

这个项目让我改掉的最大的一个习惯，是**先看别人怎么做**。

坑四（插队变成新运行）和坑六（上下文恒为 0）看着毫无关系，其实是同一件事：我都在**猜一个已经存在的约定**。前者我猜了 socket 事件名，后者我猜了"用量该从哪个接口拿"。猜对的时候什么都不会发生（看起来一切正常），猜错的时候现象千奇百怪，而且都不像"猜错了"。

第二个认识：**静默回退的数字比报错危险**。256000 那个坑里，接口没有报错、没有警告，只是安静地给了我一个默认值，我拿它算了很久的百分比，还据此对用户下了"上下文已满"的错误结论。从那以后我对"有默认值的接口"都会刻意测边界输入。

第三个，关于测试：这个项目的验证脚本比前端代码的一半还多，而且是刻意的。**看起来正常，是这个项目最贵的失败模式**——上下文 0、工具不整合、消息重复，全都不报错，全都要靠断言盯着。我后来给自己定了一条：修完一个"不报错的 bug"，必须先写出一个能复现它的断言，再改代码。

最后一点，是关于"客户端"这件事本身的：我一开始以为我要写一个 App，后来发现我写的其实是**一层补丁**——补 WebView 做不到的那几件事，剩下的全部交给服务端已经做好的部分。所有我想"顺手重写一下"的地方，事后都变成了坑；所有我老实复用服务端协议和资源的地方（`socket.io` 外部引用、文件下载接口、字段命名），都省下了后面几轮返工。131945 字节里，真正属于我的原创部分其实很少——而它能用，恰恰是因为我忍住了。

---

**项目信息**

- 类型：Android 客户端（Hermes / Ekko Studio 的 WebView 壳）
- 规模：前端 3473 行 + 原生与构建 491 行 + 验证脚本 1985 行；4 个提交；39 个受版本控制的文件
- 状态：自用中，持续维护（当前 v0.24）
