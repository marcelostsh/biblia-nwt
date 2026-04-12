<script setup>
defineProps({
  verses: { type: Array, required: true },
  bookName: { type: String, required: true },
  chapterNumber: { type: Number, required: true }
})
</script>

<template>
  <div class="q-pa-md" style="padding-bottom: 80px">
    <q-card flat class="verse-card">
      <q-card-section>
        <p
          v-for="verse in verses"
          :key="verse.number"
          :id="`verse-${verse.number}`"
          class="verse"
        >
          <span class="verse-number">{{ verse.number }}</span>
          <span class="verse-text">{{ verse.text }}</span>
        </p>
      </q-card-section>
    </q-card>
  </div>
</template>

<style scoped>
.verse-card {
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.verse {
  margin-bottom: 4px;
  line-height: 1.7;
  font-size: 1rem;
  color: #333;
  transition: background 0.3s;
  padding: 2px 4px;
  border-radius: 4px;
}

.verse.highlight {
  background: #fff3cd;
}

.verse-number {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--q-primary);
  vertical-align: super;
  margin-right: 3px;
}
</style>
