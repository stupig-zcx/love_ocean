<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import FishNode from "./components/FishNode.vue";
import IntroOverlay from "./components/IntroOverlay.vue";
import MouseSparkleLayer from "./components/MouseSparkleLayer.vue";
import StoryModal from "./components/StoryModal.vue";
import { useFishSchool } from "./composables/useFishSchool";
import { stories as storySeed } from "./data/stories";
import { starTimeline } from "./data/starTimeline";

// Global UI state
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
const viewportWidth = ref(typeof window !== "undefined" ? window.innerWidth : 1280);

// Resolve scene music files from local audio folder
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

// Header profile metadata
const loveProfile = {
  chenBirthday: "05.02",
  yiBirthday: "03.23",
  togetherSince: "2026-04-06",
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
// Each star card keeps its own front/back flip state.
const flippedStars = reactive({});
let resizeRafId = 0;

const { fishNodes } = useFishSchool(stories, oceanStageRef);
const starNodeWidth = computed(() => (viewportWidth.value <= 768 ? 150 : 180));
const starNodeGap = computed(() => (viewportWidth.value <= 768 ? 28 : 58));

const starNodes = computed(() => {
  // Create a z-like vertical rhythm for the horizontal timeline.
  const zOffsets = [-42, 24, -16, 46, -30, 18, -12, 36, -24, 40];
  const spacing = starNodeWidth.value + starNodeGap.value;

  const nodes = starTimeline.map((node, index) => ({
    ...node,
    nodeKey: node.id || `${node.date}-${node.title}`,
    driftY: zOffsets[index % zOffsets.length],
    paperTilt: ((index * 9) % 10) - 5,
    pinSize: 24 + ((index * 7) % 10),
  }));

  return nodes.map((node, index) => {
    const nextNode = nodes[index + 1];
    if (!nextNode) {
      return {
        ...node,
        linkAngle: 0,
        linkLength: 0,
      };
    }

    const currentY = node.driftY + 18 + node.pinSize * 0.5;
    const nextY = nextNode.driftY + 18 + nextNode.pinSize * 0.5;
    const deltaY = nextY - currentY;

    return {
      ...node,
      linkLength: Math.hypot(spacing, deltaY),
      linkAngle: (Math.atan2(deltaY, spacing) * 180) / Math.PI,
    };
  });
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
  "--link-length": `${node.linkLength}px`,
  "--link-angle": `${node.linkAngle}deg`,
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
  const nextInSkyScene = scene.scrollTop > window.innerHeight * 0.35;
  if (nextInSkyScene !== inSkyScene.value) {
    inSkyScene.value = nextInSkyScene;
  }
};

const pauseAudio = (audio) => {
  if (audio) {
    audio.pause();
  }
};

// Audio playback helper for scene-based background music.
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

// Inertial horizontal dragging for Scene 2 timeline.
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
  flippedStars[node.nodeKey] = !flippedStars[node.nodeKey];
};

const isStarFlipped = (nodeKey) => Boolean(flippedStars[nodeKey]);

// Browser gesture unlock for autoplay-restricted audio.
const unlockAudio = () => {
  audioUnlocked.value = true;
  syncSceneMusic();
};

const onWindowResize = () => {
  // Throttle resize updates to animation frames to avoid reactive churn.
  if (resizeRafId) {
    return;
  }
  resizeRafId = window.requestAnimationFrame(() => {
    viewportWidth.value = window.innerWidth;
    resizeRafId = 0;
  });
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
  window.addEventListener("resize", onWindowResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("pointerdown", unlockAudio);
  window.removeEventListener("keydown", onEsc);
  window.removeEventListener("resize", onWindowResize);
  document.body.style.overflow = "";
  pauseAudio(oceanAudioRef.value);
  pauseAudio(skyAudioRef.value);
  if (resizeRafId) {
    window.cancelAnimationFrame(resizeRafId);
  }
  stopMomentum();
});
</script>

<template>
  <div>
    <!-- Global visual layers -->
    <MouseSparkleLayer :mode="inSkyScene ? 'star' : 'ocean'" />
    <IntroOverlay :visible="introVisible" />

    <!-- Scene background music players -->
    <audio ref="oceanAudioRef" :src="oceanMusicSrc || undefined" loop preload="auto"></audio>
    <audio ref="skyAudioRef" :src="skyMusicSrc || undefined" loop preload="auto"></audio>

    <!-- Manual music switch -->
    <button class="music-toggle" type="button" :disabled="!hasMusic" @click="toggleMusic">
      {{ !hasMusic ? "无音乐文件" : musicEnabled ? "音乐: 开" : "音乐: 关" }}
    </button>

    <!-- Scene 1 + Scene 2 container -->
    <div ref="sceneScrollRef" class="scene-scroll" :class="{ ready: !introVisible }" @scroll.passive="onSceneScroll">
      <!-- Scene 1: ocean fish memories -->
      <section class="scene-panel ocean-panel">
        <main class="story-world ocean-world" aria-label="恋爱海洋故事">
          <header class="hero">
            <p class="hero-subtitle">OUR OCEAN LOVE STORY</p>
            <h2>在蓝色海洋里，遇见每一段心动回忆</h2>
            <h4>点击抓捕小鱼，查看珍贵回忆瞬间</h4>
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

      <!-- Scene 2: horizontal star timeline -->
      <section class="scene-panel sky-panel" aria-label="星空时间线">
        <header class="sky-header">
          <p class="hero-subtitle sky-subtitle">OUR STAR MAP</p>
          <h2>在广袤星空中，查看独属于我们的时间线</h2>
          <h4>左右拖动星空查看时间节点</h4>
          <p class="love-meta">
            Chen {{ loveProfile.chenBirthday }} · Yi {{ loveProfile.yiBirthday }} · Together since {{ loveProfile.togetherSince }} ·  lasts for {{ togetherDays }} days
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
            :key="node.nodeKey"
            class="star-node"
            :class="{ 'is-flipped': isStarFlipped(node.nodeKey) }"
            :style="starStyle(node, index)"
            :aria-pressed="isStarFlipped(node.nodeKey)"
            @click="onStarClick($event, node)"
          >
            <span class="star-pin" aria-hidden="true"></span>
            <span class="star-thread" aria-hidden="true"></span>
            <span class="note-paper">
              <span class="note-inner">
                <span class="note-face note-front">
                  <span class="note-title">{{ node.title }}</span>
                  <span class="note-date">{{ node.date }}</span>
                </span>
                <span class="note-face note-back">
                  <span class="note-text">{{ node.text }}</span>
                </span>
              </span>
            </span>
          </button>
        </div>

        <footer class="story-footer sky-footer">To be continue...</footer>
      </section>
    </div>

    <!-- Full-screen story modal (used by scene 1 fish nodes) -->
    <StoryModal :open="modalOpen" :story="activeStory" @close="closeStory" />
  </div>
</template>
