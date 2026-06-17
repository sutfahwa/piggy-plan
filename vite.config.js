import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

// Single page (index.html). Auth is an in-app gate (src/features/auth/AuthScreen.jsx
// rendered by App.jsx) — login is required before the app loads, and per-user data
// lives in Firebase (see src/shared/firebase.js). Each feature lives under
// src/features/<feature> so it can be developed/shipped on its own branch.
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
