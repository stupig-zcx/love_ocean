<script setup>
import { computed, ref, watch } from "vue";
import { adcodeToProvinceCode, provinceNamesByCode, provinceTravelNotes, visitedProvinces } from "../data/chinaTravel";

const props = defineProps({
  active: {
    type: Boolean,
    default: false,
  },
});

const MAP_WIDTH = 1180;
const MAP_HEIGHT = 760;
const MAP_PADDING = 10;
const PREVIEW_WIDTH = 320;
const PREVIEW_HEIGHT = 210;
const PREVIEW_PADDING = 16;
const CHINA_GEO_URL = `${import.meta.env.BASE_URL}maps/chinaGeo.json`;
const FIT_MIN_LATITUDE = 17;

const hoveredCode = ref("");
const selectedCode = ref("");
const loadState = ref("idle");
const provinceShapes = ref([]);

const detailCopy = {
  emptyTitle: "\u60ac\u6d6e\u6216\u70b9\u51fb\u7701\u4efd",
  emptyTexts: ["\u5728\u5de6\u4fa7\u5730\u56fe\u4e0a\u9009\u4e2d\u4e00\u4e2a\u7701\u4efd\uff0c\u8fd9\u91cc\u4f1a\u5c55\u793a\u5b83\u7684\u8f6e\u5ed3\u548c\u6211\u4eec\u7684\u65c5\u884c\u8bb0\u5f55\u3002"],
  emptyMeta: "\u7b49\u5f85\u9009\u62e9",
  missingTitle: "\u8fd9\u6bb5\u65c5\u884c\u8bb0\u5f55\u8fd8\u5728\u6574\u7406\u4e2d",
  missingTexts: ["\u8fd9\u6bb5\u65c5\u884c\u8bb0\u5f55\u8fd8\u5728\u6574\u7406\u4e2d\uff0c\u5177\u4f53\u7684\u65f6\u95f4\u548c\u6545\u4e8b\u53ef\u4ee5\u4e4b\u540e\u5728\u6570\u636e\u6587\u4ef6\u91cc\u8865\u4e0a\u3002"],
  unvisitedTitle: "\u8fd8\u6ca1\u6709\u4e00\u8d77\u53bb\u8fc7",
  unvisitedTexts: ["\u7b49\u6211\u4eec\u53bb\u5230\u8fd9\u91cc\uff0c\u518d\u5199\u4e0b\u5c5e\u4e8e\u8fd9\u4e00\u7ad9\u7684\u56de\u5fc6\u3002"],
  unvisitedMeta: "\u672a\u6765\u67d0\u5929",
};

const normalizePolygons = (geometry) => {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return [geometry.coordinates];
  if (geometry.type === "MultiPolygon") return geometry.coordinates;
  return [];
};

const resolveProvinceCode = (feature) => adcodeToProvinceCode[String(feature.properties?.adcode)] || "";

const formatNumber = (value) => Number(value).toFixed(2);

const toMercatorPoint = ([longitude, latitude]) => {
  const longitudeInRadians = (longitude * Math.PI) / 180;
  const latitudeInRadians = (latitude * Math.PI) / 180;

  return {
    x: longitudeInRadians,
    y: Math.log(Math.tan(Math.PI / 4 + latitudeInRadians / 2)),
  };
};

const createBounds = (coordinates) => {
  const projectedPoints = coordinates.map(toMercatorPoint);
  const xValues = projectedPoints.map((point) => point.x);
  const yValues = projectedPoints.map((point) => point.y);

  return {
    minX: Math.min(...xValues),
    maxX: Math.max(...xValues),
    minY: Math.min(...yValues),
    maxY: Math.max(...yValues),
  };
};

const createProjector =
  ({ width, height, padding, bounds }) =>
  ([longitude, latitude]) => {
    const point = toMercatorPoint([longitude, latitude]);
    const scale = Math.min(
      (width - padding * 2) / (bounds.maxX - bounds.minX),
      (height - padding * 2) / (bounds.maxY - bounds.minY),
    );
    const mapPixelWidth = (bounds.maxX - bounds.minX) * scale;
    const mapPixelHeight = (bounds.maxY - bounds.minY) * scale;
    const offsetX = (width - mapPixelWidth) / 2;
    const offsetY = (height - mapPixelHeight) / 2;
    const x = offsetX + (point.x - bounds.minX) * scale;
    const y = offsetY + (bounds.maxY - point.y) * scale;

    return `${formatNumber(x)} ${formatNumber(y)}`;
  };

const ringToPath = (ring, projectCoordinate) => {
  if (!ring.length) return "";

  const [firstPoint, ...restPoints] = ring;
  const lineCommands = restPoints.map((point) => `L ${projectCoordinate(point)}`).join(" ");

  return `M ${projectCoordinate(firstPoint)} ${lineCommands} Z`;
};

const geometryToPath = (geometry, projectCoordinate) =>
  normalizePolygons(geometry)
    .flatMap((polygon) => polygon.map((ring) => ringToPath(ring, projectCoordinate)))
    .join(" ");

const createProvinceShapes = (geoJson) => {
  const provinceFeatures = geoJson.features.filter((feature) => resolveProvinceCode(feature));
  const allCoordinates = provinceFeatures.flatMap((feature) =>
    normalizePolygons(feature.geometry).flatMap((polygon) => polygon.flat()),
  );

  // Some GeoJSON points are remote sea islands far below the mainland. They are
  // still rendered, but excluding them from fitting keeps the main map large.
  const fittingCoordinates = allCoordinates.filter(([, latitude]) => latitude >= FIT_MIN_LATITUDE);
  const projectCoordinate = createProjector({
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    padding: MAP_PADDING,
    bounds: createBounds(fittingCoordinates.length ? fittingCoordinates : allCoordinates),
  });

  return provinceFeatures.map((feature) => {
    const code = resolveProvinceCode(feature);
    const provinceCoordinates = normalizePolygons(feature.geometry).flatMap((polygon) => polygon.flat());
    const previewCoordinate = createProjector({
      width: PREVIEW_WIDTH,
      height: PREVIEW_HEIGHT,
      padding: PREVIEW_PADDING,
      bounds: createBounds(provinceCoordinates),
    });

    return {
      code,
      name: provinceNamesByCode[code] || feature.properties?.name || code,
      path: geometryToPath(feature.geometry, projectCoordinate),
      previewPath: geometryToPath(feature.geometry, previewCoordinate),
    };
  });
};

const loadMapData = async () => {
  if (loadState.value !== "idle") return;

  loadState.value = "loading";

  try {
    const response = await fetch(CHINA_GEO_URL);
    if (!response.ok) throw new Error(`Unable to load China map: ${response.status}`);

    provinceShapes.value = createProvinceShapes(await response.json());
    loadState.value = "ready";
  } catch (error) {
    console.error(error);
    loadState.value = "error";
  }
};

const visitedSet = computed(() => new Set(visitedProvinces));
const visitedCount = computed(() => provinceShapes.value.filter((item) => visitedSet.value.has(item.code)).length);
const activeDetailCode = computed(() => hoveredCode.value || selectedCode.value);
const activeProvince = computed(() => provinceShapes.value.find((item) => item.code === activeDetailCode.value) || null);
const activeTravelNote = computed(() => (activeProvince.value ? provinceTravelNotes[activeProvince.value.code] : null));
const detailState = computed(() => {
  if (!activeProvince.value) {
    return {
      date: detailCopy.emptyMeta,
      title: detailCopy.emptyTitle,
      texts: detailCopy.emptyTexts,
    };
  }

  if (activeTravelNote.value) return activeTravelNote.value;

  if (visitedSet.value.has(activeProvince.value.code)) {
    return {
      date: activeProvince.value.name,
      title: detailCopy.missingTitle,
      texts: detailCopy.missingTexts,
    };
  }

  return {
    date: detailCopy.unvisitedMeta,
    title: detailCopy.unvisitedTitle,
    texts: detailCopy.unvisitedTexts,
  };
});

const detailTexts = computed(() => detailState.value.texts || [detailState.value.text].filter(Boolean));

const selectProvince = (code) => {
  selectedCode.value = code;
};

watch(
  () => props.active,
  (isActive) => {
    if (isActive) loadMapData();
  },
  { immediate: true },
);
</script>

<template>
  <div class="travel-content">
    <header class="hero travel-header">
      <p class="hero-subtitle">OUR TRAVEL MAP</p>
      <h2>China travel map with highlighted provinces</h2>
      <h4>Maintain visited provinces in one data file</h4>
      <p class="travel-stats">Visited {{ visitedCount }} / {{ provinceShapes.length }} province-level regions</p>
    </header>

    <section class="travel-map-stage" aria-label="China travel map">
      <div class="travel-map-layout">
        <div class="travel-map-main">
          <svg
            class="travel-map-svg"
            :viewBox="`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="China provinces map"
          >
            <text
              v-if="loadState !== 'ready'"
              class="map-loading-label"
              x="50%"
              y="50%"
              dominant-baseline="middle"
              text-anchor="middle"
            >
              {{ loadState === "error" ? "Map failed to load" : "Loading China map..." }}
            </text>

            <g
              v-for="item in provinceShapes"
              :key="item.code"
              class="province-region"
              :class="{ visited: visitedSet.has(item.code), selected: selectedCode === item.code }"
              tabindex="0"
              @click="selectProvince(item.code)"
              @focus="hoveredCode = item.code"
              @blur="hoveredCode = ''"
              @mouseenter="hoveredCode = item.code"
              @mouseleave="hoveredCode = ''"
            >
              <path class="province-path" :d="item.path" fill-rule="evenodd" />
              <title>{{ item.name }}</title>
            </g>
          </svg>

          <div class="travel-legend">
            <span class="legend-chip visited"></span>
            <span>Visited</span>
            <span class="legend-chip"></span>
            <span>Not visited</span>
          </div>
        </div>

        <aside class="travel-detail-panel" aria-live="polite">
          <div class="province-preview-frame">
            <svg
              class="province-preview-svg"
              :viewBox="`0 0 ${PREVIEW_WIDTH} ${PREVIEW_HEIGHT}`"
              preserveAspectRatio="xMidYMid meet"
              role="img"
              :aria-label="activeProvince ? `${activeProvince.name} map preview` : 'Province preview placeholder'"
            >
              <path
                v-if="activeProvince"
                class="province-preview-path"
                :d="activeProvince.previewPath"
                fill-rule="evenodd"
              />
              <text
                v-else
                class="province-preview-empty"
                x="50%"
                y="50%"
                dominant-baseline="middle"
                text-anchor="middle"
              >
                Select a province
              </text>
            </svg>
          </div>

          <div class="travel-note-panel" :class="{ empty: !activeProvince }">
            <p class="travel-note-date">{{ detailState.date }}</p>
            <h3 class="travel-province-name">{{ activeProvince ? activeProvince.name : "旅行档案" }}</h3>
            <p class="travel-note-title">{{ detailState.title }}</p>
            <ul class="travel-note-list">
              <li v-for="line in detailTexts" :key="line">{{ line }}</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>

    <footer class="story-footer">To be continue...</footer>
  </div>
</template>
