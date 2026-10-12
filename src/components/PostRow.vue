<script setup lang="ts">
import type { Post } from '@/lib/posts'

defineProps<{
  post: Post
}>()
</script>

<template>
  <RouterLink :to="`/posts/${post.slug}`" class="row">
    <span class="row-date">{{ post.date }}</span>
    <span class="row-tag">
      <span :class="['cat', `cat-${post.category}`]">{{ post.categoryLabel }}</span>
    </span>
    <span class="row-title">
      <i :class="['dot', { 'dot-wip': post.status === 'wip' }]" />
      <span class="txt">{{ post.title }}</span>
    </span>
    <span class="row-meta">
      <template v-if="post.stack.length">{{ post.stack[0] }} · </template>
      {{ post.readingTime }} min
    </span>
  </RouterLink>
</template>
