<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useHead } from '@unhead/vue'
import { posts, stats } from 'virtual:blog'
import { useOg } from '@/composables/useOg'
import RecordRow from '@/components/ui/RecordRow.vue'

useHead({
  title: '文章 · RHINE 笔记',
  meta: [{ name: 'description', content: '全部文章，按发布时间倒序，可按分类与标签筛选。' }],
})
useOg({ title: '文章 · RHINE 笔记', desc: '全部文章，按发布时间倒序，可按分类与标签筛选。' })

const MAX_TAGS = 3

const route = useRoute()
const router = useRouter()

/** URL 里的 tag 用逗号分隔，最多取前三个 */
function parseTags(v: unknown): string[] {
  return typeof v === 'string'
    ? v.split(',').map(s => s.trim()).filter(Boolean).slice(0, MAX_TAGS)
    : []
}

const cat = computed(() => (typeof route.query.cat === 'string' ? route.query.cat : 'all'))
/** 已选标签：按点选/拖入顺序，最多 3 个 */
const selected = ref<string[]>(parseTags(route.query.tag))

const all = computed(() => [...posts].reverse())

const list = computed(() =>
  all.value.filter(p => {
    const okCat = cat.value === 'all' || p.category === cat.value
    /* 标签是任一命中 */
    const okTag = !selected.value.length || p.tags.some(t => selected.value.includes(t))
    return okCat && okTag
  }),
)

/* 分类与标签可叠加：改一个时保留另一个 */
function syncUrl(catName: string, tags: string[]) {
  const query: Record<string, string> = {}
  if (catName && catName !== 'all') query.cat = catName
  if (tags.length) query.tag = tags.join(',')
  router.replace({ query })
}

const setCat = (name: string) => syncUrl(name, selected.value)

function addTag(name: string) {
  const cur = selected.value
  if (cur.includes(name)) return
  const next = [...cur, name].slice(-MAX_TAGS)
  selected.value = next
  syncUrl(cat.value, next)
}

function toggleTag(name: string) {
  const cur = selected.value
  /* 再点已选中的就是取消；超过 3 个时丢掉最早选的那个 */
  const next = cur.includes(name) ? cur.filter(t => t !== name) : [...cur, name].slice(-MAX_TAGS)
  selected.value = next
  syncUrl(cat.value, next)
  /* 窄屏下标签栏在列表下方：选完把结果滚回视野 */
  if (typeof window !== 'undefined' && matchMedia('(max-width: 959px)').matches) {
    document.getElementById('list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function removeTag(name: string) {
  const next = selected.value.filter(t => t !== name)
  selected.value = next
  syncUrl(cat.value, next)
}

/* ---------- 拖拽：右栏标签 → 待填区 ---------- */
const dragOver = ref(false)

function onDragStart(e: DragEvent, name: string) {
  if (!e.dataTransfer) return
  e.dataTransfer.setData('text/plain', name)
  e.dataTransfer.effectAllowed = 'copy'
}

function onDragOver(e: DragEvent) {
  /* 必须 preventDefault，浏览器才允许 drop */
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
  dragOver.value = true
}

function onDragLeave(e: DragEvent) {
  /* 指针移到槽内子元素时也会触发 dragleave，用 relatedTarget 过滤 */
  const host = e.currentTarget as HTMLElement
  const next = e.relatedTarget as Node | null
  if (next && host.contains(next)) return
  dragOver.value = false
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  dragOver.value = false
  const name = e.dataTransfer?.getData('text/plain') || ''
  /* 只认右栏里真实存在的标签；重复拖入不重复加 */
  if (name && stats.tags.some(t => t.name === name)) addTag(name)
}

/* 浏览器前进/后退时，URL 里的标签重新落到待填区 */
watch(
  () => route.query.tag,
  v => {
    const next = parseTags(v)
    if (next.join(',') !== selected.value.join(',')) selected.value = next
  },
)
</script>

<template>
  <div class="ef-spread">
    <section class="ef-sheet">
      <p class="ef-eyebrow slash">Articles / 2026</p>
      <header class="ef-sheet-head">
        <h1>文章</h1>
        <p class="ef-field"><span>{{ list.length }}</span> 篇</p>
      </header>

      <div class="filters" role="group" aria-label="按分类筛选">
        <button class="ef-chip" type="button" :aria-pressed="cat === 'all'" @click="setCat('all')">
          全部 <span class="n">{{ stats.count }}</span>
        </button>
        <button
          v-for="c in stats.cats"
          :key="c.name"
          class="ef-chip"
          type="button"
          :aria-pressed="cat === c.name"
          @click="setCat(c.name)"
        >
          {{ c.name }} <span class="n">{{ c.count }}</span>
        </button>
      </div>

      <!-- 标签待填区：右栏标签可以点进来，也可以拖进来；点卡片即移除 -->
      <div
        class="tag-slot"
        :class="{ 'is-empty': !selected.length, 'is-dragover': dragOver }"
        role="group"
        aria-label="已选标签，最多三个"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
      >
        <button
          v-for="t in selected"
          :key="t"
          class="ef-chip tag-card"
          type="button"
          :aria-label="`移除标签 ${t}`"
          @click="removeTag(t)"
        >
          {{ t }} <span class="x" aria-hidden="true">×</span>
        </button>
        <span v-if="!selected.length" class="tag-slot-empty" aria-hidden="true">+</span>
      </div>

      <ol v-if="list.length" class="ef-records" id="list">
        <li v-for="(p, i) in list" :key="p.no"><RecordRow :post="p" :i="i" cls="ef-in-come" /></li>
      </ol>
      <p v-else class="ef-empty">没有交集。取消一个标签，或换个分类。</p>
    </section>

    <aside class="ef-margin side-fixed">
      <h2 class="ef-field margin-h">按分类</h2>
      <ul class="ef-ledger">
        <li v-for="c in stats.cats" :key="c.name">
          <RouterLink :to="{ path: '/articles/', query: { cat: c.name } }">{{ c.name }}</RouterLink>
          <span class="ef-field">{{ c.count }} 篇</span>
        </li>
      </ul>

      <h2 class="ef-field margin-h">按标签</h2>
      <ul class="tag-cloud" role="group" aria-label="按标签筛选，最多三个，任一命中即可；可拖到上方待填区">
        <li v-for="t in stats.tags" :key="t.name">
          <button
            class="ef-chip"
            type="button"
            draggable="true"
            :aria-pressed="selected.includes(t.name)"
            @click="toggleTag(t.name)"
            @dragstart="onDragStart($event, t.name)"
          >
            {{ t.name }} <span class="n">{{ t.count }}</span>
          </button>
        </li>
      </ul>
    </aside>
  </div>
</template>
