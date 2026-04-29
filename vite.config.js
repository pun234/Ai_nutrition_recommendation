import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: [
      'ai-nutrition-recommendation-1.onrender.com'
    ],
   
    port: process.env.PORT || 4173,
    host: '0.0.0.0'
  }
})
