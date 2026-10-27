import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type UserConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import type { ViteSSGOptions } from 'vite-ssg'
import { blogContent, blogRoutes } from './scripts/content-plugin'

// 内容路由由 content-plugin 统一推导（frontmatter secret 分流），这里不做编号特判
const { postRoutes, secretRoute } = blogRoutes()

export default defineConfig({
  plugins: [vue(), blogContent()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  ssgOptions: {
    dirStyle: 'nested',
    includedRoutes: () => ['/', '/articles/', '/about/', '/404/', secretRoute, ...postRoutes],
  },
} as UserConfig & { ssgOptions: ViteSSGOptions })
