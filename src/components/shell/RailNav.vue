<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { computed } from 'vue'
import { site, posts } from 'virtual:blog'
import { useAchievements } from '@/composables/useAchievements'
import { useTheme } from '@/composables/useTheme'
import { soundOn, toggleSound } from '@/composables/useSound'
import { openAchievements, openPalette } from '@/composables/useUi'
import { fmtDate } from '@/utils/format'

const route = useRoute()
const { count: achCount, total: achTotal } = useAchievements()
const { isDark, toggle } = useTheme()

const latestNo = computed(() => posts[posts.length - 1]?.no ?? '—')
const articlesActive = computed(() => ['articles', 'post', 'colophon'].includes(String(route.name)))

const current = (path: string) => {
  if (path === '/') return route.path === '/' || route.path === ''
  return route.path.startsWith(path)
}

function onTheme(e: MouseEvent) {
  useAchievements().theme()
  toggle(e)
}

function onSound() {
  toggleSound()
  if (!soundOn.value) useAchievements().silence()
}
</script>

<template>
  <nav class="ef-rail rail" aria-label="主导航">
    <RouterLink to="/" custom v-slot="{ href, navigate }">
      <a class="brand" :href="href" @click="navigate">RHINE<span class="brand-zh">笔记</span></a>
    </RouterLink>
    <div class="rail-links">
      <RouterLink to="/" :aria-current="current('/') ? 'page' : undefined">首页</RouterLink>
      <RouterLink to="/articles/" :aria-current="articlesActive ? 'page' : undefined">文章</RouterLink>
      <RouterLink to="/archive/" :aria-current="current('/archive') ? 'page' : undefined">归档</RouterLink>
      <RouterLink to="/about/" :aria-current="current('/about') ? 'page' : undefined">关于</RouterLink>
    </div>
    <div class="rail-tools">
      <button class="ef-btn small" type="button" data-palette-open aria-keyshortcuts="Control+K Meta+K" @click="openPalette()">
        搜索 <span class="sub">Ctrl K</span>
      </button>
      <button class="ef-btn small" type="button" @click="openAchievements()">
        成就 <span class="sub">{{ achCount }} / {{ achTotal }}</span>
      </button>
      <button
        class="ef-btn small"
        type="button"
        data-theme-toggle
        :aria-pressed="isDark"
        aria-label="切换深浅主题"
        @click="onTheme"
      >
        深浅
      </button>
      <button
        class="ef-btn small"
        type="button"
        :aria-pressed="soundOn"
        aria-label="音效开关"
        @click="onSound"
      >
        音效
      </button>
    </div>
    <p class="rail-foot ef-field">No.{{ latestNo }} · {{ fmtDate(site.updated) }}</p>
  </nav>
</template>
