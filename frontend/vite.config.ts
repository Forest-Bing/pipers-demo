import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // 后端 FastAPI 默认跑在 8000，用代理转发，前端不会遇到跨域问题。
    // 需要后端把路由挂到 /api 前缀下（app.include_router(api_router, prefix="/api")）。
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
