<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import FishNode from "./components/FishNode.vue";
import IntroOverlay from "./components/IntroOverlay.vue";
import MouseSparkleLayer from "./components/MouseSparkleLayer.vue";
import StoryModal from "./components/StoryModal.vue";
import { useFishSchool } from "./composables/useFishSchool";
import { stories as storySeed } from "./data/stories";
import { starTimeline } from "./data/starTimeline";

const introVisible = ref(true);
const modalOpen = ref(false);
const activeStory = ref(null);
const stories = ref(storySeed);
const oceanStageRef = ref(null);
const sceneScrollRef = ref(null);
const starScrollRef = ref(null);
const oceanAudioRef = ref(null);
const skyAudioRef = ref(null);
const inSkyScene = ref(false);
const musicEnabled = ref(true);
const audioUnlocked = ref(false);

const audioModules = import.meta.glob("./audio/*.{mp3,wav,ogg,m4a,aac,flac}", {
  eager: true,
  import: "default",
});

const audioByName = Object.entries(audioModules).reduce((acc, [path, source]) => {
  const fileName = path.split("/").pop();
  acc[fileName] = source;
  return acc;
}, {});

const oceanMusicSrc =
  audioByName["ocean.mp3"] || audioByName["sea.mp3"] || audioByName["ocean.wav"] || "";
const skyMusicSrc =
  audioByName["sky.mp3"] || audioByName["stars.mp3"] || audioByName["sky.wav"] || "";
const hasMusic = computed(() => Boolean(oceanMusicSrc || skyMusicSrc));

const loveProfile = {
  chenBirthday: "03.16",
  yiBirthday: "09.21",
  togetherSince: "2024-02-14",
};

const togetherDays = computed(() => {
  const start = new Date(`${loveProfile.togetherSince}T00:00:00`);
  const startTime = start.getTime();
  if (Number.isNaN(startTime)) {
    return "--";
  }
  const elapsed = Date.now() - startTime;
  return Math.max(1, Math.floor(elapsed / 86400000) + 1);
});

const dragState = {
  active: false,
  moved: false,
  pointerId: null,
  startX: 0,
  startScrollLeft: 0,
  lastX: 0,
  lastTime: 0,
  velocity: 0,
  momentumId: null,
};

const { fishNodes } = useFishSchool(stories, oceanStageRef);

const starNodes = computed(() => {
  const zOffsets = [-42, 24, -16, 46, -30, 18, -12, 36, -24, 40];

  return starTimeline.map((node, index) => ({
    ...node,
    driftY: zOffsets[index % zOffsets.length],
    paperTilt: ((index * 9) % 10) - 5,
    pinSize: 24 + ((index * 7) % 10),
  }));
});

const fishStyle = (fish) => ({
  left: `${fish.x}px`,
  top: `${fish.y}px`,
  "--size": `${fish.size}px`,
  "--angle": `${fish.angle}rad`,
  "--tilt": `${fish.tilt}deg`,
});

const starStyle = (node, index) => ({
  "--drift-y": `${node.driftY}px`,
  "--paper-tilt": `${node.paperTilt}deg`,
  "--pin-size": `${node.pinSize}px`,
  "--entry-delay": `${index * 0.07}s`,
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

const onSceneScroll = () => {
  const scene = sceneScrollRef.value;
  if (!scene) {
    return;
  }
  inSkyScene.value = scene.scrollTop > window.innerHeight * 0.35;
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
  const oceanAudio = oceanAudioRef.value;
  const skyAudio = skyAudioRef.value;

  if (!hasMusic.value || !musicEnabled.value || !audioUnlocked.value) {
    pauseAudio(oceanAudio);
    pauseAudio(skyAudio);
    return;
  }

  if (inSkyScene.value) {
    pauseAudio(oceanAudio);
    await playAudioSafe(skyAudio);
  } else {
    pauseAudio(skyAudio);
    await playAudioSafe(oceanAudio);
  }
};

const toggleMusic = () => {
  if (!hasMusic.value) {
    return;
  }
  musicEnabled.value = !musicEnabled.value;
};

const stopMomentum = () => {
  if (dragState.momentumId) {
    window.cancelAnimationFrame(dragState.momentumId);
    dragState.momentumId = null;
  }
};

const startMomentum = () => {
  const container = starScrollRef.value;
  if (!container) {
    return;
  }

  stopMomentum();

  const tick = () => {
    if (Math.abs(dragState.velocity) < 0.05) {
      stopMomentum();
      return;
    }

    container.scrollLeft -= dragState.velocity * 16;
    dragState.velocity *= 0.93;
    dragState.momentumId = window.requestAnimationFrame(tick);
  };

  dragState.momentumId = window.requestAnimationFrame(tick);
};

const onStarPointerDown = (event) => {
  const container = starScrollRef.value;
  if (!container) {
    return;
  }
  event.preventDefault();

  dragState.active = true;
  dragState.moved = false;
  dragState.pointerId = event.pointerId;
  dragState.startX = event.clientX;
  dragState.startScrollLeft = container.scrollLeft;
  dragState.lastX = event.clientX;
  dragState.lastTime = performance.now();
  dragState.velocity = 0;

  stopMomentum();

  container.classList.add("dragging");
  container.setPointerCapture(event.pointerId);
};

const onStarPointerMove = (event) => {
  const container = starScrollRef.value;
  if (!container || !dragState.active || dragState.pointerId !== event.pointerId) {
    return;
  }

  const delta = event.clientX - dragState.startX;
  if (Math.abs(delta) > 3) {
    dragState.moved = true;
  }

  container.scrollLeft = dragState.startScrollLeft - delta;

  const now = performance.now();
  const dt = Math.max(1, now - dragState.lastTime);
  dragState.velocity = (event.clientX - dragState.lastX) / dt;
  dragState.lastX = event.clientX;
  dragState.lastTime = now;
};

const onStarPointerUp = (event) => {
  const container = starScrollRef.value;
  if (!container || dragState.pointerId !== event.pointerId) {
    return;
  }

  if (container.hasPointerCapture(event.pointerId)) {
    container.releasePointerCapture(event.pointerId);
  }
  dragState.active = false;
  dragState.pointerId = null;
  container.classList.remove("dragging");
  startMomentum();
};

const onStarPointerCancel = () => {
  const container = starScrollRef.value;
  if (!container) {
    return;
  }

  if (dragState.pointerId !== null && container.hasPointerCapture(dragState.pointerId)) {
    container.releasePointerCapture(dragState.pointerId);
  }
  dragState.active = false;
  dragState.pointerId = null;
  dragState.velocity = 0;
  container.classList.remove("dragging");
  stopMomentum();
};

const onStarClick = (event, node) => {
  if (dragState.moved) {
    event.preventDefault();
    return;
  }
  openStory(node);
};

const unlockAudio = () => {
  audioUnlocked.value = true;
  syncSceneMusic();
};

watch([inSkyScene, musicEnabled, audioUnlocked], () => {
  syncSceneMusic();
});

onMounted(() => {
  setTimeout(() => {
    introVisible.value = false;
  }, 4600);

  window.addEventListener("pointerdown", unlockAudio, { once: true });
  window.addEventListener("keydown", onEsc);
});

onBeforeUnmount(() => {
  window.removeEventListener("pointerdown", unlockAudio);
  window.removeEventListener("keydown", onEsc);
  document.body.style.overflow = "";
  pauseAudio(oceanAudioRef.value);
  pauseAudio(skyAudioRef.value);
  stopMomentum();
});
</script>

<template>
  <div>
    <MouseSparkleLayer :mode="inSkyScene ? 'star' : 'ocean'" />
    <IntroOverlay :visible="introVisible" />
    <audio ref="oceanAudioRef" :src="oceanMusicSrc || undefined" loop preload="auto"></audio>
    <audio ref="skyAudioRef" :src="skyMusicSrc || undefined" loop preload="auto"></audio>

    <button class="music-toggle" type="button" :disabled="!hasMusic" @click="toggleMusic">
      {{ !hasMusic ? "无音乐文件" : musicEnabled ? "音乐: 开" : "音乐: 关" }}
    </button>

    <div ref="sceneScrollRef" class="scene-scroll" :class="{ ready: !introVisible }" @scroll="onSceneScroll">
      <section class="scene-panel ocean-panel">
        <main class="story-world ocean-world" aria-label="恋爱海洋故事">
          <header class="hero">
            <p class="hero-subtitle">OUR OCEAN LOVE STORY</p>
            <h2>在蓝色海洋里，遇见每一段心动回忆</h2>
          </header>

          <section ref="oceanStageRef" class="ocean-stage" aria-label="游动故事鱼群">
            <FishNode
              v-for="fish in fishNodes"
              :key="`fish-${fish.index}`"
              :fish="fish"
              :style-object="fishStyle(fish)"
              @open="openStory"
            />
          </section>
        </main>
      </section>

      <section class="scene-panel sky-panel" aria-label="星空时间线">
        <header class="sky-header">
          <p class="hero-subtitle sky-subtitle">OUR STAR MAP</p>
          <h2>左右拖动星空，查看每个时间节点</h2>
          <p class="love-meta">
            小晨生日 {{ loveProfile.chenBirthday }} · 小逸生日 {{ loveProfile.yiBirthday }} · 在一起
            {{ loveProfile.togetherSince }} · 第 {{ togetherDays }} 天
          </p>
        </header>

        <div
          ref="starScrollRef"
          class="star-scroll"
          aria-label="星空时间节点横向轴"
          @pointerdown="onStarPointerDown"
          @pointermove="onStarPointerMove"
          @pointerup="onStarPointerUp"
          @pointercancel="onStarPointerCancel"
        >
          <button
            v-for="(node, index) in starNodes"
            :key="`star-${index}`"
            class="star-node"
            :style="starStyle(node, index)"
            @click="onStarClick($event, node)"
          >
            <span class="star-pin" aria-hidden="true"></span>
            <span class="star-thread" aria-hidden="true"></span>
            <span class="note-paper">
              <span class="note-date">{{ node.date }}</span>
              <span class="note-title">{{ node.title }}</span>
              <span class="note-metric">{{ node.metric }}</span>
            </span>
          </button>
        </div>

        <footer class="story-footer sky-footer">To be continue...</footer>
      </section>
    </div>

    <StoryModal :open="modalOpen" :story="activeStory" @close="closeStory" />
  </div>
</template>
