<script setup lang="ts">
import { computed, ref } from 'vue'
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

const route = useRoute()
const router = useRouter()
const q = ref('')
const cat = computed(() => (typeof route.query.cat === 'string' ? route.query.cat : 'all'))
const tag = computed(() => (typeof route.query.tag === 'string' ? route.query.tag : ''))
const all = computed(() => [...posts].reverse())

const list = computed(() => {
  const k = q.value.trim().toLowerCase()
  return all.value.filter(p => {
    const okCat = cat.value === 'all' || p.category === cat.value
    const okTag = !tag.value || p.tags.includes(tag.value)
    const text = `${p.no} ${p.title} ${p.category} ${p.tags.join(' ')}`.toLowerCase()
    return okCat && okTag && (!k || text.includes(k))
  })
})

/* 分类与标签可叠加；改一个时保留另一个。再点同一枚标签就是取消 */
function navigate(catName: string, tagName: string) {
  const query: Record<string, string> = {}
  if (catName && catName !== 'all') query.cat = catName
  if (tagName) query.tag = tagName
  router.replace({ query })
}
const setCat = (name: string) => navigate(name, tag.value)
const toggleTag = (name: string) => navigate(cat.value, tag.value === name ? '' : name)
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

      <ul class="tag-cloud" role="group" aria-label="按标签筛选">
        <li v-for="t in stats.tags" :key="t.name">
          <button class="ef-chip" type="button" :aria-pressed="tag === t.name" @click="toggleTag(t.name)">
            {{ t.name }} <span class="n">{{ t.count }}</span>
          </button>
        </li>
      </ul>

      <label class="ef-search">
        <input v-model="q" type="search" placeholder="搜索标题、编号、标签" aria-label="搜索文章" />
      </label>

      <ol v-if="list.length" class="ef-records" id="list">
        <li v-for="(p, i) in list" :key="p.no"><RecordRow :post="p" :i="i" cls="ef-in-come" /></li>
      </ol>
      <p v-else class="ef-empty">没有找到匹配的记录。换个词，或取消筛选。</p>
    </section>

    <aside class="ef-margin">
      <h2 class="ef-field margin-h">按分类</h2>
      <ul class="ef-ledger">
        <li v-for="c in stats.cats" :key="c.name">
          <RouterLink :to="{ path: '/articles/', query: { cat: c.name } }">{{ c.name }}</RouterLink>
          <span class="ef-field">{{ c.count }} 篇</span>
        </li>
      </ul>
    </aside>
  </div>
</template>
