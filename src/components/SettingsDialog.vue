<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'saved'])

const apiKey = ref('')
const modelName = ref('')
const showKey = ref(false)
const testing = ref(false)
const testResult = ref(null)

const defaultModels = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite'
]
const modelOptions = ref([...defaultModels])
const loadingModels = ref(false)

function addModel(val, done) {
  if (val && !modelOptions.value.includes(val)) {
    modelOptions.value.push(val)
  }
  done(val, 'add-unique')
}

async function fetchModels() {
  if (!apiKey.value.trim()) {
    testResult.value = { ok: false, msg: 'Informe a API key primeiro' }
    return
  }
  loadingModels.value = true
  testResult.value = null
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.value.trim()}`)
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error?.message || `Erro ${res.status}`)

    const names = (data.models || [])
      .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      .map(m => m.name.replace('models/', ''))
      .filter(n => !/tts|live|image|embedding|aqa|vision|pro/i.test(n))
      .filter(n => /^gemini-[2-9]/.test(n))
      .sort()
      .reverse()

    if (names.length === 0) throw new Error('Nenhum modelo compatível encontrado')
    modelOptions.value = names
    testResult.value = { ok: true, msg: `${names.length} modelo(s) carregado(s)` }
  } catch (e) {
    testResult.value = { ok: false, msg: e.message }
  } finally {
    loadingModels.value = false
  }
}

function load() {
  apiKey.value = localStorage.getItem('gemini_api_key') || ''
  modelName.value = localStorage.getItem('gemini_model') || 'gemini-2.5-flash'
  testResult.value = null
}

watch(() => props.modelValue, (open) => {
  if (open) load()
})

function save() {
  localStorage.setItem('gemini_api_key', apiKey.value.trim())
  localStorage.setItem('gemini_model', modelName.value.trim() || 'gemini-2.5-flash')
  emit('saved')
  emit('update:modelValue', false)
}

async function testConnection() {
  if (!apiKey.value.trim() || !modelName.value.trim()) {
    testResult.value = { ok: false, msg: 'Preencha API key e modelo' }
    return
  }
  testing.value = true
  testResult.value = null
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName.value.trim()}:generateContent?key=${apiKey.value.trim()}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'ping' }] }],
        generationConfig: { maxOutputTokens: 5 }
      })
    })
    const data = await res.json()
    if (res.ok) {
      testResult.value = { ok: true, msg: 'Funcionou! ✓' }
    } else {
      testResult.value = { ok: false, msg: data?.error?.message || `Erro ${res.status}` }
    }
  } catch (e) {
    testResult.value = { ok: false, msg: e.message }
  } finally {
    testing.value = false
  }
}

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <q-dialog :model-value="modelValue" @update:model-value="close" persistent>
    <q-card style="min-width: 320px; max-width: 92vw;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Configurações Gemini</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="close" />
      </q-card-section>

      <q-card-section class="q-gutter-md">
        <q-input
          v-model="apiKey"
          label="API Key do Gemini"
          :type="showKey ? 'text' : 'password'"
          outlined
          dense
          autocomplete="off"
        >
          <template v-slot:append>
            <q-icon
              :name="showKey ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showKey = !showKey"
            />
          </template>
        </q-input>

        <q-select
          v-model="modelName"
          :options="modelOptions"
          label="Modelo"
          hint="Selecione ou digite uma versão nova"
          outlined
          dense
          use-input
          hide-selected
          fill-input
          input-debounce="0"
          new-value-mode="add-unique"
          @new-value="addModel"
        />

        <div class="row q-gutter-sm">
          <q-btn
            label="Listar modelos"
            color="primary"
            outline
            :loading="loadingModels"
            @click="fetchModels"
            class="col"
          />
          <q-btn
            label="Testar"
            color="secondary"
            outline
            :loading="testing"
            @click="testConnection"
            class="col"
          />
        </div>

        <q-banner
          v-if="testResult"
          :class="testResult.ok ? 'bg-positive text-white' : 'bg-negative text-white'"
          dense
          rounded
        >
          {{ testResult.msg }}
        </q-banner>

        <div class="text-caption text-grey-7">
          Chave salva só no seu dispositivo (localStorage). Pega a sua em
          <a href="https://aistudio.google.com/apikey" target="_blank" style="color: inherit;">aistudio.google.com/apikey</a>.
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancelar" @click="close" />
        <q-btn unelevated color="primary" label="Salvar" @click="save" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
