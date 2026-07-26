<script setup>
const props = defineProps({
  verses: { type: Array, required: true },
  bookName: { type: String, required: true },
  chapterNumber: { type: Number, required: true },
  // faixa selecionada: [inicio, fim] — um único versículo é [n, n]
  selectedRange: { type: Array, default: null }
})

defineEmits(['select'])

function isSelected(n) {
  const r = props.selectedRange
  return !!r && n >= r[0] && n <= r[1]
}
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
          :class="{ selected: isSelected(verse.number) }"
          @click="$emit('select', verse.number)"
        >
          <span v-if="verse.number === 1" class="chapter-number">{{ chapterNumber }}</span>
          <span v-else class="verse-number">{{ verse.number }}</span>
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
  font-size: var(--font-size-text, 1rem);
  color: #333;
  transition: background 0.3s, box-shadow 0.3s;
  padding: 2px 4px 2px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.chapter-number {
  float: left;
  font-size: calc(var(--font-size-text, 16px) * 2.8);
  font-weight: 700;
  line-height: 0.85;
  color: var(--q-primary);
  margin-right: 6px;
  padding-top: 4px;
}

/* estado persistente: discreto, marca onde você parou */
.verse.selected {
  background: #eef2f9;
  box-shadow: inset 3px 0 0 var(--q-primary);
}

/* pulso ao chegar pela busca — some em 2s e devolve ao estado discreto */
.verse.highlight {
  background: #d8e2f2;
  box-shadow: inset 3px 0 0 var(--q-primary);
  transition: none; /* entra na hora; a saída é que desliza */
}

.verse-number {
  font-size: calc(var(--font-size-text, 16px) * 0.75);
  font-weight: 700;
  color: var(--q-primary);
  vertical-align: super;
  margin-right: 6px;
  padding: 2px 6px;
}
</style>
