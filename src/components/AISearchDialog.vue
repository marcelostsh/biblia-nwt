<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { searchBibleTopics } from '../services/gemini.js'
import { resolveReference } from '../services/bibleRef.js'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'open-reference', 'open-settings'])

const query = ref('')
const loading = ref(false)
const error = ref('')
const topics = ref([])
const listening = ref(false)

const speechSupported = typeof window !== 'undefined'
  && (window.SpeechRecognition || window.webkitSpeechRecognition)

let recognition = null

function startVoice() {
  if (!speechSupported) {
    error.value = 'Reconhecimento de voz não suportado neste navegador'
    return
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  recognition = new SR()
  recognition.lang = 'pt-BR'
  recognition.interimResults = false
  recognition.maxAlternatives = 1

  recognition.onstart = () => { listening.value = true }
  recognition.onend = () => { listening.value = false }
  recognition.onerror = (e) => {
    listening.value = false
    error.value = `Erro de voz: ${e.error}`
  }
  recognition.onresult = (e) => {
    const text = e.results[0][0].transcript
    query.value = text
    runSearch()
  }
  recognition.start()
}

function stopVoice() {
  if (recognition) recognition.stop()
}

async function runSearch() {
  if (!query.value.trim()) return
  error.value = ''
  topics.value = []
  loading.value = true
  try {
    const result = await searchBibleTopics(query.value.trim())
    topics.value = (result.topics || []).map(t => ({
      title: t.title,
      results: (t.references || [])
        .map(resolveReference)
        .filter(Boolean)
    })).filter(t => t.results.length > 0)

    if (topics.value.length === 0) {
      error.value = 'Nenhuma referência válida encontrada. Tenta reformular.'
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function openRef(ref) {
  emit('open-reference', {
    book: ref.book,
    chapter: ref.chapter,
    verse: ref.verseStart
  })
  close()
}

function close() {
  stopVoice()
  emit('update:modelValue', false)
}

function reset() {
  query.value = ''
  topics.value = []
  error.value = ''
}

watch(() => props.modelValue, (open) => {
  if (!open) {
    stopVoice()
  }
})

onUnmounted(stopVoice)

const hasKey = computed(() => !!localStorage.getItem('gemini_api_key'))
</script>

<template>
  <q-dialog :model-value="modelValue" @update:model-value="close" maximized transition-show="slide-up" transition-hide="slide-down">
    <q-card class="ai-search-card column no-wrap">
      <q-toolbar class="bg-primary text-white">
        <q-btn flat dense round icon="close" @click="close" />
        <q-toolbar-title>Busca por tema</q-toolbar-title>
        <q-btn v-if="topics.length || query" flat dense round icon="refresh" @click="reset" />
      </q-toolbar>

      <q-card-section class="q-pa-md">
        <q-input
          v-model="query"
          outlined
          dense
          placeholder="Ex: cura de doenças, perdão, fé..."
          @keyup.enter="runSearch"
          autofocus
        >
          <template v-slot:append>
            <q-btn
              v-if="speechSupported"
              flat
              round
              dense
              :icon="listening ? 'mic' : 'mic_none'"
              :color="listening ? 'red' : 'grey-7'"
              @click="listening ? stopVoice() : startVoice()"
            />
            <q-btn
              flat
              round
              dense
              icon="search"
              color="primary"
              :loading="loading"
              @click="runSearch"
            />
          </template>
        </q-input>
      </q-card-section>

      <q-card-section v-if="!hasKey" class="q-pt-none">
        <q-banner class="bg-warning text-dark" rounded>
          Configure a API key do Gemini primeiro.
          <template v-slot:action>
            <q-btn flat label="Abrir" @click="$emit('open-settings'); close()" />
          </template>
        </q-banner>
      </q-card-section>

      <q-card-section v-if="error" class="q-pt-none">
        <q-banner class="bg-negative text-white" rounded dense>{{ error }}</q-banner>
      </q-card-section>

      <div class="ai-results col scroll">
        <div v-if="loading" class="q-pa-lg text-center text-grey-7">
          <q-spinner size="32px" />
          <div class="q-mt-sm">Pesquisando...</div>
        </div>

        <div v-for="(topic, tIdx) in topics" :key="tIdx" class="q-mb-md">
          <div class="text-subtitle1 text-weight-bold q-px-md q-pt-md q-pb-sm">
            {{ topic.title }}
          </div>
          <q-list separator>
            <q-item
              v-for="(ref, rIdx) in topic.results"
              :key="rIdx"
              clickable
              @click="openRef(ref)"
            >
              <q-item-section>
                <q-item-label class="text-primary text-weight-medium">
                  {{ ref.label }}
                </q-item-label>
                <q-item-label caption lines="3">
                  {{ ref.verses.map(v => v.text).join(' ') }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="chevron_right" />
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.ai-search-card {
  height: 100vh;
  height: 100dvh;
}
.ai-results {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
