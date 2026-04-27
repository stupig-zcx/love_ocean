<script setup>
import { computed, ref } from "vue";
import { provinceTiles, visitedProvinces } from "../data/chinaTravel";

defineProps({
  active: {
    type: Boolean,
    default: false,
  },
});

const TILE_W = 74;
const TILE_H = 48;
const TILE_GAP = 9;
const PAD_X = 26;
const PAD_Y = 20;

const hoveredCode = ref("");

const visitedSet = computed(() => new Set(visitedProvinces));
const visitedCount = computed(() => provinceTiles.filter((item) => visitedSet.value.has(item.code)).length);
const mapWidth = computed(() => {
  const maxX = Math.max(...provinceTiles.map((item) => item.x));
  return PAD_X * 2 + (maxX + 1) * (TILE_W + TILE_GAP);
});
const mapHeight = computed(() => {
  const maxY = Math.max(...provinceTiles.map((item) => item.y));
  return PAD_Y * 2 + (maxY + 1) * (TILE_H + TILE_GAP);
});

const hoveredProvince = computed(() => provinceTiles.find((item) => item.code === hoveredCode.value) || null);

const tileX = (item) => PAD_X + item.x * (TILE_W + TILE_GAP);
const tileY = (item) => PAD_Y + item.y * (TILE_H + TILE_GAP);
</script>

<template>
  <div class="travel-content">
    <header class="hero travel-header">
      <p class="hero-subtitle">OUR TRAVEL MAP</p>
      <h2>China travel map with highlighted provinces</h2>
      <h4>Maintain visited provinces in one data file</h4>
      <p class="travel-stats">Visited {{ visitedCount }} / {{ provinceTiles.length }} province-level regions</p>
    </header>

    <section class="travel-map-stage" aria-label="China travel map">
      <svg class="travel-map-svg" :viewBox="`0 0 ${mapWidth} ${mapHeight}`" role="img" aria-label="China provinces map">
        <g
          v-for="item in provinceTiles"
          :key="item.code"
          class="province-tile"
          :class="{ visited: visitedSet.has(item.code) }"
          :transform="`translate(${tileX(item)} ${tileY(item)})`"
          @mouseenter="hoveredCode = item.code"
          @mouseleave="hoveredCode = ''"
        >
          <rect :width="TILE_W" :height="TILE_H" rx="8" ry="8" />
          <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle">{{ item.short }}</text>
          <title>{{ item.name }}</title>
        </g>
      </svg>

      <p class="travel-hover">
        {{ hoveredProvince ? `Province: ${hoveredProvince.name}` : "Hover a province to preview name" }}
      </p>

      <div class="travel-legend">
        <span class="legend-chip visited"></span>
        <span>Visited</span>
        <span class="legend-chip"></span>
        <span>Not visited</span>
      </div>
    </section>

    <footer class="story-footer">To be continue...</footer>
  </div>
</template>

