<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";

const canvasRef = ref(null);

let ctx;
let animationId;
let stars = [];
let sparks = [];
let tick = 0;
const mouse = { x: 0, y: 0, active: false };

const STAR_COUNT = 120;

const random = (min, max) => min + Math.random() * (max - min);

const hsla = (h, s, l, a) => `hsla(${h}, ${s}%, ${l}%, ${a})`;

const resize = () => {
  const canvas = canvasRef.value;
  if (!canvas) {
    return;
  }

  const ratio = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  stars = Array.from({ length: STAR_COUNT }, () => ({
    x: random(0, width),
    y: random(0, height),
    r: random(0.7, 2.2),
    phase: random(0, Math.PI * 2),
    speed: random(0.004, 0.012),
    alpha: random(0.25, 0.62),
    hueSeed: random(0, 360),
  }));
};

const spawnSparks = (x, y) => {
  const amount = 9;
  for (let i = 0; i < amount; i += 1) {
    sparks.push({
      x,
      y,
      vx: random(-1.35, 1.35),
      vy: random(-1.4, 1.4),
      life: random(26, 46),
      maxLife: random(26, 46),
      r: random(1.0, 2.5),
      hueSeed: random(0, 360),
    });
  }
};

const onMouseMove = (event) => {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
  mouse.active = true;
  spawnSparks(mouse.x, mouse.y);
};

const onMouseLeave = () => {
  mouse.active = false;
};

const draw = () => {
  if (!ctx || !canvasRef.value) {
    return;
  }

  tick += 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  ctx.clearRect(0, 0, width, height);

  for (const star of stars) {
    star.phase += star.speed;
    const twinkle = 0.5 + Math.sin(star.phase) * 0.35;
    let alpha = star.alpha * twinkle;

    if (mouse.active) {
      const dx = star.x - mouse.x;
      const dy = star.y - mouse.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 180) {
        alpha += ((180 - dist) / 180) * 0.4;
      }
    }

    const hue = (star.hueSeed + tick * 0.22 + (star.x / width) * 70 + (star.y / height) * 45) % 360;

    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fillStyle = hsla(hue, 84, 68, Math.min(alpha, 0.98));
    ctx.fill();

    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r * 2.1, 0, Math.PI * 2);
    ctx.fillStyle = hsla(hue, 86, 64, Math.min(alpha * 0.25, 0.28));
    ctx.fill();
  }

  sparks = sparks.filter((spark) => spark.life > 0);
  for (const spark of sparks) {
    spark.life -= 1;
    spark.x += spark.vx;
    spark.y += spark.vy;
    spark.vx *= 0.985;
    spark.vy *= 0.985;

    const alpha = (spark.life / spark.maxLife) * 0.92;
    const hue = (spark.hueSeed + tick * 0.6 + spark.life * 2.2) % 360;

    ctx.beginPath();
    ctx.arc(spark.x, spark.y, spark.r, 0, Math.PI * 2);
    ctx.fillStyle = hsla(hue, 90, 72, alpha);
    ctx.fill();
  }

  animationId = window.requestAnimationFrame(draw);
};

onMounted(() => {
  resize();
  draw();
  window.addEventListener("resize", resize);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseleave", onMouseLeave);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resize);
  window.removeEventListener("mousemove", onMouseMove);
  window.removeEventListener("mouseleave", onMouseLeave);
  if (animationId) {
    window.cancelAnimationFrame(animationId);
  }
});
</script>

<template>
  <canvas ref="canvasRef" class="mouse-sparkle-layer" aria-hidden="true"></canvas>
</template>
