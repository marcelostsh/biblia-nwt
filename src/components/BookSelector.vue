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
  <div class="q-pa-sm" style="padding-bottom: 80px">
    <template v-for="testament in ['hebrew', 'greek']" :key="testament">
      <q-item-label
        header
        class="text-primary text-weight-bold text-uppercase"
        style="font-size: 0.8rem; letter-spacing: 0.5px"
        v-if="books.some(b => b.testament === testament)"
      >
        {{ testamentLabel(testament) }}
      </q-item-label>

      <div class="row q-col-gutter-xs q-px-xs">
        <div
          class="col-6"
          v-for="(book, index) in books.filter(b => b.testament === testament)"
          :key="book.id"
        >
          <q-card
            flat
            bordered
            class="cursor-pointer book-card book-enter"
            :style="{ animationDelay: `${index * 20}ms` }"
            @click="emit('select', book)"
            v-ripple
          >
            <q-card-section class="q-py-sm q-px-md">
              <div class="text-body2 text-weight-medium">{{ book.name }}</div>
              <div class="text-caption text-grey">{{ book.chapters.length }} cap.</div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.book-card {
  border-radius: 8px;
  transition: background 0.15s;
}
.book-card:active {
  background: #e8eef6;
}

@keyframes bookIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.book-enter {
  animation: bookIn 0.25s ease both;
}
</style>
