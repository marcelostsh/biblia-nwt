<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  inputMode: { type: String, default: 'text' },
  placeholder: { type: String, default: 'Buscar...' },
  isOpen: { type: Boolean, default: true },
  step: { type: Number, default: 0 },
  bookName: { type: String, default: '' },
  chapterNumber: { type: Number, default: 0 },
  totalVerses: { type: Number, default: 0 },
  multiChapter: { type: Boolean, default: true }
})

const emit = defineEmits(['update:modelValue', 'enter', 'open', 'close', 'goto-books', 'goto-chapters', 'goto-verse'])

const inputEl = ref(null)

function focusInput() {
  if (!props.isOpen) {
    emit('open')
  }
  nextTick(() => {
    const el = inputEl.value?.$el?.querySelector('input') || inputEl.value
    el?.focus()
  })
}

watch(() => props.isOpen, (val) => {
  if (val) {
    nextTick(() => {
      const el = inputEl.value?.$el?.querySelector('input') || inputEl.value
      el?.focus()
    })
  }
})
</script>

<template>
  <div class="search-bar">
    <!-- Breadcrumb when reading and input closed -->
    <div v-if="step === 2 && !isOpen" class="breadcrumb" @click.stop>
      <span class="crumb crumb-book" @click="emit('goto-books')">{{ bookName }}</span>
      <template v-if="multiChapter">
        <q-icon name="chevron_right" size="18px" color="grey-5" />
        <span class="crumb crumb-chapter" @click="emit('goto-chapters')">{{ chapterNumber }}</span>
      </template>
      <q-icon name="chevron_right" size="18px" color="grey-5" />
      <span class="crumb crumb-verses" @click="emit('goto-verse')">1-{{ totalVerses }}</span>
    </div>

    <!-- Input field -->
    <div v-else @click="focusInput">
      <q-input
        ref="inputEl"
        :model-value="modelValue"
        @update:model-value="emit('update:modelValue', $event)"
        @keydown.enter.prevent="emit('enter')"
        :placeholder="placeholder"
        :inputmode="inputMode"
        :type="inputMode === 'numeric' ? 'tel' : 'text'"
        dense
        rounded
        outlined
        bg-color="grey-2"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
      >
        <template v-slot:prepend>
          <q-icon name="search" color="grey-6" />
        </template>
      </q-input>
    </div>
  </div>
</template>

<style scoped>
.search-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px 12px;
  padding-bottom: max(8px, env(safe-area-inset-bottom));
  background: white;
  border-top: 1px solid #e0e0e0;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
  z-index: 20;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
}

.crumb {
  font-size: 0.95rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 8px;
  color: var(--q-primary);
  background: #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.crumb:active {
  background: #e0e0e0;
}
</style>
