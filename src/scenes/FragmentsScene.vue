<script setup>
import { computed } from "vue";
import { fragments } from "../data/fragments";

defineProps({
  active: {
    type: Boolean,
    default: false,
  },
});

const cards = computed(() =>
  fragments.map((item, index) => ({
    ...item,
    tilt: ((index % 5) - 2) * 2.2,
    drift: ((index * 11) % 16) - 8,
  }))
);
</script>

<template>
  <div class="fragments-content">
    <header class="hero fragments-header">
      <p class="hero-subtitle">OUR DAILY FRAGMENTS</p>
      <h2>Tiny moments, carefully saved</h2>
      <h4>Each note stores one ordinary but precious memory</h4>
    </header>

    <section class="fragments-stage" aria-label="Daily fragments wall">
      <article
        v-for="item in cards"
        :key="item.id"
        class="fragment-card"
        :style="{ '--tilt': `${item.tilt}deg`, '--drift': `${item.drift}px` }"
      >
        <p class="fragment-date">{{ item.date }}</p>
        <h3>{{ item.title }}</h3>
        <p class="fragment-text">{{ item.text }}</p>
      </article>
    </section>
  </div>
</template>

