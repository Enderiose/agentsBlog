import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import App from './App.vue'
import { routes } from './router'
import { site } from './lib/posts'
import './styles/main.css'

const router = createRouter({
  // base 必须与 vite.config.ts 的 base 一致，否则 GitHub Pages 子路径下路由全 404
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, _from, saved) {
    if (saved) return saved
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})

router.afterEach((to) => {
  const t = (to.meta?.title as string) || ''
  document.title = t ? `${t} · ${site.title}` : `${site.title} · 施工日志`
})

createApp(App).use(router).mount('#app')
