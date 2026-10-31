<script setup lang="ts">
import { computed } from 'vue'
import { postsByTag } from '@/lib/posts'
import PostRow from '@/components/PostRow.vue'

const props = defineProps<{ tag: string }>()

const list = computed(() => postsByTag(props.tag))
</script>

<template>
  <div class="wrap">
    <section class="head">
      <div class="term">
        <div class="term-bar">
          <span class="term-dots"><i /><i /><i /></span>
          <span>~/agents/tags/{{ tag }}</span>
          <span class="spacer" />
          <span>{{ list.length }} 篇</span>
        </div>
        <div class="term-body">
          <div class="cmd">
            <span class="p">~/agents</span> $ <b>grep -rl "#{{ tag }}" ./posts</b>
          </div>
          <h1>#{{ tag }}</h1>
        </div>
      </div>
    </section>

    <section class="sec">
      <div v-if="list.length" class="log">
        <PostRow v-for="p in list" :key="p.slug" :post="p" />
      </div>

      <div v-else class="empty glass">
        <p>没有带这个标签的记录。</p>
        <RouterLink class="btn" to="/tags">看全部标签</RouterLink>
      </div>

      <div class="back">
        <RouterLink to="/tags" class="btn">← 全部标签</RouterLink>
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
  box-shadow: 2px 2px 0 rgba(46, 58, 72, 0.12);
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
h1 {
  color: var(--ink);
  padding: 0 6px;
  display: table;
  background: linear-gradient(transparent 52%, var(--hl-y) 52% 92%, transparent 92%);
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

.back {
  margin-top: 26px;
}

</style>
