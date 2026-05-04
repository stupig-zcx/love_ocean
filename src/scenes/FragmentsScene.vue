<script setup>
import { computed, onBeforeUnmount, ref } from "vue";
import { futureFilmReels } from "../data/futureFilmReels";
import { pastFilmReels } from "../data/pastFilmReels";

defineProps({
  active: {
    type: Boolean,
    default: false,
  },
});

const pastReelRef = ref(null);
const futureReelRef = ref(null);

const localImageModules = import.meta.glob("../images/*.{png,jpg,jpeg,webp,avif,gif}", {
  eager: true,
  import: "default",
});

const imagesByName = Object.entries(localImageModules).reduce((acc, [path, url]) => {
  const fileName = path.split("/").pop();
  acc[fileName] = url;
  return acc;
}, {});

const fallbackImage = imagesByName["story-01.jpg"] || Object.values(imagesByName)[0] || "";

const pastReels = computed(() =>
  pastFilmReels.map((item) => ({
    type: "past",
    id: `past-${item.id}`,
    title: item.title,
    date: item.date,
    text: item.descText,
    longText: item.memoryText,
    image: imagesByName[item.localFile] || fallbackImage,
  }))
);

const futureReels = computed(() =>
  futureFilmReels.map((item) => ({
    type: "future",
    id: `future-${item.id}`,
    title: item.title,
    date: item.targetDate,
    text: item.wishText,
    longText: item.sceneNote,
  }))
);

const hoveredPastId = ref("");

const hoveredPastCopy = computed(() => {
  const reel = pastReels.value.find((item) => item.id === hoveredPastId.value);
  if (!reel) {
    return "";
  }
  return `${reel.title} - ${reel.date} - ${reel.longText}`;
});

const hoveredPastLines = computed(() => {
  const reel = pastReels.value.find((item) => item.id === hoveredPastId.value);
  if (!reel) {
    return ["把鼠标停在一格胶卷上", "字幕会像老电影一样一行行浮现"];
  }
  return [reel.title, reel.date, reel.longText];
});

const hoveredPastCharacters = computed(() =>
  hoveredPastLines.value.map((line) => Array.from(line))
);

const createDragState = () => ({
  active: false,
  pointerId: null,
  startX: 0,
  startScrollLeft: 0,
  lastX: 0,
  lastTime: 0,
  velocity: 0,
  momentumId: null,
});

const dragStates = {
  past: createDragState(),
  future: createDragState(),
};

const reelRefs = {
  past: pastReelRef,
  future: futureReelRef,
};

const stopMomentum = (type) => {
  const state = dragStates[type];
  if (state?.momentumId) {
    window.cancelAnimationFrame(state.momentumId);
    state.momentumId = null;
  }
};

const startMomentum = (type) => {
  const state = dragStates[type];
  const container = reelRefs[type]?.value;
  if (!state || !container) {
    return;
  }
  stopMomentum(type);

  const tick = () => {
    if (Math.abs(state.velocity) < 0.05) {
      stopMomentum(type);
      return;
    }
    container.scrollLeft -= state.velocity * 16;
    state.velocity *= 0.93;
    state.momentumId = window.requestAnimationFrame(tick);
  };

  state.momentumId = window.requestAnimationFrame(tick);
};

const onReelPointerDown = (event, type) => {
  const state = dragStates[type];
  const container = reelRefs[type]?.value;
  if (!state || !container) {
    return;
  }
  event.preventDefault();

  state.active = true;
  state.pointerId = event.pointerId;
  state.startX = event.clientX;
  state.startScrollLeft = container.scrollLeft;
  state.lastX = event.clientX;
  state.lastTime = performance.now();
  state.velocity = 0;

  stopMomentum(type);
  container.classList.add("dragging");
  container.setPointerCapture(event.pointerId);
};

const onReelPointerMove = (event, type) => {
  const state = dragStates[type];
  const container = reelRefs[type]?.value;
  if (!state || !container || !state.active || state.pointerId !== event.pointerId) {
    return;
  }

  const delta = event.clientX - state.startX;
  container.scrollLeft = state.startScrollLeft - delta;

  const now = performance.now();
  const dt = Math.max(1, now - state.lastTime);
  state.velocity = (event.clientX - state.lastX) / dt;
  state.lastX = event.clientX;
  state.lastTime = now;
};

const onReelPointerUp = (event, type) => {
  const state = dragStates[type];
  const container = reelRefs[type]?.value;
  if (!state || !container || state.pointerId !== event.pointerId) {
    return;
  }

  if (container.hasPointerCapture(event.pointerId)) {
    container.releasePointerCapture(event.pointerId);
  }
  state.active = false;
  state.pointerId = null;
  container.classList.remove("dragging");
  startMomentum(type);
};

const onReelPointerCancel = (type) => {
  const state = dragStates[type];
  const container = reelRefs[type]?.value;
  if (!state || !container) {
    return;
  }
  if (state.pointerId !== null && container.hasPointerCapture(state.pointerId)) {
    container.releasePointerCapture(state.pointerId);
  }
  state.active = false;
  state.pointerId = null;
  state.velocity = 0;
  container.classList.remove("dragging");
  stopMomentum(type);
};

const onPastHover = (reelId) => {
  hoveredPastId.value = reelId;
};

const clearPastHover = () => {
  hoveredPastId.value = "";
};

onBeforeUnmount(() => {
  stopMomentum("past");
  stopMomentum("future");
});
</script>

<template>
  <div class="fragments-content">
    <section class="film-strip-layout" aria-label="Film reel room">
      <div class="film-strip-scroll" @mouseleave="clearPastHover">
        <div class="film-world">
          <div class="film-orbit film-orbit--left"></div>
          <div class="film-orbit film-orbit--right"></div>

          <section class="film-zone film-zone--past" aria-label="Captured daily memories">
            <p class="film-kicker">PAST FRAMES</p>
            <h2>日常点滴</h2>
            <p class="film-zone-desc">每一个平凡瞬间，都是生活的热爱。</p>

            <div class="film-reel-window film-reel-window--past">
              <div
                ref="pastReelRef"
                class="film-reel film-reel--past"
                @pointerdown="onReelPointerDown($event, 'past')"
                @pointermove="onReelPointerMove($event, 'past')"
                @pointerup="onReelPointerUp($event, 'past')"
                @pointercancel="onReelPointerCancel('past')"
              >
                <div class="film-reel-track">
                  <article
                    v-for="reel in pastReels"
                    :key="reel.id"
                    class="reel-card reel-card--past"
                    tabindex="0"
                    @mouseenter="onPastHover(reel.id)"
                    @focusin="onPastHover(reel.id)"
                    @mouseleave="clearPastHover"
                    @blur="clearPastHover"
                  >
                    <div class="reel-photo">
                      <img :src="reel.image" :alt="reel.title" />
                    </div>
                  </article>
                </div>
              </div>
            </div>

            <div class="film-hover-letter" :class="{ show: Boolean(hoveredPastCopy) }" aria-live="polite">
              <span v-for="(line, lineIndex) in hoveredPastCharacters" :key="`${hoveredPastId || 'empty'}-${lineIndex}`" class="film-hover-line">
                <span
                  v-for="(char, charIndex) in line"
                  :key="`${lineIndex}-${charIndex}`"
                  class="film-hover-char"
                  :style="{ '--char-index': charIndex, '--line-index': lineIndex }"
                >
                  {{ char === " " ? "\u00a0" : char }}
                </span>
              </span>
            </div>
          </section>

          <section class="film-zone film-zone--future" aria-label="Future wishes">
            <p class="film-kicker">UNSHOT REELS</p>
            <h2>未来祈愿</h2>
            <p class="film-zone-desc">向着光的方向，遇见更好的我们。</p>

            <div class="film-reel-window film-reel-window--future">
              <div
                ref="futureReelRef"
                class="film-reel film-reel--future"
                @pointerdown="onReelPointerDown($event, 'future')"
                @pointermove="onReelPointerMove($event, 'future')"
                @pointerup="onReelPointerUp($event, 'future')"
                @pointercancel="onReelPointerCancel('future')"
              >
                <div class="film-reel-track">
                  <article v-for="reel in futureReels" :key="reel.id" class="reel-card reel-card--future">
                    <div class="reel-sealed-badge">UNEXPOSED</div>
                    <div class="reel-copy reel-copy--future">
                      <p class="reel-date">{{ reel.date }}</p>
                      <h3>{{ reel.title }}</h3>
                      <p class="reel-text">{{ reel.text }}</p>
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  </div>
</template>
