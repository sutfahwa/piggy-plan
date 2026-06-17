import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Two pages: the main app (index.html) and the auth screen (login.html).
// Each feature lives under src/features/<feature> so it can be developed and
// shipped on its own branch with minimal cross-file churn.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
      },
    },
  },
});
