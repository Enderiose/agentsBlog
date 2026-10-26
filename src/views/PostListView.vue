<script setup lang="ts">
import { ref, computed } from 'vue'
import { sortedPosts, stats } from '@/lib/posts'
import PostRow from '@/components/PostRow.vue'

type Filter = 'all' | 'project' | 'pitfall' | 'changelog' | 'retro'

const filters: { key: Filter; label: string }[] = [
  { key: 'all', label: 'all' },
  { key: 'project', label: 'project' },
  { key: 'pitfall', label: 'pitfall' },
  { key: 'changelog', label: 'changelog' },
  { key: 'retro', label: 'retro' },
]

const active = ref<Filter>('all')
const q = ref('')

const list = computed(() => {
  const kw = q.value.trim().toLowerCase()
  return sortedPosts.filter((p) => {
    if (active.value !== 'all' && p.category !== active.value) return false
    if (!kw) return true
    return (
      p.title.toLowerCase().includes(kw) ||
      p.summary.toLowerCase().includes(kw) ||
      p.tags.join(' ').toLowerCase().includes(kw)
    )
  })
})

const countOf = (k: Filter) =>
  k === 'all' ? sortedPosts.length : sortedPosts.filter((p) => p.category === k).length
</script>

<template>
  <div class="wrap">
    <section class="head">
      <div class="term">
        <div class="term-bar">
          <span class="term-dots"><i /><i /><i /></span>
          <span>~/agents/posts</span>
          <span class="spacer" />
          <span>{{ list.length }} / {{ stats.posts }}</span>
        </div>
        <div class="term-body">
          <div class="cmd">
            <span class="p">~/agents</span> $ <b>ls -lt ./posts</b>
          </div>
          <h1>全部记录</h1>
          <p class="lede">
            按时间倒序，新的在上面。项目、踩坑、变更、总结都在这一条时间线上。
          </p>
        </div>
      </div>
    </section>

    <section class="sec">
      <div class="toolbar">
        <div class="filters">
          <button
            v-for="f in filters"
            :key="f.key"
            :class="['chip', { on: active === f.key }]"
            @click="active = f.key"
          >
            {{ f.label }}
            <span class="n">{{ countOf(f.key) }}</span>
          </button>
        </div>

        <div class="search">
          <span class="p">$</span>
          <input v-model="q" type="text" placeholder="grep …" />
        </div>
      </div>

      <div v-if="list.length" class="log">
        <PostRow v-for="p in list" :key="p.slug" :post="p" />
      </div>

      <div v-else class="empty glass">
        <p>没有匹配的记录。</p>
        <button class="btn" @click="((active = 'all'), (q = ''))">清空筛选</button>
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
  max-width: 62ch;
}

.sec {
  padding: 36px 0 0;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chip .n {
  margin-left: 6px;
  font-size: 10.5px;
  color: var(--ink-4);
}
.chip.on .n {
  color: #a78bfa;
}

.search {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--stroke);
  background: var(--panel);
  min-width: 180px;
}

.search .p {
  color: var(--prompt);
  font-size: 13px;
}

.search input {
  flex: 1;
  background: transparent;
  border: 0;
  outline: none;
  color: var(--ink);
  font-family: var(--mono);
  font-size: 13.5px;
  min-width: 80px;
}

.search input::placeholder {
  color: var(--ink-4);
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
  font-size: 14px;
}

@media (max-width: 640px) {
  .search {
    margin-left: 0;
    width: 100%;
  }
}
</style>
