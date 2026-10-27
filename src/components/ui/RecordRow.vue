<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { Post } from '@/types/blog'
import { fmtDate, fmtNum } from '@/utils/format'

const props = withDefaults(defineProps<{ post: Post; i?: number; cls?: string }>(), { i: 0, cls: '' })
</script>

<template>
  <RouterLink class="ef-record" :class="props.cls" :style="{ '--i': props.i }" :to="`/post/${props.post.no}/`">
    <span class="ef-tag">No.{{ props.post.no }}</span>
    <time class="ef-field" :datetime="props.post.date">{{ fmtDate(props.post.date) }}</time>
    <span class="name ef-read">{{ props.post.title }}</span>
    <span class="ef-field">{{ fmtNum(props.post.chars) }} 字</span>
  </RouterLink>
</template>
