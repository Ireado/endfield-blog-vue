<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useHead } from '@unhead/vue'
import { posts, stats } from 'virtual:blog'
import type { Post } from '@/types/blog'
import { fmtDate, fmtNum } from '@/utils/format'
import { useOg } from '@/composables/useOg'
import RecordRow from '@/components/ui/RecordRow.vue'

useHead({
  title: '归档 · RHINE 笔记',
  meta: [{ name: 'description', content: `全部 ${stats.count} 篇文章按年月归档，带字数与分类统计。` }],
})

useOg({ title: '归档 · RHINE 笔记', desc: `全部 ${stats.count} 篇文章按年月归档，带字数与分类统计。` })

/* 按年月分组：月份倒序，月内日期倒序（posts 本身是日期升序） */
const groups = computed(() => {
  const map = new Map<string, Post[]>()
  for (const p of posts) {
    const key = p.date.slice(0, 7)
    const arr = map.get(key)
    if (arr) arr.push(p)
    else map.set(key, [p])
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, items]) => ({
      key,
      label: key.replace('-', '.'),
      items: [...items].reverse(),
      chars: items.reduce((n, p) => n + p.chars, 0),
    }))
})

const avg = computed(() => (stats.count ? Math.round(stats.totalChars / stats.count) : 0))
const spanDays = computed(() => {
  if (!stats.first || !stats.latest) return 0
  return Math.round((new Date(stats.latest).getTime() - new Date(stats.first).getTime()) / 86400000) + 1
})
const activeMonths = computed(() => stats.months.filter(m => m.count > 0).length)
const totalMonths = computed(() => stats.months.length)
const maxCat = computed(() => Math.max(...stats.cats.map(c => c.count), 1))

function go(key: string) {
  document.getElementById('m-' + key)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="ef-spread">
    <section class="ef-sheet archive">
      <p class="ef-eyebrow slash">Archive</p>
      <header class="ef-sheet-head">
        <h1>归档</h1>
        <p class="ef-field"><span>{{ stats.count }}</span> 篇 · {{ groups.length }} 个月</p>
      </header>
      <p class="ef-lede ef-read">
        全部文章按年月归档，编号即顺序。从 {{ fmtDate(stats.first) }} 的第一篇到
        {{ fmtDate(stats.latest) }} 的最近一篇，跨度 {{ spanDays }} 天。
      </p>

      <div class="ef-figs arc-figs">
        <div><b>{{ stats.count }}</b><span>篇</span></div>
        <div><b>{{ fmtNum(stats.totalChars) }}</b><span>字</span></div>
        <div><b>{{ spanDays }}</b><span>天跨度</span></div>
      </div>

      <ul class="ef-ledger arc-ledger">
        <li><span>平均每篇</span><span class="ef-field">{{ fmtNum(avg) }} 字</span></li>
        <li><span>有更新的月份</span><span class="ef-field">{{ activeMonths }} / {{ totalMonths }} 个月</span></li>
        <li><span>分类</span><span class="ef-field">{{ stats.cats.length }} 个</span></li>
      </ul>

      <h2 class="ef-group-head ef-read"><span>分类分布</span><span class="ef-field">按篇数</span></h2>
      <ul class="arc-cats">
        <li v-for="c in stats.cats" :key="c.name">
          <RouterLink :to="{ path: '/articles/', query: { cat: c.name } }">{{ c.name }}</RouterLink>
          <span class="arc-bar" aria-hidden="true"><i :style="{ '--w': (c.count / maxCat).toFixed(2) }"></i></span>
          <span class="ef-field arc-n">{{ c.count }}</span>
        </li>
      </ul>

      <h2 class="ef-group-head ef-read"><span>时间线</span><span class="ef-field">新 → 旧</span></h2>
      <div class="arc-timeline">
        <section v-for="g in groups" :id="'m-' + g.key" :key="g.key" class="arc-month">
          <h3 class="ef-field">
            <time :datetime="g.key">{{ g.label }}</time>
            <span>{{ g.items.length }} 篇 · {{ fmtNum(g.chars) }} 字</span>
          </h3>
          <ol class="ef-records">
            <li v-for="(p, i) in g.items" :key="p.no"><RecordRow :post="p" :i="i" /></li>
          </ol>
        </section>
      </div>
    </section>

    <aside class="ef-margin">
      <div class="toc-wrap">
        <p class="ef-field toc-h">月份</p>
        <ol class="toc">
          <li v-for="g in groups" :key="g.key">
            <a :href="'#m-' + g.key" @click.prevent="go(g.key)">{{ g.label }} · {{ g.items.length }} 篇</a>
          </li>
        </ol>
        <h2 class="ef-field margin-h">按分类</h2>
        <ul class="ef-ledger">
          <li v-for="c in stats.cats" :key="c.name">
            <RouterLink :to="{ path: '/articles/', query: { cat: c.name } }">{{ c.name }}</RouterLink>
            <span class="ef-field">{{ c.count }} 篇</span>
          </li>
        </ul>
        <p class="ef-field arc-note">日期、字数与分类计数都由构建脚本从文章本身统计，没有手填。</p>
      </div>
    </aside>
  </div>
</template>
