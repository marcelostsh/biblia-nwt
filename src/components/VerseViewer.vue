<script setup>
defineProps({
  verses: { type: Array, required: true },
  bookName: { type: String, required: true },
  chapterNumber: { type: Number, required: true }
})
</script>

<template>
  <div class="verse-viewer">
    <div class="verses-content">
      <p
        v-for="verse in verses"
        :key="verse.number"
        :id="`verse-${verse.number}`"
        class="verse"
      >
        <span class="verse-number">{{ verse.number }}</span>
        <span class="verse-text">{{ verse.text }}</span>
      </p>
    </div>
  </div>
</template>

<style scoped>
.verse-viewer {
  padding: 16px;
  padding-bottom: 80px;
}

.verses-content {
  background: white;
  border-radius: 12px;
  padding: 20px 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
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
  color: #4a6da7;
  vertical-align: super;
  margin-right: 3px;
}

.verse-text {
  /* inherits from .verse */
}
</style>
