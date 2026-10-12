import data from '@/generated/posts.json'

export type Category = 'project' | 'pitfall' | 'changelog' | 'retro'

export interface TocItem {
  level: number
  text: string
  id: string
}

export interface Post {
  slug: string
  title: string
  date: string
  category: Category
  categoryLabel: string
  tags: string[]
  summary: string
  status: string
  stack: string[]
  repo: string
  demo: string
  featured: boolean
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

export function featuredPost(): Post | undefined {
  return sortedPosts.find((p) => p.featured) ?? sortedPosts[0]
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
