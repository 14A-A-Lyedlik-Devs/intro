import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useTranslationStore } from '@/stores/translationStore'

import App from './App.vue'
import router from './router'
import 'virtual:windi.css'
import 'virtual:fonts.css'
import './assets/main.css'
import CustomScrollbar from 'custom-vue-scrollbar'
import 'custom-vue-scrollbar/dist/style.css'

const app = createApp(App)

app.use(createPinia())

const translationStore = useTranslationStore()
translationStore.loadTranslations()

app.use(router)

app.component(CustomScrollbar.name, CustomScrollbar)

app.mount('#app')

declare module 'vue' {
  export interface GlobalComponents {
    CustomScrollbar: typeof CustomScrollbar
  }
}
