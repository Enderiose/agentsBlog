import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: '首页' },
  },
  {
    path: '/posts',
    name: 'posts',
    component: () => import('@/views/PostListView.vue'),
    meta: { title: '全部记录' },
  },
  {
    path: '/posts/:slug',
    name: 'post',
    component: () => import('@/views/PostView.vue'),
    props: true,
  },
  {
    path: '/projects',
    name: 'projects',
    component: () => import('@/views/ProjectsView.vue'),
    meta: { title: '项目' },
  },
  {
    path: '/tags',
    name: 'tags',
    component: () => import('@/views/TagsView.vue'),
    meta: { title: '标签' },
  },
  {
    path: '/tags/:tag',
    name: 'tag',
    component: () => import('@/views/TagView.vue'),
    props: true,
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/AboutView.vue'),
    meta: { title: '关于' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
  },
]
