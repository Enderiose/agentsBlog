---
title: 自动化一个没有 API 的东西
project: checkin
slug: twwb-checkin
date: 2026-09-27
category: project
tags: [自动化, 签到, python, cdp, windows]
summary: Trae SOLO CN 和 WorkBuddy 每天都要手动签到，都没有 API，只能模拟点击。这篇文章记录怎么让「点按钮」不靠运气：自校验、不盲点、可诊断；再到任意网页签到，以及 cookie 过期时主动告警、推不出去就弹窗兜底。
stack: [Python, ctypes, Win32 API, CDP, Node.js, schtasks]
status: shipped
updated: 2026-10-31
pinned: true
repo: https://github.com/Enderiose/checkin
---

每天两件事：打开 Trae 点签到，打开 WorkBuddy 点签到。

都不难，但都很烦。而且它们**都没有 API**。

于是只能做最笨的那种自动化：**模拟点击**。

这类自动化最怕的不是写不出来，而是**不可靠**。一个"有时候能点，有时候点不到，还告诉你成功了"的脚本，比手动点更糟糕 —— 因为你会信它。

所以这个项目的重点全部在**可靠性**上。

## 两个目标，两种技术

| 目标 | 技术 |
|---|---|
| **Trae SOLO CN** | Chrome DevTools Protocol (CDP) + Node.js |
| **WorkBuddy** | Win32 API (ctypes) + Python |

为什么不一样？因为一个是 Electron 应用（有调试端口），另一个只能靠原生窗口操作。

**Trae**：调试端口只监听 `127.0.0.1`，通过 CDP 可以直接操作 DOM —— 比模拟点击可靠得多。

**WorkBuddy**：没有调试端口，只能用 Win32 API 找窗口、算坐标、发点击消息。

后者的可靠性天然更差，所以后面所有的加固都是围绕它做的。

## 触发时机：登录后 2 分钟

```batch
:: install_startup_task.bat
:: 计划任务：AT LOGON + 2 分钟延迟
```

为什么不在登录瞬间跑？因为**桌面环境还没就绪** —— 窗口没起来、托盘没加载、DPI 没确定。

2 分钟是个经验值，可调（`STARTUP_DELAY`）。

安装时会问签哪些应用（15 秒无操作默认全签）：

```cmd
install_startup_task.bat            :: 交互式
install_startup_task.bat workbuddy  :: 无人值守，只签 WorkBuddy
```

可选值：`trae`、`workbuddy`、`all`（或 `both`）、`1`、`2`、`3`。

## 核心设计：绝不盲点

这是整个项目里我最满意的一段。

### 问题

模拟点击的经典失败模式：

```
脚本：点击 (1200, 480)
系统：（那里什么都没有）
脚本：任务完成 ✅
```

**它没点到，但报告成功了。**

### 解法：点击前后截图对比

```python
WORKBUDDY_VERIFY = True    # 默认开启
```

WorkBuddy 的签到步骤是**自校验**的：

1. **等**白色签到按钮渲染出来（不是等固定时长）
2. **确认窗口真的在前台**（否则点击会落到别的窗口）
3. **点击**
4. **对比点击前后的截图**
5. 界面没变化 → **重试**（最多 `WORKBUDDY_MAX_TRIES` 次）

关键在最后一条的分支：

> **若找不到按钮，就按"今天已签到"处理并返回 0，绝不盲点。**

于是"没点到"再也不会被误报成成功。

### 诊断工具：只截图，不点击

```bash
python scripts\diagnose_workbuddy.py
```

它会：

- 截取**真实**的 WorkBuddy 窗口
- 在配置的坐标处**画一个十字**
- **全程不点击**

于是你能直接看到："我的坐标偏了多少。"

这个工具的存在理由很实在：**当签到失败时，你需要的是观察，不是重试。**

## 坐标问题：DPI 是陷阱

WorkBuddy 的点击坐标是硬编码的。

```python
WORKBUDDY_MENU_X/Y       # 头像菜单
WORKBUDDY_CHECKIN_X/Y    # 签到按钮
```

上游默认值按 **1920x1080** 校准。我的机器是 **2560x1440**，所以必须重新测。

**换屏或改缩放后必须重新校准**，否则点击落空。分辨率不一致时日志会输出 `WARN`。

重新测量坐标的正确方法：

```bash
python -c "import ctypes,ctypes.wintypes as w,time; u=ctypes.windll.user32; time.sleep(5); p=w.POINT(); u.GetCursorPos(ctypes.byref(p)); print(p.x, p.y)"
```

**用 `python`，不要用 PowerShell。**

> PowerShell **不感知 DPI**，取到的坐标会被缩放。

这条坑很典型：你测出来一个坐标，填进去，点击落在错误的位置，而你看不出任何异常。

坐标通过**环境变量**注入到第三方脚本里：

```python
# config.py 是唯一配置源 → 环境变量 → 第三方脚本
```

这样上游代码不用改，配置也集中在一处。

## 日志：为"事后排查"而写

每次运行追加写入 `logs\auto_checkin_YYYY-MM-DD.log`（UTF-8，保留 30 天）。

每条记录包含：

- **运行环境**：会话 ID、屏幕分辨率、开机后经过时间、各路径解析结果
- **每个子进程**：完整命令 + stdout/stderr + 退出码
- **任何异常**：完整堆栈

退出码：

| 码 | 含义 |
|---|---|
| `0` | 全部签到成功，或至少一个成功 |
| `1` | 全部签到失败 / 应用或脚本路径不存在 |
| `3` | 脚本异常崩溃（日志中有 `[CRASH]` 段落） |

计划任务的上次退出码也能查：

```cmd
schtasks /Query /TN AutoCheckinOnStartup /V /FO LIST
```

看"上次结果"字段。

**为什么要记这么多？** 因为计划任务是在你不在的时候跑的。出问题时，你只有日志。

## 两个隐蔽的坑

### 坑一：计划任务的工作目录是 `C:\Windows\System32`

计划任务默认在 `C:\Windows\System32` 下启动。

如果脚本里用了相对路径，**它会去找 `C:\Windows\System32\config.py`**。

修法：

> 所有路径都基于**项目目录**解析，与当前目录无关。

这条后来被我在所有自动化脚本里遵守。

### 坑二：安装脚本静默失败

最早的安装脚本会在 UAC 被取消时**静默关窗** —— 你以为装好了，其实什么都没发生。

修法：

```
logs\install_task.log
```

里面记录：

- **提权状态**
- 解析到的 Python / Node 路径
- **完整的 `schtasks` 命令** + 输出 + 退出码

> UAC 被取消时现在会**明确报错**，不再静默关窗。

这条对应的是同一个原则：**任何"什么都没发生"的情况，都必须能被观测到。**

## 并发竞态

最近一次提交是：

```
fix: 修复自动签到两处竞态与安装脚本静默失败，补齐安装日志
```

两处竞态都来自同一个原因：**同时操作两个应用的窗口时，前台窗口会互相抢**。

WorkBuddy 的点击要求"窗口真的在前台"，而 Trae 的 CDP 操作可能把焦点抢走。

修法是串行化 + 每步重新确认前台状态。

## 第三方代码：明确归属

这个项目**封装**了两个上游项目：

| 目录 | 上游 | 作者 | 许可证 |
|---|---|---|---|
| `trae-daily-checkin/` | BlueChonk/trae-daily-checkin | Cecilia | MIT |
| `workbuddy-checkin/` | GitOfUser/workbuddy-checkin | GitOfUser | **上游未提供许可证文件** |

我在 README 里写得很明确：

> 签到实现的所有功劳归上游作者所有；本项目原创部分仅为**封装与调度层**（`config.py`、`scripts/`、`*.bat`）。

本地补丁也全部记录在案：

- `trae-daily-checkin/` 带 **3 处**修复：等待 CDP page target、轮询账户 UI、让 `--close` 真正生效
- `workbuddy-checkin/` 带 **2 处**补丁：点击坐标、流程开关（都由环境变量驱动，从而能由 `config.py` 统一配置）

**第二条的许可证状态被单独标出来了** —— 上游没给许可证文件，所以是"版权归原作者所有"。这种情况必须写清楚，不能假装它是 MIT。

## 可配置的流程开关

```python
WORKBUDDY_SKIP_MENU = True
```

设为 `True` 时直接从首页点签到按钮，**跳过头像菜单流程**。

为什么需要这个开关？因为"点头像 → 等菜单 → 点签到"这条链路里，菜单的渲染时序不稳定。能少一步就少一个失败点。

## 第二版：从「点两个按钮」到「签任意网页」

十月这版改动比第一版本身还大，而且是被逼的：要签的站点从两个变成了十几个，全是网页，没有一个提供能直接调的 API。

先说名字：项目已从 `TWWB_checkin` 改名为 **`checkin`**，仓库在
[github.com/Enderiose/checkin](https://github.com/Enderiose/checkin)。
（老仓库远端还在的话，`git remote set-url origin <新地址>` 就行。）

### 站点列表是一个 TOML 文件

```toml
[[sites]]
name = "example"          # 同时是 cookie 文件名：cookies/example.json
url  = "https://example.com/checkin"   # 能点到签到按钮的那个页面，不是后端 API

[[sites]]
name = "anyrouter"
url = "https://anyrouter.top/console/topup"
login_only  = true        # 打开页面本身就算签到，没有按钮
checkin_api = "/api/user/sign_in"
browser_only = true       # 有 WAF，静默 HTTP 必被拦
```

`.config` 是 git-ignored 的，仓库里只放 `.config.example`。cookie 按 `name` 存成 `cookies/<name>.json`，每站登录一次：

```cmd
python scripts\web_checkin.py --login anyrouter
```

### 两级降级，而不是一个「万能浏览器脚本」

```
1. 静默  带保存的 cookie 直接 GET 那个页面
         页面已写「已签到」或「成功」→ 结束，不开浏览器
2. 无头  静默拿不到结论（401/403、跳登录、文字拿不准）
         → Chrome/Edge 无头打开页面、点按钮、读结果、存截图
```

中间那句「拿不准」是重点。**判定靠关键词，而且顺序是先 `already` 再 `success`** —— 因为已经签完的页面通常还留着「签到」两个字，先匹 success 会把「今天已签到」误读成「刚刚签成了」。

浏览器这层没有用 Selenium 当第一选择，而是走 CDP 直连无头 Chrome/Edge（`browser_engine.py`），只有 `websocket-client` 缺席时才回退 Selenium。少一层驱动就少一个版本兼容问题。

### 调度从「登录 + 2 分钟」变成二选一

| 方式 | 适用 |
|---|---|
| `logon` | 桌面应用（Trae / WorkBuddy），必须等桌面就绪 |
| `daily` | 纯网页签到，不需要你登录，固定时刻跑 |

目标也变成可组合的：`trae` / `workbuddy` / `web` / `all` / `apps`。安装时用 PowerShell 选择器点，不用再背参数。

### 又踩到的两个坑

- **子模块指到了 fork**。上游改了点击逻辑，但装在自己这边的 `workbuddy-checkin/` 还是旧的 —— 子模块改指 fork，并把 `.gitmodules` 补进版本控制，不然换台机器 `--recursive` 克隆下来还是一份没人维护的代码。
- **残留进程会被下一次签到撞上**。上一轮的 Chrome/Node 没退干净，下一轮抢窗口、抢调试端口。`clean_strays.py` 就是干这个的：只清自己起的进程，按名字和命令行比对，不做宽口径杀进程。

## 第三版：签到失败，谁告诉你

第二版解决了「怎么签」，没解决「签失败了谁知道」。

计划任务在早上跑，我不在电脑前。失败只会写进 `logs\auto_checkin_YYYY-MM-DD.log`。而 cookie 过期这种事，通常要等我某天手动打开某个站点，才发现已经登出好几天了。

于是这一版只做一件事：**把失败推到我手机上**。

### 先让子进程说清楚「为什么失败」

以前 `web_checkin.py` 对「登录态没了」和「页面结构变了」都返回一个模糊的 `fallback`。父进程只看到退出码，没法知道是哪个站、什么原因。

现在判定结果里多了一个独立状态 `login_required`，并且子进程往 stdout 打一行机器可读的标记：

```text
LOGIN_REQUIRED site=anyrouter
```

父进程只解析这一行，不去猜日志、不去重跑判定。**父子进程之间的契约是一条文本行，不是退出码。**

为什么不用退出码？因为退出码只有一个字节，而我要知道的是「哪几个站需要重新登录」。

### 四种「失效」，从强到弱

```text
1. HTTP 401/403              （静默层和无头层都算）
2. 被重定向到登录页
3. 页面文案里有「请先登录」/「not logged in」
4. cookies/<site>.json 里的 expiry 字段
```

前三条是「已经死了」，第四条是「快死了」—— 默认提前 3 天提醒（`expiry_warn_days`）。**能提前修的事，不要等它坏。**

### 坑：最短命的 cookie 不代表登录态

第一版我图省事，把 cookie 文件里所有 `expiry` 取最小值，结果每天都能收到「即将过期」。

原因是有个反爬 cookie（`acw_sc__v2` 之类）寿命只有一小时 —— 它每次请求都会重发，和登录态毫无关系。

修法两条：

- 取**最长寿**的那个 cookie 当作会话寿命
- 再维护一份短命 WAF cookie 前缀黑名单（`acw_`、`cf_clearance`、`_abck` …），扫描时直接跳过

> 判断「会话还在不在」要看最长的那个，不是最短的那个。

### 每天最多一条，不重复吵

同一份状态每天只推一次：把「站点列表 + 到期日期」算成一个指纹，落在 `logs/.notify_state.json`。

不这么做，定时任务会每天把同一条「cookie 过期」推给你，直到你续期为止 —— 然后你就学会无视它了。**告警一旦变成噪音，就等于没有告警。**

默认只在 `expired` 时发；也可以改成 `failure`（任何失败）或 `always`（每次都发）。成功且没到期时，一条都不发。

### token 不进仓库，也不进 URL

```text
优先级 1：CHECKIN_WEBHOOK_TOKEN 环境变量
优先级 2：.hook_token 单行文件（git-ignored）
```

token 放在 `X-Hook-Token` **请求头**里，不拼在 URL 上 —— URL 会进宿主和反代的访问日志。

`.hook_token.example` 里留的是 `<...>` 占位符，程序把它当作「未配置」，不会拿占位符去请求。轮换 token 也不用重启，下次运行重新读文件。

### 坑：通知失败，不能把签到判成失败

这是我最在意的一条。通知只是旁路，签到才是主任务。

所以通知步骤整体包在 try/except 里，失败只记 `WARN`，**退出码仍然只由签到结果决定**。

我还专门做了一次反向验证：故意把 token 改错，跑一遍自动签到 —— 签到成功，退出码 0，日志里多一条通知失败。顺序对了。

### 最后一道兜底：投递不出去，就弹窗

webhook 挂了的时候（token 错 `40001`、宿主不可达、`429` 限流），消息不能就这么消失 —— 那正是你最需要看到它的时刻。

于是加了一层本地弹窗：

- 弹窗跑在**独立分离进程**里，签到主流程不等它
- 始终置顶（`MB_TOPMOST`）
- `MessageBoxTimeoutW` 到点自动关闭（默认 60 秒）

最后这条是关键：`MessageBoxW` 会一直等人点确定。计划任务在凌晨跑，没人点，进程就永远卡在那儿。而 `MessageBoxTimeoutW` 是**没有公开文档**的 API，但从 Win2000 起就在 —— 这是唯一能自动关闭消息框的办法。

### 怎么验证

```cmd
python scripts\notify.py --selftest              :: 发一条连通性测试
python scripts\notify.py --check-expiry          :: 只扫描 cookie，不发送
python scripts\notify.py --show-config           :: 看生效配置（不打印 token）
python scripts\auto_checkin.py --notify-dry-run  :: 只记录消息，不发送
python scripts\auto_checkin.py --no-notify       :: 完全跳过通知
```

`--dry-run` 是我后来加得最值的一个开关：**先看它会发什么，再决定要不要让它发。**

## 回头看

第一版很小 —— 4 次提交，58 个文件。加上网页签到和失败告警这两轮，现在是 9 次提交、`scripts/` 下 3686 行 Python。

但它把"自动化一个没有 API 的东西"这件事里所有的坑都踩了一遍：

| 坑 | 解法 |
|---|---|
| 点击落空但报成功 | 前后截图对比 + 重试 |
| 找不到按钮 | 按"已签到"处理，**绝不盲点** |
| 坐标随屏幕变 | 环境变量注入 + 诊断工具 + 分辨率 WARN |
| DPI 缩放 | 用 `python` 测坐标，不用 PowerShell |
| 工作目录不对 | 所有路径基于项目目录 |
| 安装静默失败 | 独立安装日志 + UAC 取消明确报错 |
| 窗口互相抢 | 串行化 + 每步重新确认前台 |
| 事后无法排查 | 全量环境 dump + 子进程退出码 |
| 定时任务失败没人知道 | 子进程标记行 + 每日去重推送 + 弹窗兜底 |

而贯穿全部的一条是：

> **不要让你的自动化有机会"假装成功"。**

一个会撒谎的自动化脚本，比手动操作更危险 —— 因为手动操作至少你知道自己做没做。

---

**项目信息**

- 类型：Windows 自动化签到（计划任务）+ 失败通知
- 目标：Trae SOLO CN + WorkBuddy + 任意网页
- 规模：9 次提交 · `scripts/*.py` 3686 行（其中 `notify.py` 724 行）
- 仓库：https://github.com/Enderiose/checkin
- 状态：自用中，持续维护
