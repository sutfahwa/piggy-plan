import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Single page: the main app (index.html). The auth/login page (login.html +
// src/features/auth) is intentionally NOT built — the account feature is hidden,
// so the login screen must not be reachable, even at /login. The source is kept;
// to re-enable, add `login: resolve(__dirname, 'login.html')` back below.
// Each feature lives under src/features/<feature> so it can be developed and
// shipped on its own branch with minimal cross-file churn.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
});
