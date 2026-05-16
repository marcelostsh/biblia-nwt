<script setup>
import { ref, watch } from 'vue'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])

const uiSize = ref(16)
const textSize = ref(16)

const UI_MIN = 12
const UI_MAX = 20
const TEXT_MIN = 12
const TEXT_MAX = 40

function load() {
  uiSize.value = parseInt(localStorage.getItem('font_size_ui') || '16')
  textSize.value = parseInt(localStorage.getItem('font_size_text') || '16')
}

function applyVars() {
  document.documentElement.style.setProperty('--font-size-ui', uiSize.value + 'px')
  document.documentElement.style.setProperty('--font-size-text', textSize.value + 'px')
}

watch(() => props.modelValue, (open) => { if (open) load() })
watch([uiSize, textSize], applyVars)

function save() {
  localStorage.setItem('font_size_ui', uiSize.value)
  localStorage.setItem('font_size_text', textSize.value)
  emit('update:modelValue', false)
}

function close() {
  load()
  applyVars()
  emit('update:modelValue', false)
}
</script>

<template>
  <q-dialog :model-value="modelValue" @update:model-value="close">
    <q-card style="min-width: 320px; max-width: 92vw;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Tamanho da Fonte</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="close" />
      </q-card-section>

      <q-card-section class="q-gutter-lg">
        <div>
          <div class="row items-center justify-between q-mb-sm">
            <span class="text-subtitle2">Fonte do sistema</span>
            <span class="text-caption text-grey-7">{{ uiSize }}px</span>
          </div>
          <q-slider
            v-model="uiSize"
            :min="UI_MIN"
            :max="UI_MAX"
            :step="1"
            color="primary"
            label
            :label-value="uiSize + 'px'"
          />
          <div class="row justify-between text-caption text-grey-6">
            <span>A</span>
            <span style="font-size: 1.2em">A</span>
          </div>
        </div>

        <q-separator />

        <div>
          <div class="row items-center justify-between q-mb-sm">
            <span class="text-subtitle2">Fonte dos textos</span>
            <span class="text-caption text-grey-7">{{ textSize }}px</span>
          </div>
          <q-slider
            v-model="textSize"
            :min="TEXT_MIN"
            :max="TEXT_MAX"
            :step="1"
            color="primary"
            label
            :label-value="textSize + 'px'"
          />
          <div class="row justify-between text-caption text-grey-6">
            <span>A</span>
            <span style="font-size: 1.2em">A</span>
          </div>
        </div>

      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancelar" @click="close" />
        <q-btn unelevated color="primary" label="Salvar" @click="save" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

