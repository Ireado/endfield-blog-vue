<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import { posts, secret, site, stats } from 'virtual:blog'
import type { Post } from '@/types/blog'
import { useAchievements } from '@/composables/useAchievements'
import { useReading } from '@/composables/useReading'
import { useOg } from '@/composables/useOg'
import { fmtDate, fmtNum } from '@/utils/format'
import RecordRow from '@/components/ui/RecordRow.vue'
import NotFoundView from './NotFoundView.vue'

const route = useRoute()
const ach = useAchievements()

const isSecret = computed(() => route.name === 'colophon')
const post = computed<Post | undefined>(() => {
  if (isSecret.value) return secret
  return posts.find(p => p.no === String(route.params.no))
})

const pageTitle = computed(() => (post.value ? `${post.value.title} · RHINE 笔记` : '没有这一页 · RHINE 笔记'))
const pageDesc = computed(() => post.value?.abstract || '')

useHead({
  title: pageTitle,
  meta: computed(() => [
    { name: 'description', content: pageDesc.value },
    ...(isSecret.value ? [{ name: 'robots', content: 'noindex' }] : []),
  ]),
})

useOg({ title: pageTitle, desc: pageDesc, type: 'article' })

const { pct, current } = useReading(() => ach.deepscan())

const related = computed<Post[]>(() => (isSecret.value ? [posts[posts.length - 1], posts[0]] : []))

/* 上一篇 / 下一篇：按 posts 的日期顺序（构建期排好）线性推进 */
const navIdx = computed(() => {
  const p = post.value
  if (!p || isSecret.value) return -1
  return posts.findIndex(x => x.no === p.no)
})
const prev = computed<Post | undefined>(() => (navIdx.value > 0 ? posts[navIdx.value - 1] : undefined))
const next = computed<Post | undefined>(() => (navIdx.value >= 0 ? posts[navIdx.value + 1] : undefined))

const progress = computed(() => Math.round(pct.value * 100) + '%')

function go(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <NotFoundView v-if="!post" />
  <div v-else class="ef-spread">
    <article class="ef-sheet post">
      <p class="ef-eyebrow slash">{{ post.categoryEn }} / 2026</p>
      <p class="ef-crumb ef-field">
        <RouterLink to="/articles/">全部文章</RouterLink><span>{{ isSecret ? '隐藏档案' : post.category }}</span>
      </p>
      <p class="ids">
        <span class="ef-tag is-current">No.{{ post.no }}</span>
        <span class="ef-kv"><span>分类</span><span>{{ post.category }}</span></span>
        <span class="ef-state">已发布</span>
      </p>
      <ul class="ef-facts ef-field">
        <li><time :datetime="post.date">{{ fmtDate(post.date) }}</time></li>
        <li>{{ fmtNum(post.chars) }} 字</li>
        <li>约 {{ post.minutes }} 分钟</li>
      </ul>
      <h1 class="title ef-read">{{ post.title }}</h1>
      <div class="ef-tri" aria-hidden="true"><i></i><i></i><i></i></div>
      <p class="ef-lede ef-read">{{ post.abstract }}</p>
      <p v-if="post.tags.length" class="post-tags">
        <RouterLink
          v-for="t in post.tags"
          :key="t"
          class="ef-chip"
          :to="{ path: '/articles/', query: { tag: t } }"
        >{{ t }}</RouterLink>
      </p>

      <div class="ef-prose" v-html="post.html"></div>

      <nav v-if="!isSecret && (prev || next)" class="post-nav" aria-label="文章导航">
        <RouterLink v-if="prev" class="post-nav-item" :to="`/post/${prev.no}/`">
          <span class="dir ef-field"><span aria-hidden="true">←</span> 上一篇</span>
          <span class="nv-title ef-read">{{ prev.title }}</span>
          <span class="nv-no ef-field">No.{{ prev.no }} · {{ fmtDate(prev.date) }}</span>
        </RouterLink>
        <span v-else class="post-nav-void" aria-hidden="true"></span>
        <RouterLink v-if="next" class="post-nav-item is-end" :to="`/post/${next.no}/`">
          <span class="dir ef-field">下一篇 <span aria-hidden="true">→</span></span>
          <span class="nv-title ef-read">{{ next.title }}</span>
          <span class="nv-no ef-field">No.{{ next.no }} · {{ fmtDate(next.date) }}</span>
        </RouterLink>
        <span v-else class="post-nav-void" aria-hidden="true"></span>
      </nav>

      <template v-if="isSecret">
        <h2 class="ef-group-head ef-read"><span>接着读</span><span class="ef-field">{{ related.length }} 篇</span></h2>
        <ol class="ef-records">
          <li v-for="(p, i) in related" :key="p.no"><RecordRow :post="p" :i="i" /></li>
        </ol>
      </template>
      <p class="ef-field post-end">本文编号 No.{{ post.no }} · {{ post.category }} · {{ fmtNum(post.chars) }} 字</p>
    </article>

    <aside class="ef-margin">
      <div class="toc-wrap">
        <p class="ef-field toc-h">目录</p>
        <ol class="toc">
          <li v-for="h in post.headings" :key="h.id">
            <a :href="'#' + h.id" :aria-current="current === h.id ? 'true' : undefined" @click.prevent="go(h.id)">
              {{ h.text }}
            </a>
          </li>
        </ol>
        <p class="ef-field read-line">读到这里 <b>{{ progress }}</b></p>
        <h2 class="ef-field margin-h">本站</h2>
        <ul class="ef-ledger">
          <li><span>篇数</span><span class="ef-field">{{ stats.count }} 篇</span></li>
          <li><span>字数</span><span class="ef-field">{{ fmtNum(stats.totalChars) }} 字</span></li>
          <li><span>更新</span><span class="ef-field">{{ fmtDate(site.updated) }}</span></li>
        </ul>
      </div>
    </aside>
  </div>
</template>
