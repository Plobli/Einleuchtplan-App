import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 443,
      host: 'theater.cfrlab.de'
    },
    proxy: {},
    watch: {
      usePolling: true
    }
  }
})
