<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { posts } from 'virtual:blog'
import ScrollArea from './ScrollArea.vue'
import { paletteOpen } from '@/composables/useUi'
import { useDialogClose } from '@/composables/useDialogClose'

const dlg = ref<HTMLDialogElement | null>(null)
const input = ref<HTMLInputElement | null>(null)
const palList = ref<HTMLOListElement | null>(null)
const q = ref('')
const { close: closeDialog, cancel: cancelClose } = useDialogClose()

interface Row {
  no: string
  title: string
  cat: string
  to: string
}

const pages: Row[] = [
  { no: '', title: '首页', cat: '页面', to: '/' },
  { no: '', title: '文章', cat: '页面', to: '/articles/' },
  { no: '', title: '关于', cat: '页面', to: '/about/' },
]

const items: Row[] = [
  ...pages,
  ...[...posts].reverse().map(p => ({ no: p.no, title: p.title, cat: p.category, to: `/post/${p.no}/` })),
]

const rows = computed(() => {
  const k = q.value.trim().toLowerCase()
  if (!k) return items
  return items.filter(it => `${it.no} ${it.title} ${it.cat}`.toLowerCase().includes(k))
})

watch(paletteOpen, async (open) => {
  if (open) {
    cancelClose(dlg.value)
    if (dlg.value && !dlg.value.open) dlg.value.showModal()
    window.dispatchEvent(new Event('rhine:dialog-open'))
    q.value = ''
    await nextTick()
    input.value?.focus()
  } else {
    closeDialog(dlg.value)
  }
})

function onInputKey(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    const first = palList.value?.querySelector<HTMLAnchorElement>('a')
    first?.click()
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    palList.value?.querySelector<HTMLAnchorElement>('a')?.focus()
  }
}

function onListKey(e: KeyboardEvent) {
  const links = [...(palList.value?.querySelectorAll<HTMLAnchorElement>('a') || [])]
  const at = links.indexOf(document.activeElement as HTMLAnchorElement)
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    ;(links[at + 1] || links[0])?.focus()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (at <= 0) input.value?.focus()
    else links[at - 1]?.focus()
  }
}

function onFocusIn(e: FocusEvent) {
  const a = (e.target as HTMLElement).closest('a')
  if (!a) return
  palList.value?.querySelectorAll('a[aria-current]').forEach(x => x.removeAttribute('aria-current'))
  a.setAttribute('aria-current', 'true')
}
</script>

<template>
  <dialog
    id="palette"
    ref="dlg"
    class="ef-dialog palette"
    aria-labelledby="pal-title"
    @cancel.prevent="paletteOpen = false"
    @close="paletteOpen = false"
    @click.self="paletteOpen = false"
  >
    <div class="ef-panel cut-br">
      <p class="ef-eyebrow slash">Search</p>
      <h2 id="pal-title">跳到</h2>
      <label class="ef-search">
        <input
          ref="input"
          v-model="q"
          type="search"
          placeholder="标题、编号或页面"
          autocomplete="off"
          aria-label="搜索文章与页面"
          @keydown="onInputKey"
        />
      </label>
      <ScrollArea @keydown="onListKey" @focusin="onFocusIn">
        <ol ref="palList" id="pal-list" class="ef-records">
            <li v-for="row in rows" :key="row.to">
              <RouterLink class="ef-record" :to="row.to" @click="paletteOpen = false">
                <span class="ef-tag">{{ row.no ? 'No.' + row.no : 'PAGE' }}</span>
                <span class="name ef-read">{{ row.title }}</span>
                <span class="ef-field">{{ row.cat }}</span>
              </RouterLink>
            </li>
            <li v-if="!rows.length" class="pal-empty ef-field" style="padding: 0.9rem 0.4rem">
              没有匹配的页面或文章。
            </li>
        </ol>
      </ScrollArea>
      <div class="dialog-foot">
        <p class="ef-field palette-hint">↑↓ 选择 · Enter 打开 · Esc 关闭</p>
        <button class="ef-btn small" type="button" @click="paletteOpen = false">关闭</button>
      </div>
    </div>
  </dialog>
</template>
