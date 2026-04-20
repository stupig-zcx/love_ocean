<script setup>
defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  story: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["close"]);

const close = () => emit("close");
</script>

<template>
  <aside class="story-modal" :class="{ open }" :aria-hidden="!open" role="dialog" aria-modal="true">
    <div class="modal-mask" @click="close"></div>
    <article class="modal-card" v-if="story">
      <button class="modal-close" aria-label="关闭内容卡片" @click="close">×</button>
      <img :src="story.image" :alt="story.title + ' 配图'" />
      <div class="modal-content">
        <h3>{{ story.title }}</h3>
        <p>{{ story.text }}</p>
      </div>
    </article>
  </aside>
</template>
