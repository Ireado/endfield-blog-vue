import { readdirSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type UserConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import type { ViteSSGOptions } from 'vite-ssg'
import { blogContent } from './scripts/content-plugin'

const postRoutes = readdirSync('content/posts')
  .filter(f => f.endsWith('.md'))
  .map(f => f.slice(0, 3))
  .filter(no => no !== '000')
  .map(no => `/post/${no}/`)

export default defineConfig({
  plugins: [vue(), blogContent()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  ssgOptions: {
    dirStyle: 'nested',
    includedRoutes: () => ['/', '/articles/', '/about/', '/404/', '/colophon/', ...postRoutes],
  },
} as UserConfig & { ssgOptions: ViteSSGOptions })
