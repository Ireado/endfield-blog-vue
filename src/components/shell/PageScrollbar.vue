<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * 页面滚动条。
 * 原生条在 site.css 里关掉了（scrollbar-width: none），这里用和弹窗内
 * ScrollArea 同一套视觉补一根：8px 方头条、纸色轨道 + 1px 细线、墨色滑块。
 * 只在可滚动时出现；弹窗打开（html.modal-open）时由 CSS 收起。
 */
const on = ref(false)
const dragging = ref(false)
const thumb = ref<HTMLElement | null>(null)

const MIN_THUMB = 32

let drag: { y: number; top: number } | null = null
let raf = 0
let ro: ResizeObserver | null = null

function update() {
  const doc = document.documentElement
  const vh = window.innerHeight
  const sh = doc.scrollHeight
  const max = sh - vh
  const el = thumb.value
  if (!el) return

  const can = max > 1
  on.value = can
  if (!can) return

  const h = Math.max(MIN_THUMB, Math.round((vh * vh) / sh))
  const top = (vh - h) * (window.scrollY / max)
  el.style.height = `${h}px`
  el.style.transform = `translateY(${top}px)`
}

function onScroll() {
  if (raf) return
  raf = requestAnimationFrame(() => {
    raf = 0
    update()
  })
}

function onDown(e: PointerEvent) {
  const el = thumb.value
  if (!el) return
  e.preventDefault()
  el.setPointerCapture(e.pointerId)
  drag = { y: e.clientY, top: window.scrollY }
  dragging.value = true
}

function onMove(e: PointerEvent) {
  const el = thumb.value
  if (!drag || !el) return
  const max = document.documentElement.scrollHeight - window.innerHeight
  const track = window.innerHeight - el.offsetHeight
  if (track <= 0) return
  window.scrollTo(0, drag.top + (e.clientY - drag.y) * (max / track))
}

function onUp() {
  drag = null
  dragging.value = false
}

/** 点轨道空白处：把滑块中心对到指针位置 */
function onTrack(e: PointerEvent) {
  const el = thumb.value
  if (!el || e.target === el) return
  const h = el.offsetHeight
  const track = window.innerHeight - h
  if (track <= 0) return
  const y = Math.max(0, Math.min(track, e.clientY - h / 2))
  window.scrollTo(0, (y / track) * (document.documentElement.scrollHeight - window.innerHeight))
}

onMounted(() => {
  update()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  if ('ResizeObserver' in window) {
    ro = new ResizeObserver(onScroll)
    ro.observe(document.body)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  ro?.disconnect()
  if (raf) cancelAnimationFrame(raf)
})
</script>

<template>
  <div class="page-sb" :class="{ 'is-on': on, 'is-dragging': dragging }" aria-hidden="true" @pointerdown="onTrack">
    <i
      ref="thumb"
      @pointerdown.stop="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
    ></i>
  </div>
</template>
