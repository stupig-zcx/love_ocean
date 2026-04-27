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
const travelStreamPoints = [];
const mouse = { x: 0, y: 0, prevX: 0, prevY: 0, hasPrevious: false, active: false };
let lastOceanTrailAt = 0;
const MAX_TRAIL_ITEMS = 260;
const MAX_TRAVEL_STREAM_POINTS = 34;
const TRAVEL_STREAM_POINT_LIFE = 82;
const TRAVEL_STREAM_MIN_DISTANCE = 5;

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

  if (props.mode === "travel") {
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

const appendTravelStreamPoint = (x, y, dx, dy) => {
  const distance = Math.hypot(dx, dy);
  if (distance < TRAVEL_STREAM_MIN_DISTANCE) return;

  travelStreamPoints.push({
    x,
    y,
    life: TRAVEL_STREAM_POINT_LIFE,
    maxLife: TRAVEL_STREAM_POINT_LIFE,
    width: random(1.8, 3.2),
    hue: random(116, 142),
  });

  if (travelStreamPoints.length > MAX_TRAVEL_STREAM_POINTS) {
    travelStreamPoints.splice(0, travelStreamPoints.length - MAX_TRAVEL_STREAM_POINTS);
  }
};

const onPointerMove = (event) => {
  const nextX = event.clientX;
  const nextY = event.clientY;
  const dx = mouse.hasPrevious ? nextX - mouse.x : 0;
  const dy = mouse.hasPrevious ? nextY - mouse.y : 0;

  mouse.prevX = mouse.x;
  mouse.prevY = mouse.y;
  mouse.x = nextX;
  mouse.y = nextY;
  mouse.hasPrevious = true;
  mouse.active = true;

  if (props.mode === "ocean") {
    const now = performance.now();
    if (now - lastOceanTrailAt > 58) {
      spawnOceanTrail(mouse.x, mouse.y);
      lastOceanTrailAt = now;
    }
  } else if (props.mode === "star") {
    spawnStarTrail(mouse.x, mouse.y);
  } else if (props.mode === "travel") {
    appendTravelStreamPoint(mouse.x, mouse.y, dx, dy);
  }
};

const onPointerLeave = () => {
  mouse.active = false;
  mouse.hasPrevious = false;
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

const drawTravel = () => {
  for (let i = travelStreamPoints.length - 1; i >= 0; i -= 1) {
    travelStreamPoints[i].life -= 1;
    if (travelStreamPoints[i].life <= 0) {
      travelStreamPoints.splice(i, 1);
    }
  }

  if (travelStreamPoints.length < 2) return;

  const first = travelStreamPoints[0];
  const head = travelStreamPoints[travelStreamPoints.length - 1];
  const headAlpha = Math.min(0.92, head.life / head.maxLife);
  const drawSmoothPath = () => {
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);

    for (let i = 1; i < travelStreamPoints.length - 1; i += 1) {
      const point = travelStreamPoints[i];
      const next = travelStreamPoints[i + 1];
      const midX = (point.x + next.x) / 2;
      const midY = (point.y + next.y) / 2;
      ctx.quadraticCurveTo(point.x, point.y, midX, midY);
    }

    ctx.lineTo(head.x, head.y);
  };
  const gradient = ctx.createLinearGradient(first.x, first.y, head.x, head.y);
  gradient.addColorStop(0, "hsla(128, 82%, 62%, 0)");
  gradient.addColorStop(0.48, `hsla(132, 84%, 64%, ${headAlpha * 0.28})`);
  gradient.addColorStop(0.86, `hsla(136, 88%, 68%, ${headAlpha * 0.72})`);
  gradient.addColorStop(1, `hsla(140, 92%, 76%, ${headAlpha})`);

  drawSmoothPath();
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 3.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();

  drawSmoothPath();
  ctx.strokeStyle = `hsla(140, 96%, 78%, ${headAlpha * 0.34})`;
  ctx.lineWidth = 1.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();

  if (headAlpha > 0.08) {
    const glow = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 16);
    glow.addColorStop(0, `hsla(140, 96%, 78%, ${headAlpha * 0.45})`);
    glow.addColorStop(1, "hsla(140, 96%, 78%, 0)");
    ctx.beginPath();
    ctx.arc(head.x, head.y, 16, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(head.x, head.y, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(140, 96%, 82%, ${headAlpha})`;
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
  } else if (props.mode === "travel") {
    drawTravel();
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
    travelStreamPoints.length = 0;
    mouse.hasPrevious = false;
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
