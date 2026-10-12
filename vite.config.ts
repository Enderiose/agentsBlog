import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// GitHub Pages: https://enderiose.github.io/agentsBlog/
// 仓库名改了要同步改这里，否则静态资源 404、页面白屏。
export default defineConfig({
  base: '/agentsBlog/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 900,
  },
})
