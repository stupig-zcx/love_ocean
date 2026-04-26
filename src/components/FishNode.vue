<script setup>
// Single animated fish node in Scene 1 (click to open story modal).
const props = defineProps({
  fish: {
    type: Object,
    required: true,
  },
  styleObject: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["open"]);

const onClick = () => {
  emit("open", props.fish);
};
</script>

<template>
  <button class="fish-node" :style="styleObject" @click="onClick">
    <span class="fish-shape" :class="`fish--${fish.type}`" :style="{ '--hue': fish.hue }" aria-hidden="true">
      <span class="fish-tail"></span>
      <span class="fish-body"></span>
      <span class="fish-fin"></span>
      <span class="fish-dorsal"></span>
      <span class="fish-snout"></span>
      <span class="fish-stripe"></span>
      <span class="fish-cheek"></span>
      <span class="fish-eye"></span>
      <span class="fish-mouth"></span>
      <span class="fish-bubble"></span>
    </span>
    <span class="fish-label">{{ fish.title }}</span>
  </button>
</template>
