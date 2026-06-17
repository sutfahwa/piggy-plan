/* Render Piggy Plan source assets (icon foreground/background + splash) to PNG.
   These feed `npx @capacitor/assets generate` which produces every Android
   density + adaptive icon. Re-run with: node scripts/gen-icons.mjs            */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

mkdirSync('assets', { recursive: true });
mkdirSync('public', { recursive: true });

// Brand-mark piggy (white line art) — same glyph used in the app header.
const PIGGY = 'M3 11.5c0-2.8 2.6-5 6-5h3.5c.8-1 2-1.6 3.2-1.6 0 .8-.3 1.5-.7 2 .9.6 1.6 1.5 1.9 2.6l1.6.5c.4.1.6.5.6.9V14c0 .5-.4.9-.9.9h-1.2c-.4.6-.9 1.1-1.5 1.5V18a1 1 0 0 1-1 1h-1.2a1 1 0 0 1-1-1v-.6a7.7 7.7 0 0 1-2.7 0V18a1 1 0 0 1-1 1H7.9a1 1 0 0 1-1-1v-1.7C5 15.2 3.8 13.5 3.6 11.5Z';

// piggy group at a given scale/translate/stroke, drawn in `color`
const piggyGroup = (tx, ty, s, sw, color = '#ffffff') => `
  <g transform="translate(${tx},${ty}) scale(${s})" fill="none" stroke="${color}"
     stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">
    <path d="${PIGGY}"/>
    <circle cx="15" cy="11" r="0.9" fill="${color}" stroke="none"/>
  </g>`;

const coralBg = (id) => `
  <defs><linearGradient id="${id}" x1="0" y1="0" x2="0.35" y2="1">
    <stop offset="0" stop-color="#FFA39A"/><stop offset="1" stop-color="#F0635F"/>
  </linearGradient></defs>`;

// 1024 adaptive FOREGROUND — white piggy centered within the safe zone, transparent bg
const fgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${piggyGroup(-16, -24.8, 44, 1.15)}
</svg>`;

// 1024 adaptive BACKGROUND — coral gradient, full bleed
const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${coralBg('g')}<rect width="1024" height="1024" fill="url(#g)"/>
</svg>`;

// 1024 legacy ICON — composite coral bg + white piggy (rounded by the launcher)
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${coralBg('g2')}<rect width="1024" height="1024" fill="url(#g2)"/>
  ${piggyGroup(-16, -24.8, 44, 1.15)}
</svg>`;

// 2732 SPLASH — peach canvas with a centered coral brand tile
const splashSvg = (bg) => `<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732" viewBox="0 0 2732 2732">
  ${coralBg('g3')}
  <rect width="2732" height="2732" fill="${bg}"/>
  <rect x="986" y="986" width="760" height="760" rx="190" fill="url(#g3)"/>
  ${piggyGroup(1102, 1097.6, 22, 1.3)}
</svg>`;

// 1024 MASKABLE — coral bg + piggy with extra padding (art ~63%, inside the
// maskable safe zone so launchers/PWA masks never clip it)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  ${coralBg('gm')}<rect width="1024" height="1024" fill="url(#gm)"/>
  ${piggyGroup(80, 72.8, 36, 1.15)}
</svg>`;

const png = (svg, file, size, dir = 'assets') =>
  sharp(Buffer.from(svg)).resize(size, size).png().toFile(dir + '/' + file);

await Promise.all([
  // Capacitor (native Android) source assets
  png(fgSvg, 'icon-foreground.png', 1024),
  png(bgSvg, 'icon-background.png', 1024),
  png(iconSvg, 'icon-only.png', 1024),
  png(splashSvg('#FFF3EC'), 'splash.png', 2732),
  png(splashSvg('#2A1B17'), 'splash-dark.png', 2732),
  // PWA / web icons (served from public/)
  png(iconSvg, 'pwa-192.png', 192, 'public'),
  png(iconSvg, 'pwa-512.png', 512, 'public'),
  png(maskableSvg, 'pwa-maskable-512.png', 512, 'public'),
  png(iconSvg, 'apple-touch-icon.png', 180, 'public'),
  png(iconSvg, 'favicon.png', 64, 'public'),
]);

console.log('✓ wrote assets/ (Capacitor) + public/ (PWA) icons');
