<script setup lang="ts">
import { computed } from 'vue'
import { postsByTag } from '@/lib/posts'
import PostRow from '@/components/PostRow.vue'

const props = defineProps<{ tag: string }>()

const list = computed(() => postsByTag(props.tag))
</script>

<template>
  <div class="wrap">
    <section class="head">
      <div class="term">
        <div class="term-bar">
          <span class="term-dots"><i /><i /><i /></span>
          <span>~/agents/tags/{{ tag }}</span>
          <span class="spacer" />
          <span>{{ list.length }} 篇</span>
        </div>
        <div class="term-body">
          <div class="cmd">
            <span class="p">~/agents</span> $ <b>grep -rl "#{{ tag }}" ./posts</b>
          </div>
          <h1>#{{ tag }}</h1>
        </div>
      </div>
    </section>

    <section class="sec">
      <div v-if="list.length" class="log">
        <PostRow v-for="p in list" :key="p.slug" :post="p" />
      </div>

      <div v-else class="empty glass">
        <p>没有带这个标签的记录。</p>
        <RouterLink class="btn" to="/tags">看全部标签</RouterLink>
      </div>

      <div class="back">
        <RouterLink to="/tags" class="btn">← 全部标签</RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.head {
  padding: 46px 0 0;
}

.spacer {
  margin-left: auto;
}

h1 {
  font-size: clamp(24px, 4vw, 34px);
  letter-spacing: -1px;
  margin: 6px 0 0;
  background: linear-gradient(100deg, #c4b5fd, #67e8f9);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.sec {
  padding: 36px 0 0;
}

.empty {
  padding: 46px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}
.empty p {
  margin: 0;
  color: var(--ink-3);
}

.back {
  margin-top: 28px;
}
</style>
