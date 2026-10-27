<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useHead } from '@unhead/vue'
import { posts, site, stats } from 'virtual:blog'
import { useAchievements } from '@/composables/useAchievements'
import { scramble, vScramble } from '@/composables/useScramble'
import { tone } from '@/composables/useSound'
import { fmtDate, fmtNum } from '@/utils/format'
import ArtFrame from '@/components/home/ArtFrame.vue'
import RecordRow from '@/components/ui/RecordRow.vue'

useHead({
  title: 'RHINE 笔记 · 一个人的设计与工程笔记',
  meta: [{ name: 'description', content: '界面、前端、渲染与声音的工作笔记。按发布顺序编号。' }],
})

const ach = useAchievements()
const latest = computed(() => posts[posts.length - 1])
const ticker = computed(() => [...posts].reverse())
const recent = computed(() => [...posts].reverse().slice(0, 4))
const maxMonth = computed(() => Math.max(...stats.months.map(m => m.count), 1))
const emptyMonths = computed(() => stats.months.filter(m => m.count === 0).map(m => Number(m.label)))
const barsNote = computed(() =>
  emptyMonths.value.length
    ? `${emptyMonths.value.join('、')} 月没有更新，柱图里就是缺的那一格。`
    : '柱高就是那个月发布的篇数。',
)
const barsLabel = computed(() => {
  const first = stats.months[0]?.label ?? ''
  const last = stats.months[stats.months.length - 1]?.label ?? ''
  return `2026 年 ${Number(first)} 月至 ${Number(last)} 月每月发布的文章篇数`
})

/** 字标连点七次 */
let clicks = 0
let lastClick = 0
function onWordmark() {
  const now = Date.now()
  if (now - lastClick > 1600) clicks = 0
  lastClick = now
  clicks += 1
  tone(420 + clicks * 90, 0.04, 'square', 0.3)
  if (clicks >= 7) {
    clicks = 0
    ach.wordmark()
  }
}

const hero = ref<HTMLElement | null>(null)
const hollow = ref<HTMLElement | null>(null)

onMounted(() => {
  if (!hero.value) return
  if (!matchMedia('(prefers-reduced-motion: no-preference) and (hover: hover)').matches) return
  hero.value.addEventListener('pointermove', (e) => {
    const box = hero.value!.getBoundingClientRect()
    const mx = (e.clientX - box.left) / box.width - 0.5
    const my = (e.clientY - box.top) / box.height - 0.5
    hero.value!.style.setProperty('--mx', mx.toFixed(3))
    hero.value!.style.setProperty('--my', my.toFixed(3))
  })
})

function onHollowEnter() {
  if (hollow.value) scramble(hollow.value)
}
</script>

<template>
  <section ref="hero" class="hero">
    <p class="meta ef-field">
      <time :datetime="site.updated">{{ fmtDate(site.updated) }}</time>
      <span>第 <b v-scramble="{ delay: 220 }">{{ stats.days }}</b> 天</span>
      <span><b v-scramble="{ delay: 260 }">{{ stats.count }}</b> 篇</span>
      <span><b v-scramble="{ delay: 300 }">{{ fmtNum(stats.totalChars) }}</b> 字</span>
    </p>

    <h1 class="ef-wordmark" @click="onWordmark">
      <span class="solid ef-in-drive">RHINE</span>
      <span class="hollow ef-in-drive" style="animation-delay: 140ms" aria-hidden="true">.NOTES</span>
    </h1>

    <div class="copy">
      <p class="claim"><span class="ef-marker ef-in-stroke">{{ site.tagline }}</span></p>
      <p class="bio">界面、前端、渲染管线，以及做东西时踩过的坑。按发布顺序编号，一共 {{ stats.count }} 篇。</p>
      <p class="ef-actions">
        <RouterLink class="ef-btn go" :to="`/post/${latest.no}/`">
          读最新一篇 <span class="sub">No.{{ latest.no }}</span>
        </RouterLink>
        <RouterLink class="ef-btn" to="/articles/">全部文章</RouterLink>
        <RouterLink class="ef-btn" to="/about/">关于</RouterLink>
      </p>
    </div>

    <figure class="ef-frame">
      <div class="window"><ArtFrame /></div>
      <figcaption class="ef-plate">工作台，俯视。写字的地方。</figcaption>
    </figure>

    <div class="ef-ticker" aria-label="最近的文章">
      <div class="track">
        <ul>
          <li v-for="p in ticker" :key="p.no">
            <RouterLink :to="`/post/${p.no}/`"><b>No.{{ p.no }}</b>{{ p.title }}</RouterLink>
          </li>
        </ul>
        <ul aria-hidden="true">
          <li v-for="p in ticker" :key="'dup-' + p.no">
            <RouterLink :to="`/post/${p.no}/`" tabindex="-1"><b>No.{{ p.no }}</b>{{ p.title }}</RouterLink>
          </li>
        </ul>
      </div>
    </div>
  </section>

  <section class="latest">
    <RouterLink :to="`/post/${latest.no}/`" @pointerenter="onHollowEnter">
      <span ref="hollow" class="ef-hollow-no" aria-hidden="true">{{ latest.no }}</span>
      <span class="body">
        <span class="ef-field">
          <span class="flag">最新</span> {{ fmtDate(latest.date) }} | {{ fmtNum(latest.chars) }} 字 | 约 {{ latest.minutes }} 分钟
        </span>
        <span class="title">{{ latest.title }}</span>
        <span class="ef-read" style="color: var(--ef-ink-2); line-height: 1.8">{{ latest.abstract }}</span>
        <span class="ef-btn go">阅读全文</span>
      </span>
    </RouterLink>
  </section>

  <section class="stats">
    <p class="ef-eyebrow slash">Stats / 2026</p>
    <h2 class="ef-bar-title">今年的产出</h2>
    <div class="stats-grid">
      <div>
        <div class="ef-figs">
          <div><b>{{ stats.count }}</b><span>篇</span></div>
          <div><b>{{ fmtNum(stats.totalChars) }}</b><span>字</span></div>
          <div><b>{{ stats.cats.length }}</b><span>个分类</span></div>
        </div>
        <ul class="ef-ledger stats-ledger">
          <li v-for="c in stats.cats" :key="c.name">
            <RouterLink :to="{ path: '/articles/', query: { cat: c.name } }">{{ c.name }}</RouterLink>
            <span class="ef-field">{{ c.count }} 篇</span>
          </li>
          <li><span>最近更新</span><span class="ef-field">{{ fmtDate(latest.date) }}</span></li>
        </ul>
      </div>
      <div class="bars-wrap">
        <p class="ef-field bars-h">每月篇数 · {{ Number(stats.months[0]?.label) }} 月至 {{ Number(stats.months[stats.months.length - 1]?.label) }} 月</p>
        <ol class="ef-bars" :aria-label="barsLabel">
          <li v-for="m in stats.months" :key="m.label" :style="{ '--v': (m.count / maxMonth).toFixed(2) }">
            <span>{{ m.label }}</span>
          </li>
        </ol>
        <p class="ef-field bars-note">{{ barsNote }}</p>
      </div>
    </div>
  </section>

  <section class="index">
    <p class="ef-eyebrow slash">Index</p>
    <h2 class="ef-bar-title">最近四篇</h2>
    <ol class="ef-records">
      <li v-for="(p, i) in recent" :key="p.no"><RecordRow :post="p" :i="i" cls="ef-in-come" /></li>
    </ol>
    <p class="ef-actions" style="margin-top: 1.5rem">
      <RouterLink class="ef-btn" to="/articles/">全部 {{ stats.count }} 篇</RouterLink>
    </p>
  </section>
</template>
