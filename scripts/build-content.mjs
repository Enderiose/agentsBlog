/**
 * 内容构建脚本
 *
 * 扫描 content/posts/*.md → 解析 frontmatter → 渲染 HTML → 输出：
 *   src/generated/posts.json   运行时读取的文章数据
 *   public/feed.xml            RSS
 *   public/sitemap.xml         Sitemap
 *
 * 在 dev / build 前自动执行（见 package.json 的 predev / prebuild）。
 */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

import matter from 'gray-matter'
import MarkdownIt from 'markdown-it'
import anchor from 'markdown-it-anchor'
import Shiki from '@shikijs/markdown-it'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const postsDir = join(root, 'content', 'posts')
const outDir = join(root, 'src', 'generated')
const publicDir = join(root, 'public')

/** 站点信息 —— 部署地址变了要改这里 */
const SITE = {
  title: 'Agent Log',
  description: '我所有 Agent 应用项目的施工日志 —— 需求、架构、踩坑与最终成果。',
  url: 'https://enderiose.github.io/agentsBlog',
  author: 'Enderiose',
  lang: 'zh-CN',
}

/** 分类白名单，决定列表页的筛选与配色 */
const CATEGORIES = {
  project: { label: '项目', order: 1 },
  pitfall: { label: '踩坑', order: 2 },
  changelog: { label: '变更', order: 3 },
  retro: { label: '总结', order: 4 },
}

/** 阅读时长：中文按 400 字/分，英文按 220 词/分 */
function readingTime(text) {
  const cjk = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const words = (text.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[A-Za-z0-9_'-]+/g) || []).length
  return Math.max(1, Math.round(cjk / 400 + words / 220))
}

/** 从正文提取纯文本摘要 */
function makeSummary(body, limit = 110) {
  const plain = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+.*$/gm, ' ')
    .replace(/^\s*[-*+]\s+/gm, ' ')
    .replace(/^\s*>\s?/gm, ' ')
    .replace(/[*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return plain.length > limit ? plain.slice(0, limit) + '…' : plain
}

function formatDate(d) {
  if (d instanceof Date) return d.toISOString().slice(0, 10)
  return String(d).slice(0, 10)
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

async function main() {
  if (!existsSync(postsDir)) {
    console.error(`[content] 缺少内容目录: ${postsDir}`)
    process.exit(1)
  }

  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: false,
    breaks: false,
  })
  md.use(anchor, {
    // 与 extractToc 解耦：TOC 直接从渲染后的 HTML 里读 id，这里只负责生成稳定 slug
    slugify: (s) =>
      String(s)
        .trim()
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'section',
    permalink: anchor.permalink.linkInsideHeader({ symbol: '#', placement: 'after' }),
  })
  md.use(
    await Shiki({
      theme: 'github-dark-default',
      // 不指定 langs 会加载全部语言，构建会明显变慢
      langs: [
        'lua',
        'js',
        'ts',
        'jsx',
        'tsx',
        'vue',
        'json',
        'jsonc',
        'bash',
        'shell',
        'markdown',
        'html',
        'css',
        'yaml',
        'toml',
        'ini',
        'python',
        'diff',
        'sql',
        'powershell',
        'text',
      ],
      defaultLanguage: 'text',
      fallbackLanguage: 'text',
    }),
  )

  // 以下划线开头的文件是模板 / 草稿，不参与构建
  const files = (await readdir(postsDir)).filter((f) => f.endsWith('.md') && !f.startsWith('_'))
  const posts = []

  for (const file of files) {
    const raw = await readFile(join(postsDir, file), 'utf8')
    const { data, content } = matter(raw)

    const slug = data.slug || basename(file, '.md')
    const category = CATEGORIES[data.category] ? data.category : 'project'
    const date = formatDate(data.date || new Date())

    const body = content.trim()
    // shiki >= 1.x 的 markdown-it 插件是同步的，highlighter 已在上面预加载完毕
    const html = md.render(body)
    const toc = extractToc(html)

    posts.push({
      slug,
      title: data.title || slug,
      date,
      category,
      categoryLabel: CATEGORIES[category].label,
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      summary: data.summary || makeSummary(body),
      status: data.status || 'shipped',
      stack: Array.isArray(data.stack) ? data.stack.map(String) : [],
      repo: data.repo || '',
      demo: data.demo || '',
      featured: Boolean(data.featured),
      draft: Boolean(data.draft),
      readingTime: readingTime(body),
      html,
      toc,
    })
  }

  const published = posts
    .filter((p) => !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

  // 站点统计
  const stats = {
    posts: published.length,
    projects: published.filter((p) => p.category === 'project').length,
    pitfalls: published.filter((p) => p.category === 'pitfall').length,
    retros: published.filter((p) => p.category === 'retro').length,
    tags: [...new Set(published.flatMap((p) => p.tags))].length,
  }

  const tags = [...new Set(published.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b, 'zh'))

  await mkdir(outDir, { recursive: true })
  await mkdir(publicDir, { recursive: true })

  await writeFile(
    join(outDir, 'posts.json'),
    JSON.stringify({ site: SITE, stats, tags, posts: published }, null, 2),
    'utf8',
  )

  // ---- RSS ----
  const items = published
    .slice(0, 30)
    .map(
      (p) => `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${SITE.url}/posts/${p.slug}/</link>
      <guid isPermaLink="true">${SITE.url}/posts/${p.slug}/</guid>
      <pubDate>${new Date(p.date + 'T00:00:00Z').toUTCString()}</pubDate>
      <description>${escapeXml(p.summary)}</description>
${p.tags.map((t) => `      <category>${escapeXml(t)}</category>`).join('\n')}
    </item>`,
    )
    .join('\n')

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE.title)}</title>
    <link>${SITE.url}</link>
    <description>${escapeXml(SITE.description)}</description>
    <language>${SITE.lang}</language>
    <atom:link href="${SITE.url}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`
  await writeFile(join(publicDir, 'feed.xml'), feed, 'utf8')

  // ---- Sitemap ----
  const urls = [
    `${SITE.url}/`,
    `${SITE.url}/posts/`,
    `${SITE.url}/projects/`,
    `${SITE.url}/tags/`,
    `${SITE.url}/about/`,
    ...published.map((p) => `${SITE.url}/posts/${p.slug}/`),
  ]
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${escapeXml(u)}</loc></url>`).join('\n')}
</urlset>
`
  await writeFile(join(publicDir, 'sitemap.xml'), sitemap, 'utf8')

  console.log(
    `[content] ${published.length} 篇文章 · ${stats.tags} 个标签 · 已生成 posts.json / feed.xml / sitemap.xml`,
  )
}

/** 从渲染后的 HTML 提取 h2/h3 目录（id 直接取自 anchor 的产物，保证与正文锚点一致） */
function extractToc(html) {
  const toc = []
  const re = /<h([23])\b([^>]*)>([\s\S]*?)<\/h\1>/g
  let m
  while ((m = re.exec(html))) {
    const idMatch = /\bid="([^"]+)"/.exec(m[2])
    if (!idMatch) continue
    const text = m[3]
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .trim()
    toc.push({ level: Number(m[1]), text, id: idMatch[1] })
  }
  return toc
}

main().catch((err) => {
  console.error('[content] 构建失败:', err)
  process.exit(1)
})
