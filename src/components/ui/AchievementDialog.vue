<script setup lang="ts">
import { ref, watch } from 'vue'
import ScrollArea from './ScrollArea.vue'
import { achOpen } from '@/composables/useUi'
import { useDialogClose } from '@/composables/useDialogClose'
import { ACHIEVEMENTS, useAchievements } from '@/composables/useAchievements'

const { count, total, has } = useAchievements()
const dlg = ref<HTMLDialogElement | null>(null)
const { close: closeDialog, cancel: cancelClose } = useDialogClose()

watch(achOpen, (open) => {
  if (open) {
    cancelClose(dlg.value)
    if (dlg.value && !dlg.value.open) dlg.value.showModal()
    window.dispatchEvent(new Event('rhine:dialog-open'))
  } else {
    closeDialog(dlg.value)
  }
})
</script>

<template>
  <dialog
    id="ach-dialog"
    ref="dlg"
    class="ef-dialog wide"
    aria-labelledby="ach-title"
    @cancel.prevent="achOpen = false"
    @close="achOpen = false"
    @click.self="achOpen = false"
  >
    <div class="ef-panel cut-br">
      <p class="ef-eyebrow slash">Achievements / 2026</p>
      <h2 id="ach-title">成就 <span class="ef-field">{{ count }} / {{ total }}</span></h2>
      <p class="ef-field dialog-sub">存在这台设备的浏览器里。清除站点数据会一并清空。</p>
      <ScrollArea>
        <ol class="ach-list">
          <li v-for="a in ACHIEVEMENTS" :key="a.id" :class="{ 'is-got': has(a.id) }">
            <span class="no">No.{{ a.no }}</span>
            <span class="nm">{{ has(a.id) || !a.secret ? a.name : '？？？' }}</span>
            <span class="st">{{ has(a.id) ? '已获得' : '未获得' }}</span>
            <span class="ds">{{ has(a.id) || !a.secret ? a.desc : a.hint || '── 保密 ──' }}</span>
          </li>
        </ol>
      </ScrollArea>
      <div class="dialog-foot">
        <button class="ef-btn small" type="button" @click="achOpen = false">关闭</button>
      </div>
    </div>
  </dialog>
</template>
