<script setup lang="ts">
import type { Post } from '@/lib/posts'

defineProps<{
  post: Post
  index?: number
}>()

const STATUS_LABEL: Record<Post['status'], string> = {
  shipped: '已交付',
  wip: '进行中',
  abandoned: '已弃坑',
}

function glow(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement
  const r = el.getBoundingClientRect()
  el.style.setProperty('--mx', `${e.clientX - r.left}px`)
  el.style.setProperty('--my', `${e.clientY - r.top}px`)
}
</script>

<template>
  <RouterLink :to="`/posts/${post.slug}`" class="card" @mousemove="glow">
    <div class="idx">
      <span v-if="post.pinned" class="pin">置顶</span>
      <span v-if="index !== undefined">{{ String(index + 1).padStart(2, '0') }} / </span>{{ post.category }}
    </div>

    <h3 class="pname">{{ post.project || post.title }}</h3>
    <p class="ptitle">{{ post.title }}</p>
    <p>{{ post.summary }}</p>

    <div v-if="post.stack.length" class="stack">
      <span v-for="s in post.stack.slice(0, 4)" :key="s" class="tag">{{ s }}</span>
    </div>

    <div class="foot">
      <span class="st">
        <i :class="['dot', `dot-${post.status}`]" />
        {{ STATUS_LABEL[post.status] }}
      </span>
      <span>{{ post.date }}</span>
    </div>
  </RouterLink>
</template>

<style scoped>
/* 项目卡：贴在纸上的便利贴，轮流换颜色 + 胶带 */
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 22px 20px 18px;
  border-radius: 2px;
  border: 1px solid var(--line-mid);
  background: var(--note-y);
  box-shadow: 3px 4px 0 var(--sketch-shadow-5);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  overflow: visible;
}

/* 便签上沿的胶带 */
.card::before {
  content: "";
  position: absolute;
  top: -10px;
  left: 22px;
  width: 66px;
  height: 20px;
  transform: rotate(-4deg);
  background: rgb(var(--veil) / 0.55);
  border-left: 1px dashed var(--line-soft);
  border-right: 1px dashed var(--line-soft);
  pointer-events: none;
}

/* 右下角折角 */
.card::after {
  content: "";
  position: absolute;
  right: 0;
  bottom: 0;
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, transparent 50%, var(--line-soft) 50%);
  pointer-events: none;
}

.card:hover {
  transform: translateY(-4px) rotate(-0.7deg);
  box-shadow: 5px 8px 0 var(--sketch-shadow-8);
}

.idx {
  font-size: 13px;
  letter-spacing: 0.6px;
  color: var(--ink-3);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--mono);
}

.pin {
  font-size: 11.5px;
  padding: 0 7px;
  border-radius: 2px;
  color: var(--ink);
  background: var(--hl-p);
  border-bottom: 1.4px solid var(--v3);
  font-family: var(--hand);
  transform: rotate(-2deg);
}

h3.pname {
  font-size: 20px;
  line-height: 1.35;
  margin: 0 0 4px;
  color: var(--ink);
  font-weight: 400;
  letter-spacing: 0.2px;
}

/* 文章标题：铅笔小字 */
p.ptitle {
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--ink-3);
  margin: 0 0 10px;
  flex: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card:hover h3.pname {
  background: linear-gradient(transparent 60%, var(--hl-y) 60% 94%, transparent 94%);
}

p {
  font-size: 15px;
  line-height: 1.75;
  color: var(--ink-2);
  margin: 0 0 14px;
  flex: 1;
}

.stack {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.tag {
  font-size: 12.5px;
  padding: 0 8px;
  border-radius: 2px;
  background: rgb(var(--veil) / 0.6);
  border: 1px solid var(--line-mid-2);
  color: var(--ink-2);
}

.foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1.5px dashed var(--line-soft-2);
  font-size: 13px;
  color: var(--ink-3);
}

.st {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--ink-2);
}
</style>
