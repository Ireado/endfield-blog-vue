<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useHead } from '@unhead/vue'
import { posts, stats } from 'virtual:blog'
import { fmtDate, fmtNum } from '@/utils/format'
import RecordRow from '@/components/ui/RecordRow.vue'

useHead({
  title: '文章 · RHINE 笔记',
  meta: [{ name: 'description', content: '全部文章，按发布时间倒序。' }],
})

const route = useRoute()
const router = useRouter()
const q = ref('')
const cat = computed(() => (typeof route.query.cat === 'string' ? route.query.cat : 'all'))
const all = computed(() => [...posts].reverse())

const list = computed(() => {
  const k = q.value.trim().toLowerCase()
  return all.value.filter(p => {
    const okCat = cat.value === 'all' || p.category === cat.value
    const text = `${p.no} ${p.title} ${p.category} ${p.tags.join(' ')}`.toLowerCase()
    return okCat && (!k || text.includes(k))
  })
})

function setCat(name: string) {
  router.replace({ query: name === 'all' ? {} : { cat: name } })
}
</script>

<template>
  <div class="ef-spread">
    <section class="ef-sheet">
      <p class="ef-eyebrow slash">Articles / 2026</p>
      <header class="ef-sheet-head">
        <h1>文章</h1>
        <p class="ef-field"><span>{{ list.length }}</span> 篇</p>
      </header>
      <p class="ef-lede ef-read">按发布时间倒序。编号即顺序，可以用搜索（Ctrl K）直接跳。</p>

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

      <label class="ef-search">
        <input v-model="q" type="search" placeholder="搜索标题、编号、标签" aria-label="搜索文章" />
      </label>

      <ol v-if="list.length" class="ef-records" id="list">
        <li v-for="(p, i) in list" :key="p.no"><RecordRow :post="p" :i="i" cls="ef-in-come" /></li>
      </ol>
      <p v-else class="ef-empty">没有找到匹配的记录。换个词，或点「全部」看所有文章。</p>
    </section>

    <aside class="ef-margin">
      <h2 class="ef-field margin-h">按分类</h2>
      <ul class="ef-ledger">
        <li v-for="c in stats.cats" :key="c.name">
          <RouterLink :to="{ path: '/articles/', query: { cat: c.name } }">{{ c.name }}</RouterLink>
          <span class="ef-field">{{ c.count }} 篇</span>
        </li>
        <li><span>字数合计</span><span class="ef-field">{{ fmtNum(stats.totalChars) }} 字</span></li>
        <li><span>首篇</span><span class="ef-field">{{ fmtDate(stats.first) }}</span></li>
      </ul>
      <h2 class="ef-field margin-h">说明</h2>
      <p class="ef-field" style="line-height: 1.8">编号、日期、字数都来自文章本身，由构建脚本统计。没有阅读数。</p>
    </aside>
  </div>
</template>
