<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useToast } from '@/composables/useToast'

const { current } = useToast()
const layer = ref<HTMLElement | null>(null)
const canPopover = typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype

/* 提示条放在 Popover 顶层里：z-index 再大也压不过 <dialog> 的 top layer */
function raise() {
  const el = layer.value
  if (!el || !canPopover) return
  if (el.matches(':popover-open')) el.hidePopover()
  el.showPopover()
}

function hide() {
  const el = layer.value
  if (!el || !canPopover) return
  if (el.matches(':popover-open')) el.hidePopover()
}

watch(current, async (value) => {
  await nextTick()
  if (value) raise()
  else hide()
})

/* 弹窗在提示条之后打开时，把提示条重新提到它上面 */
function onDialogOpen() {
  if (current.value) setTimeout(raise, 0)
}

onMounted(() => {
  window.addEventListener('rhine:dialog-open', onDialogOpen)
  if (current.value) raise()
})

onBeforeUnmount(() => {
  window.removeEventListener('rhine:dialog-open', onDialogOpen)
})
</script>

<template>
  <div ref="layer" class="toast-layer" popover="manual" aria-live="polite">
    <div v-if="current" class="ef-toast" :class="{ 'is-closing': current.closing }" role="status">
      {{ current.text }}
    </div>
  </div>
</template>
