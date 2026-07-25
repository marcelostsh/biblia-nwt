import { createApp } from 'vue'
import { Quasar, Notify } from 'quasar'

import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'

import App from './App.vue'

const app = createApp(App)

app.use(Quasar, {
  plugins: { Notify },
  config: {
    brand: {
      primary: '#4a6da7',
      secondary: '#7b968f',
      accent: '#c9a96e',
      dark: '#1d1d1d'
    }
  }
})

app.mount('#app')

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // ?v= muda a cada release: o browser vê um script novo e reinstala o SW.
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js?v=${__APP_VERSION__}`)
      .then(reg => reg.update())
      .catch(() => {})
  })
}
