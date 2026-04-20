<script setup>
const props = defineProps({
  story: {
    type: Object,
    required: true,
  },
  styleObject: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["open"]);

const onClick = () => {
  emit("open", props.story);
};
</script>

<template>
  <button class="flower-node" :class="story.side" :style="styleObject" @click="onClick">
    <span class="flower" aria-hidden="true"></span>
    <span class="node-label">{{ story.title }}</span>
  </button>
</template>
