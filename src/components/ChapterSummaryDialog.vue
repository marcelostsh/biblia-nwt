<script setup>
import { ref, computed, watch } from 'vue'
import { summarizeChapter } from '../services/gemini.js'

const props = defineProps({
  modelValue: Boolean,
  bookName: { type: String, default: '' },
  chapterNumber: { type: Number, default: 0 },
  verses: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:modelValue', 'open-settings'])

const loading = ref(false)
const error = ref('')
const overview = ref([])
const themes = ref([])
const copied = ref(false)
const tab = ref('overview')

const hasKey = computed(() => !!localStorage.getItem('gemini_api_key'))

function rangeLabel(b) {
  return b.verseStart === b.verseEnd ? `${b.verseStart}` : `${b.verseStart}-${b.verseEnd}`
}

async function run() {
  error.value = ''
  overview.value = []
  themes.value = []
  copied.value = false
  tab.value = 'overview'
  if (!hasKey.value) return
  loading.value = true
  try {
    const text = props.verses.map(v => `${v.number}. ${v.text}`).join('\n')
    const res = await summarizeChapter(props.bookName, props.chapterNumber, text)
    overview.value = res.overview
    themes.value = res.themes
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function copy() {
  const header = `${props.bookName} ${props.chapterNumber}`
  const ov = overview.value.map(b => `${rangeLabel(b)} — ${b.summary}`).join('\n\n')
  const th = themes.value.map(t => {
    const refs = t.refs.map(rangeLabel).join(', ')
    return `${t.emoji ? t.emoji + ' ' : ''}${t.name} (${refs})\n${t.insight}`
  }).join('\n\n')
  const full = `${header}\n\nRESUMO\n${ov}\n\nTEMAS\n${th}`
  try {
    await navigator.clipboard.writeText(full)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1800)
  } catch (e) {
    error.value = 'Não foi possível copiar'
  }
}

function close() {
  emit('update:modelValue', false)
}

const ready = computed(() => hasKey.value && !loading.value && !error.value)

// Ao abrir, dispara a análise do capítulo atual.
watch(() => props.modelValue, (open) => {
  if (open) run()
})
</script>

<template>
  <q-dialog :model-value="modelValue" @update:model-value="close" position="bottom" transition-show="slide-up" transition-hide="slide-down">
    <q-card class="summary-card column no-wrap">
      <q-toolbar class="bg-primary text-white">
        <q-icon name="auto_awesome" size="22px" class="q-mr-sm" />
        <q-toolbar-title>{{ bookName }} {{ chapterNumber }}</q-toolbar-title>
        <q-btn
          v-if="ready && (overview.length || themes.length)"
          flat dense round
          :icon="copied ? 'check' : 'content_copy'"
          @click="copy"
        >
          <q-tooltip>{{ copied ? 'Copiado!' : 'Copiar' }}</q-tooltip>
        </q-btn>
        <q-btn flat dense round icon="close" @click="close" />
      </q-toolbar>

      <!-- Abas: Resumo + um por tema -->
      <q-tabs
        v-if="ready && themes.length"
        v-model="tab"
        dense
        active-color="primary"
        indicator-color="primary"
        align="left"
        class="text-grey-7 tabs-bar"
        narrow-indicator
        inline-label
      >
        <q-tab name="overview" icon="segment" label="Resumo" no-caps />
        <q-tab
          v-for="(t, i) in themes"
          :key="i"
          :name="'theme-' + i"
          :label="(t.emoji ? t.emoji + ' ' : '') + t.name"
          no-caps
        />
      </q-tabs>

      <q-card-section v-if="!hasKey">
        <q-banner class="bg-warning text-dark" rounded>
          Configure a chave da IA primeiro.
          <template v-slot:action>
            <q-btn flat label="Abrir" @click="$emit('open-settings'); close()" />
          </template>
        </q-banner>
      </q-card-section>

      <q-card-section v-else-if="loading" class="text-center text-grey-7 q-py-lg">
        <q-spinner size="34px" color="primary" />
        <div class="q-mt-sm">Analisando o capítulo...</div>
      </q-card-section>

      <q-card-section v-else-if="error">
        <q-banner class="bg-negative text-white" rounded dense>{{ error }}</q-banner>
        <div class="text-center q-mt-md">
          <q-btn flat color="primary" icon="refresh" label="Tentar de novo" @click="run" />
        </div>
      </q-card-section>

      <q-tab-panels
        v-else
        v-model="tab"
        animated
        swipeable
        class="col panels"
      >
        <!-- Resumo por faixas -->
        <q-tab-panel name="overview" class="panel-scroll">
          <div v-for="(b, i) in overview" :key="i" class="summary-block">
            <span class="verse-range">{{ rangeLabel(b) }}</span>
            <span class="block-text">{{ b.summary }}</span>
          </div>
        </q-tab-panel>

        <!-- Um painel por tema -->
        <q-tab-panel
          v-for="(t, i) in themes"
          :key="i"
          :name="'theme-' + i"
          class="panel-scroll"
        >
          <div class="theme-head">
            <span class="theme-emoji">{{ t.emoji }}</span>
            <span class="theme-name">{{ t.name }}</span>
          </div>
          <p class="theme-insight">{{ t.insight }}</p>
          <div class="theme-refs">
            <span v-for="(r, ri) in t.refs" :key="ri" class="verse-range small">{{ rangeLabel(r) }}</span>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </q-dialog>
</template>

<style scoped>
.summary-card {
  width: 100%;
  height: 72vh;
  border-top-left-radius: 18px;
  border-top-right-radius: 18px;
}
.tabs-bar {
  border-bottom: 1px solid #eee;
}
.panels {
  overflow: hidden;
}
.panel-scroll {
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.summary-block {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}
.summary-block:last-child {
  border-bottom: none;
}
.verse-range {
  flex: 0 0 auto;
  min-width: 52px;
  text-align: center;
  font-weight: 700;
  font-size: 1rem;
  color: white;
  background: var(--q-primary);
  border-radius: 10px;
  padding: 4px 8px;
}
.verse-range.small {
  min-width: 0;
  font-size: 0.9rem;
  padding: 3px 10px;
}
.block-text {
  flex: 1;
  font-size: 1.1rem;
  line-height: 1.5;
}
.theme-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.theme-emoji {
  font-size: 2rem;
}
.theme-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--q-primary);
}
.theme-insight {
  font-size: 1.2rem;
  line-height: 1.6;
  margin: 0 0 18px;
}
.theme-refs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
