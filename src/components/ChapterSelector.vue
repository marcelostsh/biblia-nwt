<script setup>
defineProps({
  chapters: { type: Array, required: true },
  bookName: { type: String, required: true }
})

const emit = defineEmits(['select'])
</script>

<template>
  <div class="q-pa-md" style="padding-bottom: 80px">
    <div class="chapter-grid">
      <q-btn
        v-for="chapter in chapters"
        :key="chapter.number"
        :label="chapter.number"
        outline
        color="primary"
        class="chapter-btn"
        @click="emit('select', chapter)"
      />
    </div>
  </div>
</template>

<style scoped>
.chapter-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}
.chapter-btn {
  aspect-ratio: 1;
  font-size: 1.1rem;
  font-weight: 500;
  border-radius: 8px;
}
</style>
