import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // ★★★ 핵심 추가 부분 ★★★
  envDir: '.',   // 루트에서 .env 로딩하도록 강제
})
