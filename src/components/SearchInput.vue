<script setup>
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'

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

const emit = defineEmits(['update:modelValue', 'enter', 'open', 'close', 'goto-books', 'goto-chapters', 'goto-verse', 'summarize'])

const inputEl = ref(null)

// Sobe a barra de busca junto com o teclado do celular.
// Usa a Visual Viewport API: quando o teclado abre, a viewport encolhe;
// a gente empurra a barra pra cima pela mesma altura, colada no teclado.
const keyboardOffset = ref(0)

function updateKeyboardOffset() {
  const vv = window.visualViewport
  if (!vv) return
  const overlap = window.innerHeight - vv.height - vv.offsetTop
  keyboardOffset.value = overlap > 80 ? overlap : 0
}

onMounted(() => {
  const vv = window.visualViewport
  if (!vv) return
  vv.addEventListener('resize', updateKeyboardOffset)
  vv.addEventListener('scroll', updateKeyboardOffset)
})

onBeforeUnmount(() => {
  const vv = window.visualViewport
  if (!vv) return
  vv.removeEventListener('resize', updateKeyboardOffset)
  vv.removeEventListener('scroll', updateKeyboardOffset)
})

// X: se tem texto, limpa; se já está vazio, fecha a busca (some o teclado).
function onClear() {
  if (props.modelValue) {
    emit('update:modelValue', '')
  } else {
    // Android ignora blur() puro; travar o campo por um instante força o teclado a cair.
    const el = inputEl.value?.$el?.querySelector('input')
    if (el) {
      el.setAttribute('readonly', 'readonly')
      el.blur()
      setTimeout(() => el.removeAttribute('readonly'), 300)
    }
    emit('close')
  }
}

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
  <div class="search-bar" :style="{ transform: `translateY(-${keyboardOffset}px)` }">
    <!-- Breadcrumb when reading and input closed -->
    <div v-if="step === 2 && !isOpen" class="breadcrumb" @click.stop>
      <span class="crumb crumb-book" @click="emit('goto-books')">{{ bookName }}</span>
      <template v-if="multiChapter">
        <q-icon name="chevron_right" size="24px" color="grey-5" />
        <span class="crumb crumb-chapter" @click="emit('goto-chapters')">{{ chapterNumber }}</span>
      </template>
      <q-icon name="chevron_right" size="24px" color="grey-5" />
      <span class="crumb crumb-verses" @click="emit('goto-verse')">1-{{ totalVerses }}</span>
      <q-btn
        round
        color="primary"
        icon="auto_awesome"
        size="12px"
        class="summary-btn"
        @click="emit('summarize')"
      />
    </div>

    <!-- Input field -->
    <div v-else @click="focusInput">
      <q-input
        ref="inputEl"
        class="search-field"
        :model-value="modelValue"
        @update:model-value="emit('update:modelValue', $event)"
        @keydown.enter.prevent="emit('enter')"
        :placeholder="placeholder"
        :inputmode="inputMode"
        :type="inputMode === 'numeric' ? 'tel' : 'text'"
        rounded
        outlined
        bg-color="grey-2"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
      >
        <template v-slot:prepend>
          <q-icon name="search" color="grey-6" size="26px" />
        </template>
        <template v-slot:append>
          <q-icon
            name="close"
            color="grey-6"
            size="26px"
            class="cursor-pointer"
            @click.stop="onClear"
          />
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
  padding: 10px 12px;
  padding-bottom: max(10px, env(safe-area-inset-bottom));
  background: white;
  border-top: 1px solid #e0e0e0;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
  z-index: 20;
  transition: transform 0.18s ease-out;
}

/* Campo de busca com alvo de toque confortável (~56px) */
.search-field :deep(.q-field__control) {
  height: 56px;
  border-radius: 28px;
}
.search-field :deep(.q-field__marginal) {
  height: 56px;
}
.search-field :deep(.q-field__native) {
  font-size: 1.15rem;
}
.search-field :deep(.q-field__native::placeholder) {
  font-size: 1.1rem;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 4px;
  min-height: 56px;
}

.crumb {
  font-size: 1.15rem;
  font-weight: 600;
  padding: 10px 18px;
  border-radius: 14px;
  color: var(--q-primary);
  background: #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.crumb:active {
  background: #e0e0e0;
}

.summary-btn {
  margin-left: auto;
}
</style>
