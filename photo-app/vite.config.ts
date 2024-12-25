import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['aws-amplify', '@aws-amplify/auth'], // Add specific auth package if using direct import
  },
  build: {
    rollupOptions: {
      external: ['aws-amplify', '@aws-amplify/auth'], // Mark auth external if importing directly
    },
  },
});
