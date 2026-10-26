<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { getPost, adjacent, related } from '@/lib/posts'
import PostRow from '@/components/PostRow.vue'

const props = defineProps<{ slug: string }>()

const post = computed(() => getPost(props.slug))
const nav = computed(() => adjacent(props.slug))
const rel = computed(() => related(props.slug, 3))

/* 代码块复制按钮 */
async function enhanceCodeBlocks() {
  await nextTick()
  document.querySelectorAll<HTMLPreElement>('.prose pre').forEach((pre) => {
    if (pre.dataset.enhanced) return
    pre.dataset.enhanced = '1'
    pre.classList.add('code-block')

    const btn = document.createElement('button')
    btn.className = 'copy-btn'
    btn.type = 'button'
    btn.textContent = 'copy'
    btn.addEventListener('click', async () => {
      const code = pre.querySelector('code')?.textContent ?? ''
      try {
        await navigator.clipboard.writeText(code)
        btn.textContent = 'copied'
        setTimeout(() => (btn.textContent = 'copy'), 1400)
      } catch {
        btn.textContent = 'failed'
        setTimeout(() => (btn.textContent = 'copy'), 1400)
      }
    })
    pre.appendChild(btn)
  })
}

/* 目录滚动高亮 */
const activeId = ref('')
let ticking = false

function onScroll() {
  if (ticking) return
  ticking = true
  requestAnimationFrame(() => {
    ticking = false
    const hs = Array.from(document.querySelectorAll<HTMLElement>('.prose h2, .prose h3'))
    let cur = ''
    for (const h of hs) {
      if (h.getBoundingClientRect().top <= 120) cur = h.id
      else break
    }
    activeId.value = cur
  })
}

onMounted(() => {
  enhanceCodeBlocks()
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => window.removeEventListener('scroll', onScroll))

watch(
  () => props.slug,
  () => {
    enhanceCodeBlocks()
    activeId.value = ''
  },
)
</script>

<template>
  <div v-if="post" class="wrap post-wrap">
    <!-- 面包屑 -->
    <nav class="crumb">
      <RouterLink to="/">~</RouterLink>
      <span class="sep">/</span>
      <RouterLink to="/posts">posts</RouterLink>
      <span class="sep">/</span>
      <span class="cur">{{ post.slug }}</span>
    </nav>

    <!-- 头部 -->
    <header class="phead glass">
      <div class="meta-top">
        <span :class="['cat', `cat-${post.category}`]">{{ post.categoryLabel }}</span>
        <span v-if="post.project" class="proj">{{ post.project }}</span>
        <span v-if="post.status === 'wip'" class="st st-wip">进行中</span>
        <span v-else-if="post.status === 'abandoned'" class="st st-dead">已弃坑</span>
        <span class="date">{{ post.date }}</span>
        <template v-if="post.updated">
          <span class="sep">·</span>
          <span class="rt">更新于 {{ post.updated }}</span>
        </template>
        <span class="sep">·</span>
        <span class="rt">{{ post.readingTime }} 分钟</span>
      </div>

      <h1>{{ post.title }}</h1>
      <p class="summary">{{ post.summary }}</p>

      <div class="tags">
        <RouterLink v-for="t in post.tags" :key="t" :to="`/tags/${t}`" class="tag-pill">
          #{{ t }}
        </RouterLink>
      </div>

      <div v-if="post.stack.length" class="stack">
        <span class="lbl">stack:</span>
        <span v-for="s in post.stack" :key="s" class="s">{{ s }}</span>
      </div>

      <div v-if="post.repo" class="stack">
        <span class="lbl">repo:</span>
        <a class="s repo" :href="post.repo" target="_blank" rel="noopener">
          {{ post.repo.replace(/^https:\/\/github\.com\//, '') }}
        </a>
      </div>
    </header>

    <div class="layout">
      <!-- 正文 -->
      <article class="prose" v-html="post.html" />

      <!-- 目录 -->
      <aside v-if="post.toc.length > 1" class="toc">
        <div class="toc-inner glass">
          <h4>// contents</h4>
          <ul>
            <li
              v-for="(t, i) in post.toc"
              :key="i"
              :class="[`lv${t.level}`, { active: t.id === activeId }]"
            >
              <a :href="`#${t.id}`">{{ t.text }}</a>
            </li>
          </ul>
        </div>
      </aside>
    </div>

    <!-- 上下篇 -->
    <nav class="pn">
      <RouterLink v-if="nav.prev" :to="`/posts/${nav.prev.slug}`" class="pn-item glass">
        <span class="lbl">← 更新的一篇</span>
        <span class="t">{{ nav.prev.title }}</span>
      </RouterLink>
      <span v-else class="pn-empty" />

      <RouterLink v-if="nav.next" :to="`/posts/${nav.next.slug}`" class="pn-item glass right">
        <span class="lbl">更早的一篇 →</span>
        <span class="t">{{ nav.next.title }}</span>
      </RouterLink>
    </nav>

    <!-- 相关 -->
    <section v-if="rel.length" class="sec">
      <div class="sec-head">
        <h2>related</h2>
        <div class="rule" />
      </div>
      <div class="log">
        <PostRow v-for="p in rel" :key="p.slug" :post="p" />
      </div>
    </section>
  </div>

  <!-- 404 -->
  <div v-else class="wrap nf">
    <div class="glass nf-box">
      <div class="code">404</div>
      <h2>这个文件不存在</h2>
      <p><code>{{ slug }}.md</code> 找不到。</p>
      <RouterLink class="btn btn-primary" to="/posts">回到全部记录</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.post-wrap {
  padding-top: 40px;
}

/* ---- 面包屑 ---- */
.crumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: var(--ink-4);
  margin-bottom: 22px;
  flex-wrap: wrap;
}
.crumb a:hover {
  color: var(--v2);
}
.crumb .cur {
  color: var(--ink-3);
}

/* ---- 头部 ---- */
.phead {
  padding: 32px 34px;
  margin-bottom: 40px;
}

.meta-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
  font-size: 12px;
  color: var(--ink-4);
  flex-wrap: wrap;
}

/* 所属项目名 */
.proj {
  color: var(--ink-2);
  font-size: 12.5px;
  letter-spacing: 0.2px;
}

/* 状态标签：进行中 / 已弃坑 */
.st {
  font-size: 11px;
  letter-spacing: 0.6px;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  border: 1px solid currentColor;
  opacity: 0.85;
}
.st-wip {
  color: var(--warn);
}
.st-dead {
  color: var(--ink-4);
  border-style: dashed;
}

h1 {
  font-size: clamp(25px, 4.2vw, 40px);
  line-height: 1.2;
  letter-spacing: -1.4px;
  margin: 0 0 16px;
}

.summary {
  color: var(--ink-2);
  font-size: 15px;
  line-height: 1.8;
  margin: 0 0 20px;
  max-width: 68ch;
}

.tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag-pill {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--stroke);
  background: rgba(255, 255, 255, 0.04);
  color: var(--ink-3);
  transition: all 0.18s ease;
}
.tag-pill:hover {
  color: #c4b5fd;
  border-color: rgba(124, 92, 255, 0.5);
  background: rgba(124, 92, 255, 0.14);
}

.stack {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px dashed var(--stroke);
  font-size: 12px;
  color: var(--ink-4);
}
.stack .lbl {
  letter-spacing: 1.2px;
  text-transform: uppercase;
}
.stack .s {
  padding: 2px 9px;
  border-radius: 6px;
  background: rgba(34, 211, 238, 0.1);
  border: 1px solid rgba(34, 211, 238, 0.24);
  color: #67e8f9;
}
.stack .s.repo {
  color: #c4b5fd;
  border-color: rgba(124, 92, 255, 0.34);
  background: rgba(124, 92, 255, 0.12);
}
.stack .s.repo:hover {
  border-color: rgba(124, 92, 255, 0.7);
}

/* ---- 布局 ---- */
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 48px;
  align-items: start;
}

.toc-inner {
  padding: 18px 20px;
  position: sticky;
  top: 96px;
  max-height: calc(100vh - 140px);
  overflow-y: auto;
  overscroll-behavior: contain;
}

.toc-inner::-webkit-scrollbar {
  width: 4px;
}
.toc-inner::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.14);
  border: 0;
}

.toc h4 {
  font-size: 11.5px;
  letter-spacing: 1.6px;
  text-transform: uppercase;
  color: var(--v1);
  margin: 0 0 12px;
  font-weight: 700;
}

.toc ul {
  list-style: none;
  margin: 0;
  padding: 0;
  border-left: 1px solid var(--stroke);
}

.toc li a {
  display: block;
  padding: 5px 0 5px 12px;
  font-size: 12.5px;
  color: var(--ink-3);
  border-left: 2px solid transparent;
  margin-left: -1px;
  transition: all 0.16s ease;
  line-height: 1.5;
}
.toc li a:hover {
  color: #c4b5fd;
  border-left-color: var(--v1);
}
.toc li.active a {
  color: #c4b5fd;
  border-left-color: var(--v1);
  background: rgba(124, 92, 255, 0.08);
}
.toc .lv3 a {
  padding-left: 24px;
  font-size: 12px;
  color: var(--ink-4);
}

/* ---- 上下篇 ---- */
.pn {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 56px;
}

.pn-item {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  transition: all 0.2s ease;
}

.pn-item:hover {
  border-color: rgba(124, 92, 255, 0.5);
  transform: translateY(-2px);
}

.pn-item .lbl {
  font-size: 11px;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: var(--ink-4);
}

.pn-item .t {
  font-size: 14px;
  color: var(--ink);
  line-height: 1.5;
}

.pn-item.right {
  text-align: right;
}

.sec {
  padding: 52px 0 0;
}

/* ---- 404 ---- */
.nf {
  padding: 90px 24px;
  display: grid;
  place-items: center;
}

.nf-box {
  padding: 48px 40px;
  text-align: center;
  max-width: 460px;
}

.nf-box .code {
  font-size: 58px;
  letter-spacing: -3px;
  background: linear-gradient(120deg, #c4b5fd, #67e8f9);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  line-height: 1;
  margin-bottom: 16px;
}

.nf-box h2 {
  font-size: 19px;
  margin: 0 0 10px;
}

.nf-box p {
  color: var(--ink-3);
  font-size: 13.5px;
  margin: 0 0 24px;
}

@media (max-width: 980px) {
  .layout {
    grid-template-columns: 1fr;
    gap: 32px;
  }
  .toc-inner {
    position: static;
  }
  .toc {
    order: -1;
  }
}

@media (max-width: 640px) {
  .phead {
    padding: 24px 20px;
  }
  .pn {
    grid-template-columns: 1fr;
  }
  .pn-item.right {
    text-align: left;
  }
}
</style>

<style>
/* 代码块复制按钮（非 scoped：操作的是 v-html 内容） */
.prose pre.code-block {
  position: relative;
}

.prose pre .copy-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.6px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.07);
  color: #a5b0cf;
  cursor: pointer;
  opacity: 0;
  transition: all 0.18s ease;
}

.prose pre.code-block:hover .copy-btn {
  opacity: 1;
}

.prose pre .copy-btn:hover {
  background: rgba(124, 92, 255, 0.28);
  color: #fff;
  border-color: rgba(124, 92, 255, 0.5);
}
</style>
