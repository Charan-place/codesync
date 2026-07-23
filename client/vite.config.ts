import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Some deps (yjs, simple-peer and their transitive deps) reference the
    // Node.js `global` object, which doesn't exist in the browser.
    global: 'globalThis',
  },
})
