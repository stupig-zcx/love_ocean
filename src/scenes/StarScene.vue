<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { starTimeline } from "../data/starTimeline";

defineProps({
  active: {
    type: Boolean,
    default: false,
  },
});

const starScrollRef = ref(null);
const viewportWidth = ref(typeof window !== "undefined" ? window.innerWidth : 1280);
let resizeRafId = 0;

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
  pressedNodeKey: "",
  startX: 0,
  startScrollLeft: 0,
  lastX: 0,
  lastTime: 0,
  velocity: 0,
  momentumId: null,
};

const flippedStars = reactive({});

const starNodeWidth = computed(() => (viewportWidth.value <= 768 ? 150 : 180));
const starNodeGap = computed(() => (viewportWidth.value <= 768 ? 28 : 58));

const starNodes = computed(() => {
  const zOffsets = [-42, 24, -16, 46, -30, 18, -12, 36, -24, 40];
  const spacing = starNodeWidth.value + starNodeGap.value;
  const timeline = starTimeline.some((node) => node.isEnding)
    ? starTimeline
    : [
        ...starTimeline,
        {
          id: "star-ending",
          date: "",
          title: "To be continue...",
          text: "To be continue...",
          isEnding: true,
        },
      ];

  const nodes = timeline.map((node, index) => ({
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

const starStyle = (node, index) => ({
  "--drift-y": `${node.driftY}px`,
  "--paper-tilt": `${node.paperTilt}deg`,
  "--pin-size": `${node.pinSize}px`,
  "--link-length": `${node.linkLength}px`,
  "--link-angle": `${node.linkAngle}deg`,
  "--entry-delay": `${index * 0.07}s`,
});

const isStarFlipped = (nodeKey) => Boolean(flippedStars[nodeKey]);

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

const onPointerDown = (event) => {
  const container = starScrollRef.value;
  if (!container) {
    return;
  }
  event.preventDefault();

  const hitCard = event.target.closest?.(".star-node");

  dragState.active = true;
  dragState.moved = false;
  dragState.pointerId = event.pointerId;
  dragState.pressedNodeKey = hitCard?.dataset.nodeKey || "";
  dragState.startX = event.clientX;
  dragState.startScrollLeft = container.scrollLeft;
  dragState.lastX = event.clientX;
  dragState.lastTime = performance.now();
  dragState.velocity = 0;

  stopMomentum();
  container.classList.add("dragging");
  container.setPointerCapture(event.pointerId);
};

const onPointerMove = (event) => {
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

const onPointerUp = (event) => {
  const container = starScrollRef.value;
  if (!container || dragState.pointerId !== event.pointerId) {
    return;
  }

  if (container.hasPointerCapture(event.pointerId)) {
    container.releasePointerCapture(event.pointerId);
  }
  container.classList.remove("dragging");

  if (!dragState.moved && dragState.pressedNodeKey) {
    const key = dragState.pressedNodeKey;
    flippedStars[key] = !flippedStars[key];
    dragState.velocity = 0;
    stopMomentum();
  } else {
    startMomentum();
  }

  dragState.active = false;
  dragState.pointerId = null;
  dragState.pressedNodeKey = "";
  dragState.moved = false;
};

const onPointerCancel = () => {
  const container = starScrollRef.value;
  if (!container) {
    return;
  }

  if (dragState.pointerId !== null && container.hasPointerCapture(dragState.pointerId)) {
    container.releasePointerCapture(dragState.pointerId);
  }
  dragState.active = false;
  dragState.moved = false;
  dragState.pointerId = null;
  dragState.pressedNodeKey = "";
  dragState.velocity = 0;
  container.classList.remove("dragging");
  stopMomentum();
};

const onWindowResize = () => {
  if (resizeRafId) {
    return;
  }
  resizeRafId = window.requestAnimationFrame(() => {
    viewportWidth.value = window.innerWidth;
    resizeRafId = 0;
  });
};

onMounted(() => {
  window.addEventListener("resize", onWindowResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onWindowResize);
  if (resizeRafId) {
    window.cancelAnimationFrame(resizeRafId);
  }
  stopMomentum();
});
</script>

<template>
  <div>
    <header class="sky-header">
      <p class="hero-subtitle sky-subtitle">OUR STAR MAP</p>
      <h2>A timeline made of stars</h2>
      <h4>Drag horizontally to browse moments</h4>
      <p class="love-meta">
        Chen {{ loveProfile.chenBirthday }} | Yi {{ loveProfile.yiBirthday }} | Together since
        {{ loveProfile.togetherSince }} | Lasts for {{ togetherDays }} days
      </p>
    </header>

    <div
      ref="starScrollRef"
      class="star-scroll"
      aria-label="Horizontal star timeline"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerCancel"
    >
      <div
        v-for="(node, index) in starNodes"
        :key="node.nodeKey"
        class="star-node"
        :class="{ 'is-flipped': isStarFlipped(node.nodeKey), 'is-ending': node.isEnding }"
        :data-node-key="node.nodeKey"
        :style="starStyle(node, index)"
      >
        <span class="star-pin" aria-hidden="true"></span>
        <span class="star-thread" aria-hidden="true"></span>
        <span class="note-paper">
          <span class="note-inner">
            <span class="note-face note-front">
              <template v-if="node.isEnding">
                <span class="ending-note-text">{{ node.title }}</span>
              </template>
              <template v-else>
                <span class="note-title">{{ node.title }}</span>
                <span class="note-date">{{ node.date }}</span>
              </template>
            </span>
            <span class="note-face note-back">
              <span :class="node.isEnding ? 'ending-note-text' : 'note-text'">{{ node.text }}</span>
            </span>
          </span>
        </span>
      </div>
    </div>
  </div>
</template>

