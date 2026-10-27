<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useHead } from '@unhead/vue'
import RailNav from '@/components/shell/RailNav.vue'
import SiteFooter from '@/components/shell/SiteFooter.vue'
import PageScrollbar from '@/components/shell/PageScrollbar.vue'
import SearchPalette from '@/components/ui/SearchPalette.vue'
import AchievementDialog from '@/components/ui/AchievementDialog.vue'
import ToastHost from '@/components/ui/ToastHost.vue'
import { achOpen, openPalette, paletteOpen } from '@/composables/useUi'
import { useAchievements } from '@/composables/useAchievements'
import { initTheme } from '@/composables/useTheme'
import { initSound, play, soundOn } from '@/composables/useSound'
import { setScrollLock } from '@/composables/useScrollLock'

useHead({ htmlAttrs: { lang: 'zh-CN' } })

const route = useRoute()
const router = useRouter()
const ach = useAchievements()

const isHome = computed(() => route.name === 'home')
const isNotFound = computed(() => route.name === 'not-found')

watch([paletteOpen, achOpen], ([p, a]) => setScrollLock(p || a), { flush: 'post' })

// 路由变化时收起浮层（浏览器前进/后退也可能在浮层打开时触发）
watch(() => route.fullPath, () => {
  paletteOpen.value = false
  achOpen.value = false
})

const SEQ = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA']
let ki = 0

function onKey(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    openPalette()
    ach.keyboard()
    return
  }
  const typing = /INPUT|TEXTAREA/.test((document.activeElement as HTMLElement | null)?.tagName || '')
  if (typing) return
  if (e.code === SEQ[ki]) {
    ki += 1
    if (ki === SEQ.length) {
      ki = 0
      ach.konami()
    }
  } else {
    ki = e.code === SEQ[0] ? 1 : 0
  }
}

function onClick(e: MouseEvent) {
  if (!soundOn.value) return
  const hit = (e.target as HTMLElement).closest('.ef-btn, .ef-record, .ef-tag, .ef-chip, .rail a, .secret-no')
  if (hit) play('tick')
}

let stopAfter: (() => void) | null = null
let triRaf = 0

/* 三色条随滚动从右往左擦除（0–72px 内完成），不占布局高度 */
function updateTri() {
  const p = Math.min(1, Math.max(0, window.scrollY / 72))
  document.documentElement.style.setProperty('--tri-wipe', p.toFixed(3))
}
function onScrollTri() {
  if (triRaf) return
  triRaf = requestAnimationFrame(() => {
    triRaf = 0
    updateTri()
  })
}

onMounted(() => {
  initTheme()
  initSound()
  ach.begin()

  router.isReady().then(() => {
    ach.checkReload(route.name as string | null, String(route.params.no || ''))
    ach.enter(route, null)
  })

  stopAfter = router.afterEach((to, from) => {
    ach.enter(to, from)
    document.body.dataset.page = String(to.name || 'home')
    requestAnimationFrame(updateTri)
  })

  document.body.dataset.page = String(route.name || 'home')
  updateTri()
  window.addEventListener('scroll', onScrollTri, { passive: true })
  window.addEventListener('keydown', onKey)
  document.addEventListener('click', onClick, true)
})

onBeforeUnmount(() => {
  stopAfter?.()
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('scroll', onScrollTri)
  document.removeEventListener('click', onClick, true)
  if (triRaf) cancelAnimationFrame(triRaf)
})
</script>

<template>
  <div class="ef-tri" :class="{ 'ef-in-sweep': isHome }" aria-hidden="true"><i></i><i></i><i></i></div>
  <div class="shell">
    <RailNav />
    <main class="main" :class="{ alone: isNotFound }">
      <RouterView v-slot="{ Component, route: current }">
        <component :is="Component" :key="current.path" />
      </RouterView>
      <SiteFooter />
    </main>
  </div>

  <SearchPalette />
  <AchievementDialog />
  <ToastHost />
  <PageScrollbar />
</template>
