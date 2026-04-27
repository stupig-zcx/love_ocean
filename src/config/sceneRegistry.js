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
    ariaLabel: "Ocean Story Scene",
  },
  {
    id: "star",
    enabled: true,
    component: StarScene,
    sparkleMode: "star",
    musicKey: "sky",
    panelClass: "sky-panel",
    ariaLabel: "Star Timeline Scene",
  },
  {
    id: "fragments",
    enabled: false,
    component: FragmentsScene,
    sparkleMode: "soft",
    musicKey: "fragments",
    panelClass: "fragments-panel",
    ariaLabel: "Daily Fragments Scene",
  },
  {
    id: "travel",
    enabled: true,
    component: TravelMapScene,
    sparkleMode: "travel",
    musicKey: "travel",
    panelClass: "travel-panel",
    ariaLabel: "China Travel Map Scene",
  },
];

