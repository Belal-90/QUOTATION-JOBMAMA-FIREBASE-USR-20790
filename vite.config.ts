import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Firebase Storage CORS এড়াতে same-origin দিয়ে ইমেজ লোড (PDF export এর জন্য)
      '/__firebase-storage-proxy': {
        target: 'https://firebasestorage.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/__firebase-storage-proxy/, ''),
        secure: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 4173,
    allowedHosts: [
      'quotation-jobmama-firebase-usr-20790.onrender.com',
      ...(process.env.RENDER_EXTERNAL_HOSTNAME ? [process.env.RENDER_EXTERNAL_HOSTNAME] : []),
    ],
  },
})
