<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import { site } from 'virtual:blog'
import { fmtDate } from '@/utils/format'

useHead({
  title: '没有这一页 · RHINE 笔记',
  meta: [{ name: 'description', content: '这个地址没有对应的记录。' }],
})

const route = useRoute()
</script>

<template>
  <section class="notfound">
    <p class="ef-eyebrow slash">404 / Not found</p>
    <h1>没有这一页</h1>
    <p class="ef-lede ef-read">你打开的地址没有对应的记录。可能是手误，也可能是这条记录还没写。</p>
    <p class="ef-facts ef-field"><span>编号 404</span><span>{{ fmtDate(site.updated) }}</span></p>
    <p class="ef-field" style="color: var(--ef-ink-2); word-break: break-all">{{ route.fullPath }}</p>
    <p class="ef-actions">
      <RouterLink class="ef-btn go" to="/">回首页</RouterLink>
      <RouterLink class="ef-btn" to="/articles/">全部文章</RouterLink>
      <RouterLink class="ef-btn" to="/about/">关于</RouterLink>
    </p>
  </section>
</template>
