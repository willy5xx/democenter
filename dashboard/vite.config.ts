import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  optimizeDeps: {
    include: ['@tanstack/react-table'],
  },
  server: {
    proxy: {
      // Proxy vendVision backend API first (more specific paths)
      '^/api/(sites|machine-regions|settings|events|config|obs|health)': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // Proxy go2rtc WebRTC API (keep these after backend to avoid conflicts)
      '/api/webrtc': {
        target: 'http://localhost:1984',
        changeOrigin: true,
        ws: true, // Enable WebSocket proxying for WebRTC
      },
      '/api/streams': {
        target: 'http://localhost:1984',
        changeOrigin: true,
      },
    },
  },
})
