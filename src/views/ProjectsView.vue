<script setup lang="ts">
import { computed } from 'vue'
import { sortedProjects, stats } from '@/lib/posts'
import ProjectCard from '@/components/ProjectCard.vue'

const projects = computed(() => sortedProjects)
</script>

<template>
  <div class="wrap">
    <section class="head">
      <div class="term">
        <div class="term-bar">
          <span class="term-dots"><i /><i /><i /></span>
          <span>~/agents/projects</span>
          <span class="spacer" />
          <span>{{ projects.length }} running</span>
        </div>
        <div class="term-body">
          <div class="cmd">
            <span class="p">~/agents</span> $ <b>ps aux | grep agent</b>
          </div>
          <h1>项目</h1>
          <p class="lede">
            我做过的 Agent 应用都在这儿，一篇对一个项目：目标、架构、踩的坑、最后的形态。
          </p>
        </div>
      </div>
    </section>

    <section class="sec">
      <div class="sec-head">
        <h2>all_projects</h2>
        <div class="rule" />
        <span class="count">{{ stats.projects }} 个已记录</span>
      </div>

      <div v-if="projects.length" class="pgrid">
        <ProjectCard v-for="(p, i) in projects" :key="p.slug" :post="p" :index="i" />
      </div>

      <div v-else class="empty glass">
        <p>还没有项目记录。</p>
        <RouterLink class="btn" to="/about">看看怎么写</RouterLink>
      </div>
    </section>
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
  margin: 6px 0 12px;
}

.lede {
  color: var(--ink-2);
  font-size: 14.5px;
  margin: 0;
  max-width: 64ch;
}

.sec {
  padding: 36px 0 0;
}

.pgrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
  gap: 16px;
}

.empty {
  padding: 46px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}
.empty p {
  margin: 0;
  color: var(--ink-3);
}
</style>
