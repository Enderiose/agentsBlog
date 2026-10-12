# Agent Log

> [English](README.md) | 简体中文

一个「边做边公开」的博客，记录我做过的每一个 Agent 应用项目 —— 需求、架构、踩坑，以及最后的成果。

线上地址：**https://enderiose.github.io/agentsBlog/**

重点不是展示成品，而是把过程和卡住我的东西写下来，让下一个项目能有个更好的起点。

## 技术栈

| 层 | 选型 |
|---|---|
| 框架 | Vue 3 + TypeScript + Vue Router |
| 构建 | Vite 6 |
| 内容 | `content/posts/` 下的 Markdown + frontmatter |
| 渲染 | markdown-it + Shiki（构建期）+ markdown-it-anchor |
| 索引 | Node 脚本生成 `posts.json`、`feed.xml`、`sitemap.xml` |
| 部署 | GitHub Actions → GitHub Pages |

没有后端，全静态。文章 HTML 在构建期渲染完毕，所以运行时不带 markdown 解析器。

## 快速开始

```bash
npm install
npm run dev        # http://localhost:5173/agentsBlog/
```

其他命令：

```bash
npm run content    # 重新生成文章索引 / RSS / Sitemap
npm run build      # 内容 + 生产构建，输出到 dist/
npm run preview    # 预览 dist/
npm run typecheck  # vue-tsc 类型检查
```

> `npm run dev` 与 `npm run build` 已经内置了 `npm run content`。

## 写一篇文章

在 `content/posts/` 下新建文件，**文件名即 URL slug**。

```markdown
---
title: 文章标题
date: 2026-10-12
category: project      # project | pitfall | changelog | retro
tags: [wow, lua, codex]
summary: 一句话摘要，会出现在列表和搜索结果里。
stack: [Lua 5.1, Node.js]
status: shipped        # shipped | wip
featured: false        # true 会置顶到首页
draft: false           # true 不会进入构建产物
---

正文。`##` 与 `###` 标题会自动收进右侧目录。
```

然后 `npm run dev`。索引、RSS、Sitemap 会自动重建。

## 部署

推送到 `main` 会触发 `.github/workflows/deploy.yml`，构建后发布到 GitHub Pages。

仓库需要一次性设置：**Settings → Pages → Source 选 GitHub Actions**。

**如果改了仓库名，记得同步改 `vite.config.ts` 里的 `base`**（当前是 `/agentsBlog/`）。
配错会导致所有静态资源 404、页面白屏 —— 这个坑本站自己也记了一篇。

### 为什么要生成静态路由

GitHub Pages 是纯静态托管，**不做 SPA 的 history fallback**。没有额外处理时，
`/agentsBlog/` 能正常打开，而每一个子路由（`/agentsBlog/posts/xxx/`）都返回 404 ——
很容易被误判成部署失败。

`scripts/generate-static-routes.mjs` 紧跟在 `vite build` 之后运行，做四件事：

- 把 `dist/index.html` 复制到每个路由目录（每篇文章、每个标签，以及 `posts/`、
  `projects/`、`tags/`、`about/`）
- 按路由改写 `<title>`、description 与 OG 标签，让分享出去的链接显示正确标题
- 写一份 `404.html` 作为兜底，未预生成的路径也能正常渲染
- 写 `.nojekyll`，避免 Jekyll 跳过下划线开头的资源目录

## 目录结构

```
agentsBlog/
├── .github/workflows/deploy.yml   CI → GitHub Pages
├── content/posts/*.md             文章（你唯一需要改的东西）
├── scripts/build-content.mjs      Markdown → HTML + 索引 + RSS + Sitemap
├── public/favicon.svg             （feed.xml / sitemap.xml 为生成物）
├── src/
│   ├── components/                AuroraBackground、AppHeader、AppFooter、
│   │                              PostRow、ProjectCard
│   ├── views/                     Home、PostList、Post、Projects、Tags、
│   │                              Tag、About、NotFound
│   ├── lib/posts.ts               内容读取 + 搜索
│   ├── router/index.ts            路由
│   ├── styles/main.css            设计系统
│   └── generated/                 生成物，不入库
└── design-previews/               最初的四份风格候选稿
```

## 设计说明

视觉上融合了前期两个方向（见 `design-previews/`）：

- **配色**取自「极光玻璃拟态」方案 —— 深色底、紫青渐变、毛玻璃面板。
- **排版与结构**取自「终端极客风」方案 —— 全局等宽字体、`//` 分节标记、
  `$` 提示符、日志行列表，以及一层很淡的扫描线。

设计变量都在 `src/styles/main.css` 里，用 CSS 自定义属性集中管理。
