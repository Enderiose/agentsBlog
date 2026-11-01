/**
 * 配色三态：系统 / 浅 / 深。
 *
 * 约定：
 * - 存的是「用户的选择」（system|light|dark），DOM 上挂的是「算出来的结果」（light|dark）。
 *   这样 CSS 只需要一套 [data-theme="dark"]，不用再写一遍 prefers-color-scheme 媒体查询。
 * - 「系统」时监听系统切换，改系统主题页面立刻跟着变，不用刷新。
 * - 首屏防闪靠 index.html 里那段内联脚本（在 CSS 之前跑），这里只负责后续变更。
 */

export type ThemeMode = 'system' | 'light' | 'dark'
export type EffectiveTheme = 'light' | 'dark'

export const THEME_KEY = 'agentlog-theme'

export const THEME_MODES: { mode: ThemeMode; label: string; title: string }[] = [
  { mode: 'system', label: '系统', title: '跟随系统配色' },
  { mode: 'light', label: '浅', title: '米黄作业本纸' },
  { mode: 'dark', label: '深', title: '夜读本（熄灯后的纸）' },
]

const META_COLOR: Record<EffectiveTheme, string> = {
  light: '#faf7ee',
  dark: '#191c22',
}

const darkQuery = (): MediaQueryList | null =>
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null

export function systemTheme(): EffectiveTheme {
  return darkQuery()?.matches ? 'dark' : 'light'
}

export function readMode(): ThemeMode {
  try {
    const v = localStorage.getItem(THEME_KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {
    /* 隐私模式下 localStorage 会抛 */
  }
  return 'system'
}

export function saveMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_KEY, mode)
  } catch {
    /* 存不上就算了，本次会话仍然生效 */
  }
}

/** 把「用户的选择」落到 DOM 上，返回实际生效的配色 */
export function applyMode(mode: ThemeMode): EffectiveTheme {
  const effective: EffectiveTheme = mode === 'system' ? systemTheme() : mode
  const root = document.documentElement
  root.setAttribute('data-theme', effective)
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', META_COLOR[effective])
  return effective
}

/** 系统配色变化时的回调（只该在 mode === 'system' 时接到 applyMode） */
export function onSystemChange(cb: () => void): () => void {
  const q = darkQuery()
  if (!q) return () => {}
  q.addEventListener('change', cb)
  return () => q.removeEventListener('change', cb)
}
