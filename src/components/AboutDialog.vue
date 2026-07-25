<script setup>
import { ref } from 'vue'

defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])

const version = __APP_VERSION__
const buildDate = new Date(__BUILD_DATE__).toLocaleString('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short'
})

const updating = ref(false)

// Limpa tudo que o navegador guardou e recarrega buscando da rede.
async function update() {
  updating.value = true
  try {
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map(key => caches.delete(key)))
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map(reg => reg.unregister()))
    }
  } catch (err) {
    // Se algo falhar, o reload abaixo ainda tenta buscar da rede.
  }
  location.replace(`${import.meta.env.BASE_URL}?u=${Date.now()}`)
}

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <q-dialog :model-value="modelValue" @update:model-value="close">
    <q-card style="min-width: 320px; max-width: 92vw;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Sobre</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="close" />
      </q-card-section>

      <q-card-section class="column items-center q-gutter-sm">
        <q-icon name="menu_book" size="48px" color="primary" />
        <div class="text-subtitle1">Bíblia NWT</div>
        <div class="text-h6 text-primary">v{{ version }}</div>
        <div class="text-caption text-grey-7">Compilado em {{ buildDate }}</div>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pt-md">
        <q-btn
          unelevated
          color="primary"
          class="full-width"
          icon="refresh"
          label="Atualizar aplicativo"
          :loading="updating"
          @click="update"
        />
        <div class="text-caption text-grey-7 text-center q-mt-sm">
          Limpa os arquivos salvos e recarrega a versão mais recente.
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
