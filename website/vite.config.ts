import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Brain-Connectome-Analysis/',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1600,
  },
});
