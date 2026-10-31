<script setup lang="ts">
import { ref, computed } from 'vue'
import { sortedPosts, site } from '@/lib/posts'
import PostRow from '@/components/PostRow.vue'

const feedUrl = `${site.url}/feed.xml`
const latest = computed(() => sortedPosts.slice(0, 10))

const copied = ref(false)
let timer: number | undefined

async function copy() {
  try {
    await navigator.clipboard.writeText(feedUrl)
  } catch {
    // 非安全上下文或权限被拒时的降级：选中文本，让用户手动复制
    const el = document.getElementById('feed-url')
    if (el) {
      const range = document.createRange()
      range.selectNodeContents(el)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
  }
  copied.value = true
  window.clearTimeout(timer)
  timer = window.setTimeout(() => (copied.value = false), 1800)
}
</script>

<template>
  <div class="wrap">
    <section class="head">
      <div class="term">
        <div class="term-bar">
          <span class="term-dots"><i /><i /><i /></span>
          <span>~/agents/feed</span>
          <span class="spacer" />
          <span>application/rss+xml</span>
        </div>
        <div class="term-body">
          <div class="cmd">
            <span class="p">~/agents</span> $ <b>head -c 120 feed.xml</b>
          </div>
          <h1>订阅</h1>
          <p class="lede">
            新记录靠 RSS 分发，没有邮件列表，也不做站内推送。把地址粘进阅读器就能收到。
          </p>
        </div>
      </div>
    </section>

    <section class="sec">
      <div class="sec-head">
        <h2>feed_url</h2>
        <div class="rule" />
        <span class="count">RSS 2.0</span>
      </div>

      <div class="urlbox glass">
        <code id="feed-url">{{ feedUrl }}</code>
        <button class="btn btn-primary" type="button" @click="copy">
          {{ copied ? '已复制 ✓' : '复制地址' }}
        </button>
      </div>

      <p class="hint">
        主流阅读器（Feedly、Inoreader、NetNewsWire、Reeder、FreshRSS）都能直接订阅。用浏览器打开本站时，地址栏里的订阅按钮也能认出这个源。
      </p>
    </section>

    <section class="sec">
      <div class="sec-head">
        <h2>latest_in_feed</h2>
        <div class="rule" />
        <span class="count">{{ latest.length }} / {{ sortedPosts.length }}</span>
      </div>

      <div class="log">
        <PostRow v-for="p in latest" :key="p.slug" :post="p" />
      </div>

      <p class="hint">
        feed 里含最近 30 篇。<a :href="feedUrl" target="_blank" rel="noopener">直接看 feed.xml</a>
      </p>
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
.urlbox {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  flex-wrap: wrap;
  background: var(--note-b);
}

.urlbox code {
  flex: 1;
  min-width: 240px;
  font-size: 13.5px;
  color: var(--ink);
  word-break: break-all;
  line-height: 1.7;
  font-family: var(--mono);
}

.hint {
  font-size: 15px;
  color: var(--ink-3);
  line-height: 1.9;
  margin: 14px 0 0;
  max-width: 66ch;
}

.hint a {
  color: var(--pen-blue);
  border-bottom: 1.5px solid rgba(44, 92, 158, 0.35);
}
.hint a:hover {
  background: var(--hl-b);
}

@media (max-width: 640px) {
  .urlbox {
    padding: 12px;
  }
  .urlbox .btn {
    width: 100%;
    justify-content: center;
  }
}

</style>
