import type { RouteRecordRaw, RouterScrollBehavior } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import ArticlesView from '@/views/ArticlesView.vue'
import ArticleView from '@/views/ArticleView.vue'
import AboutView from '@/views/AboutView.vue'
import NotFoundView from '@/views/NotFoundView.vue'

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/articles/', name: 'articles', component: ArticlesView },
  { path: '/post/:no/', name: 'post', component: ArticleView },
  { path: '/about/', name: 'about', component: AboutView },
  { path: '/colophon/', name: 'colophon', component: ArticleView },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
]

export const scrollBehavior: RouterScrollBehavior = (to, _from, saved) => {
  if (saved) return saved
  if (to.hash) return { el: to.hash, top: 24, behavior: 'smooth' }
  return { top: 0 }
}
