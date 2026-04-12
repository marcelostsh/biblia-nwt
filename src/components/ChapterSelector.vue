<script setup>
defineProps({
  chapters: { type: Array, required: true },
  bookName: { type: String, required: true }
})

const emit = defineEmits(['select'])
</script>

<template>
  <div class="chapter-selector">
    <div class="chapters-grid">
      <button
        v-for="chapter in chapters"
        :key="chapter.number"
        class="chapter-item"
        @click="emit('select', chapter)"
      >
        {{ chapter.number }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.chapter-selector {
  padding: 16px;
  padding-bottom: 80px;
}

.chapters-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.chapter-item {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 500;
  color: #4a6da7;
  cursor: pointer;
  transition: background 0.15s;
}

.chapter-item:active {
  background: #4a6da7;
  color: white;
}
</style>
