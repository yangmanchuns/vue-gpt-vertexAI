import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

console.log("ENV CHECK:", import.meta.env);
console.log("GEMINI:", import.meta.env.VITE_GEMINI_API_KEY);

createApp(App).mount('#app')
