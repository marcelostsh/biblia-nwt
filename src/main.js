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
    navigator.serviceWorker.register('/biblia-nwt/sw.js')
  })
}
