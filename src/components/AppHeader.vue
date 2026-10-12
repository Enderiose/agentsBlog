<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { search } from '@/lib/posts'
import type { Post } from '@/lib/posts'

const route = useRoute()
const router = useRouter()

const nav = [
  { name: 'home', to: '/', label: '首页' },
  { name: 'projects', to: '/projects', label: '项目' },
  { name: 'posts', to: '/posts', label: '记录' },
  { name: 'tags', to: '/tags', label: '标签' },
  { name: 'about', to: '/about', label: '关于' },
]

const isActive = (name: string) => {
  if (name === 'posts') return route.name === 'posts' || route.name === 'post'
  if (name === 'projects') return route.name === 'projects'
  if (name === 'tags') return route.name === 'tags' || route.name === 'tag'
  return route.name === name
}

/* ---- 搜索 ---- */
const open = ref(false)
const q = ref('')
const inputEl = ref<HTMLInputElement | null>(null)

const results = computed<Post[]>(() => (q.value.trim().length > 0 ? search(q.value) : []))

watch(open, async (v) => {
  if (v) {
    await new Promise((r) => setTimeout(r, 30))
    inputEl.value?.focus()
  } else {
    q.value = ''
  }
})

function goto(slug: string) {
  open.value = false
  router.push(`/posts/${slug}`)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}

// Ctrl/Cmd + K 唤起搜索
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    open.value = !open.value
  }
})
</script>

<template>
  <header>
    <div class="wrap bar">
      <RouterLink to="/" class="brand" aria-label="回到首页">
        <span class="prompt">~/</span><span class="name">AGENT.LOG</span><span class="cursor" />
      </RouterLink>

      <nav class="nav">
        <RouterLink
          v-for="n in nav"
          :key="n.name"
          :to="n.to"
          :class="['nav-link', { on: isActive(n.name) }]"
        >
          {{ n.label }}
        </RouterLink>
      </nav>

      <div class="actions">
        <button class="icon-btn" title="搜索 (Ctrl+K)" @click="open = !open">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" stroke-linecap="round" />
          </svg>
        </button>
        <a class="icon-btn gh" :href="`https://github.com/Enderiose/agentsBlog`" target="_blank" rel="noopener" title="GitHub">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.2-.1-.3-.5-1.5.1-3 0 0 1-.3 3.3 1.2a11 11 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.5.2 2.7.1 3 .8.9 1.2 1.9 1.2 3.2 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .4.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z"
            />
          </svg>
        </a>
      </div>
    </div>

    <!-- 搜索面板 -->
    <Transition name="fade">
      <div v-if="open" class="search-layer" @click.self="open = false">
        <div class="search-panel glass">
          <div class="search-head">
            <span class="prompt">$</span>
            <input
              ref="inputEl"
              v-model="q"
              type="text"
              placeholder="grep -r …  输入关键词搜索"
              @keydown="onKeydown"
            />
            <kbd>ESC</kbd>
          </div>

          <div v-if="q.trim() && results.length === 0" class="search-empty">
            没有匹配的记录。
          </div>

          <ul v-else-if="results.length" class="search-results">
            <li v-for="p in results" :key="p.slug" @click="goto(p.slug)">
              <span :class="['cat', `cat-${p.category}`]">{{ p.categoryLabel }}</span>
              <span class="t">{{ p.title }}</span>
              <span class="d">{{ p.date }}</span>
            </li>
          </ul>

          <div v-else class="search-hint">
            搜索标题、摘要、标签或正文。按 <kbd>Ctrl</kbd>+<kbd>K</kbd> 随时唤起。
          </div>
        </div>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
header {
  position: sticky;
  top: 0;
  z-index: 60;
  padding: 14px 0;
  background: linear-gradient(180deg, rgba(7, 8, 15, 0.86), rgba(7, 8, 15, 0.3));
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.bar {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* ---- 品牌 ---- */
.brand {
  display: flex;
  align-items: center;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.3px;
  white-space: nowrap;
}
.brand .prompt {
  color: var(--prompt);
}
.brand .name {
  color: var(--ink);
  margin-right: 3px;
}
.brand .cursor {
  width: 8px;
  height: 14px;
  vertical-align: -1px;
}

/* ---- 导航 ---- */
.nav {
  margin-left: auto;
  display: flex;
  gap: 4px;
  align-items: center;
}

.nav-link {
  padding: 7px 14px;
  border-radius: var(--radius-pill);
  font-size: 13.5px;
  color: var(--ink-2);
  transition: all 0.18s ease;
  white-space: nowrap;
}
.nav-link:hover {
  color: var(--ink);
  background: var(--panel-2);
}
.nav-link.on {
  color: var(--ink);
  background: rgba(124, 92, 255, 0.16);
  border: 1px solid rgba(124, 92, 255, 0.4);
  padding: 6px 13px;
}

/* ---- 动作 ---- */
.actions {
  display: flex;
  gap: 6px;
  align-items: center;
}

.icon-btn {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid var(--stroke);
  background: var(--panel);
  color: var(--ink-2);
  cursor: pointer;
  transition: all 0.18s ease;
}
.icon-btn:hover {
  color: var(--ink);
  background: var(--panel-2);
  border-color: var(--stroke-2);
  transform: translateY(-1px);
}

/* ---- 搜索 ---- */
.search-layer {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: rgba(4, 5, 10, 0.72);
  backdrop-filter: blur(6px);
  display: flex;
  justify-content: center;
  padding-top: 12vh;
}

.search-panel {
  width: min(660px, calc(100vw - 32px));
  max-height: 70vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 40px 100px -40px rgba(124, 92, 255, 0.7);
}

.search-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--stroke);
}
.search-head .prompt {
  color: var(--prompt);
  font-size: 14px;
}
.search-head input {
  flex: 1;
  background: transparent;
  border: 0;
  outline: none;
  color: var(--ink);
  font-family: var(--mono);
  font-size: 15px;
}
.search-head input::placeholder {
  color: var(--ink-4);
}

kbd {
  font-family: var(--mono);
  font-size: 10.5px;
  padding: 2px 6px;
  border-radius: 5px;
  border: 1px solid var(--stroke);
  background: rgba(255, 255, 255, 0.06);
  color: var(--ink-3);
}

.search-results {
  list-style: none;
  margin: 0;
  padding: 8px;
  overflow-y: auto;
}

.search-results li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.14s ease;
}
.search-results li:hover {
  background: rgba(124, 92, 255, 0.12);
}
.search-results .t {
  flex: 1;
  font-size: 14px;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.search-results .d {
  font-size: 12px;
  color: var(--ink-4);
}

.search-empty,
.search-hint {
  padding: 22px 20px;
  font-size: 13.5px;
  color: var(--ink-3);
}

@media (max-width: 860px) {
  .nav-link {
    padding: 6px 10px;
    font-size: 13px;
  }
}

@media (max-width: 620px) {
  .bar {
    flex-wrap: wrap;
  }
  .nav {
    order: 3;
    width: 100%;
    margin-left: 0;
    overflow-x: auto;
    padding-bottom: 2px;
    scrollbar-width: none;
  }
  .nav::-webkit-scrollbar {
    display: none;
  }
  .actions {
    margin-left: auto;
  }
}
</style>
