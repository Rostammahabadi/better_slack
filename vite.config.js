import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true
        }
      }
    },
    css: {
      devSourcemap: true
    },
    define: {
      'process.env': {
        VITE_AUTH0_DOMAIN: env.VITE_AUTH0_DOMAIN,
        VITE_AUTH0_CLIENT_ID: env.VITE_AUTH0_CLIENT_ID,
        VITE_AUTH0_AUDIENCE: env.VITE_AUTH0_AUDIENCE,
        VITE_API_URL: env.VITE_API_URL
      }
    }
  }
})
