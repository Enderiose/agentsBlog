<script setup lang="ts">
import { computed } from 'vue'
import { sortedPosts, allTags } from '@/lib/posts'

const cloud = computed(() =>
  allTags
    .map((t) => ({ tag: t, count: sortedPosts.filter((p) => p.tags.includes(t)).length }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'zh')),
)

const max = computed(() => Math.max(1, ...cloud.value.map((c) => c.count)))
</script>

<template>
  <div class="wrap">
    <section class="head">
      <div class="term">
        <div class="term-bar">
          <span class="term-dots"><i /><i /><i /></span>
          <span>~/agents/tags</span>
          <span class="spacer" />
          <span>{{ cloud.length }} tags</span>
        </div>
        <div class="term-body">
          <div class="cmd">
            <span class="p">~/agents</span> $ <b>cut -d' ' -f2 tags.txt | sort | uniq -c</b>
          </div>
          <h1>标签</h1>
          <p class="lede">字号代表出现频次。点进去看同一主题下的所有记录。</p>
        </div>
      </div>
    </section>

    <section class="sec">
      <div class="cloud">
        <RouterLink
          v-for="c in cloud"
          :key="c.tag"
          :to="`/tags/${c.tag}`"
          class="tag-pill"
          :style="{ fontSize: `${12 + (c.count / max) * 8}px` }"
        >
          #{{ c.tag }}<span class="n">{{ c.count }}</span>
        </RouterLink>
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
  max-width: 60ch;
}

.sec {
  padding: 40px 0 0;
}

.cloud {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.tag-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--stroke);
  background: var(--panel);
  color: var(--ink-2);
  transition: all 0.18s ease;
  backdrop-filter: blur(12px);
}

.tag-pill:hover {
  color: #c4b5fd;
  border-color: rgba(124, 92, 255, 0.5);
  background: rgba(124, 92, 255, 0.14);
  transform: translateY(-2px);
}

.tag-pill .n {
  font-size: 11px;
  color: var(--ink-4);
  padding: 1px 7px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.06);
}
</style>
