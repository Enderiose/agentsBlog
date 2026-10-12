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
            这里没有邮件列表，也不打算有。想第一时间看到新记录，用 RSS ——
            没有算法、没有广告、不用留邮箱。
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
        把上面这行粘进任意阅读器 —— Feedly、Inoreader、NetNewsWire、Reeder、FreshRSS 都行。
        支持自动发现的浏览器也能直接识别本站。
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

.urlbox {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 18px;
  flex-wrap: wrap;
}

.urlbox code {
  flex: 1;
  min-width: 240px;
  font-size: 13px;
  color: var(--ink-2);
  word-break: break-all;
  line-height: 1.6;
}

.hint {
  font-size: 13px;
  color: var(--ink-4);
  line-height: 1.8;
  margin: 14px 0 0;
  max-width: 66ch;
}

.hint a {
  color: var(--v2);
}
.hint a:hover {
  text-decoration: underline;
}

@media (max-width: 640px) {
  .urlbox {
    padding: 14px;
  }
  .urlbox .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
