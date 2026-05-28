import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('element-plus') || id.includes('@element-plus')) {
            return 'vendor-element-plus'
          }

          if (id.includes('echarts') || id.includes('vue-echarts') || id.includes('zrender')) {
            return 'vendor-charts'
          }

          if (id.includes('xlsx')) {
            return 'vendor-xlsx'
          }

          if (id.includes('vue') || id.includes('pinia')) {
            return 'vendor-vue'
          }

          return 'vendor'
        }
      }
    }
  }
})
