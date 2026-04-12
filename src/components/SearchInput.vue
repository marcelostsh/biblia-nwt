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

function onInput(e) {
  emit('update:modelValue', e.target.value)
}

function onKeydown(e) {
  if (e.key === 'Enter') {
    e.preventDefault()
    emit('enter')
  }
}

function focusInput() {
  if (!props.isOpen) {
    emit('open')
  }
  nextTick(() => {
    inputEl.value?.focus()
  })
}

// Auto-focus when opened
watch(() => props.isOpen, (val) => {
  if (val) {
    nextTick(() => {
      inputEl.value?.focus()
    })
  }
})
</script>

<template>
  <div class="search-bar" @click="focusInput">
    <div class="search-input-wrapper">
      <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        ref="inputEl"
        type="text"
        :inputmode="inputMode"
        :placeholder="placeholder"
        :value="modelValue"
        @input="onInput"
        @keydown="onKeydown"
        class="search-input"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
      />
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
  box-shadow: 0 -2px 8px rgba(0,0,0,0.08);
  z-index: 20;
  min-height: 52px;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  background: #f0f2f5;
  border-radius: 24px;
  padding: 0 12px;
  gap: 8px;
}

.search-icon {
  color: #888;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: none;
  padding: 12px 0;
  font-size: 1rem;
  color: #333;
  outline: none;
}

.search-input::placeholder {
  color: #aaa;
}
</style>
