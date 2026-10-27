<script setup lang="ts">
import { onBeforeUnmount, onMounted, onUpdated, ref } from 'vue'

const host = ref<HTMLElement | null>(null)
const body = ref<HTMLElement | null>(null)
const bar = ref<HTMLElement | null>(null)
const thumb = ref<HTMLElement | null>(null)
const scrollable = ref(false)
const dragging = ref(false)

let drag: { y: number; top: number } | null = null
let ro: ResizeObserver | null = null

function update() {
  const el = body.value
  const th = thumb.value
  if (!el || !th) return
  const sh = el.scrollHeight
  const ch = el.clientHeight
  const can = sh - ch > 1
  scrollable.value = can
  host.value?.classList.toggle('has-more', can && sh - el.scrollTop - ch > 4)
  if (!can) return
  const height = Math.max(28, Math.round((ch * ch) / sh))
  const maxTop = ch - height
  const top = maxTop * (el.scrollTop / (sh - ch))
  th.style.height = `${height}px`
  th.style.transform = `translateY(${top}px)`
}

function onThumbDown(e: PointerEvent) {
  e.preventDefault()
  const el = body.value
  if (!el) return
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  drag = { y: e.clientY, top: el.scrollTop }
  dragging.value = true
}

function onThumbMove(e: PointerEvent) {
  const el = body.value
  const th = thumb.value
  if (!drag || !el || !th) return
  const maxTop = el.clientHeight - th.offsetHeight
  const ratio = maxTop > 0 ? (el.scrollHeight - el.clientHeight) / maxTop : 1
  el.scrollTop = drag.top + (e.clientY - drag.y) * ratio
}

function endDrag() {
  drag = null
  dragging.value = false
}

function onTrack(e: PointerEvent) {
  const el = body.value
  const th = thumb.value
  const track = bar.value
  if (!el || !th || !track || e.target === th) return
  const box = track.getBoundingClientRect()
  const maxTop = box.height - th.offsetHeight
  if (maxTop <= 0) return
  const y = Math.max(0, Math.min(maxTop, e.clientY - box.top - th.offsetHeight / 2))
  el.scrollTop = (y / maxTop) * (el.scrollHeight - el.clientHeight)
}

onMounted(() => {
  const el = body.value
  if (!el) return
  el.addEventListener('scroll', update, { passive: true })
  if ('ResizeObserver' in window) {
    ro = new ResizeObserver(update)
    ro.observe(el)
    if (el.firstElementChild) ro.observe(el.firstElementChild)
  }
  update()
})

onUpdated(update)

onBeforeUnmount(() => {
  body.value?.removeEventListener('scroll', update)
  ro?.disconnect()
})

defineExpose({ update })
</script>

<template>
  <div ref="host" class="scroll-host" :class="{ 'is-scrollable': scrollable, 'is-dragging': dragging }">
    <div ref="body" class="scroll-body"><slot /></div>
    <div ref="bar" class="ef-sb" aria-hidden="true" @pointerdown="onTrack">
      <i ref="thumb" @pointerdown.stop="onThumbDown" @pointermove="onThumbMove" @pointerup="endDrag" @pointercancel="endDrag"></i>
    </div>
  </div>
</template>
