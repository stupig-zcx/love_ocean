<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import IntroOverlay from "./components/IntroOverlay.vue";
import MouseSparkleLayer from "./components/MouseSparkleLayer.vue";
import StoryModal from "./components/StoryModal.vue";
import { sceneRegistry } from "./config/sceneRegistry";

// Global app state
const introVisible = ref(true);
const modalOpen = ref(false);
const activeStory = ref(null);
const sceneScrollRef = ref(null);
const backgroundAudioRef = ref(null);
const activeSceneIndex = ref(0);
const musicEnabled = ref(true);
const audioUnlocked = ref(false);

// Scene registry (enabled decides whether to render in frontend)
const enabledScenes = computed(() => sceneRegistry.filter((scene) => scene.enabled));
const activeScene = computed(() => enabledScenes.value[activeSceneIndex.value] || enabledScenes.value[0] || null);
const activeSparkleMode = computed(() => activeScene.value?.sparkleMode || "soft");

// Resolve local audio files once at startup.
const audioModules = import.meta.glob("./audio/*.{mp3,wav,ogg,m4a,aac,flac}", {
  eager: true,
  import: "default",
});

const audioByName = Object.entries(audioModules).reduce((acc, [path, source]) => {
  const fileName = path.split("/").pop();
  acc[fileName] = source;
  return acc;
}, {});

const pickAudioSource = (...fileNames) => fileNames.map((name) => audioByName[name]).find(Boolean) || "";

const musicByKey = {
  ocean: pickAudioSource("ocean.mp3", "sea.mp3", "ocean.wav"),
  sky: pickAudioSource("sky.mp3", "stars.mp3", "sky.wav"),
  fragments: pickAudioSource("fragments.mp3", "memory.mp3", "fragments.wav"),
  travel: pickAudioSource("map.mp3", "travel.mp3", "travel.wav"),
};

const musicVolumeByKey = {
  ocean: 0.72,
  sky: 0.58,
  fragments: 0.54,
  travel: 0.62,
};

const hasMusic = computed(() => Object.values(musicByKey).some(Boolean));
const currentMusicSrc = computed(() => (activeScene.value ? musicByKey[activeScene.value.musicKey] || "" : ""));

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

// Scene activation follows the nearest full-screen panel.
const syncActiveScene = () => {
  const container = sceneScrollRef.value;
  if (!container) {
    return;
  }

  const sceneCount = enabledScenes.value.length;
  if (!sceneCount) {
    activeSceneIndex.value = 0;
    return;
  }

  const nextIndex = Math.round(container.scrollTop / window.innerHeight);
  const normalizedIndex = Math.min(sceneCount - 1, Math.max(0, nextIndex));

  if (normalizedIndex !== activeSceneIndex.value) {
    activeSceneIndex.value = normalizedIndex;
  }
};

const pauseAudio = (audio) => {
  if (audio) {
    audio.pause();
  }
};

const playAudioSafe = async (audio) => {
  if (!audio || !audio.src) {
    return;
  }
  try {
    await audio.play();
  } catch {
    // Autoplay may be blocked before user gesture.
  }
};

const syncSceneMusic = async () => {
  const audio = backgroundAudioRef.value;
  if (!audio) {
    return;
  }

  if (!hasMusic.value || !musicEnabled.value || !audioUnlocked.value || !currentMusicSrc.value) {
    pauseAudio(audio);
    return;
  }

  if (audio.dataset.currentSrc !== currentMusicSrc.value) {
    audio.src = currentMusicSrc.value;
    audio.dataset.currentSrc = currentMusicSrc.value;
    audio.currentTime = 0;
  }

  const key = activeScene.value?.musicKey || "";
  audio.volume = musicVolumeByKey[key] ?? 0.62;

  await playAudioSafe(audio);
};

const toggleMusic = () => {
  if (!hasMusic.value) {
    return;
  }
  musicEnabled.value = !musicEnabled.value;
};

const unlockAudio = () => {
  audioUnlocked.value = true;
  syncSceneMusic();
};

watch([activeSceneIndex, musicEnabled, audioUnlocked, currentMusicSrc], () => {
  syncSceneMusic();
});

watch(enabledScenes, (list) => {
  if (!list.length) {
    activeSceneIndex.value = 0;
    return;
  }
  if (activeSceneIndex.value > list.length - 1) {
    activeSceneIndex.value = list.length - 1;
  }
});

onMounted(() => {
  setTimeout(() => {
    introVisible.value = false;
  }, 4600);

  window.addEventListener("pointerdown", unlockAudio, { once: true });
  window.addEventListener("keydown", onEsc);
  window.addEventListener("resize", syncActiveScene);
  window.requestAnimationFrame(syncActiveScene);
});

onBeforeUnmount(() => {
  window.removeEventListener("pointerdown", unlockAudio);
  window.removeEventListener("keydown", onEsc);
  window.removeEventListener("resize", syncActiveScene);
  document.body.style.overflow = "";
  pauseAudio(backgroundAudioRef.value);
});
</script>

<template>
  <div>
    <!-- Global visual layers -->
    <MouseSparkleLayer :mode="activeSparkleMode" />
    <IntroOverlay :visible="introVisible" />

    <!-- Scene background music player -->
    <audio ref="backgroundAudioRef" loop preload="auto"></audio>

    <!-- Manual music switch -->
    <button class="music-toggle" type="button" :disabled="!hasMusic" @click="toggleMusic">
      {{ !hasMusic ? "Music: N/A" : musicEnabled ? "Music: On" : "Music: Off" }}
    </button>

    <!-- Scenes container -->
    <div ref="sceneScrollRef" class="scene-scroll" :class="{ ready: !introVisible }" @scroll.passive="syncActiveScene">
      <section
        v-for="(scene, index) in enabledScenes"
        :key="scene.id"
        class="scene-panel"
        :class="scene.panelClass"
        :aria-label="scene.ariaLabel"
      >
        <component :is="scene.component" :active="index === activeSceneIndex" @open-story="openStory" />
      </section>
    </div>

    <!-- Full-screen story modal (used by Scene 1 currently) -->
    <StoryModal :open="modalOpen" :story="activeStory" @close="closeStory" />
  </div>
</template>
