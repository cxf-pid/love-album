import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/love-album/',
  plugins: [vue(), tailwindcss()],
  server: {
    port: 3000,
    open: true
  }
})
