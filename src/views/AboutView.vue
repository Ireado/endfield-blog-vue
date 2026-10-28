<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useHead } from '@unhead/vue'
import { site, stats } from 'virtual:blog'
import { fmtDate, fmtNum } from '@/utils/format'
import { useOg } from '@/composables/useOg'

useHead({
  title: '关于 · RHINE 笔记',
  meta: [{ name: 'description', content: '关于这个站和写字的人。' }],
})

useOg({ title: '关于 · RHINE 笔记', desc: '关于这个站和写字的人。' })

function go(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div class="ef-spread">
    <section class="ef-sheet">
      <p class="ef-eyebrow slash">About</p>
      <header class="ef-sheet-head">
        <h1>关于</h1>
        <p class="ef-field">更新于 {{ fmtDate(site.updated) }}</p>
      </header>
      <p class="ef-lede ef-read">写这个站的人，和这个站的做法。</p>

      <div class="ef-prose">
        <p>我是 <strong>RHINE</strong>，设计工程师。白天做界面和前端，晚上折腾渲染和声音。这个站是我的工作笔记：把做过的事写清楚，顺便把版式当成长期练习。</p>

        <h2 id="s1">在做的事</h2>
        <ul>
          <li><strong>界面系统</strong>：把一套规则落到能维护的部件上，先定形状，再定颜色。</li>
          <li><strong>前端工程</strong>：不依赖框架的交互、性能与可访问性。</li>
          <li><strong>渲染管线</strong>：Blender 无头渲染、颜色校准、逐帧比对。</li>
          <li><strong>声音合成</strong>：用振荡器做克制的界面反馈。</li>
        </ul>

        <h2 id="s3">这个站</h2>
        <p>
          没有评论、没有统计、没有账号。文章按发布时间编号，从 No.001 开始。想找什么，用搜索（<kbd>Ctrl</kbd> /
          <kbd>⌘</kbd> + <kbd>K</kbd>）或者去<RouterLink to="/articles/">文章页</RouterLink>筛选。
        </p>
        <p>页面在构建时预渲染成静态 HTML，交互在浏览器里由 Vue 接管。字数、阅读时长、分类计数都是构建时算出来的，不是手填的——这样它们就不会说谎。</p>

        <h2 id="s5">联系</h2>
        <p>目前没有公开的联系方式。如果以后开了，会写在这一页。</p>
      </div>

      <h2 class="ef-group-head ef-read"><span>站点的做法</span><span class="ef-field">5 项</span></h2>
      <ul class="ef-ledger">
        <li><span>页面</span><span class="ef-field">Vue 3 · 静态生成</span></li>
        <li><span>样式</span><span class="ef-field">手写 CSS · 设计变量</span></li>
        <li><span>内容</span><span class="ef-field">Markdown · frontmatter</span></li>
        <li><span>拉丁字</span><span class="ef-field">Saira · 可变宽度</span></li>
        <li><span>字体许可</span><span class="ef-field">SIL OFL 1.1</span></li>
      </ul>
    </section>

    <aside class="ef-margin">
      <div class="toc-wrap">
        <p class="ef-field toc-h">目录</p>
        <ol class="toc">
          <li><a href="#s1" @click.prevent="go('s1')">在做的事</a></li>
          <li><a href="#s3" @click.prevent="go('s3')">这个站</a></li>
          <li><a href="#s5" @click.prevent="go('s5')">联系</a></li>
        </ol>
        <h2 class="ef-field margin-h">按分类</h2>
        <ul class="ef-ledger">
          <li v-for="c in stats.cats" :key="c.name">
            <RouterLink :to="{ path: '/articles/', query: { cat: c.name } }">{{ c.name }}</RouterLink>
            <span class="ef-field">{{ c.count }} 篇</span>
          </li>
        </ul>
        <h2 class="ef-field margin-h">站点数据</h2>
        <ul class="ef-ledger">
          <li><span>首篇</span><span class="ef-field">{{ fmtDate(stats.first) }}</span></li>
          <li><span>最近</span><span class="ef-field">{{ fmtDate(stats.latest) }}</span></li>
          <li><span>篇数</span><span class="ef-field">{{ stats.count }} 篇</span></li>
          <li><span>字数</span><span class="ef-field">{{ fmtNum(stats.totalChars) }} 字</span></li>
        </ul>
      </div>
    </aside>
  </div>
</template>
