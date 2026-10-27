import { ref } from 'vue'

export const paletteOpen = ref(false)
export const achOpen = ref(false)

export function openPalette() {
  paletteOpen.value = true
}

export function openAchievements() {
  achOpen.value = true
}

export function closePalette() {
  paletteOpen.value = false
}

export function closeAchievements() {
  achOpen.value = false
}
