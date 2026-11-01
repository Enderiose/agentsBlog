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
  padding: 40px 0 0;
}

.spacer {
  margin-left: auto;
}

h1 {
  font-size: clamp(26px, 4vw, 40px);
  letter-spacing: 0.6px;
  margin: 6px 0 10px;
  font-weight: 400;
}

.lede {
  color: var(--ink-2);
  font-size: 16.5px;
  margin: 0;
  max-width: 62ch;
}

.sec {
  padding: 32px 0 0;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.filters {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.chip .n {
  margin-left: 6px;
  font-size: 12px;
  color: var(--ink-4);
  font-family: var(--mono);
}
.chip.on .n {
  color: var(--ink-2);
}

/* 搜索：手写检索框 */
.search {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 14px;
  border-radius: 2px;
  border: 1.4px solid var(--ink-3);
  background: var(--note);
  min-width: 190px;
  box-shadow: 2px 2px 0 var(--ink-shadow-4);
}

.search .p {
  color: var(--pen-red);
  font-size: 15px;
}

.search input {
  flex: 1;
  background: transparent;
  border: 0;
  outline: none;
  color: var(--ink);
  font-family: var(--hand);
  font-size: 15.5px;
  min-width: 80px;
}

.search input::placeholder {
  color: var(--ink-4);
}

.empty {
  padding: 44px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

.empty p {
  margin: 0;
  color: var(--ink-3);
  font-size: 16px;
}

@media (max-width: 640px) {
  .search {
    margin-left: 0;
    width: 100%;
  }
}
/* ---- 标签云 ---- */
.cloud {
  display: flex;
  gap: 9px 7px;
  flex-wrap: wrap;
  align-items: baseline;
  padding: 4px 0;
}

.tag-pill {
  display: inline-flex;
  align-items: baseline;
  gap: 5px;
  padding: 1px 11px;
  border-radius: 2px;
  border: 1.3px dashed var(--line-strong);
  background: rgb(var(--veil) / 0.9);
  color: var(--ink-2);
  box-shadow: 1px 1px 0 var(--sketch-shadow-2);
  transition: all 0.15s ease;
}

.tag-pill:hover {
  color: var(--ink);
  background: var(--hl-y);
  transform: translateY(-2px) rotate(-1deg);
}

.tag-pill .n {
  font-size: 11.5px;
  color: var(--ink-4);
  font-family: var(--mono);
}

</style>
