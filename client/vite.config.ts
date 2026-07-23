import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // simple-peer's stream chain (readable-stream) does `require('events')`
      // expecting Node's EventEmitter. Vite/Rolldown treats core Node modules
      // as external by default instead of bundling a browser shim, which left
      // that import as `undefined` at runtime and crashed with
      // "TypeError: Cannot read properties of undefined (reading 'call')"
      // the moment a WebRTC peer connection was created. The npm `events`
      // package is the standard browser-compatible EventEmitter polyfill.
      events: 'events',
    },
  },
  define: {
    // Some deps (yjs, simple-peer and their transitive deps) reference the
    // Node.js `global` object, which doesn't exist in the browser.
    global: 'globalThis',
  },
})
