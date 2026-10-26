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

.link:hover {
  color: var(--v2);
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
  padding: 14px 16px;
  transition: all 0.18s ease;
}

.pitem:hover {
  border-color: rgba(124, 92, 255, 0.5);
  background: rgba(124, 92, 255, 0.12);
  transform: translateY(-2px);
}

.pitem .pl {
  font-size: 14px;
  color: var(--ink);
}

.pitem .pd {
  font-size: 12px;
  color: var(--ink-4);
}

.pitem .pa {
  margin-left: auto;
  color: var(--ink-4);
  transition: color 0.18s ease;
}

.pitem:hover .pa {
  color: var(--v2);
}

.tags {
  display: flex;
  gap: 9px;
  flex-wrap: wrap;
}

.tag-pill {
  font-size: 12.5px;
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--stroke);
  background: var(--panel);
  color: var(--ink-3);
  transition: all 0.18s ease;
}

.tag-pill:hover {
  color: #c4b5fd;
  border-color: rgba(124, 92, 255, 0.5);
  background: rgba(124, 92, 255, 0.14);
  transform: translateY(-2px);
}

.foot-note {
  font-size: 13px;
  color: var(--ink-4);
  margin: 0;
}

.foot-note a {
  color: var(--v2);
}
.foot-note a:hover {
  text-decoration: underline;
}
</style>
