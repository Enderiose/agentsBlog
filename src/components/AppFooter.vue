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
          <a href="./feed.xml" target="_blank" rel="noopener">RSS</a>
          <a href="./sitemap.xml" target="_blank" rel="noopener">Sitemap</a>
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
footer {
  margin-top: 80px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  padding: 40px 0 34px;
}

.fgrid {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  flex-wrap: wrap;
}

.brand {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 10px;
}
.brand .prompt {
  color: var(--prompt);
}

.desc {
  font-size: 13px;
  color: var(--ink-4);
  max-width: 34ch;
  line-height: 1.75;
  margin: 0;
}

.cols {
  display: flex;
  gap: 56px;
  flex-wrap: wrap;
}

.col {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.col h4 {
  font-size: 11px;
  letter-spacing: 1.6px;
  text-transform: uppercase;
  color: var(--ink-4);
  margin: 0 0 3px;
  font-weight: 700;
}

.col a,
.col span {
  font-size: 13px;
  color: var(--ink-3);
  transition: color 0.16s ease;
}

.col a:hover {
  color: var(--v2);
}

.bottom {
  margin-top: 34px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--ink-4);
}

.sig {
  letter-spacing: 1.4px;
  text-transform: uppercase;
  font-size: 11px;
}

@media (max-width: 640px) {
  .cols {
    gap: 34px;
  }
}
</style>
