<script setup lang="ts">
import { site, stats } from '@/lib/posts'
const year = new Date().getFullYear()
</script>

<template>
  <footer>
    <div class="wrap fgrid">
      <div class="left">
        <div class="brand"><span class="prompt">~/</span>AGENT.LOG</div>
        <p class="desc">
          {{ site.description }}
        </p>
      </div>

      <div class="cols">
        <div class="col">
          <h4>导航</h4>
          <RouterLink to="/projects">项目</RouterLink>
          <RouterLink to="/posts">全部记录</RouterLink>
          <RouterLink to="/tags">标签</RouterLink>
          <RouterLink to="/about">关于</RouterLink>
        </div>
        <div class="col">
          <h4>订阅</h4>
          <RouterLink to="/feed">RSS</RouterLink>
          <RouterLink to="/sitemap">Sitemap</RouterLink>
          <a href="https://github.com/Enderiose/agentsBlog" target="_blank" rel="noopener">GitHub</a>
        </div>
        <div class="col">
          <h4>统计</h4>
          <span>{{ stats.posts }} 篇记录</span>
          <span>{{ stats.projects }} 个项目</span>
          <span>{{ stats.pitfalls }} 个坑</span>
        </div>
      </div>
    </div>

    <div class="wrap bottom">
      <span>© {{ year }} {{ site.author }} · 用 Markdown 写作，用 Vite 构建</span>
      <span class="sig">build in public</span>
    </div>
  </footer>
</template>

<style scoped>
/* 页脚：手账最后一页，撕纸边 + 手写签名 */
footer {
  margin-top: 84px;
  padding: 40px 0 34px;
  position: relative;
  border-top: 2px dashed var(--stroke-2);
  background: linear-gradient(180deg, rgba(255, 253, 244, 0.55), transparent);
}

/* 顶部锯齿撕纸 */
footer::before {
  content: "";
  position: absolute;
  top: -8px;
  left: 0;
  right: 0;
  height: 8px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='8' viewBox='0 0 24 8'%3E%3Cpath d='M0 8 L6 1 L12 7 L18 0 L24 8 Z' fill='%23faf7ee'/%3E%3C/svg%3E");
  background-repeat: repeat-x;
}

.fgrid {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  flex-wrap: wrap;
}

.brand {
  font-size: 19px;
  font-weight: 400;
  margin-bottom: 10px;
  display: inline-block;
  padding: 1px 6px;
  border-bottom: 2px solid var(--ink);
}
.brand .prompt {
  color: var(--pen-red);
  transform: rotate(-8deg);
  display: inline-block;
}

.desc {
  font-size: 14.5px;
  color: var(--ink-3);
  max-width: 34ch;
  line-height: 1.8;
  margin: 0;
}

.cols {
  display: flex;
  gap: 52px;
  flex-wrap: wrap;
}

.col {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.col h4 {
  font-size: 14px;
  letter-spacing: 0.6px;
  color: var(--ink);
  margin: 0 0 3px;
  font-weight: 400;
  padding: 0 4px;
  display: table;
  background: linear-gradient(transparent 55%, var(--hl-y) 55% 92%, transparent 92%);
}

.col a,
.col span {
  font-size: 14.5px;
  color: var(--ink-3);
  transition: color 0.16s ease;
  display: inline-block;
}

.col a:hover {
  color: var(--ink);
  background: linear-gradient(transparent 55%, var(--hl-b) 55% 92%, transparent 92%);
}

.bottom {
  margin-top: 30px;
  padding-top: 16px;
  border-top: 1px dashed var(--stroke);
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 13.5px;
  color: var(--ink-4);
}

.sig {
  letter-spacing: 0.6px;
  font-size: 14px;
  color: var(--pen-red);
  transform: rotate(-1.5deg);
  display: inline-block;
}

@media (max-width: 640px) {
  .cols {
    gap: 30px;
  }
}
</style>
