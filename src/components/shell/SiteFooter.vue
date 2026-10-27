<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { site, stats } from 'virtual:blog'
import { fmtDate } from '@/utils/format'
</script>

<template>
  <footer class="site-foot">
    <p class="ef-field">RHINE 笔记 · 更新于 {{ fmtDate(site.updated) }} · 共 {{ stats.count }} 篇</p>
    <p class="ef-field">
      Saira · SIL OFL 1.1 · 无统计脚本 ·
      <RouterLink class="secret-no" to="/colophon/" aria-label="隐藏档案 No.000">No.000</RouterLink>
    </p>
  </footer>
</template>
