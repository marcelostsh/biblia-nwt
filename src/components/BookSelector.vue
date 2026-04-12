<script setup>
defineProps({
  books: { type: Array, required: true }
})

const emit = defineEmits(['select'])

function testamentLabel(testament) {
  return testament === 'hebrew' ? 'Escrituras Hebraicas' : 'Escrituras Gregas'
}
</script>

<template>
  <div class="book-selector">
    <template v-for="testament in ['hebrew', 'greek']" :key="testament">
      <div
        class="testament-header"
        v-if="books.some(b => b.testament === testament)"
      >
        {{ testamentLabel(testament) }}
      </div>
      <div class="books-grid">
        <button
          v-for="book in books.filter(b => b.testament === testament)"
          :key="book.id"
          class="book-item"
          @click="emit('select', book)"
        >
          <span class="book-name">{{ book.name }}</span>
          <span class="book-chapters">{{ book.chapters.length }} cap.</span>
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.book-selector {
  padding: 8px;
  padding-bottom: 80px;
}

.testament-header {
  font-size: 0.8rem;
  font-weight: 600;
  color: #4a6da7;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 12px 8px 6px;
}

.books-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 0 4px;
}

.book-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 12px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  text-align: left;
}

.book-item:active {
  background: #e8eef6;
}

.book-name {
  font-size: 0.95rem;
  font-weight: 500;
  color: #333;
}

.book-chapters {
  font-size: 0.75rem;
  color: #888;
  margin-top: 2px;
}
</style>
