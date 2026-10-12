# 交接文本 — 让项目侧的 agent 直接投稿

> 用法：复制下面 `====` 之间的内容，把 `<>` 占位符填好，发给在项目里工作的 agent（hermes）。
> 它读完 `docs/ARTICLE-GUIDE.md` 就能独立完成挖素材、写作、验证、提交的全过程。

---

====

# 任务：把 <项目名> 写成一篇记录，提交到 agentsBlog

你现在的角色是**投稿作者**。你要为手上这个项目写一篇记录，提交到 Agent Log 博客。

## 第一步：读规范

先读投稿指南（**完整读一遍再动手**）：

```bash
curl -sL https://raw.githubusercontent.com/Enderiose/agentsBlog/main/docs/ARTICLE-GUIDE.md
```

或直接克隆仓库看 `docs/ARTICLE-GUIDE.md`。

同时读两篇范文，感受本站的调性与详略程度：

- https://raw.githubusercontent.com/Enderiose/agentsBlog/main/content/posts/foundinsec.md
- https://raw.githubusercontent.com/Enderiose/agentsBlog/main/content/posts/netstorm.md

## 第二步：挖素材

**关键：不要编。所有内容必须来自项目仓库里的真实记录。**

按优先级挖：

| 来源 | 挖什么 |
|---|---|
| `AGENTS.md` | 规则、红线、**踩坑记录**（常在 §9 或「踩过的坑」章节）← 最高价值 |
| `handoff.md` / `docs/handoff.md` | 过程、卡点、决策、**已排除的假设**、认知修正 |
| `docs/lessons.md` | 教训簿（如果有），通常是编号条目 |
| `docs/SPEC.md` | 架构、技术选型、硬约束 |
| `docs/PLAN.md` | 已排期 / **已否决**（否决理由很值钱） |
| `README.md` | 项目定位、硬性规则 |

规模数据从 git 拿：

```bash
git log --reverse --format=%ad --date=short | head -1   # 起始日期
git log -1 --format=%ad --date=short                    # 最后提交
git rev-list --count HEAD                               # 提交数
find . -name '*.<ext>' -not -path './.git/*' | xargs wc -l | tail -1   # 代码行数
```

**取不到的数字就不写，不要估。**

## 第三步：写文章

在 agentsBlog 仓库新建 `content/posts/<slug>.md`（模板见 `content/posts/_TEMPLATE.md`）。

```yaml
---
title: <具体、有画面感的标题>
slug: <kebab-case-english>
date: <YYYY-MM-DD>
category: <project|pitfall|changelog|retro>
tags: [<3-6 个，先查现有标签别造同义词>]
summary: <60-110 字的一句话>
stack: [<2-5 项>]
status: <shipped|wip>
featured: false
---
```

### 硬性要求

1. **每个数字都要有出处** —— 提交数、行数、天数、性能数字，全部可追溯到一条命令
2. **至少 3 个具体的坑** —— 每个都是「现象 → 原因 → 修法 → 教训」，带报错信息或错误码
3. **必须有「回头看」** —— 讲这个项目真正教会了什么，不要总结功能
4. **必须有「现状与欠债」** —— 诚实写未完成的部分
5. **不写成功学** —— 不写「实现了…效果良好」，写「我以为 X，实际是 Y，代价是 Z」
6. **代码块用真实代码** —— 从仓库里摘，可以简化，不能虚构
7. **长度 3000–8000 字**

### 项目信息

| 项 | 值 |
|---|---|
| 项目名 | <填> |
| 仓库路径 | <填> |
| 目标 slug | <填> |
| 分类 | <填> |
| 一句话定位 | <填> |

## 第四步：验证

```bash
cd <agentsBlog 路径>
npm run content     # 输出里应能看到新文章，且总数 +1
npm run build       # 应成功，并输出「生成 M 个静态路由」
```

两个都必须通过才提交。

## 第五步：提交

```bash
git add content/posts/<slug>.md
git commit -m "content: <标题>"
git push
```

**只提交那一个 `.md` 文件。**
`src/generated/`、`public/feed.xml`、`public/sitemap.xml` 是构建产物，不要提交。

推送后 GitHub Actions 自动部署，1–2 分钟生效。

## 自检清单（提交前逐条打勾）

- [ ] `npm run content` 能看到新文章
- [ ] `npm run build` 成功
- [ ] frontmatter 字段齐全，slug 与文件名一致
- [ ] summary 在 60–110 字
- [ ] tags 没造同义词
- [ ] 每个数字有出处
- [ ] ≥3 个坑，每个都有「现象 → 原因 → 修法」
- [ ] 有「回头看」和「现状与欠债」
- [ ] 代码来自真实仓库
- [ ] 没有凭据值（一律写占位符）

## 排除清单

**不要写**：`juku`（R18）、`guoapp`（juku 的 app 版）、`pi-extensions`（属 pi 扩展改动）、`dsh`（项目未成）。

## 完成后回报

回复时给出：

1. 新增的文件路径
2. commit hash
3. `npm run content` 与 `npm run build` 的实际输出（后几行）
4. 文章字数与阅读时长

====
