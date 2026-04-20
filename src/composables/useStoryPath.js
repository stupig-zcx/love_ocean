import { computed } from "vue";

export function useStoryPath(storiesRef, laneHeightRef) {
  const waveX = (t) => {
    const major = Math.sin(t * Math.PI * 2.2) * 10;
    const minor = Math.sin((t + 0.18) * Math.PI * 5.2) * 2.8;
    return 50 + major + minor;
  };

  const lanePath = computed(() => {
    const points = [];
    const steps = 12;

    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      points.push({ x: waveX(t), y: 20 + t * (laneHeightRef.value - 40) });
    }

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i += 1) {
      const prev = points[i - 1];
      const cur = points[i];
      const controlY = (prev.y + cur.y) / 2;
      d += ` Q ${prev.x} ${controlY} ${cur.x} ${cur.y}`;
    }

    return d;
  });

  const storyNodes = computed(() => {
    const total = storiesRef.value.length;

    return storiesRef.value.map((story, index) => {
      const t = (index + 1) / (total + 1);
      const center = waveX(t) + (((index * 13) % 7) - 3) * 0.6;
      const side = index % 2 === 0 ? "left" : "right";
      const gap = 72 + ((index * 17) % 20);

      return {
        ...story,
        index,
        side,
        center,
        top: Math.round(60 + t * (laneHeightRef.value - 140)),
        gap,
      };
    });
  });

  return {
    lanePath,
    storyNodes,
  };
}
