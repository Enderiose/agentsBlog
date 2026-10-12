<script setup lang="ts">
import { stats, allTags } from '@/lib/posts'

const stack = [
  { k: '前端', v: 'Vue 3 · TypeScript · Vue Router' },
  { k: '构建', v: 'Vite 6' },
  { k: '内容', v: 'Markdown + frontmatter' },
  { k: '渲染', v: 'markdown-it + Shiki' },
  { k: '部署', v: 'GitHub Actions → GitHub Pages' },
]

const categories = [
  { key: 'project', label: '项目', desc: '一个应用的完整过程：起因、架构、踩坑、成果。' },
  { key: 'pitfall', label: '踩坑', desc: '单独成篇的坑。能复现，能对照，能少走弯路。' },
  { key: 'changelog', label: '变更', desc: '重要改动与版本演进，附带前后对比。' },
  { key: 'retro', label: '总结', desc: '跨项目的复盘：工作流、方法论、沉淀下来的原则。' },
]
</script>

<template>
  <div class="wrap-narrow">
    <section class="head">
      <div class="term">
        <div class="term-bar">
          <span class="term-dots"><i /><i /><i /></span>
          <span>~/agents/about</span>
          <span class="spacer" />
          <span>README.md</span>
        </div>
        <div class="term-body">
          <div class="cmd">
            <span class="p">~/agents</span> $ <b>cat README.md</b>
          </div>
          <h1>关于这个站</h1>
        </div>
      </div>
    </section>

    <article class="prose sec">
      <h2>为什么写</h2>
      <p>
        我做了一批 Agent 应用。过程散在几百次提交、几千行日志和一堆会话记录里，
        没人看得见，我自己过一阵也会忘。
      </p>
      <p>
        所以开了这个站。把每个项目的<strong>需求、架构、踩坑和最终成果</strong>摊开写。
      </p>
      <blockquote>
        <p>不写成功学。只写可复现的过程，和那些把我卡住的东西。</p>
      </blockquote>

      <h2>写什么</h2>
      <div class="cats">
        <div v-for="c in categories" :key="c.key" class="cat-card glass">
          <span :class="['cat', `cat-${c.key}`]">{{ c.label }}</span>
          <p>{{ c.desc }}</p>
        </div>
      </div>

      <h2>技术栈</h2>
      <table>
        <tbody>
          <tr v-for="s in stack" :key="s.k">
            <th>{{ s.k }}</th>
            <td>{{ s.v }}</td>
          </tr>
        </tbody>
      </table>

      <h2>怎么写</h2>
      <p>每篇文章就是一个 Markdown 文件，放在 <code>content/posts/</code>：</p>
      <pre><code>---
title: 文章标题
date: 2026-10-12
category: project      # project | pitfall | changelog | retro
tags: [wow, lua]
summary: 一句话摘要，会出现在列表和搜索结果里
stack: [Lua, Node.js]
status: shipped        # shipped | wip
---

正文……</code></pre>
      <p>
        构建时由 Node 脚本解析 frontmatter、渲染 HTML、生成索引、RSS 和 Sitemap。
        推送到 <code>main</code> 后 GitHub Actions 自动发布。
      </p>

      <h2>站点规模</h2>
      <table>
        <tbody>
          <tr><th>记录</th><td>{{ stats.posts }} 篇</td></tr>
          <tr><th>项目</th><td>{{ stats.projects }} 个</td></tr>
          <tr><th>踩坑</th><td>{{ stats.pitfalls }} 条</td></tr>
          <tr><th>总结</th><td>{{ stats.retros }} 篇</td></tr>
          <tr><th>标签</th><td>{{ stats.tags }} 个</td></tr>
        </tbody>
      </table>

      <h2>订阅</h2>
      <p>
        有 <RouterLink to="/feed">RSS</RouterLink>，
        也有 <RouterLink to="/sitemap">网站地图</RouterLink>。
      </p>

      <h2>标签一览</h2>
      <div class="tags">
        <RouterLink v-for="t in allTags" :key="t" :to="`/tags/${t}`" class="tag-pill">
          #{{ t }}
        </RouterLink>
      </div>
    </article>
  </div>
</template>

<style scoped>
.head {
  padding: 46px 0 0;
}

.spacer {
  margin-left: auto;
}

h1 {
  font-size: clamp(26px, 4vw, 38px);
  letter-spacing: -1.2px;
  margin: 6px 0 0;
}

.sec {
  padding: 40px 0 0;
}

.cats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 1.4em 0;
}

.cat-card {
  padding: 16px 18px;
}

.cat-card p {
  margin: 10px 0 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--ink-2);
}

.tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 1em;
}

.tag-pill {
  font-size: 12.5px;
  padding: 5px 13px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--stroke);
  background: var(--panel);
  color: var(--ink-3);
  transition: all 0.18s ease;
}

.tag-pill:hover {
  color: #c4b5fd;
  border-color: rgba(124, 92, 255, 0.5);
  background: rgba(124, 92, 255, 0.14);
}

@media (max-width: 560px) {
  .cats {
    grid-template-columns: 1fr;
  }
}
</style>
