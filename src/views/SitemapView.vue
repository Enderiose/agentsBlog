<script setup lang="ts">
import { computed } from 'vue'
import { sortedPosts, allTags, stats, site } from '@/lib/posts'
import PostRow from '@/components/PostRow.vue'

const pages = [
  { to: '/', label: '首页', desc: '站点入口' },
  { to: '/posts', label: '全部记录', desc: `${stats.posts} 篇` },
  { to: '/projects', label: '项目', desc: `${stats.projects} 个` },
  { to: '/tags', label: '标签', desc: `${stats.tags} 个` },
  { to: '/feed', label: '订阅', desc: 'RSS' },
  { to: '/about', label: '关于', desc: '站点说明' },
]

const CATS = [
  { key: 'project', label: '项目' },
  { key: 'pitfall', label: '踩坑' },
  { key: 'changelog', label: '变更' },
  { key: 'retro', label: '总结' },
] as const

const groups = computed(() =>
  CATS.map((c) => ({ ...c, items: sortedPosts.filter((p) => p.category === c.key) })).filter(
    (g) => g.items.length,
  ),
)

const total = computed(() => pages.length + sortedPosts.length + allTags.length)
const sitemapUrl = `${site.url}/sitemap.xml`
</script>

<template>
  <div class="wrap">
    <section class="head">
      <div class="term">
        <div class="term-bar">
          <span class="term-dots"><i /><i /><i /></span>
          <span>~/agents/sitemap</span>
          <span class="spacer" />
          <span>{{ total }} urls</span>
        </div>
        <div class="term-body">
          <div class="cmd">
            <span class="p">~/agents</span> $ <b>tree -L 2 ./</b>
          </div>
          <h1>网站地图</h1>
          <p class="lede">页面、记录、标签都在这一页，找不到东西时可以从这儿翻。</p>
        </div>
      </div>
    </section>

    <section class="sec">
      <div class="sec-head">
        <h2>pages</h2>
        <div class="rule" />
        <span class="count">{{ pages.length }}</span>
      </div>
      <div class="pgrid">
        <RouterLink v-for="p in pages" :key="p.to" :to="p.to" class="pitem glass">
          <span class="pl">{{ p.label }}</span>
          <span class="pd">{{ p.desc }}</span>
          <span class="pa">→</span>
        </RouterLink>
      </div>
    </section>

    <section v-for="g in groups" :key="g.key" class="sec">
      <div class="sec-head">
        <h2>{{ g.key }}</h2>
        <div class="rule" />
        <span class="count">{{ g.items.length }}</span>
      </div>
      <div class="log">
        <PostRow v-for="p in g.items" :key="p.slug" :post="p" />
      </div>
    </section>

    <section class="sec">
      <div class="sec-head">
        <h2>tags</h2>
        <div class="rule" />
        <RouterLink to="/tags" class="count link">全部 →</RouterLink>
      </div>
      <div class="tags">
        <RouterLink v-for="t in allTags" :key="t" :to="`/tags/${t}`" class="tag-pill">
          #{{ t }}
        </RouterLink>
      </div>
    </section>

    <section class="sec">
      <p class="foot-note">
        给爬虫的原始版本：<a :href="sitemapUrl" target="_blank" rel="noopener">sitemap.xml</a>
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
  box-shadow: 2px 2px 0 var(--ink-shadow-4);
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
.link:hover {
  color: var(--ink);
  background: linear-gradient(transparent 55%, var(--hl-b) 55% 92%, transparent 92%);
}

.pgrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.pitem {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  transition: all 0.15s ease;
  border-radius: 2px;
}

.pitem:hover {
  transform: translateY(-2px) rotate(-0.5deg);
  box-shadow: 3px 5px 0 var(--sketch-shadow-6);
}

.pitem .pl {
  font-size: 15.5px;
  color: var(--ink);
}

.pitem .pd {
  font-size: 12.5px;
  color: var(--ink-4);
  font-family: var(--mono);
}

.pitem .pa {
  margin-left: auto;
  color: var(--ink-4);
  transition: color 0.15s ease;
}

.pitem:hover .pa {
  color: var(--pen-red);
}

.tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag-pill {
  font-size: 14px;
  padding: 1px 11px;
  border-radius: 2px;
  border: 1.3px dashed var(--line-strong);
  background: rgb(var(--veil) / 0.9);
  color: var(--ink-2);
  transition: all 0.15s ease;
}

.tag-pill:hover {
  color: var(--ink);
  background: var(--hl-y);
  transform: translateY(-2px) rotate(-1deg);
}

.foot-note {
  font-size: 15px;
  color: var(--ink-3);
  margin: 0;
}

.foot-note a {
  color: var(--pen-blue);
  border-bottom: 1.5px solid rgba(44, 92, 158, 0.35);
}
.foot-note a:hover {
  background: var(--hl-b);
}

</style>
