<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

// Scene-aware background canvas: ocean bubbles, star particles, and soft ambience.
const props = defineProps({
  mode: {
    type: String,
    default: "ocean",
  },
});

const canvasRef = ref(null);

let ctx;
let animationId;
const ambience = [];
const trail = [];
const mouse = { x: 0, y: 0, active: false };
let lastOceanTrailAt = 0;
const MAX_TRAIL_ITEMS = 260;

const random = (min, max) => min + Math.random() * (max - min);

const resize = () => {
  const canvas = canvasRef.value;
  if (!canvas) {
    return;
  }

  // Cap DPR to reduce canvas overdraw cost on high-density screens.
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  rebuildAmbience();
};

const rebuildAmbience = () => {
  ambience.length = 0;
  const width = window.innerWidth;
  const height = window.innerHeight;

  if (props.mode === "ocean") {
    for (let i = 0; i < 42; i += 1) {
      ambience.push({
        x: random(0, width),
        y: random(0, height),
        r: random(1.2, 4.8),
        driftX: random(-0.18, 0.18),
        driftY: random(-0.45, -0.08),
        alpha: random(0.08, 0.24),
      });
    }
    return;
  }

  const count = props.mode === "soft" ? 72 : 120;
  for (let i = 0; i < count; i += 1) {
    ambience.push({
      x: random(0, width),
      y: random(0, height),
      r: random(0.6, 1.8),
      twinkle: random(0, Math.PI * 2),
      speed: random(0.01, 0.03),
      alpha: random(0.15, 0.52),
    });
  }
};

const spawnOceanTrail = (x, y) => {
  const bubbleCount = Math.floor(random(2, 4));
  for (let i = 0; i < bubbleCount; i += 1) {
    trail.push({
      kind: "bubble",
      x,
      y,
      vx: random(-0.36, 0.36),
      vy: random(-5.92, -1.4),
      life: random(48, 78),
      maxLife: random(48, 78),
      r: random(3.8, 8.4),
      sway: random(0, Math.PI * 2),
      swaySpeed: random(0.1, 0.12),
    });
  }
  if (trail.length > MAX_TRAIL_ITEMS) {
    trail.splice(0, trail.length - MAX_TRAIL_ITEMS);
  }
};

const spawnStarTrail = (x, y) => {
  for (let i = 0; i < 9; i += 1) {
    trail.push({
      kind: "star",
      x,
      y,
      vx: random(-1.2, 1.2),
      vy: random(-1.1, 1.1),
      life: random(22, 40),
      maxLife: random(22, 40),
      r: random(0.8, 2.3),
    });
  }
  if (trail.length > MAX_TRAIL_ITEMS) {
    trail.splice(0, trail.length - MAX_TRAIL_ITEMS);
  }
};

const onPointerMove = (event) => {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
  mouse.active = true;

  if (props.mode === "ocean") {
    const now = performance.now();
    if (now - lastOceanTrailAt > 58) {
      spawnOceanTrail(mouse.x, mouse.y);
      lastOceanTrailAt = now;
    }
  } else if (props.mode === "star") {
    spawnStarTrail(mouse.x, mouse.y);
  }
};

const onPointerLeave = () => {
  mouse.active = false;
};

const drawOcean = (width, height) => {
  for (const item of ambience) {
    item.x += item.driftX;
    item.y += item.driftY;
    if (item.y < -10) {
      item.y = height + 10;
      item.x = random(0, width);
    }
    if (item.x < -12) {
      item.x = width + 12;
    }
    if (item.x > width + 12) {
      item.x = -12;
    }

    ctx.beginPath();
    ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(198, 238, 255, ${item.alpha})`;
    ctx.fill();
  }

  for (let i = trail.length - 1; i >= 0; i -= 1) {
    const item = trail[i];
    item.life -= 1;
    item.sway += item.swaySpeed;
    item.x += item.vx + Math.sin(item.sway) * 0.12;
    item.y += item.vy;
    item.vx *= 0.992;
    item.vy *= 0.994;

    if (item.life <= 0) {
      trail.splice(i, 1);
      continue;
    }

    const alpha = (item.life / item.maxLife) * 0.65;

    ctx.beginPath();
    ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(218, 246, 255, ${alpha})`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(item.x, item.y, item.r + 0.9, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(188, 232, 255, ${alpha * 0.8})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
};

const drawStars = (softMode = false) => {
  for (const item of ambience) {
    item.twinkle += item.speed;
    const alpha = item.alpha + Math.sin(item.twinkle) * (softMode ? 0.08 : 0.14);

    ctx.beginPath();
    ctx.arc(item.x, item.y, softMode ? item.r * 1.2 : item.r, 0, Math.PI * 2);
    ctx.fillStyle = softMode
      ? `rgba(218, 236, 255, ${Math.max(0.05, alpha * 0.78)})`
      : `rgba(255, 255, 255, ${Math.max(0.06, alpha)})`;
    ctx.fill();
  }

  if (softMode) {
    return;
  }

  for (let i = trail.length - 1; i >= 0; i -= 1) {
    const item = trail[i];
    item.life -= 1;
    item.x += item.vx;
    item.y += item.vy;
    item.vx *= 0.985;
    item.vy *= 0.985;

    if (item.life <= 0) {
      trail.splice(i, 1);
      continue;
    }

    const alpha = (item.life / item.maxLife) * 0.9;

    ctx.beginPath();
    ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(item.x, item.y, item.r * 1.9, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.18})`;
    ctx.fill();
  }
};

const draw = () => {
  if (!ctx || !canvasRef.value) {
    return;
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  ctx.clearRect(0, 0, width, height);

  if (props.mode === "ocean") {
    drawOcean(width, height);
  } else if (props.mode === "soft") {
    drawStars(true);
  } else {
    drawStars(false);
  }

  animationId = window.requestAnimationFrame(draw);
};

watch(
  () => props.mode,
  () => {
    trail.length = 0;
    rebuildAmbience();
  }
);

onMounted(() => {
  resize();
  draw();
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerleave", onPointerLeave, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resize);
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerleave", onPointerLeave);
  if (animationId) {
    window.cancelAnimationFrame(animationId);
  }
});
</script>

<template>
  <canvas ref="canvasRef" class="mouse-sparkle-layer" aria-hidden="true"></canvas>
</template>
