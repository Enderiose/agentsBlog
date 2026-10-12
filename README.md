# Agent Log

> English | [简体中文](README_CN.md)

A build-in-public blog for every agent application project I've built — the
requirements, the architecture, the pitfalls, and how it all ended up.

Live: **https://enderiose.github.io/agentsBlog/**

The point is not to show finished work. It's to write down the process and the
things that got me stuck, so the next project starts from a better place.

## Stack

| Layer | Choice |
|---|---|
| Framework | Vue 3 + TypeScript + Vue Router |
| Build | Vite 6 |
| Content | Markdown + frontmatter in `content/posts/` |
| Rendering | markdown-it + Shiki (build time) + markdown-it-anchor |
| Index | A Node script generates `posts.json`, `feed.xml`, `sitemap.xml` |
| Deploy | GitHub Actions → GitHub Pages |

No backend. Everything is static; the article HTML is rendered at build time so
the shipped bundle needs no markdown parser at runtime.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173/agentsBlog/
```

Other commands:

```bash
npm run content    # regenerate the post index / RSS / sitemap
npm run build      # content + production build into dist/
npm run preview    # serve dist/
npm run typecheck  # vue-tsc
```

> `npm run dev` and `npm run build` already run `npm run content` first.

## Writing a post

Create a file under `content/posts/`. The filename becomes the URL slug.

```markdown
---
title: My post title
date: 2026-10-12
category: project      # project | pitfall | changelog | retro
tags: [wow, lua, codex]
summary: One sentence, shown in lists and search results.
stack: [Lua 5.1, Node.js]
status: shipped        # shipped | wip
featured: false        # true pins it to the homepage
draft: false           # true hides it from the build
---

Body goes here. Headings `##` and `###` are collected into the table of contents.
```

Then run `npm run dev`. The index, RSS and sitemap rebuild automatically.

## Deploying

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and
publishes to GitHub Pages.

One-time repo setup: **Settings → Pages → Source = GitHub Actions**.

If you rename the repository, update `base` in `vite.config.ts` to match
(`/agentsBlog/` today). Getting this wrong makes every asset 404 and the page
render blank — a pitfall documented on the site itself.

### Why static routes are generated

GitHub Pages is plain static hosting and does **not** perform SPA history
fallback. Without help, `/agentsBlog/` renders fine while every sub-route
(`/agentsBlog/posts/xxx/`) returns 404 — easy to misread as a broken deploy.

`scripts/generate-static-routes.mjs` runs right after `vite build` and:

- copies `dist/index.html` into every route directory (each post, each tag,
  plus `posts/`, `projects/`, `tags/`, `about/`)
- rewrites `<title>`, description and OG tags per route, so shared links show
  the right title instead of the site title
- writes `404.html` as a catch-all so unknown paths still render the app
- writes `.nojekyll` so Jekyll does not skip underscore-prefixed assets

## Layout

```
agentsBlog/
├── .github/workflows/deploy.yml   CI → GitHub Pages
├── content/posts/*.md             Articles (the only thing you edit)
├── scripts/build-content.mjs      Markdown → HTML + index + RSS + sitemap
├── public/favicon.svg             (feed.xml / sitemap.xml are generated)
├── src/
│   ├── components/                AuroraBackground, AppHeader, AppFooter,
│   │                              PostRow, ProjectCard
│   ├── views/                     Home, PostList, Post, Projects, Tags,
│   │                              Tag, About, NotFound
│   ├── lib/posts.ts               Content access + search
│   ├── router/index.ts            Routes
│   ├── styles/main.css            Design system
│   └── generated/                 Generated; not committed
└── design-previews/               The four original style candidates
```

## Design

The look combines two directions that were prototyped first (see
`design-previews/`):

- **Palette** from the "aurora / glassmorphism" candidate — dark base, violet
  and cyan gradients, frosted glass panels.
- **Typography and structure** from the "terminal" candidate — a global
  monospace stack, `//` section markers, `$` prompts, log-line lists, and a
  faint scanline overlay.

Design tokens live in `src/styles/main.css` as CSS custom properties.
