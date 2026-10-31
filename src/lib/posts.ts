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

/** 极简全文搜索：标题 / 摘要 / 标签 加权匹配 */
export function search(q: string): Post[] {
  const kw = q.trim().toLowerCase()
  if (!kw) return []
  const terms = kw.split(/\s+/).filter(Boolean)
  return sortedPosts
    .map((p) => {
      const title = p.title.toLowerCase()
      const summary = p.summary.toLowerCase()
      const tags = p.tags.join(' ').toLowerCase()
      const text = p.html.replace(/<[^>]+>/g, ' ').toLowerCase()
      let score = 0
      for (const t of terms) {
        if (title.includes(t)) score += 10
        if (tags.includes(t)) score += 6
        if (summary.includes(t)) score += 4
        if (text.includes(t)) score += 1
      }
      return { p, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((x) => x.p)
}

export function formatDate(d: string): string {
  return d
}
