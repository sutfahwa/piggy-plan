# 🐷 Piggy Plan · วางแผนการเงินส่วนตัว

A friendly Thai personal-finance app: monthly budgeting, income-tax planning
(สิทธิลดหย่อน ปีภาษี 2569), overtime (OT) calculation, and provident-fund (PVD)
retirement projection. All data is stored **on-device** (`localStorage`) — no
sign-in required.

> The account/profile feature (login, profile, change password, account
> settings) is currently **hidden** behind a flag — the code is kept, not
> deleted. See [Account feature (hidden)](#account-feature-hidden).

Implemented from a [Claude Design](https://claude.ai/design) handoff bundle as a
real **Vite + React** app. Each feature lives in its own folder so it can be
developed and shipped on a separate git branch with minimal cross-file churn.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173  (main app: /, auth: /login.html)
npm run build    # production build → dist/
npm run preview  # serve the production build
```

## Project structure

```
PiggyPlan/
├── index.html              # main app entry  →  src/App.jsx
├── login.html              # auth entry      →  src/features/auth/login.jsx
├── vite.config.js          # 2-page build (main + login)
└── src/
    ├── App.jsx             # app shell: routing between pages, theme tweaks
    ├── styles.css          # the whole design system (colors, components, layout)
    ├── shared/             # cross-feature foundation
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
        ├── settings/       # full-page account settings        (hidden — see flag)
        ├── profile/        # profile menu + settings modal + tabs (hidden — holds the flag)
        └── auth/           # login / signup / forgot-password   (hidden — orphaned page)
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

State persists to `localStorage` under the `finplan:` prefix.

## Account feature (hidden)

Login, profile management, change-password, account settings, and logout are
currently **turned off** so the app runs purely on-device with no sign-in. The
code is intact — nothing was deleted.

`ProfileMenu` (the avatar at the top-right) is the only entry point to all of
these, so a single flag gates everything across web **and** mobile:

```js
// src/features/profile/profile.jsx
const ACCOUNT_ENABLED = false;   // ← set to true to restore the account feature
```

When `false`, `ProfileMenu` renders nothing, so the avatar, profile dropdown,
settings page, and logout/login redirect never appear. `login.html` still builds
but nothing links to it. Flip the flag to `true` to bring the whole feature back.

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
