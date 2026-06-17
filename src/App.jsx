/* ============================================================
   App.jsx — main app entry + Tweaks
   ============================================================ */
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import './shared/globals.js';
import './features/welcome/WelcomeScreen.jsx';
import './features/plan/PlanPage.jsx';
import './features/tax/TaxPage.jsx';
import './features/ot/OTPage.jsx';
import './features/retire/RetirePage.jsx';
import './features/settings/SettingsPage.jsx';
const {
  useStored, useTweaks, TweaksPanel, TweakSection, TweakRadio, ConfirmHost,
  Ic, ICONS, NAV, Sidebar, Topbar, MobileTop, MobileNav, ProfileMenu, BrandMark, PROFILE_DEFAULT,
  WelcomeScreen, PlanPage, TaxPage, OTPage, RetirePage, SettingsPage,
} = window;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "fruit",
  "navLayout": "sidebar",
  "fontPair": "prompt",
  "cornerStyle": "round",
  "accent": "#FF8787"
}/*EDITMODE-END*/;

const THEMES = {
  fruit: { label: 'ผลไม้สด', attr: '', accent: '#F0635F' },
  mint:  { label: 'มินต์เย็น', attr: 'mint', accent: '#6BA257' },
  peach: { label: 'พีชอุ่น', attr: 'peach', accent: '#D9805F' },
};
const FONT_PAIRS = {
  prompt:  { head: '"Prompt", sans-serif', body: '"IBM Plex Sans Thai", sans-serif' },
  looped:  { head: '"Mali", cursive', body: '"IBM Plex Sans Thai Looped", sans-serif' },
  clean:   { head: '"Bai Jamjuree", sans-serif', body: '"Noto Sans Thai", sans-serif' },
};
const CORNERS = {
  sharp:  { sm: '6px',  r: '10px', lg: '14px', xl: '18px' },
  round:  { sm: '12px', r: '18px', lg: '26px', xl: '34px' },
  pill:   { sm: '16px', r: '24px', lg: '34px', xl: '44px' },
};

function AppTweaks({ t, setTweak }) {
  return (
    <TweaksPanel title="ปรับแต่งดีไซน์">
      <TweakSection label="ธีมสี" />
      <TweakRadio label="โทนสี" value={t.theme} onChange={v => setTweak('theme', v)}
        options={[{ value: 'fruit', label: 'ผลไม้สด' }, { value: 'mint', label: 'มินต์' }, { value: 'peach', label: 'พีช' }]} />
      <TweakSection label="เลย์เอาต์" />
      <TweakRadio label="ตำแหน่งเมนู" value={t.navLayout} onChange={v => setTweak('navLayout', v)}
        options={[{ value: 'sidebar', label: 'ด้านข้าง' }, { value: 'top', label: 'ด้านบน' }]} />
      <TweakRadio label="ความมนของขอบ" value={t.cornerStyle} onChange={v => setTweak('cornerStyle', v)}
        options={[{ value: 'sharp', label: 'เหลี่ยม' }, { value: 'round', label: 'มน' }, { value: 'pill', label: 'มนมาก' }]} />
      <TweakSection label="ฟอนต์" />
      <TweakRadio label="คู่ฟอนต์" value={t.fontPair} onChange={v => setTweak('fontPair', v)}
        options={[{ value: 'prompt', label: 'Prompt' }, { value: 'looped', label: 'มน' }, { value: 'clean', label: 'เรียบ' }]} />
    </TweaksPanel>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [page, setPage] = React.useState('welcome');
  const [sub, setSub] = React.useState('monthly');
  const [profile, setProfile] = useStored('profile', PROFILE_DEFAULT);
  const [settingsSec, setSettingsSec] = React.useState('profile');

  const openSettings = (sec) => { setSettingsSec(sec || 'profile'); setPage('settings'); };
  const logout = async () => {
    const ok = window.showConfirm
      ? await window.showConfirm({ type: 'warning', title: 'ออกจากระบบ', message: 'ต้องการออกจากระบบ Piggy Plan ใช่หรือไม่?', confirmText: 'ออกจากระบบ', cancelText: 'ยกเลิก' })
      : window.confirm('ต้องการออกจากระบบใช่หรือไม่?');
    if (ok) window.location.href = '/login.html';
  };

  React.useEffect(() => {
    const root = document.documentElement;
    const th = THEMES[t.theme] || THEMES.fruit;
    if (th.attr) root.setAttribute('data-theme', th.attr); else root.removeAttribute('data-theme');
    const fp = FONT_PAIRS[t.fontPair] || FONT_PAIRS.prompt;
    root.style.setProperty('--font-head', fp.head);
    root.style.setProperty('--font-body', fp.body);
    const cs = CORNERS[t.cornerStyle] || CORNERS.round;
    root.style.setProperty('--r-sm', cs.sm);
    root.style.setProperty('--r', cs.r);
    root.style.setProperty('--r-lg', cs.lg);
    root.style.setProperty('--r-xl', cs.xl);
  }, [t.theme, t.fontPair, t.cornerStyle]);

  const month = new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
  const open = (p, s) => { setPage(p); if (s) setSub(s); };

  // Welcome — full-screen landing
  if (page === 'welcome') {
    return (
      <React.Fragment>
      <WelcomeScreen open={open} profile={profile} setProfile={setProfile} onOpenSettings={openSettings} key="welcome" />
        <AppTweaks t={t} setTweak={setTweak} />
        <ConfirmHost />
      </React.Fragment>
    );
  }

  let body;
  if (page === 'plan') body = <PlanPage sub={sub} setSub={setSub} key={'plan-' + sub} />;
  else if (page === 'tax') body = <TaxPage key="tax" />;
  else if (page === 'ot') body = <OTPage key="ot" />;
  else if (page === 'retire') body = <RetirePage key="retire" />;
  else if (page === 'settings') body = <SettingsPage section={settingsSec} setSection={setSettingsSec}
    profile={profile} setProfile={setProfile} onClose={() => setPage('welcome')} onLogout={logout} key="settings" />;

  return (
    <div className={'app' + (t.navLayout === 'top' ? ' layout-top' : '')}>
      {t.navLayout === 'sidebar' && <Sidebar page={page} setPage={setPage} sub={sub} setSub={setSub} />}
      <div className="main">
        <MobileTop page={page} setPage={setPage} profile={profile} setProfile={setProfile} onOpenSettings={openSettings} />
        {t.navLayout === 'sidebar'
          ? <Topbar page={page} sub={sub} month={month} setPage={setPage} profile={profile} setProfile={setProfile} onOpenSettings={openSettings} />
          : <TopNav page={page} setPage={setPage} sub={sub} setSub={setSub} month={month} profile={profile} setProfile={setProfile} onOpenSettings={openSettings} />}
        {body}
      </div>
      <MobileNav page={page} setPage={setPage} sub={sub} setSub={setSub} />
      <AppTweaks t={t} setTweak={setTweak} />
      <ConfirmHost />
    </div>
  );
}

/* top navigation variant */
function TopNav({ page, setPage, sub, setSub, month, profile, setProfile, onOpenSettings }) {
  const go = (n) => { setPage(n.id); if (n.subs) setSub(n.subs[0].id); };
  return (
    <header className="topnav">
      <button className="brand" onClick={() => setPage('welcome')} style={{ padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}>
        <BrandMark />
        <div><div className="brand-name">Piggy Plan</div></div>
      </button>
      <nav className="topnav-items">
        <button className="topnav-item" onClick={() => setPage('welcome')}>
          <Ic d={ICONS.home} size={19} /> หน้าแรก
        </button>
        {NAV.map(n => (
          <button key={n.id} className={'topnav-item' + (page === n.id ? ' active' : '')} onClick={() => go(n)}>
            <Ic d={ICONS[n.icon]} size={19} /> {n.label}
          </button>
        ))}
      </nav>
      <div style={{ flex: 1 }} />
      <ProfileMenu profile={profile} setProfile={setProfile} onOpenSettings={onOpenSettings} />
    </header>
  );
}

Object.assign(window, { TopNav, AppTweaks });

// Reuse the root across Vite HMR reloads so dev doesn't warn about
// calling createRoot() twice on the same container.
const container = document.getElementById('root');
window.__pp_root = window.__pp_root || ReactDOM.createRoot(container);
window.__pp_root.render(<App />);

// PWA: register the service worker on the web only. Inside the Capacitor
// Android app the assets are already bundled, so we skip the SW there.
if (import.meta.env.PROD && !window.Capacitor && 'serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }));
}
