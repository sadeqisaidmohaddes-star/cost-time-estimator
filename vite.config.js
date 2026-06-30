import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Single-page app, no backend. All state is in-memory React state.
export default defineConfig({
  base: '/cost-time-estimator/',
  plugins: [react(), tailwindcss()],
})
