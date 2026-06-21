# 🐷 Piggy Plan · วางแผนการเงินส่วนตัว

A friendly Thai personal-finance app: monthly budgeting, income-tax planning
(สิทธิลดหย่อน ปีภาษี 2569), overtime (OT) calculation, and provident-fund (PVD)
retirement projection.

**Login is required** (Firebase Auth — email/password + Google). Each user's data
is stored per-account in Firestore and synced across devices; `localStorage` is
used as a per-user cache. See [Accounts & per-user data](#accounts--per-user-data-firebase).

Implemented from a [Claude Design](https://claude.ai/design) handoff bundle as a
real **Vite + React** app. Each feature lives in its own folder so it can be
developed and shipped on a separate git branch with minimal cross-file churn.

## Getting started

```bash
npm install
cp .env.example .env   # then fill in your Firebase web config (see below)
npm run dev            # http://localhost:5173
npm run build          # production build → dist/
npm run preview        # serve the production build
```

> Without a `.env`, the app shows a "configure Firebase" notice instead of the
> login screen.

## Project structure

```
PiggyPlan/
├── index.html              # app entry  →  src/App.jsx
├── vite.config.js          # single-page build + PWA
├── .env.example            # Firebase web config template (copy to .env)
├── firestore.rules         # Firestore security rules (per-user isolation)
└── src/
    ├── App.jsx             # auth gate (login required) + app shell + cloud sync
    ├── styles.css          # the whole design system (colors, components, layout)
    ├── shared/             # cross-feature foundation
    │   ├── firebase.js     # Auth (email + Google) + per-user Firestore load/save
    │   ├── globals.js      # load-order barrel (run before any feature page)
    │   ├── data.jsx        # formats, mock data, tax/PVD/retirement formulas, icons
    │   ├── inputs.jsx      # MoneyInput, CustomSelect (used by several features)
    │   ├── charts.jsx      # Donut, GroupedBars, AreaChart, LineChart, Ring, CompareBars
    │   ├── modal.jsx       # global confirm/alert modal (window.showConfirm / showAlert)
    │   ├── tweaks-panel.jsx# design "tweaks" panel (theme / font / corners)
    │   └── nav.jsx         # Sidebar, Topbar, MobileTop/Nav, BrandMark
    └── features/
        ├── welcome/        # landing / home dashboard
        ├── plan/           # วางแผนการเงิน — monthly / summary / yearly savings (+ Excel export)
        ├── tax/            # วางแผนภาษี — income tax + deductions calculator
        ├── ot/             # คำนวณค่าล่วงเวลา — OT worksheet
        ├── retire/         # กองทุนสำรองเลี้ยงชีพ — PVD projection
        ├── settings/       # full-page account settings
        ├── profile/        # profile menu + settings modal + tabs
        └── auth/           # AuthScreen (login/signup/forgot) + auth.css
```

### Per-feature → per-branch workflow

A feature is self-contained in `src/features/<feature>/`. To work on one in
isolation, branch off and edit only that folder (plus `shared/` if a primitive
genuinely needs to change):

```bash
git checkout -b feat/tax     # then edit src/features/tax/** only
git checkout -b feat/retire  # then edit src/features/retire/** only
```

### How modules share code

The original design prototype shared code through global `window` assignments and
ordered `<script>` tags. That model is preserved but made into real ES modules:
each shared module still does `Object.assign(window, {...})`, and
`src/shared/globals.js` imports them in dependency order. Any feature page
side-effect-imports `globals.js` (so `window` is fully populated) and then reads
what it needs via a destructure from `window`. `App.jsx` additionally imports
each feature page so their components register before the app mounts.

Each feature reads/writes app state via `useStored` (localStorage under the
`finplan:` prefix); that state is the unit synced to the cloud per user.

## Accounts & per-user data (Firebase)

Login is required. On sign-in, the user's saved state is loaded from Firestore
into `localStorage`; on any change it's pushed back (debounced). Local data is
cleared on every auth change, so two accounts on the same device never see each
other's data. The whole `finplan:*` state is stored as one document per user:
`users/{uid}`. (`ACCOUNT_ENABLED` in `src/features/profile/profile.jsx` is now
`true`; set it to `false` to hide accounts again.)

### One-time Firebase setup

1. **Create a project** at [console.firebase.google.com](https://console.firebase.google.com).
2. **Add a Web app** (`</>`), copy the config values into your `.env`
   (see `.env.example`).
3. **Authentication → Sign-in method:** enable **Email/Password** and **Google**.
4. **Firestore Database → Create database** (Production mode).
5. **Firestore → Rules:** paste [`firestore.rules`](firestore.rules) and Publish
   (each user can read/write only their own `users/{uid}` doc).
6. **Authentication → Settings → Authorized domains:** add your Netlify domain
   (and `localhost` is allowed by default) so Google sign-in works in production.
7. `npm run build` (env is read at build time) and deploy.

The Firebase web keys are public client config — access is controlled by the
security rules + Auth, not by hiding the keys. `.env` is gitignored anyway.

> **Android note:** Google sign-in via popup may not work inside the Capacitor
> WebView; email/password works there. For native Google sign-in later, add the
> `@capacitor-firebase/authentication` plugin.

### Local testing (never touches production)

In **dev mode** (`npm run dev`) the app is fully isolated from production:

- **Accounts → Firebase Auth Emulator** (local) — test sign-ups never hit the
  production user pool.
- **Data → local SQLite** (`src/shared/sqlite.js`) — saved on your machine, not
  Firestore. Inspect it in **DBeaver** by exporting the file: open the browser
  console and run `downloadDB()` (from `src/shared/db-tool.js`), then open the
  downloaded `.db` in DBeaver.

Run two terminals:

```bash
npm run emu    # 1) start Firebase emulators (Auth + Firestore) — UI at http://localhost:4000
npm run dev    # 2) start the app (it auto-connects to the emulators in dev)
```

All of this is **dev-only** (`import.meta.env.DEV`) and is stripped from the
production build — `npm run build` / Netlify always use the real Firebase
project. (Emulators need JDK, which the Android setup already requires.)

## Install on mobile (PWA)

The deployed web app is an installable PWA (`vite-plugin-pwa` — manifest +
Workbox service worker), so it works **without** the APK on any phone:

- **Android (Chrome):** open the site → menu → **Add to Home screen / Install app**.
- **iOS (Safari):** open the site → Share → **Add to Home Screen**.

It then launches full-screen (standalone), shows the piggy icon, and works
offline (the app shell is precached). The service worker only runs on the web —
it is intentionally skipped inside the Capacitor Android app.

## Android app (Capacitor)

The web app is wrapped as a native Android app with [Capacitor](https://capacitorjs.com).
The native project lives in `android/` (`appId` `com.piggyplan.app`).

```bash
npm run android:sync   # build web → copy into the Android project
npm run android:open   # …and open it in Android Studio
npm run android:apk    # …and build a debug APK via Gradle
```

The debug APK is produced at:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

Install it on a device/emulator with:

```bash
~/Library/Android/sdk/platform-tools/adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Requirements: JDK 21, Android SDK (compile/target SDK 35). After changing any web
code, re-run `npm run android:sync` (or `android:apk`) so the native project picks
up the new build.

### App name & icon

The launcher name is **Piggy Plan** (`android/app/src/main/res/values/strings.xml`).
The launcher icon is the brand mark (white piggy on a coral gradient). Source art
is rendered by `scripts/gen-icons.mjs` into `assets/`, then expanded to every
density + adaptive/round icon + splash:

```bash
npm run android:icons   # regenerate icons from scripts/gen-icons.mjs
```

Edit the piggy/colors in `scripts/gen-icons.mjs` and re-run to restyle.

Notes:
- Google Fonts load from the CDN, so the first launch needs an internet connection
  (fonts then cache). Everything else runs fully offline.
- Excel export uses a browser download, which behaves differently inside the
  Android WebView — for a production release this should move to Capacitor's
  Filesystem + Share plugins.
- This builds a **debug** APK. A Play Store release needs a signed release build
  (`assembleRelease` with a keystore).
