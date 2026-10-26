<script setup lang="ts">
import { computed } from 'vue'
import {
  sortedPosts,
  postsByCategory,
  featuredPost,
  stats,
  allTags,
} from '@/lib/posts'
import PostRow from '@/components/PostRow.vue'
import ProjectCard from '@/components/ProjectCard.vue'

const featured = computed(() => featuredPost())
const latest = computed(() => sortedPosts.slice(0, 7))
const projects = computed(() => postsByCategory('project').slice(0, 6))
const pitfalls = computed(() => postsByCategory('pitfall').slice(0, 4))
const topTags = computed(() => allTags.slice(0, 14))
</script>

<template>
  <div class="wrap">
    <!-- ============ HERO ============ -->
    <section class="hero">
      <div class="term">
        <div class="term-bar">
          <span class="term-dots"><i /><i /><i /></span>
          <span>agent-log — zsh — 80×24</span>
          <span class="spacer" />
          <span>UTF-8 · main</span>
        </div>

        <div class="term-body">
          <div class="cmd">
            <span class="p">~/agents</span> $ <b>tail -f ./build-in-public.log</b>
          </div>

          <h1>
            把每一次<span class="grad">构建</span><br />
            连同<span class="grad">翻车现场</span>一起记下来。
          </h1>

          <p class="lede">
            这里是我所有 Agent 应用项目的施工日志：需求怎么来的、架构怎么选的、<em>哪一步炸了</em>，
            最后又长成了什么样子。<br />
            稿子一般在项目收尾时写，趁我还记得自己当时判断错在哪里。
          </p>

          <div class="metrics">
            <div class="metric">
              <b>{{ stats.posts }}</b><span>records</span>
            </div>
            <div class="metric">
              <b>{{ stats.projects }}</b><span>projects</span>
            </div>
            <div class="metric">
              <b>{{ stats.pitfalls }}</b><span>pitfalls</span>
            </div>
            <div class="metric">
              <b>{{ stats.tags }}</b><span>tags</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ FEATURED ============ -->
    <section v-if="featured" class="sec">
      <div class="sec-head">
        <h2>featured</h2>
        <div class="rule" />
        <span class="count">置顶</span>
      </div>

      <RouterLink :to="`/posts/${featured.slug}`" class="feature glass">
        <div class="fx">
          <div class="kicker">
            <span :class="['cat', `cat-${featured.category}`]">{{ featured.categoryLabel }}</span>
            <span class="d">{{ featured.project || '起点' }}</span>
          </div>
          <h3>{{ featured.title }}</h3>
          <p>{{ featured.summary }}</p>
          <div class="fmeta">
            <span>{{ featured.date }}</span>
            <span>·</span>
            <span>{{ featured.readingTime }} 分钟</span>
            <span v-if="featured.stack.length">·</span>
            <span v-if="featured.stack.length">{{ featured.stack.join(' / ') }}</span>
          </div>
        </div>
        <div class="visual">
          <div class="orb" />
        </div>
      </RouterLink>
    </section>

    <!-- ============ LATEST ============ -->
    <section class="sec">
      <div class="sec-head">
        <h2>recent_log</h2>
        <div class="rule" />
        <RouterLink to="/posts" class="count link">全部 {{ stats.posts }} 篇 →</RouterLink>
      </div>

      <div class="log">
        <PostRow v-for="p in latest" :key="p.slug" :post="p" />
      </div>
    </section>

    <!-- ============ PROJECTS ============ -->
    <section v-if="projects.length" class="sec">
      <div class="sec-head">
        <h2>active_projects</h2>
        <div class="rule" />
        <RouterLink to="/projects" class="count link">{{ stats.projects }} running →</RouterLink>
      </div>

      <div class="pgrid">
        <ProjectCard v-for="(p, i) in projects" :key="p.slug" :post="p" :index="i" />
      </div>
    </section>

    <!-- ============ PITFALLS ============ -->
    <section v-if="pitfalls.length" class="sec">
      <div class="sec-head">
        <h2>recent_pitfalls</h2>
        <div class="rule" />
        <span class="count">{{ stats.pitfalls }} entries</span>
      </div>

      <div class="log">
        <PostRow v-for="p in pitfalls" :key="p.slug" :post="p" />
      </div>
    </section>

    <!-- ============ TAGS ============ -->
    <section v-if="topTags.length" class="sec">
      <div class="sec-head">
        <h2>tags</h2>
        <div class="rule" />
        <RouterLink to="/tags" class="count link">全部 →</RouterLink>
      </div>
      <div class="tagcloud">
        <RouterLink v-for="t in topTags" :key="t" :to="`/tags/${t}`" class="tag-pill">
          #{{ t }}
        </RouterLink>
      </div>
    </section>

    <!-- ============ HOW I WRITE ============ -->
    <section class="sec">
      <div class="sec-head">
        <h2>how_i_write</h2>
        <div class="rule" />
        <span class="count">markdown first</span>
      </div>

      <div class="term">
        <div class="term-body snippet">
          <div><span class="p">~/agents</span> $ cat content/posts/ao-account-overview.md</div>
          <div class="blank" />
          <div class="dim">---</div>
          <div><span class="k">title</span>: AO_AccountOverview — 我的第一个 Agent 项目</div>
          <div><span class="k">date</span>: 2026-08-31</div>
          <div><span class="k">category</span>: project</div>
          <div><span class="k">tags</span>: [wow, lua, codex]</div>
          <div class="dim">---</div>
          <div class="blank" />
          <div class="h">## 踩过的坑</div>
          <div class="err">- 做完一版才发现：它就是现有表的转置</div>
          <div class="err">- Lua 的函数定义顺序，载入期不报错</div>
          <div class="blank" />
          <div><span class="p">~/agents</span> $ <span class="cursor" /></div>
        </div>
      </div>
    </section>

    <!-- ============ CTA ============ -->
    <section class="cta">
      <h3>订阅施工日志</h3>
      <p>新记录会出现在你的阅读器里。不想看了，删掉订阅源就行。</p>
      <div class="row">
        <RouterLink class="btn btn-primary" to="/feed">RSS 订阅</RouterLink>
        <RouterLink class="btn" to="/about">关于这个站</RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ---- hero ---- */
.hero {
  padding: 62px 0 20px;
}

.spacer {
  margin-left: auto;
}

h1 {
  font-size: clamp(30px, 5.2vw, 52px);
  line-height: 1.16;
  letter-spacing: -1.6px;
  margin: 6px 0 18px;
  font-weight: 700;
}

.lede {
  color: var(--ink-2);
  max-width: 62ch;
  font-size: 14.5px;
  margin: 0;
}

.lede em {
  color: var(--amber);
  font-style: normal;
}

.metrics {
  display: flex;
  gap: 34px;
  flex-wrap: wrap;
  margin-top: 30px;
  padding-top: 22px;
  border-top: 1px dashed var(--stroke);
}

.metric b {
  display: block;
  font-size: 26px;
  line-height: 1.2;
  background: linear-gradient(120deg, #c4b5fd, #67e8f9);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.metric span {
  font-size: 11px;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  color: var(--ink-4);
}

/* ---- 通用 ---- */
.sec {
  padding: 46px 0 0;
}

.link:hover {
  color: var(--v2);
}

/* ---- featured ---- */
.feature {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  overflow: hidden;
  transition: all 0.25s ease;
}

.feature:hover {
  border-color: rgba(124, 92, 255, 0.55);
  box-shadow: 0 32px 80px -44px var(--v1);
}

.fx {
  padding: 34px 32px;
}

.kicker {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}
.kicker .d {
  font-size: 11.5px;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  color: var(--ink-4);
}

.feature h3 {
  font-size: clamp(21px, 2.8vw, 28px);
  line-height: 1.25;
  letter-spacing: -0.9px;
  margin: 0 0 14px;
}

.feature p {
  color: var(--ink-2);
  font-size: 14px;
  margin: 0 0 20px;
}

.fmeta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--ink-4);
}

.visual {
  position: relative;
  overflow: hidden;
  display: grid;
  place-items: center;
  min-height: 250px;
  background: linear-gradient(
    150deg,
    rgba(124, 92, 255, 0.26),
    rgba(34, 211, 238, 0.13) 55%,
    rgba(244, 114, 182, 0.2)
  );
}

.visual::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
  background-size: 28px 28px;
}

.orb {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  position: relative;
  background: conic-gradient(from 0deg, #7c5cff, #22d3ee, #f472b6, #7c5cff);
  animation: spin 14s linear infinite;
  box-shadow: 0 0 70px -6px rgba(124, 92, 255, 0.8);
}

.orb::after {
  content: "";
  position: absolute;
  inset: 22px;
  border-radius: 50%;
  background: rgba(7, 8, 15, 0.86);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ---- 项目网格 ---- */
.pgrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

/* ---- 标签云 ---- */
.tagcloud {
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

/* ---- 代码片段 ---- */
.snippet {
  font-size: 13px;
  line-height: 1.85;
  color: var(--ink-2);
}
.snippet .blank {
  height: 8px;
}
.snippet .p {
  color: var(--prompt);
}
.snippet .k {
  color: var(--v2);
}
.snippet .dim {
  color: var(--ink-4);
}
.snippet .h {
  color: var(--ink);
}
.snippet .err {
  color: var(--amber);
}

/* ---- CTA ---- */
.cta {
  margin: 60px 0 0;
  padding: 44px 38px;
  border-radius: 24px;
  text-align: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(
    135deg,
    rgba(124, 92, 255, 0.22),
    rgba(34, 211, 238, 0.14) 50%,
    rgba(244, 114, 182, 0.2)
  );
  border: 1px solid var(--stroke-2);
  backdrop-filter: blur(24px);
}

.cta h3 {
  font-size: clamp(21px, 3.2vw, 30px);
  letter-spacing: -1px;
  margin: 0 0 12px;
}

.cta p {
  color: var(--ink-2);
  max-width: 46ch;
  margin: 0 auto 24px;
  font-size: 14.5px;
}

.cta .row {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

@media (max-width: 860px) {
  .feature {
    grid-template-columns: 1fr;
  }
  .visual {
    min-height: 170px;
    order: -1;
  }
  .fx {
    padding: 26px 22px;
  }
}

@media (max-width: 640px) {
  .hero {
    padding: 40px 0 10px;
  }
  .metrics {
    gap: 22px;
  }
  .metric b {
    font-size: 22px;
  }
  .cta {
    padding: 30px 20px;
  }
}
</style>
