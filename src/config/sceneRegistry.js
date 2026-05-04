import FragmentsScene from "../scenes/FragmentsScene.vue";
import OceanScene from "../scenes/OceanScene.vue";
import StarScene from "../scenes/StarScene.vue";
import TravelMapScene from "../scenes/TravelMapScene.vue";

// One object = one scene. Use enabled to control if it appears on frontend.
export const sceneRegistry = [
  {
    id: "ocean",
    enabled: true,
    component: OceanScene,
    sparkleMode: "ocean",
    musicKey: "ocean",
    panelClass: "ocean-panel",
    ariaLabel: "海洋故事场景",
  },
  {
    id: "star",
    enabled: true,
    component: StarScene,
    sparkleMode: "star",
    musicKey: "sky",
    panelClass: "sky-panel",
    ariaLabel: "星空时间轴场景",
  },
  {
    id: "fragments",
    enabled: true,
    component: FragmentsScene,
    sparkleMode: "film",
    musicKey: "fragments",
    panelClass: "fragments-panel",
    ariaLabel: "日常胶卷场景",
  },
  {
    id: "travel",
    enabled: true,
    component: TravelMapScene,
    sparkleMode: "travel",
    musicKey: "travel",
    panelClass: "travel-panel",
    ariaLabel: "中国旅行地图场景",
  },
];

