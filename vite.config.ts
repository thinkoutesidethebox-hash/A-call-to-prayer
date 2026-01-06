import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // This ensures your existing code using process.env.API_KEY works without refactoring
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  }
})