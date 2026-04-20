<script setup>
defineProps({
  lanePath: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <svg class="path-svg" viewBox="0 0 100 1480" preserveAspectRatio="none" aria-hidden="true">
    <path class="trail-shadow" :d="lanePath" />
    <path class="trail-shoulder" :d="lanePath" />
    <path class="trail-base" :d="lanePath" />
    <path class="trail-track" :d="lanePath" />
    <path class="trail-grit" :d="lanePath" />
  </svg>
</template>
