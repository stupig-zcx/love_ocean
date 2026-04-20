import { onBeforeUnmount, onMounted, ref } from "vue";

const random = (min, max) => min + Math.random() * (max - min);
const TAU = Math.PI * 2;
const FISH_TYPES = ["goldie", "peach", "mint", "dream", "sword", "shark", "clown", "puffer", "starfish", "jellyfish"];
const FISH_TYPE_CONFIG = {
  goldie: { sizeMul: 1, speedMul: 1 },
  peach: { sizeMul: 0.96, speedMul: 1.02 },
  mint: { sizeMul: 0.94, speedMul: 1.04 },
  dream: { sizeMul: 1, speedMul: 0.98 },
  sword: { sizeMul: 1.22, speedMul: 1.22 },
  shark: { sizeMul: 1.16, speedMul: 1.12 },
  clown: { sizeMul: 0.9, speedMul: 1.08 },
  puffer: { sizeMul: 1.08, speedMul: 0.84 },
  starfish: { sizeMul: 1.02, speedMul: 0.72 },
  jellyfish: { sizeMul: 1.12, speedMul: 0.66 },
};

const normalizeAngle = (angle) => {
  let next = angle % TAU;
  if (next < -Math.PI) {
    next += TAU;
  }
  if (next > Math.PI) {
    next -= TAU;
  }
  return next;
};

const shortestAngle = (from, to) => normalizeAngle(to - from);

export function useFishSchool(storiesRef, stageRef) {
  const fishNodes = ref([]);

  let rafId;
  let resizeObserver;
  let lastTime = 0;

  const stageSize = () => {
    const width = stageRef.value?.clientWidth ?? 0;
    const height = stageRef.value?.clientHeight ?? 0;
    return { width, height };
  };

  const makeFish = (story, index, width, height) => {
    const type = FISH_TYPES[Math.floor(random(0, FISH_TYPES.length))];
    const typeConfig = FISH_TYPE_CONFIG[type];
    const baseSize = 68 + ((index * 13) % 22);
    const size = baseSize * typeConfig.sizeMul;
    const angle = random(0, TAU);

    return {
      ...story,
      index,
      type,
      size,
      hue: (198 + index * 26) % 360,
      x: random(size, Math.max(size + 2, width - size)),
      y: random(size, Math.max(size + 2, height - size)),
      angle,
      targetAngle: angle,
      turnTimer: random(900, 2400),
      speed: random(0.75, 1.45) * typeConfig.speedMul,
      wobble: random(0, TAU),
      tilt: random(-2, 2),
    };
  };

  const initFish = () => {
    const { width, height } = stageSize();
    if (!width || !height) {
      return;
    }

    fishNodes.value = storiesRef.value.map((story, index) => makeFish(story, index, width, height));
  };

  const keepFishInBounds = () => {
    const { width, height } = stageSize();
    if (!width || !height) {
      return;
    }

    fishNodes.value = fishNodes.value.map((fish) => {
      const pad = fish.size * 0.45;
      return {
        ...fish,
        x: Math.min(width - pad, Math.max(pad, fish.x)),
        y: Math.min(height - pad, Math.max(pad, fish.y)),
      };
    });
  };

  const updateFish = (time) => {
    if (!lastTime) {
      lastTime = time;
    }

    const elapsed = time - lastTime;
    const dt = Math.min(2.3, Math.max(0.55, elapsed / 16.67));
    lastTime = time;

    const { width, height } = stageSize();
    if (!width || !height) {
      rafId = window.requestAnimationFrame(updateFish);
      return;
    }

    fishNodes.value = fishNodes.value.map((fish) => {
      const next = { ...fish };

      next.turnTimer -= elapsed;
      if (next.turnTimer <= 0) {
        next.targetAngle = normalizeAngle(next.angle + random(-Math.PI * 0.5, Math.PI * 0.5));
        next.turnTimer = random(900, 2600);
      }

      const steer = shortestAngle(next.angle, next.targetAngle);
      next.angle = normalizeAngle(next.angle + steer * 0.055 * dt + random(-0.008, 0.008) * dt);

      next.x += Math.cos(next.angle) * next.speed * 2.25 * dt;
      next.y += Math.sin(next.angle) * next.speed * 1.8 * dt;

      const pad = next.size * 0.45;
      let bounced = false;

      if (next.x <= pad) {
        next.x = pad;
        next.angle = normalizeAngle(Math.PI - next.angle);
        bounced = true;
      } else if (next.x >= width - pad) {
        next.x = width - pad;
        next.angle = normalizeAngle(Math.PI - next.angle);
        bounced = true;
      }

      if (next.y <= pad) {
        next.y = pad;
        next.angle = normalizeAngle(-next.angle);
        bounced = true;
      } else if (next.y >= height - pad) {
        next.y = height - pad;
        next.angle = normalizeAngle(-next.angle);
        bounced = true;
      }

      if (bounced) {
        next.targetAngle = next.angle;
        next.turnTimer = random(700, 1400);
      }

      next.wobble += 0.09 * dt;
      next.tilt = Math.sin(next.wobble) * 2.8;

      return next;
    });

    rafId = window.requestAnimationFrame(updateFish);
  };

  onMounted(() => {
    window.requestAnimationFrame(() => {
      initFish();
      lastTime = 0;
      rafId = window.requestAnimationFrame(updateFish);
    });

    resizeObserver = new ResizeObserver(() => {
      if (!fishNodes.value.length) {
        initFish();
      }
      keepFishInBounds();
    });

    if (stageRef.value) {
      resizeObserver.observe(stageRef.value);
    }
  });

  onBeforeUnmount(() => {
    if (rafId) {
      window.cancelAnimationFrame(rafId);
    }
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
  });

  return {
    fishNodes,
  };
}
