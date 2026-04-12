<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  inputMode: { type: String, default: 'text' },
  placeholder: { type: String, default: 'Buscar...' },
  isOpen: { type: Boolean, default: true }
})

const emit = defineEmits(['update:modelValue', 'enter', 'open', 'close'])

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
  <div class="search-bar" @click="focusInput">
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
</style>
