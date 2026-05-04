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
  <main class="story-world ocean-world" aria-label="海洋记忆场景">
    <header class="hero">
      <h2>漂浮在蓝色海洋里的回忆合照</h2>
      <h4>点击小鱼，每一张小鱼都承载了一张专属合照</h4>
    </header>

    <section ref="oceanStageRef" class="ocean-stage" aria-label="游动的故事小鱼">
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
