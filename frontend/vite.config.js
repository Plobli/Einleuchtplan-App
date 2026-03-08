import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Theater Einleuchtplan',
        short_name: 'Einleuchtplan',
        description: 'Lichttechnischer Einleuchtplan für Theater',
        theme_color: '#0d0c10',
        background_color: '#0d0c10',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/shows\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-shows',
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [200] }
            }
          },
          {
            urlPattern: /^\/api\/shows$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-shows-list',
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [200] }
            }
          },
          {
            urlPattern: /^\/api\/channels\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-channels',
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [200] }
            }
          }
        ]
      }
    })
  ],
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
