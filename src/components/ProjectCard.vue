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
.card {
  display: flex;
  flex-direction: column;
  padding: 22px;
  border-radius: var(--radius);
  border: 1px solid var(--stroke);
  background: linear-gradient(180deg, rgba(13, 15, 26, 0.72), rgba(9, 10, 18, 0.72));
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  transition: all 0.22s ease;
  position: relative;
  overflow: hidden;
}

.card::after {
  content: "";
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.24s ease;
  pointer-events: none;
  background: radial-gradient(
    420px circle at var(--mx, 50%) var(--my, 0%),
    rgba(124, 92, 255, 0.14),
    transparent 62%
  );
}

.card:hover {
  transform: translateY(-4px);
  border-color: rgba(124, 92, 255, 0.5);
  box-shadow: 0 28px 64px -38px rgba(124, 92, 255, 0.95);
}

.card:hover::after {
  opacity: 1;
}

.idx {
  font-size: 11.5px;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: var(--v1);
  margin-bottom: 12px;
}

h3.pname {
  font-size: 17.5px;
  line-height: 1.35;
  letter-spacing: -0.4px;
  margin: 0 0 6px;
  color: var(--ink);
  transition: all 0.2s ease;
}

/* 文章标题：内容式标题，作为项目名下面的副行 */
p.ptitle {
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--ink-2);
  margin: 0 0 12px;
  flex: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card:hover h3.pname {
  background: linear-gradient(100deg, #c4b5fd, #67e8f9);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

p {
  font-size: 13.5px;
  line-height: 1.75;
  color: var(--ink-2);
  margin: 0 0 16px;
  flex: 1;
}

.stack {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.tag {
  font-size: 11px;
  padding: 3px 9px;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--stroke);
  color: var(--ink-3);
}

.foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 14px;
  border-top: 1px solid var(--stroke);
  font-size: 12px;
  color: var(--ink-4);
}

.st {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--ink-3);
}
</style>
