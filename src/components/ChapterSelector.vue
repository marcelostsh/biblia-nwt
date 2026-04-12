<script setup>
defineProps({
  chapters: { type: Array, required: true },
  bookName: { type: String, required: true }
})

const emit = defineEmits(['select', 'clear'])
</script>

<template>
  <div class="q-pa-md" style="padding-bottom: 80px">
    <!-- Empty state -->
    <div v-if="chapters.length === 0" class="empty-state">
      <q-icon name="search_off" size="48px" color="grey-5" />
      <div class="text-grey-6 q-mt-sm">Nenhum capítulo encontrado</div>
      <q-btn
        flat
        no-caps
        color="primary"
        label="Limpar busca"
        icon="backspace"
        class="q-mt-md"
        @click="emit('clear')"
      />
    </div>

    <div v-else class="chapter-grid">
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
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 25vh;
}

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
