# 🐷 Piggy Plan · วางแผนการเงินส่วนตัว

A friendly Thai personal-finance app: monthly budgeting, income-tax planning
(สิทธิลดหย่อน ปีภาษี 2569), overtime (OT) calculation, and provident-fund (PVD)
retirement projection — plus account/profile management and auth.

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
        ├── settings/       # full-page account settings
        ├── profile/        # profile menu + settings modal + tabs (Avatar, ProfileMenu)
        └── auth/           # login / signup / forgot-password (standalone page)
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
