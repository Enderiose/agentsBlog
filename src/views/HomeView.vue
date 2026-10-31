<script setup lang="ts">
import { computed } from 'vue'
import {
  sortedPosts,
  sortedProjects,
  postsByCategory,
  featuredPost,
  stats,
  allTags,
} from '@/lib/posts'
import PostRow from '@/components/PostRow.vue'
import ProjectCard from '@/components/ProjectCard.vue'

const featured = computed(() => featuredPost())
const latest = computed(() => sortedPosts.slice(0, 7))
const projects = computed(() => sortedProjects.slice(0, 6))
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
        <span class="count">最近更新</span>
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
/* ---- hero：手账第一页 ---- */
.hero {
  padding: 44px 0 18px;
}

.spacer {
  margin-left: auto;
}

h1 {
  font-size: clamp(30px, 5vw, 50px);
  line-height: 1.3;
  letter-spacing: 1px;
  margin: 8px 0 16px;
  font-weight: 400;
}

.lede {
  color: var(--ink-2);
  max-width: 62ch;
  font-size: 16.5px;
  margin: 0;
  line-height: 1.95;
}

.lede em {
  color: var(--pen-red);
  font-style: normal;
  border-bottom: 2px dashed var(--pen-red);
  padding-bottom: 1px;
}

/* 统计：铅笔框格子 */
.metrics {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 26px;
  padding-top: 20px;
  border-top: 1.5px dashed var(--stroke-2);
}

.metric {
  min-width: 92px;
  padding: 6px 12px 4px;
  border: 1.4px solid var(--ink-3);
  border-radius: 2px;
  background: rgba(255, 253, 244, 0.7);
  box-shadow: 2px 2px 0 rgba(46, 58, 72, 0.12);
}

.metric b {
  display: block;
  font-size: 27px;
  line-height: 1.25;
  font-weight: 400;
  color: var(--pen-red);
  font-family: var(--mono);
  letter-spacing: -1px;
}

.metric span {
  font-size: 12.5px;
  letter-spacing: 0.4px;
  color: var(--ink-3);
}

/* ---- 通用 ---- */
.sec {
  padding: 44px 0 0;
}

.link:hover {
  color: var(--ink);
  background: linear-gradient(transparent 55%, var(--hl-b) 55% 92%, transparent 92%);
}

/* ---- featured：贴上去的大便签 ---- */
.feature {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  overflow: hidden;
  border-radius: 2px;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.feature:hover {
  transform: translateY(-3px) rotate(-0.3deg);
  box-shadow: 6px 8px 0 rgba(84, 68, 32, 0.14);
}

.fx {
  padding: 32px 30px;
}

.kicker {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.kicker .d {
  font-size: 13px;
  letter-spacing: 0.3px;
  color: var(--ink-3);
}

.feature h3 {
  font-size: clamp(22px, 2.8vw, 30px);
  line-height: 1.35;
  letter-spacing: 0.3px;
  margin: 0 0 12px;
  font-weight: 400;
  display: table;
  background: linear-gradient(transparent 58%, var(--hl-y) 58% 94%, transparent 94%);
}

.feature p {
  color: var(--ink-2);
  font-size: 16px;
  line-height: 1.85;
  margin: 0 0 18px;
}

.fmeta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 13.5px;
  color: var(--ink-3);
  border-top: 1.5px dashed var(--stroke);
  padding-top: 12px;
}

/* 右侧：方格纸上的手绘涂鸦 */
.visual {
  position: relative;
  overflow: hidden;
  display: grid;
  place-items: center;
  min-height: 250px;
  background-color: var(--note);
  background-image: linear-gradient(rgba(140, 178, 210, 0.3) 1px, transparent 1px),
    linear-gradient(90deg, rgba(140, 178, 210, 0.3) 1px, transparent 1px);
  background-size: 24px 24px;
  border-left: 1.5px dashed var(--stroke-2);
}

.orb {
  width: 130px;
  height: 130px;
  position: relative;
  border-radius: 47% 53% 55% 45% / 52% 45% 55% 48%;
  background: radial-gradient(circle at 32% 28%, #fffdf4 0 18%, transparent 55%),
    repeating-linear-gradient(
      -45deg,
      var(--hl-y) 0 9px,
      var(--hl-o) 9px 18px
    );
  border: 2.2px solid var(--ink);
  box-shadow: 4px 5px 0 rgba(46, 58, 72, 0.16);
  animation: wobble 9s ease-in-out infinite;
  display: grid;
  place-items: center;
}

/* 老师批改的对勾：笔记边上最常见的涂鸦 */
.orb::after {
  content: "✓";
  font-size: 58px;
  color: var(--pen-red);
  transform: rotate(-7deg);
  line-height: 1;
  margin-top: 6px;
}

@keyframes wobble {
  0%,
  100% {
    transform: rotate(-3deg) scale(1);
  }
  50% {
    transform: rotate(3deg) scale(1.04);
  }
}

/* ---- 项目网格 ---- */
.pgrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 26px 18px;
}

/* 便签三色轮换 */
.pgrid > :nth-child(3n + 1) {
  background: var(--note-y);
}
.pgrid > :nth-child(3n + 2) {
  background: var(--note-p);
}
.pgrid > :nth-child(3n) {
  background: var(--note-b);
}

/* ---- 标签云：荧光笔标签 ---- */
.tagcloud {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag-pill {
  font-size: 14.5px;
  padding: 1px 11px;
  border-radius: 2px;
  border: 1px solid rgba(180, 168, 140, 0.55);
  background: var(--note);
  color: var(--ink-2);
  transition: all 0.15s ease;
  box-shadow: 1px 1px 0 rgba(84, 68, 32, 0.08);
}

.tag-pill:hover {
  color: var(--ink);
  background: var(--hl-y);
  transform: translateY(-2px) rotate(-1deg);
}

/* ---- 代码片段：手抄的 markdown ---- */
.snippet {
  font-size: 13.5px;
  line-height: 1.95;
  color: var(--ink-2);
  font-family: var(--mono);
}
.snippet .blank {
  height: 6px;
}
.snippet .p {
  color: var(--pen-red);
}
.snippet .k {
  color: var(--pen-blue);
}
.snippet .dim {
  color: var(--ink-4);
}
.snippet .h {
  color: var(--ink);
  font-weight: 700;
}
.snippet .err {
  color: var(--pen-red);
}

/* ---- CTA：一张大便利贴 ---- */
.cta {
  margin: 56px 0 0;
  padding: 40px 34px;
  border-radius: 2px;
  text-align: center;
  position: relative;
  background: var(--note-y);
  border: 1.5px solid rgba(180, 168, 140, 0.6);
  box-shadow: 5px 6px 0 rgba(84, 68, 32, 0.12);
  transform: rotate(-0.35deg);
}

/* 两条胶带 */
.cta::before,
.cta::after {
  content: "";
  position: absolute;
  top: -12px;
  width: 92px;
  height: 24px;
  background: rgba(255, 255, 255, 0.6);
  border-left: 1px dashed rgba(150, 140, 110, 0.35);
  border-right: 1px dashed rgba(150, 140, 110, 0.35);
}
.cta::before {
  left: 26px;
  transform: rotate(-5deg);
}
.cta::after {
  right: 26px;
  transform: rotate(4deg);
}

.cta h3 {
  font-size: clamp(22px, 3.2vw, 30px);
  letter-spacing: 0.4px;
  margin: 0 0 10px;
  font-weight: 400;
}

.cta p {
  color: var(--ink-2);
  max-width: 46ch;
  margin: 0 auto 22px;
  font-size: 16px;
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
    border-left: 0;
    border-bottom: 1.5px dashed var(--stroke-2);
  }
  .fx {
    padding: 24px 20px;
  }
}

@media (max-width: 640px) {
  .hero {
    padding: 30px 0 10px;
  }
  .metrics {
    gap: 10px;
  }
  .metric b {
    font-size: 22px;
  }
  .cta {
    padding: 30px 20px;
  }
}
</style>
