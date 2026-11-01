<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { search } from '@/lib/posts'
import type { Post } from '@/lib/posts'
import {
  THEME_MODES,
  applyMode,
  onSystemChange,
  readMode,
  saveMode,
  type ThemeMode,
} from '@/lib/theme'

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

/* ---- 配色：系统 / 浅 / 深 ---- */
const mode = ref<ThemeMode>(readMode())
applyMode(mode.value)

let offSystem: (() => void) | null = null
function bindSystem() {
  offSystem?.()
  offSystem = mode.value === 'system' ? onSystemChange(() => applyMode('system')) : null
}
bindSystem()

function setMode(next: ThemeMode) {
  mode.value = next
  saveMode(next)
  applyMode(next)
  bindSystem()
}

onUnmounted(() => offSystem?.())

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
        <div class="theme-switch" role="radiogroup" aria-label="配色">
          <button
            v-for="m in THEME_MODES"
            :key="m.mode"
            type="button"
            role="radio"
            :aria-checked="mode === m.mode"
            :class="['theme-btn', { on: mode === m.mode }]"
            :title="m.title"
            @click="setMode(m.mode)"
          >
            {{ m.label }}
          </button>
        </div>
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
/* 手账封面页眉：横线纸 + 索引标签 + 手写品牌 */
header {
  position: sticky;
  top: 0;
  z-index: 60;
  padding: 10px 0 0;
  background: rgb(var(--paper-rgb) / 0.93);
  backdrop-filter: blur(6px) saturate(120%);
  -webkit-backdrop-filter: blur(6px) saturate(120%);
  border-bottom: 1.5px solid var(--stroke-2);
}

/* 页眉下方的双线，像作业本抬头 */
header::after {
  content: "";
  display: block;
  height: 3px;
  margin-top: 0;
  background: repeating-linear-gradient(
    90deg,
    var(--line-strong-2) 0 10px,
    transparent 10px 20px
  );
  opacity: 0.5;
}

.bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 9px;
}

/* ---- 品牌：手写签名 ---- */
.brand {
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: 400;
  letter-spacing: 0.4px;
  white-space: nowrap;
  padding: 2px 6px;
  border-bottom: 2px solid var(--ink);
  border-radius: 1px;
}

.brand .prompt {
  color: var(--pen-red);
  margin-right: 2px;
  transform: rotate(-8deg);
  display: inline-block;
}

.brand .name {
  color: var(--ink);
  margin-right: 3px;
  background: linear-gradient(transparent 58%, var(--hl-y) 58% 94%, transparent 94%);
  padding: 0 2px;
}

.brand .cursor {
  width: 2px;
  height: 18px;
  vertical-align: -3px;
}

/* ---- 导航：索引标签 ---- */
.nav {
  margin-left: auto;
  display: flex;
  gap: 2px;
  align-items: flex-end;
}

.nav-link {
  position: relative;
  padding: 6px 15px 7px;
  border-radius: 3px 3px 0 0;
  font-size: 15.5px;
  color: var(--ink-3);
  border: 1.3px solid transparent;
  border-bottom: 0;
  transition: all 0.16s ease;
  white-space: nowrap;
}

.nav-link:hover {
  color: var(--ink);
  background: rgb(var(--veil) / 0.85);
  border-color: var(--stroke);
}

.nav-link.on {
  color: var(--ink);
  background: var(--note);
  border-color: var(--stroke-2);
  box-shadow: 0 -2px 0 var(--hl-y) inset;
  transform: translateY(1px);
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
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1.4px solid var(--ink-3);
  background: var(--note);
  color: var(--ink-2);
  cursor: pointer;
  transition: all 0.16s ease;
  box-shadow: 1px 1px 0 var(--ink-shadow-3);
}
.icon-btn:hover {
  color: var(--ink);
  background: var(--hl-y);
  border-color: var(--ink);
  transform: rotate(-6deg);
}

/* ---- 搜索：便签面板 ---- */
.search-layer {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: var(--scrim);
  backdrop-filter: blur(3px);
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
  background: var(--note);
  border: 1.5px solid var(--stroke-2);
  border-radius: 3px;
  box-shadow: 6px 8px 0 var(--sketch-shadow-7);
}

.search-panel::before {
  width: 96px;
  height: 24px;
  background: var(--tape-2);
  transform: translateX(-50%) rotate(-1.6deg);
}

.search-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 20px;
  border-bottom: 1px dashed var(--stroke-2);
  background: repeating-linear-gradient(
    0deg,
    transparent 0 31px,
    var(--grid-c) 31px 32px
  );
}
.search-head .prompt {
  color: var(--pen-red);
  font-size: 15px;
}
.search-head input {
  flex: 1;
  background: transparent;
  border: 0;
  outline: none;
  color: var(--ink);
  font-family: var(--hand);
  font-size: 17px;
}
.search-head input::placeholder {
  color: var(--ink-4);
}

kbd {
  font-family: var(--mono);
  font-size: 10.5px;
  padding: 1px 6px;
  border-radius: 2px;
  border: 1px solid var(--stroke-2);
  background: var(--paper-2);
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
  padding: 9px 12px;
  border-radius: 2px;
  cursor: pointer;
  transition: background 0.14s ease;
  border-bottom: 1px dashed var(--rule-dash);
}
.search-results li:last-child {
  border-bottom: 0;
}
.search-results li:hover {
  background: linear-gradient(transparent 12%, var(--hl-y) 12% 94%, transparent 94%);
}
.search-results .t {
  flex: 1;
  font-size: 16px;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.search-results .d {
  font-size: 12.5px;
  color: var(--ink-4);
  font-family: var(--mono);
}

.search-empty,
.search-hint {
  padding: 22px 20px;
  font-size: 15px;
  color: var(--ink-3);
}

@media (max-width: 860px) {
  .nav-link {
    padding: 5px 10px 6px;
    font-size: 14.5px;
  }
  .brand {
    font-size: 18px;
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
