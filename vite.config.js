import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

// Single page: the main app (index.html). The auth/login page (login.html +
// src/features/auth) is intentionally NOT built — the account feature is hidden,
// so the login screen must not be reachable, even at /login. The source is kept;
// to re-enable, add `login: resolve(__dirname, 'login.html')` back below.
// Each feature lives under src/features/<feature> so it can be developed and
// shipped on its own branch with minimal cross-file churn.
//
// VitePWA makes the deployed site installable on mobile (Add to Home Screen)
// and work offline. SW registration is done manually in App.jsx, guarded so it
// only runs on the web (never inside the Capacitor Android WebView).
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        navigateFallback: '/index.html',
      },
      manifest: {
        name: 'Piggy Plan',
        short_name: 'Piggy Plan',
        description: 'วางแผนการเงินส่วนตัว — งบรายเดือน ภาษี OT และกองทุนเกษียณ',
        lang: 'th',
        dir: 'ltr',
        theme_color: '#F0635F',
        background_color: '#FFF3EC',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
});
