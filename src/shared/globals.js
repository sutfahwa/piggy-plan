/* ============================================================
   globals.js — load order barrel.

   The design prototype shared code via `window` globals + ordered
   <script> tags. We keep that runtime model but make it real ES
   modules: importing this barrel runs every shared module once, in
   dependency order, so `window` is fully populated before any feature
   page (which side-effect-imports this file) destructures from it.
   ============================================================ */
import './data.jsx';
import './inputs.jsx';
import './charts.jsx';
import './modal.jsx';
import './tweaks-panel.jsx';
import '../features/profile/profile.jsx';
import './nav.jsx';
