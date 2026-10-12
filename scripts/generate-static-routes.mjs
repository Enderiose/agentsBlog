/**
 * 为每个静态路由生成真实的 index.html
 *
 * 为什么需要这一步：
 *   GitHub Pages 是纯静态托管，**不支持 SPA 的 history fallback**。
 *   没有它，/agentsBlog/posts/xxx/ 会直接 404（首页却正常，很容易误判为部署失败）。
 *
 * 做法：
 *   把 vite 产出的 dist/index.html 复制到每个路由目录下，成为该路由的入口。
 *   Vue Router 拿到 URL 后照常接管渲染。
 *   顺带替换 <title> / description / og 标签，让分享卡片显示正确信息。
 *
 * 另外写一份 404.html 作为兜底：任何未预生成的路径也能正常渲染。
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const dist = join(root, 'dist')

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** 把基础 HTML 里的标题/描述替换成本路由的 */
function render(base, { title, desc }) {
  let out = base
  if (title) {
    const full = `${title} · Agent Log`
    out = out.replace(/<title>[^<]*<\/title>/, `<title>${esc(full)}</title>`)
    out = out.replace(
      /<meta property="og:title" content="[^"]*"/,
      `<meta property="og:title" content="${esc(full)}"`,
    )
  }
  if (desc) {
    // 注意：index.html 里的 meta 标签是多行写法，正则要能跨行
    out = out.replace(
      /<meta[^>]*name="description"[^>]*content="[^"]*"/,
      `<meta name="description" content="${esc(desc)}"`,
    )
    out = out.replace(
      /<meta[^>]*property="og:description"[^>]*content="[^"]*"/,
      `<meta property="og:description" content="${esc(desc)}"`,
    )
  }
  return out
}

async function write(routePath, html) {
  const dir = join(dist, routePath)
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, 'index.html'), html, 'utf8')
}

async function main() {
  if (!existsSync(dist)) {
    console.error('[routes] 缺少 dist/，请先跑 vite build')
    process.exit(1)
  }

  const data = JSON.parse(await readFile(join(root, 'src', 'generated', 'posts.json'), 'utf8'))
  const base = await readFile(join(dist, 'index.html'), 'utf8')

  const siteDesc = data.site.description

  /** 静态页 */
  const routes = [
    { path: 'posts', title: '全部记录', desc: '按时间倒序的全部施工记录。' },
    { path: 'projects', title: '项目', desc: `我做过的 ${data.stats.projects} 个 Agent 应用项目。` },
    { path: 'tags', title: '标签', desc: `按主题浏览全部 ${data.stats.tags} 个标签。` },
    { path: 'about', title: '关于', desc: siteDesc },
  ]

  /** 文章页 */
  for (const p of data.posts) {
    routes.push({ path: `posts/${p.slug}`, title: p.title, desc: p.summary })
  }

  /** 标签页 —— 用未编码的中文目录名，服务器会自行 URL 解码 */
  for (const t of data.tags) {
    routes.push({ path: `tags/${t}`, title: `#${t}`, desc: `标签「${t}」下的全部记录。` })
  }

  for (const r of routes) {
    await write(r.path, render(base, r))
  }

  /** 兜底：任何未预生成的路径也返回可渲染的页面 */
  await writeFile(join(dist, '404.html'), base, 'utf8')

  /** 禁掉 Jekyll 处理（避免下划线开头的目录被忽略） */
  await writeFile(join(dist, '.nojekyll'), '', 'utf8')

  console.log(`[routes] 生成 ${routes.length} 个静态路由 + 404.html`)
}

main().catch((err) => {
  console.error('[routes] 失败:', err)
  process.exit(1)
})
