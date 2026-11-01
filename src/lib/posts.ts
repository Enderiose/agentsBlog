import data from '@/generated/posts.json'

export type Category = 'project' | 'pitfall' | 'changelog' | 'retro'
/** shipped = 已交付 · wip = 进行中 · abandoned = 已弃坑 */
export type Status = 'shipped' | 'wip' | 'abandoned'

export interface TocItem {
  level: number
  text: string
  id: string
}

export interface Post {
  slug: string
  title: string
  /** 所属项目名（列表里当「项目标题」列显示；文章标题往往是内容式标题） */
  project: string
  date: string
  /** 有实质更新时手动填；首页仍按首次发布日期排序 */
  updated?: string
  category: Category
  categoryLabel: string
  tags: string[]
  summary: string
  status: Status
  stack: string[]
  repo: string
  demo: string
  /** 置顶：项目列表里排在最前（首页 active_projects 与 /projects 都生效） */
  pinned: boolean
  draft: boolean
  readingTime: number
  html: string
  toc: TocItem[]
}

export interface SiteInfo {
  title: string
  description: string
  url: string
  author: string
  lang: string
}

export interface Stats {
  posts: number
  projects: number
  pitfalls: number
  retros: number
  abandoned: number
  tags: number
}

export const site = data.site as SiteInfo
export const stats = data.stats as Stats
export const allTags = data.tags as string[]
export const posts = data.posts as Post[]

/** 按日期倒序（生成时已排好，这里再兜一次底） */
export const sortedPosts: Post[] = [...posts].sort((a, b) =>
  a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
)

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug)
}

export function postsByCategory(category: Category): Post[] {
  return sortedPosts.filter((p) => p.category === category)
}

export function postsByTag(tag: string): Post[] {
  return sortedPosts.filter((p) => p.tags.includes(tag))
}

/** 最近一次实质更新的日期（没填 updated 就用首发日期） */
export function lastUpdated(p: Post): string {
  return p.updated && p.updated > p.date ? p.updated : p.date
}

/**
 * 项目列表：置顶优先，其余按「最近更新」倒序。
 * 首页 active_projects 与 /projects 共用这一份顺序，避免两处规则分叉。
 */
export const sortedProjects: Post[] = postsByCategory('project').sort((a, b) => {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
  const d = lastUpdated(b).localeCompare(lastUpdated(a))
  return d !== 0 ? d : b.date.localeCompare(a.date)
})

/**
 * 首页 featured：不写死，取「最近更新的项目」。
 * 同日更新的按首发日期新者优先，再按 slug 稳定排序。
 */
export function featuredPost(): Post | undefined {
  // 弃坑项目不占首页：除非真的只剩它们
  let projects = posts.filter(
    (p) => p.category === 'project' && !p.draft && p.status !== 'abandoned',
  )
  if (!projects.length) projects = posts.filter((p) => p.category === 'project' && !p.draft)
  if (!projects.length) return sortedPosts[0]
  return [...projects].sort((a, b) => {
    const d = lastUpdated(b).localeCompare(lastUpdated(a))
    if (d !== 0) return d
    const dd = b.date.localeCompare(a.date)
    return dd !== 0 ? dd : a.slug.localeCompare(b.slug)
  })[0]
}

/** 上一个 / 下一个（按日期倒序的相邻项） */
export function adjacent(slug: string): { prev?: Post; next?: Post } {
  const i = sortedPosts.findIndex((p) => p.slug === slug)
  if (i < 0) return {}
  return {
    prev: sortedPosts[i - 1],
    next: sortedPosts[i + 1],
  }
}

/** 相关文章：同标签数最多的前 n 篇 */
export function related(slug: string, n = 3): Post[] {
  const cur = getPost(slug)
  if (!cur) return []
  return sortedPosts
    .filter((p) => p.slug !== slug)
    .map((p) => ({ p, score: p.tags.filter((t) => cur.tags.includes(t)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || (a.p.date < b.p.date ? 1 : -1))
    .slice(0, n)
    .map((x) => x.p)
}

/* ==========================================================================
   搜索：一次建索引，查询只做包含判断
   —— 多个词是 AND（每个词都得在某个字段命中），按命中字段加权
   ========================================================================== */

export interface Hit {
  post: Post
  score: number
  /** 正文里第一处命中的前后文，没有正文命中时为空串 */
  snippet: string
  /** 命中落在哪个字段（给弹层决定高亮标题还是给片段） */
  field: 'title' | 'tags' | 'summary' | 'text'
}

interface Indexed {
  post: Post
  title: string
  summary: string
  tags: string
  text: string
}

/** 去掉 HTML 标签后的正文纯文本（只算一次，别在每次击键时重算 16 篇） */
function toPlain(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

const INDEX: Indexed[] = sortedPosts.map((p) => ({
  post: p,
  title: p.title.toLowerCase(),
  summary: p.summary.toLowerCase(),
  tags: p.tags.join(' ').toLowerCase(),
  text: toPlain(p.html).toLowerCase(),
}))

export function searchTerms(q: string): string[] {
  return q.toLowerCase().split(/\s+/).filter(Boolean)
}

/** 取正文里第一处命中的前后文；找不到就返回空串 */
function makeSnippet(text: string, terms: string[]): { snippet: string; at: number } {
  let at = -1
  for (const t of terms) {
    const i = text.indexOf(t)
    if (i >= 0 && (at < 0 || i < at)) at = i
  }
  if (at < 0) return { snippet: '', at }
  const from = Math.max(0, at - 30)
  const to = Math.min(text.length, at + 64)
  return {
    snippet: (from > 0 ? '…' : '') + text.slice(from, to).trim() + (to < text.length ? '…' : ''),
    at,
  }
}

export function searchHits(q: string, limit = 12): Hit[] {
  const terms = searchTerms(q)
  if (!terms.length) return []
  const out: Hit[] = []
  for (const it of INDEX) {
    let score = 0
    let field: Hit['field'] = 'text'
    let titleHit = false
    let ok = true
    for (const t of terms) {
      let hit = false
      if (it.title.includes(t)) {
        score += 10
        // 标题开头命中比标题中间更相关
        if (it.title.startsWith(t)) score += 6
        hit = true
        if (!titleHit) titleHit = true
      }
      if (it.tags.includes(t)) {
        score += 6
        hit = true
        if (field === 'text') field = 'tags'
      }
      if (it.summary.includes(t)) {
        score += 4
        hit = true
        if (field === 'text' || field === 'tags') field = 'summary'
      }
      if (it.text.includes(t)) {
        score += 1
        hit = true
      }
      if (!hit) {
        ok = false
        break
      }
    }
    if (!ok) continue
    if (titleHit) field = 'title'
    // 先找正文片段；正文没命中（只中了标题/标签）就拿摘要当“为什么匹配”
    const body = makeSnippet(it.text, terms).snippet
    const snippet = body || (titleHit ? '' : it.post.summary)
    out.push({ post: it.post, score, snippet, field })
  }
  return out
    .sort((a, b) =>
      b.score - a.score ||
      (a.post.date < b.post.date ? 1 : a.post.date > b.post.date ? -1 : 0)
    )
    .slice(0, limit)
}

/** 兼容旧调用：只要文章 */
export function search(q: string): Post[] {
  return searchHits(q).map((h) => h.post)
}

/** 把一段文本按命中词切成片段，给模板渲染 <mark>（不做 HTML 拼接，避免把正文当标签解析） */
export function highlightParts(text: string, terms: string[]): { t: string; hit: boolean }[] {
  if (!text || !terms.length) return [{ t: text, hit: false }]
  const lower = text.toLowerCase()
  const marks: { start: number; end: number }[] = []
  for (const term of terms) {
    let from = 0
    while (from <= lower.length - term.length) {
      const i = lower.indexOf(term, from)
      if (i < 0) break
      marks.push({ start: i, end: i + term.length })
      from = i + term.length
    }
  }
  if (!marks.length) return [{ t: text, hit: false }]
  marks.sort((a, b) => a.start - b.start)
  const parts: { t: string; hit: boolean }[] = []
  let cursor = 0
  for (const m of marks) {
    if (m.start < cursor) continue
    if (m.start > cursor) parts.push({ t: text.slice(cursor, m.start), hit: false })
    parts.push({ t: text.slice(m.start, m.end), hit: true })
    cursor = m.end
  }
  if (cursor < text.length) parts.push({ t: text.slice(cursor), hit: false })
  return parts
}

export function formatDate(d: string): string {
  return d
}
