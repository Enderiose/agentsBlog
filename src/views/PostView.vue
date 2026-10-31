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
  padding-top: 34px;
}

/* ---- 面包屑：手写路径 ---- */
.crumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--ink-4);
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.crumb a:hover {
  color: var(--pen-blue);
  background: linear-gradient(transparent 55%, var(--hl-b) 55% 92%, transparent 92%);
}
.crumb .cur {
  color: var(--ink-2);
  font-family: var(--mono);
  font-size: 13px;
}

/* ---- 头部：一张贴好的便签 ---- */
.phead {
  padding: 30px 32px 26px;
  margin-bottom: 38px;
  border-radius: 2px;
}

.meta-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  font-size: 13.5px;
  color: var(--ink-3);
  flex-wrap: wrap;
}

.proj {
  color: var(--ink-2);
  font-size: 14px;
  letter-spacing: 0.2px;
}

/* 状态标签：手写圈注 */
.st {
  font-size: 12.5px;
  letter-spacing: 0.3px;
  padding: 0 8px;
  border-radius: 2px;
  border: 1.4px solid currentColor;
}
.st-wip {
  color: var(--amber);
  border-style: dashed;
}
.st-dead {
  color: var(--ink-4);
  border-style: dashed;
  opacity: 0.9;
}

h1 {
  font-size: clamp(26px, 4.2vw, 42px);
  line-height: 1.35;
  letter-spacing: 0.5px;
  margin: 0 0 14px;
  font-weight: 400;
}

.summary {
  color: var(--ink-2);
  font-size: 16.5px;
  line-height: 1.9;
  margin: 0 0 18px;
  max-width: 68ch;
  padding-left: 12px;
  border-left: 3px solid var(--hl-y);
}

.tags {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
}

.tag-pill {
  font-size: 13.5px;
  padding: 0 10px;
  border-radius: 2px;
  border: 1.3px dashed rgba(150, 138, 108, 0.75);
  background: rgba(255, 253, 244, 0.9);
  color: var(--ink-2);
  transition: all 0.15s ease;
}
.tag-pill:hover {
  color: var(--ink);
  background: var(--hl-y);
  transform: rotate(-1deg);
}

.stack {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1.5px dashed var(--stroke);
  font-size: 13px;
  color: var(--ink-4);
}
.stack .lbl {
  letter-spacing: 0.4px;
  font-family: var(--mono);
  font-size: 12.5px;
}
.stack .s {
  padding: 0 8px;
  border-radius: 2px;
  background: var(--hl-g);
  border: 1px solid rgba(47, 125, 91, 0.3);
  color: #1f4a38;
  font-size: 13px;
}
.stack .s.repo {
  color: #1f3f66;
  border-color: rgba(44, 92, 158, 0.3);
  background: var(--hl-b);
}
.stack .s.repo:hover {
  border-color: var(--pen-blue);
}

/* ---- 布局 ---- */
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 214px;
  gap: 44px;
  align-items: start;
}

/* 目录：贴在右边的小纸条 */
.toc-inner {
  padding: 16px 18px 18px;
  position: sticky;
  top: 92px;
  max-height: calc(100vh - 140px);
  overflow-y: auto;
  overscroll-behavior: contain;
  border-radius: 2px;
  background: var(--note-b);
}

.toc-inner::before {
  width: 54px;
  height: 18px;
  background: rgba(255, 255, 255, 0.62);
  transform: translateX(-50%) rotate(2deg);
}

.toc-inner::-webkit-scrollbar {
  width: 4px;
}
.toc-inner::-webkit-scrollbar-thumb {
  background: rgba(160, 148, 118, 0.4);
  border: 0;
}

.toc h4 {
  font-size: 14px;
  letter-spacing: 0.6px;
  color: var(--ink-2);
  margin: 0 0 10px;
  font-weight: 400;
  padding-bottom: 6px;
  border-bottom: 1.5px dashed rgba(150, 140, 110, 0.4);
}

.toc ul {
  list-style: none;
  margin: 0;
  padding: 0;
  border-left: 1.5px solid rgba(150, 140, 110, 0.35);
}

.toc li a {
  display: block;
  padding: 4px 0 4px 11px;
  font-size: 14px;
  color: var(--ink-3);
  border-left: 2px solid transparent;
  margin-left: -1.5px;
  transition: all 0.15s ease;
  line-height: 1.55;
}
.toc li a:hover {
  color: var(--ink);
  border-left-color: var(--pen-red);
}
.toc li.active a {
  color: var(--ink);
  border-left-color: var(--pen-red);
  background: linear-gradient(transparent 20%, var(--hl-y) 20% 96%, transparent 96%);
}
.toc .lv3 a {
  padding-left: 22px;
  font-size: 13.5px;
  color: var(--ink-4);
}

/* ---- 上下篇：两个小纸条 ---- */
.pn {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 52px;
}

.pn-item {
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  transition: transform 0.16s ease, box-shadow 0.16s ease;
  border-radius: 2px;
}

.pn-item:hover {
  transform: translateY(-2px) rotate(-0.4deg);
  box-shadow: 4px 6px 0 rgba(84, 68, 32, 0.12);
}

.pn-item .lbl {
  font-size: 12.5px;
  letter-spacing: 0.3px;
  color: var(--ink-4);
}

.pn-item .t {
  font-size: 16px;
  color: var(--ink);
  line-height: 1.5;
}

.pn-item.right {
  text-align: right;
}

.sec {
  padding: 48px 0 0;
}

/* ---- 404 ---- */
.nf {
  padding: 90px 24px;
  display: grid;
  place-items: center;
}

.nf-box {
  padding: 44px 38px;
  text-align: center;
  max-width: 460px;
}

.nf-box .code {
  font-size: 62px;
  letter-spacing: 2px;
  color: var(--pen-red);
  line-height: 1;
  margin-bottom: 14px;
  font-family: var(--mono);
  transform: rotate(-2deg);
}

.nf-box h2 {
  font-size: 21px;
  margin: 0 0 8px;
  font-weight: 400;
}

.nf-box p {
  color: var(--ink-3);
  font-size: 15px;
  margin: 0 0 22px;
}

@media (max-width: 980px) {
  .layout {
    grid-template-columns: 1fr;
    gap: 28px;
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
    padding: 22px 18px;
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
  top: 8px;
  right: 8px;
  font-family: var(--hand);
  font-size: 13px;
  letter-spacing: 0.3px;
  padding: 2px 10px;
  border-radius: 2px;
  border: 1.3px solid var(--ink-3);
  background: var(--note);
  color: var(--ink-2);
  cursor: pointer;
  opacity: 0;
  transition: all 0.16s ease;
  box-shadow: 1px 1px 0 rgba(46, 58, 72, 0.2);
}

.prose pre.code-block:hover .copy-btn {
  opacity: 1;
}

.prose pre .copy-btn:hover {
  background: var(--hl-y);
  color: var(--ink);
  border-color: var(--ink);
}
</style>
