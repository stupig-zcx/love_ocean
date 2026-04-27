<script setup>
import { ref } from "vue";
import FishNode from "../components/FishNode.vue";
import { useFishSchool } from "../composables/useFishSchool";
import { stories } from "../data/stories";

defineProps({
  active: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["open-story"]);

const oceanStageRef = ref(null);
const storyList = ref(stories);
const { fishNodes } = useFishSchool(storyList, oceanStageRef);

const fishStyle = (fish) => ({
  left: `${fish.x}px`,
  top: `${fish.y}px`,
  "--size": `${fish.size}px`,
  "--angle": `${fish.angle}rad`,
  "--tilt": `${fish.tilt}deg`,
});

const openStory = (story) => {
  emit("open-story", story);
};
</script>

<template>
  <main class="story-world ocean-world" aria-label="Ocean memory scene">
    <header class="hero">
      <p class="hero-subtitle">OUR OCEAN LOVE STORY</p>
      <h2>Memories floating in the blue ocean</h2>
      <h4>Catch a fish to open a memory card</h4>
    </header>

    <section ref="oceanStageRef" class="ocean-stage" aria-label="Swimming story fish">
      <FishNode
        v-for="fish in fishNodes"
        :key="`fish-${fish.index}`"
        :fish="fish"
        :style-object="fishStyle(fish)"
        @open="openStory"
      />
    </section>
  </main>
</template>

