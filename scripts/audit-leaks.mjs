#!/usr/bin/env node
/**
 * audit-leaks.mjs — 发布前扫描：明文凭据 + 本机路径 + 内网地址
 *
 * 用法：
 *   node scripts/audit-leaks.mjs
 *
 * 只扫源头（content / src / public / index.html / README）。dist 是产物：
 * 打包后反斜杠会被再转义一次（\ 变 \），扫描只会制造误报。
 *
 * 退出码 1 表示命中，CI 会拦住不发布。
 *
 * 为什么要有它：这些东西一旦写进文章就会出现在静态站上，而且 RSS 里也会留一份。
 * 靠记性挡不住，靠闸门才挡得住。
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { join, extname, relative } from 'node:path'

const root = process.cwd()
const TEXT = new Set(['.md', '.vue', '.ts', '.js', '.mjs', '.json', '.html', '.css', '.xml', '.txt'])
const SKIP_DIRS = new Set(['node_modules', '.git', 'generated'])

/** 允许保留的写法 —— 每条都写清为什么 */
const ALLOW = [
  // 通用系统路径：twwb-checkin / token-usage 两篇的坑就是"计划任务工作目录是 System32"
  /^C:\\Windows\\System32/,
  // 通用系统路径（hosts 文件）
  /^C:\\Windows\\System32\\drivers\\etc\\hosts/,
  // WSL 的标准挂载前缀，不含用户名
  /^\\\\wsl\.localhost\\/,
  // 站内假终端提示符（UI 装饰，不是真实路径）
  /^~\/agents/,
  // 回环地址：hosts 示例与本地端口说明要用，不暴露任何内网拓扑
  /^127\.0\.0\.1$/,
]

const RULES = [
  { id: 'SECRET_SK', re: /\bsk-[A-Za-z0-9_-]{6,}/g, mask: true, what: '疑似 API 密钥' },
  { id: 'SECRET_BEARER', re: /\bBearer\s+[A-Za-z0-9._~+/-]{10,}/gi, mask: true, what: 'Bearer 凭据' },
  { id: 'SECRET_JWT', re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, mask: true, what: 'JWT' },
  {
    id: 'SECRET_PREFIX',
    re: /\b(ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{30,})/g,
    mask: true,
    what: '已知平台的密钥前缀',
  },
  {
    id: 'SECRET_ASSIGN',
    re: /\b(?:api[_-]?key|apikey|secret|token|password|passwd|passphrase|credential)s?\b\s*[:=]\s*["'`]?([A-Za-z0-9._~+/-]{12,})/gi,
    mask: true,
    what: '赋值形式的凭据值',
  },
  { id: 'PATH_WIN', re: /(?<![\w/])[A-Za-z]:[\\/][\w.\\/-]*/g, what: '本机绝对路径（盘符）' },
  { id: 'PATH_UNC', re: /\\\\[\w.-]+\\[\w.\\-]*/g, what: 'UNC 网络路径' },
  { id: 'PATH_SSH', re: /(?<![\w/])~\/\.ssh\/(?!<)[\w.-]+/g, what: '私钥文件名' },
  {
    id: 'IP_PRIVATE',
    // 前缀 + (2~3 段)：前缀里已含一个点，分段数算对才不会把 "10.9.6.1.8" 当 IP
    re: /(?<![\d.])(?:10|127|192\.168|172\.(?:1[6-9]|2\d|3[01]))(?:\.\d{1,3}){2,3}(?![\d]|\.\d)/g,
    what: '内网地址',
  },
]

function walk(dir, out) {
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (TEXT.has(extname(p))) out.push(p)
  }
  return out
}

const files = [
  ...walk(join(root, 'content'), []),
  ...walk(join(root, 'src'), []),
  ...walk(join(root, 'public'), []),
]
for (const f of ['index.html', 'README.md', 'README_CN.md']) {
  if (existsSync(join(root, f))) files.push(join(root, f))
}

const mask = (v) => (v.length <= 8 ? v[0] + '*'.repeat(v.length - 1) : v.slice(0, 4) + `…(${v.length})`)

let hits = 0
for (const file of files) {
  let text
  try {
    text = readFileSync(file, 'utf8')
  } catch {
    continue
  }
  const lines = text.split('\n')
  for (const rule of RULES) {
    for (let i = 0; i < lines.length; i++) {
      rule.re.lastIndex = 0
      let m
      while ((m = rule.re.exec(lines[i]))) {
        const raw = m[0]
        if (ALLOW.some((a) => a.test(raw))) continue
        if (hits === 0) console.log('\n命中（file:line · 规则 · 值）：')
        hits++
        const shown = rule.mask ? mask(raw) : raw
        console.log(`  ${relative(root, file)}:${i + 1}  [${rule.id}] ${shown}  — ${rule.what}`)
      }
    }
  }
}

if (hits) {
  console.log(`\n✗ 共 ${hits} 处。要保留的写法请加进本文件的 ALLOW 并写明理由。\n`)
  process.exit(1)
}
console.log(`✓ 未发现明文凭据 / 本机路径 / 内网地址（扫描 ${files.length} 个文件）`)
