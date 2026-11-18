import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Enable JSX/React Fast Refresh for the development server.
export default defineConfig({
  plugins: [react()],
})
