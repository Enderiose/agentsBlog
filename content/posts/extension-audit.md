---
title: 给浏览器扩展做一次可复现的取证
slug: extension-audit
date: 2026-09-28
category: project
tags: [浏览器扩展, 取证, 隐私, 安全, 方法论]
summary: 新标签页类扩展到底在你点击时做了什么？我审了两个：一个被判"确认返利劫持"，一个是干净的。真正沉淀下来的不是结论，而是一套 S0–S6 的审查流程和十条硬性规则。
stack: [CRX3, Python, Bash, 静态分析]
status: shipped
---

起因很朴素：我装了一个新标签页扩展，然后开始怀疑它。

不是被害妄想。这类扩展（新标签页 / 起始页 / 工具类）的商业模式很清晰 —— **它们手里握着你最高频的入口**：地址栏、搜索、书签、电商图标。

问题在于：**你怎么证明它做了或没做什么？**

我最后做成了一个证据包，审了两个扩展，结论一个是 **D 级（确认返利劫持）**，一个是 **A 级（未发现问题）**。

但真正有价值的部分，是审完之后沉淀下来的东西。

## 先说结论（附版本与哈希）

> 判定分级：**A** 未发现问题 ／ **B** 存在风险点 ／ **C** 确认推广注入 ／ **D** 确认返利劫持

| 扩展 | 被检查版本 / 哈希 | 判定 |
|---|---|---|
| **iTab 新标签页** | Chrome 2.3.13 `247d7106…`<br>Edge 2.2.25 `a8b1a8f9…` | **D — 确认返利劫持 + 推广注入** |
| **青柠起始页** | Chrome 1.4.0 `2936aeef…`<br>Edge 1.4.0 `7990e470…` | **A — 未发现问题** |

结论的措辞全部是**可证伪动词**，这是硬性规则：

- ✅ 「默认导航的电商图标**指向**自有跳转域 `*.coml.cc`」
- ✅ 「实测 **302 至** `extdd1.browser.360.cn/browser/clk`」
- ✅ 「服务端下发推广码并**强制改写**搜索引擎链接」
- ❌ 「偷数据」「恶意」「故意」

**只评价行为，不评价个人。**

而且每条结论都**绑定版本与哈希** —— 扩展更新后，旧结论自动失效，需要重新审查。

## 十条硬性规则

这套规则比结论重要得多。

| 规则 | 说明 |
|---|---|
| **只写可复现的事实** | 每条结论必须附：文件路径 + 代码片段 + 可执行的验证命令 |
| **最小必要引用** | 只摘录证明问题所需的最小片段，不整文件转载 |
| **保留原始证据** | 原始安装包一律只读保存，**下载后立即记录哈希**，永不修改 |
| **不执行包内代码** | 静态分析优先；需要动态验证时只用隔离环境与一次性配置目录 |
| **不采集他人数据** | 审查过程不得上传/留存任何用户 Cookie、账号、浏览记录 |
| **不做人身攻击** | 只评价行为；不公布个人信息；不使用定性词 |
| **措辞用可证伪动词** | 「指向 / 302 跳转到 / 强制改写 / 未标注」 |
| **无证据即删除** | 任何无法用命令复现的断言，必须删除或降级为"待核实" |
| **结论绑定版本与哈希** | 版本更新后旧结论自动失效 |
| **禁止批量删除** | 删除只能针对明确列出的路径 |

第七条和第八条是这套东西的灵魂。

**第八条**尤其重要：它意味着审查报告里**不能有推测**。哪怕你"几乎确定"某个行为是恶意的，只要不能用一条命令复现，就得删掉或者降级。

这看起来很苛刻 —— 但它恰恰是让结论**站得住**的原因。

## 流程：S0–S6

```
S0 取证（不可跳过）→ S1 manifest 与权限 → S2 特征扫描
→ S3 上下文复核（防误报的关键一步）→ S4 网络侧验证
→ S5 判定分级 → S6 出报告 + 自证
```

### S0 · 取证

```bash
# 从官方商店下载原始包（Chrome）
curl -L -o ext.crx "https://clients2.google.com/service/update2/crx?response=redirect&prodversion=120.0&acceptformat=crx2,crx3&x=id%3D<EXT_ID>%26uc"

md5sum ext.crx && sha256sum ext.crx
file ext.crx          # 期望：Google Chrome extension, version 3
```

有个细节值得记：**`file` 若不是 CRX/ZIP，说明下载失败**（常见于 Edge 接口需要 `-L` 跟随签名地址）。

> **0 字节文件必须删除并重试，不得当作证据。**

### S1 · manifest 与权限

```python
import zipfile, io, json
raw = open('ext.crx','rb').read()
i = raw.find(b'PK\x03\x04')            # CRX3 = 文件头 + ZIP
z = zipfile.ZipFile(io.BytesIO(raw[i:]))
mf = json.loads(z.read([n for n in z.namelist() if n.endswith('manifest.json')][0]).decode('utf-8','replace'))
for k in ['name','version','permissions','host_permissions','content_scripts',
          'web_accessible_resources','chrome_url_overrides','chrome_settings_overrides',
          'background','externally_connectable','update_url']:
    if k in mf: print(k, '=', json.dumps(mf[k], ensure_ascii=False)[:400])
```

CRX3 的格式就是**文件头 + 普通 ZIP**，找到 `PK\x03\x04` 之后当 zip 解就行。

重点看**用途是否收窄** —— 同样是"清除浏览数据"权限，限定自家域名和不限定，是两个性质。

### S2 · 特征扫描

优先找这些文件，它们最常藏推广 URL：

```
defaultNavConfig*  shortcuts*  nav*  bookmark*  bookmarks.html
```

命中的关键词：电商域名（`jd.com` / `taobao.com` / `tmall.com` / `1688.com`）、仿冒域（`coml.cc` 这类）、推广码参数（`tn=` / `pid=`）。

### S3 · 上下文复核 —— 防误报的关键

**这一步是整套流程里最重要的。** 光有 grep 命中说明不了任何问题。

对每一个命中，提取前后各 120–200 字符判断语义：

```bash
grep -o '.\{120\}<关键词>.\{160\}' *.js
```

判定要求：

| 情形 | 判定 |
|---|---|
| `href=` 是**用户点击后打开**（`window.open` 在 click 回调里） | 通常正常 |
| `href=` 是**对已有链接的赋值改写**（`e.href = s[e.key] \|\| e.href`） | **高危** |
| `from=` 指向**自家域名** | 正常 |
| `from=` 指向**第三方返利域** | 高危 |

iTab 案例里那句 `e.href = s[e.key] || e.href` 就是第二种 —— **它不是在创建链接，是在改写你已经有的链接**。

这个区别，grep 是看不出来的。只有读上下文才知道。

### S4 · 网络侧验证

```bash
curl -I "https://<可疑跳转域>/"      # 抓 302 location
```

记录完整 `location`，判断终点是否为返利 / 点击跟踪服务（如 `*/browser/clk`、`*/union/*`、`*/cps/*`）。

**不携带用户 Cookie、不登录、不执行落地页脚本。**

### S5 / S6 · 分级与报告

报告模板固定，包含"如何自行验证"一节 —— 附**一分钟自证**命令，确保第三方能独立复现。

## 一分钟自证

这是整个证据包最有说服力的部分。任何人都能自己跑一遍。

### iTab（Chrome 2.3.13）

```bash
# 1. 下载原始包
curl -L -o itab.crx "https://clients2.google.com/service/update2/crx?response=redirect&prodversion=120.0&acceptformat=crx2,crx3&x=id%3Dmhloojimgilafopcmlcikiidgbbnelip%26uc"
md5sum itab.crx          # 应为 247d71066852e38d74a64d9bee31033e

# 2. 解压
python -c "import zipfile,io;raw=open('itab.crx','rb').read();i=raw.find(b'PK\x03\x04');zipfile.ZipFile(io.BytesIO(raw[i:])).extractall('itab')"

# 3. 默认导航里电商图标指向哪里
grep -o 'https://[a-z0-9.]*coml\.cc/' itab/chunks/defaultNavConfig-*.js

# 4. 推广码与链接改写
grep -o 'tn=[0-9A-Za-z_]*' itab/chunks/*.js | sort -u
grep -o 'e.href=s\[e.key\]||e.href' itab/chunks/*.js

# 5. 验证跳转去向
curl -I https://jd.coml.cc/
```

**5 条命令，5 个可验证的输出。** 任何人跑一遍，就能得到同样的结论。

### 青柠起始页（Chrome 1.4.0）

```bash
curl -L -o lime.crx "https://clients2.google.com/service/update2/crx?response=redirect&prodversion=120.0&acceptformat=crx2,crx3&x=id%3Daajmeahnoefldipnjgodkobfdcpmapno%26uc"
md5sum lime.crx          # 应为 2936aeef53a1c9bb079bfda3cf7e93d3
python -c "import zipfile,io;raw=open('lime.crx','rb').read();i=raw.find(b'PK\x03\x04');zipfile.ZipFile(io.BytesIO(raw[i:])).extractall('lime')"
grep -rEo 'jd\.com|taobao\.com|coml\.cc|tn=[A-Za-z0-9_]+' lime/   # 应为空
```

最后那条 grep **输出为空**，就是"A 级"的证据。

**"未发现问题"也需要证据。** 这是很多人忽略的一点 —— 说一个东西干净，和说它有问题，需要同样强度的证明。

## 目录规范

每个被审查的扩展建一个案例目录：

```
<extension-slug>-audit/
├── <slug>.crx                 原始包（只读，禁止修改）
├── raw/
│   ├── 00-hashes.txt          MD5 / SHA256 / 版本 / 权限摘要
│   ├── 01-manifest.txt        manifest 关键字段
│   ├── 02-permissions.txt     权限与用途对照
│   ├── 03-network-domains.txt 包内出现的全部远程域名（按频次）
│   ├── 04-suspicious-hits.txt 全部命中项及上下文
│   └── 05-verify-cmds.txt     自证命令
├── shots/                     证据截图
└── REPORT.md                  审查报告
```

两个约定：

- **截图命名** `NN-短描述.png`（两位序号），右下角固定标注 `<slug> v<ver> · 取证 <YYYY-MM-DD>`
- **哈希**同时记录 MD5 与 SHA256；报告中每次引用包都带上哈希

`03-network-domains.txt`（包内出现的**全部**远程域名，按频次）是个很聪明的设计 —— 它把"这个扩展会连哪些域"变成了一个可审阅的清单，而不需要你去读所有代码。

## 误报与免责

审查里最容易犯的错是**把正常行为当成问题**。所以流程里专门有"常见误报"一节（`docs/SPEC.md` 第 3 节），以及一份明确的免责声明：

> - 所有结论**仅适用于文中标注的版本与哈希**；扩展更新后需重新审查
> - 本仓库不含任何个人信息，不对任何开发者作主观评价
> - 文中提及的第三方公司 / 品牌 / 域名仅为**技术描述与链路说明**，不构成指控
> - 本仓库仅用于技术研究与消费者知情，不构成法律意见

最后一条尤其重要：**这是技术审查，不是法律意见。**

## 内部资料隔离

```
_内部资料（勿上传）/
```

这个目录**已通过 `.gitignore` 排除**，不进公开库。

配套一条规则：

> `_内部资料（勿上传）/` 整个目录不得对外发送、打包或上传；
> **发送文件/图片前先确认路径不在该目录内。**

这条是给 AI 代理写的 —— 因为 agent 会"顺手"把文件发出去。**闸门必须写在规则里，不能指望它记得。**

## 为什么这事值得做

我在这个项目里最大的收获是：**取证是一门"克制"的手艺。**

你很容易得出一个"感觉对了"的结论，然后把它写成一个断言。但这套流程逼你：

- 把断言拆成**可执行的命令**
- 把结论**绑定到具体版本和哈希**
- 把"没证据"的部分**删掉**
- 把"我不确定"的部分**标成待核实**

而这四条，恰好也是我在所有 Agent 项目里反复踩坑之后总结出来的东西。

**一个不能复现的结论，价值是零 —— 甚至为负，因为别人会信它。**

---

**项目信息**

- 类型：浏览器扩展审查证据包（文档与证据，非可执行程序）
- 产出：2 个完整案例 + S0–S6 标准流程 + 特征库 / 权限矩阵 / 误报清单
- 仓库：https://github.com/Enderiose/extension-audit
