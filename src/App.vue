<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import FishNode from "./components/FishNode.vue";
import IntroOverlay from "./components/IntroOverlay.vue";
import MouseSparkleLayer from "./components/MouseSparkleLayer.vue";
import StoryModal from "./components/StoryModal.vue";
import { useFishSchool } from "./composables/useFishSchool";
import { stories as storySeed } from "./data/stories";

const introVisible = ref(true);
const modalOpen = ref(false);
const activeStory = ref(null);
const stories = ref(storySeed);
const oceanStageRef = ref(null);

const { fishNodes } = useFishSchool(stories, oceanStageRef);

const fishStyle = (fish) => ({
  left: `${fish.x}px`,
  top: `${fish.y}px`,
  "--size": `${fish.size}px`,
  "--angle": `${fish.angle}rad`,
  "--tilt": `${fish.tilt}deg`,
});

const openStory = (story) => {
  activeStory.value = story;
  modalOpen.value = true;
  document.body.style.overflow = "hidden";
};

const closeStory = () => {
  modalOpen.value = false;
  document.body.style.overflow = "";
};

const onEsc = (event) => {
  if (event.key === "Escape" && modalOpen.value) {
    closeStory();
  }
};

onMounted(() => {
  setTimeout(() => {
    introVisible.value = false;
  }, 4800);
  window.addEventListener("keydown", onEsc);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onEsc);
  document.body.style.overflow = "";
});
</script>

<template>
  <div>
    <MouseSparkleLayer />
    <IntroOverlay :visible="introVisible" />

    <main class="story-world ocean-world" :class="{ ready: !introVisible }" aria-label="恋爱海洋故事">
      <header class="hero">
        <p class="hero-subtitle">OUR OCEAN LOVE STORY</p>
        <h2>在蓝色海洋里，遇见每一段心动回忆</h2>
      </header>

      <section ref="oceanStageRef" class="ocean-stage" aria-label="游动故事鱼群">
        <FishNode
          v-for="fish in fishNodes"
          :key="fish.index"
          :fish="fish"
          :style-object="fishStyle(fish)"
          @open="openStory"
        />
      </section>

      <footer class="story-footer">To be continue...</footer>
    </main>

    <StoryModal :open="modalOpen" :story="activeStory" @close="closeStory" />
  </div>
</template>
