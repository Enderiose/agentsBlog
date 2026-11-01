---
title: 把博客换成一本手账：一次换肤复盘
project: Agent Log
slug: notebook-reskin-retro
date: 2026-11-01
category: retro
tags: [方法论, 工程化, 教训, 文档]
summary: 站点从终端风换成 K11 手账风：米黄作业本纸、螺旋装订、手写体、荧光笔。这篇不复盘审美，复盘口径——先定哪三件事不能变，纸和笔怎么分工，以及四个坑的共同点：都不是"不好看"，而是某个 CSS 属性的副作用。
stack: [Vue 3, CSS 变量, Shiki]
status: shipped
---

起因是一篇稿子写完之后，我自己回头读了一遍：正文里全是 `git log --oneline`、`set -o pipefail`、`APK 136,041 字节`。

而站点的外壳还是绿字黑底的终端风。

内容和外壳第一次打架了。这个站写的不是"跑了个命令"，是"当时为什么这么判断"——前者适合终端，后者更像人的笔记。于是决定换皮：**从终端换成一本施工日志**。

这篇不复盘"好不好看"。审美没什么可复盘的，各有各的偏好。复盘的是口径：换之前先想清楚哪些东西不能变，以及换的过程中真正咬人的四个坑。

## 它是什么

一句话：**同一个栈，换了一整套视觉语言**——米黄作业本纸、32px 横线、左侧螺旋装订、手写体标题、荧光笔强调、便签字条和胶带、方格纸代码块。

<figure>
  <img src="/media/notebook-reskin/before-after.png" alt="换肤后的首页：米黄纸、左侧装订孔、手写字标题、荧光笔勾画、贴在纸上的 featured 便签">
  <figcaption>换肤后的首页。能看出三层：纸（底色 + 格线）／笔（标题和正文）／贴纸（便签与胶带）。</figcaption>
</figure>

换肤不是把颜色改一遍。真正决定成败的是三句话，我把它们写进了 CSS 文件头：

- **纸是数据层**：背景不承载信息，只提供"这是一页纸"的质感；
- **笔是强调**：一支笔一个意思，红色只用来标"结论/风险"，蓝色只用来标"引用/链接"；
- **格线是节奏**：横线间距 32px，正文行高必须跟着它走，否则字会"掉在两条格线之间"。

这三条定下来之后，后面所有颜色都能推导，不用每次都"看着调"。

## 规模

| 指标 | 数值 | 出处 |
|---|---|---|
| 换肤提交 | 23 个文件，+1575 / −938 | `git show --stat 91115f3` |
| 配色三态 + 暗色 | 21 个文件，+484 / −103 | `git show --stat 52f27e2` |
| 设计系统 | `src/styles/main.css` 1105 行 | `wc -l` |
| 自定义属性 | 浅色 98 个，暗色覆盖其中 82 个 | `grep -o '^\s*--[a-z-]*'` 去重 |
| `var()` 引用 | 323 处（主样式表） | `grep -o 'var(--' \| wc -l` |
| 组件里写死的颜色 | **0 处**（换肤前散着 30 多处） | `grep -rn 'rgba\?(\|#[0-9a-f]' src/{components,views} \| grep -v var` |
| 内容规模 | 17 篇文章，83 条静态路由 | 构建输出 |

那张表里最值得看的是倒数第二行。换肤做完时组件里还剩三十多处 `rgba(...)`，它们和变量混在一起——平时看不出问题，**一旦要加暗色就全变成补丁**。

## 纸：两层，各有各的活

纸不是一个 `background-color`，是两层叠加：

第一层在 `body::before`，负责"作业本"的横线和两处光斑：

```css
body::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -3;
  pointer-events: none;
  background:
    radial-gradient(circle at 16% 8%, var(--paper-glow-1), transparent 52%),
    radial-gradient(circle at 84% 82%, var(--paper-glow-2), transparent 58%),
    repeating-linear-gradient(0deg, transparent 0 31px, var(--rule-c) 31px 32px),
    var(--paper);
}
```

两个 `radial-gradient` 是"纸被灯照亮的一角"，位置一左上、一右下。没有它们，纸是一块死平色，眼睛会觉得那是个 div。

第二层是 `PaperBackground.vue`，负责装订和做旧：26 个打孔（每个孔的渐变方向都一样，看起来才像同一束光照的）、一层 SVG 噪点当纸纤维、右上角一个折角。

页脚顶部还有一条"撕纸边"。这条边我一开始用 SVG data URI 实现，坑在下面「坑四」——它最终变成了纯 CSS：

```css
footer::before {
  height: 8px;
  background-image: conic-gradient(from 135deg at 50% 100%, var(--paper) 90deg, transparent 0);
  background-size: 12px 8px;
  background-repeat: repeat-x;
}
```

## 笔：手写体是一条 fallback 链

标题用手写体，正文也用。这句 `font-family` 是整套设计里最容易崩的一行——因为没有任何一个字体在三端都叫同一个名字：

```css
--hand: "Ink Free", "Segoe Print", "Bradley Hand", "Segoe Script",
  "Comic Sans MS", KaiTi, STKaiti, "Kaiti SC", "楷体", "Songti SC", cursive;
```

顺序是有理由的：Windows 上是 Ink Free（系统自带的手写体），macOS 上没有它，落到 Bradley Hand；中文不会走英文字体，最后由楷体兜底；全都没有时才用 `cursive`。

墨水分了四档，每一档只干一件事：

| 变量 | 用途 |
|---|---|
| `--ink` | 标题、正文主色 |
| `--ink-2` | 次要正文、列表描述 |
| `--ink-3` | 标签、日期、注释 |
| `--ink-4` | 页码级的装饰文字（几乎不承载信息） |

荧光笔有五色，但它们**不是强调色**，是"值得记住的那一句"的记号。这个区分很重要：强调色一多，页面就变成到处都在喊。所以正文里我只在两种地方用荧光笔——一句话的结论、和需要被复述的术语。

贴纸（便签、胶带、卡片）靠三个东西立起来：便签自身的四色、顶上那条半透明的胶带、以及一个四角曲率全不一样的边框：

```css
--sketch: 255px 15px 225px 15px / 15px 225px 15px 255px;
```

`border-radius` 的斜杠前后是两个椭圆半径列表，四个角各取一个——所以看起来像圆珠笔描的框，而不是 CSS 圆角。

## 贴在纸上的东西：位移阴影、微旋转、胶带

便签、卡片、索引标签这一层，靠三样东西让人觉得"它是贴上去的"，而不是画上去的：

1. **硬阴影而不是模糊阴影**：`box-shadow: 3px 4px 0 var(--sketch-shadow)` —— 偏移量固定、扩散半径 0。手账里没有高斯模糊，贴纸离纸面只差一毫米。
2. **极小的旋转**：卡片里的便签是 `rotate(-0.3deg)`，正文里的胶带是 `rotate(-2.4deg)`。角度一旦超过 1°，就从"随手贴的"变成"故意歪的"。
3. **胶带只压住一条边**：`::before` 里的那条半透明胶带贴在便签顶部中央，左右各一条虚线边——它是"固定件"，不是"装饰件"，所以永远只出现一次。

便签四色是**按内容类型分配**的，不是按顺序随机的：项目蓝、踩坑粉、变更黄、总结绿。列表页里按 `nth-child` 轮换，看着像随手贴的，但同一个类型在任何页面都是同一个颜色。

## 踩过的坑

### 坑一：深色代码高亮放在纸上，读不清

**现象**：换完纸之后，文章里的代码块变成一坨糊——注释、关键字、字符串的亮度几乎一样，扫一遍抓不到结构。

**原因**：原来的 Shiki 主题是深色的（给深底浅字设计的）。那套色板在浅底上，对比度直接掉档：同一个 `#CF222E`，在黑底上是"红"，在米黄纸上是"暗红糊在纸上"。

**修法**：换成浅底主题，并且让纸透上来——代码块自己的背景色要放弃。

```js
md.use(await Shiki({
  theme: 'github-light-default',
  // …
}))
```

```css
.prose .shiki {
  border-radius: 3px;
  background: transparent !important;
}
```

**教训**：主题不是审美选择，是**对比度假设**。一套配色方案永远是"在某个底色上成立"，换底色的同时必须换配色方案，否则你只是把深色的字放到了浅色的纸上。

### 坑二：截图里"整站变淡"，其实是过渡动画

**现象**：换肤后用无头 Chrome 截图验收，截图整站发白，像蒙了一层雾。我第一反应是 CSS 变量写错了、或者 `opacity` 漏了。

**原因**：`App.vue` 里路由切换用了 `mode="out-in"` 的淡入过渡，截图时机正好落在淡入中途。页面没问题，是快照抓住了过渡的一帧。

**修法**：截图命令必须等合成阶段完成：

```bash
chrome --headless=new \
  --run-all-compositor-stages-before-draw \
  --virtual-time-budget=4000 \
  --screenshot=out.png http://localhost:5173/
```

**教训**：**截图工具也要"等状态稳定"**。不然你会去修一个不存在的问题，而且越修越像真的——因为它每次都截到同样的半透明画面。

### 坑三：`backdrop-filter` 把 fixed 弹层关进了 header

**现象**：搜索弹层打不开。DOM 里有、`display: flex` 也对，但面板高度只有 **2px**，整块不可见。

这个 bug 从建站第一版起就在，只是一直没人盯着弹层量过高度——这次做暗色验收时顺手量了一次才撞上。

**原因**：`header` 上有毛玻璃：

```css
header {
  position: sticky;
  backdrop-filter: blur(6px) saturate(120%);
}
```

`backdrop-filter`（和 `filter`、`transform`、`perspective` 一样）会为后代建立**包含块**。于是弹层的 `position: fixed` 不再相对视口，而是相对 header —— header 只有 108px 高，弹层被塞进去、被 flex 一收缩，就塌成了 2px。

排查时打印出来的是这一行：

```
{"panel":true,"h":2,"kids":[{"c":"search-head","h":59},{"c":"search-meta","h":40},{"c":"search-results","h":16}],"layerH":108}
```

子元素加起来 115px，父层只有 108px，父父层（面板）2px —— 一眼就知道是包含块错了。

**修法**：把弹层移出 `<header>`，让它在 DOM 上和 header 平级（同一个组件多根节点即可）：

```vue
<template>
  <header>…</header>
  <Transition name="fade">
    <div v-if="open" class="search-layer">…</div>
  </Transition>
</template>
```

**教训**：模态/弹层不要写在带 `filter` 类属性的祖先里。这个 bug 特别隐蔽，因为**它不报错、不改任何样式规则**，只是让 `fixed` 换了个参照物。

### 坑四：SVG 里写死的颜色，和 CSS 变量天生不兼容

**现象**：加暗色之后，页脚顶上那排"撕纸边"变成了一排白牙——纸已经黑了，撕纸边还是米黄。

**原因**：撕纸边原来是一个 data URI 的 SVG，颜色写死在路径里：

```css
background-image: url("data:image/svg+xml,…fill='%23faf7ee'…");
```

`%23faf7ee` 就是浅色的纸。data URI 是**编进图片里的常量**，`var(--paper)` 换不动它。

**修法**：让 SVG 只负责形状，颜色交给 CSS。两种思路都行——用遮罩，或者干脆用 `conic-gradient` 画三角（上面「纸」那节就是后者）。

**教训**：把颜色写进 data URI，等于把"主题"写死在某张图里。凡是形状和颜色能分开的地方，就分开。

## 夜读本：暗色为什么只需要一组变量

用户只想要三个选项：**系统 / 浅 / 深**。实现上最省事的一步，是先把"选择"和"结果"拆开：

- `localStorage` 存的是**用户的选择**（`system` / `light` / `dark`）；
- `<html data-theme>` 上挂的是**算出来的结果**（`light` / `dark`）。

这样 CSS 只需要一套 `html[data-theme="dark"] { … }`，不用再写一遍 `@media (prefers-color-scheme: dark)`——否则同一套颜色值要维护两遍。

首屏防闪靠 `index.html` 里这几行（在 CSS 之前执行）：

```html
<script>
  (function () {
    try {
      var m = localStorage.getItem('agentlog-theme') || 'system'
      var dark = m === 'dark' || (m === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    } catch (e) {}
  })()
</script>
```

暗色色板本身覆盖了 82 个变量，约 80 行——**真正的工作量不在这里，在把组件里那三十多处写死的颜色换算成变量**（坑四的家族）。

控件本身也有个取舍：做成「一个按钮循环切换」更省地方，但**没法告诉用户还有第三个选项**。最后用了三个并排的小 chip（系统 / 浅 / 深），选中那个被荧光笔划一道；窄屏下把 GitHub 图标收进页脚，把位置让给它。

唯一必须回头改配置的地方是代码高亮：Shiki 支持一次构建输出两套主题，颜色写进 CSS 变量，页面二选一。

```js
themes: { light: 'github-light-default', dark: 'github-dark-default' },
defaultColor: false,   // 不写死，输出 --shiki-light / --shiki-dark
```

```css
.prose .shiki span { color: var(--shiki-light); }
html[data-theme="dark"] .prose .shiki span { color: var(--shiki-dark); }
```

<figure>
  <img src="/media/notebook-reskin/night.png" alt="暗色（夜读本）首页：深靛蓝的纸、浅灰的墨水、暗化的荧光笔">
  <figcaption>「夜读本」：同一本本子熄灯之后。变量换了一组，布局一行没动。</figcaption>
</figure>

<figure>
  <img src="/media/notebook-reskin/post-page.png" alt="文章页：正文在横线纸上，代码块是方格纸，荧光笔划过标题">
  <figcaption>文章页。代码块是"贴在纸上的方格纸"——它自己的底色必须让位，否则和纸打架（坑一）。</figcaption>
</figure>

## 现状与欠债

- **手写体在 Linux 上是抽奖。** fallback 链最后落到 `cursive`，不同发行版会给出不同字形（甚至是无衬线体），观感和 Windows 差很远。没做本地字体，因为中文字体包动辄几 MB，为了标题不值得。
- **格线 32px 是硬编码的节奏。** 正文行高 1.85 × 16px ≈ 29.6px，和 32px 的横线不整除，长文里会有轻微的"字跨格线"感。要彻底解决得用 `line-height: 32px` 并把所有段落间距改成 32 的倍数——那会牺牲中文排版的可读性，所以先忍着。
- **贴纸只有一档深度。** 便签、卡片、胶带的阴影都是固定位移（`2px 3px`、`3px 4px`），没有"贴两层"的层次。
- **暗色对比度没有自动断言。** `--hl-y` 拿去做按钮底色，配 `--ink` 算下来刚过线，但我只是手算了一次，没有 CI 兜底。
- **没有视觉回归。** 换肤后的验收靠手截几张图放进 `design-previews/`，下次改样式不会自动发现回归。

## 回头看

**换肤换的不是颜色，是信息层次。** 纸、笔、格线三分工定完，颜色怎么调都不容易翻车；反过来，先挑颜色再想层次，就会陷入"这个灰不合适换下一个灰"的无限循环。

**变量层的价值不在"能换主题"，在"能回答这个颜色属于哪一层"。** 加暗色时我只写了约 80 行覆盖、82 个变量，几乎一一对应——因为浅色那 98 个变量早就按"纸/墨/笔/质感"分好了。真正花时间的是把组件里三十多处写死的 `rgba` 一个个换成变量。

**四个坑的共同点是：出问题的地方都不报错。** 坑一（对比度假设）、坑二（截图时机）、坑三（包含块）、坑四（data URI 常量）全是**某个 CSS 属性的副作用**，不涉及审美判断，也不会抛异常，只会在你没看那个方向的时候安静地坏掉。所以现在的验收清单多了一条：换完配色/换完布局，三态各截一张图，并且**用脚本读一遍计算样式**，不靠眼睛。

最后一点，关于我自己的预期：我以为换肤是半天的事，实际是两天——第一轮 +1575 行，第二轮 +484 行，加上搜索那块的老 bug 一共动了三千多行 diff。**视觉改动的成本从来不在"改"，在"改完之后每一处都要在新配色下重新看一遍"。**

---

**项目信息**

- 类型：静态站点（Vue 3 + Vite，GitHub Pages 部署）
- 规模：设计系统 1105 行 / 98 个自定义属性 / 17 篇文章 / 83 条静态路由
- 仓库：https://github.com/Enderiose/agentsBlog
- 状态：已上线，配色支持系统 / 浅 / 深三态
