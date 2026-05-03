import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const allowedPreviewHosts = [
  process.env.RAILWAY_PUBLIC_DOMAIN,
  process.env.FRONTEND_PUBLIC_DOMAIN,
].filter(Boolean)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: allowedPreviewHosts,
  },
})
