import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      port: parseInt(env.VITE_PORT || '3000'),
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        },
        '/ws': {
          target: env.VITE_WS_BASE_URL?.replace('ws://', 'http://').replace('wss://', 'https://') || 'http://localhost:8000',
          ws: true
        }
      }
    }
  }
})

