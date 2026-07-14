import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base: './' — относительные пути, чтобы сборка работала на GitHub Pages
// в любом репозитории (username.github.io/имя-репо/) без доп. настройки.
export default defineConfig({
  base: './',
  plugins: [vue()],
  server: {
    host: true, // слушать все интерфейсы (нужно для предпросмотра в песочнице)
    strictPort: false,
  },
})
