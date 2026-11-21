import { ref } from 'vue'

export const paletteOpen = ref(false)
export const achOpen = ref(false)

type LayerKey = 'palette' | 'ach'

/**
 * 各浮层「立即收起」的通道，由组件挂载时注册。
 *
 * 为什么不用 watch 去关：那样走的是 closeDialog，会先播 180ms 退出动画，
 * 于是新窗展开的整段时间里旧窗还在 —— 两个 <dialog> 是两层实面板。
 */
const withdraw: Record<LayerKey, (() => void) | null> = { palette: null, ach: null }

export function registerLayer(key: LayerKey, fn: (() => void) | null) {
  withdraw[key] = fn
}

/* 同一时刻只允许一个模态浮层。
   开新的之前先把另一个顶掉，而不是让它留在下面当背景。 */
export function openPalette() {
  withdraw.ach?.()
  paletteOpen.value = true
}

export function openAchievements() {
  withdraw.palette?.()
  achOpen.value = true
}

export function closePalette() {
  paletteOpen.value = false
}

export function closeAchievements() {
  achOpen.value = false
}
