/* ============================================================
   login.jsx — auth feature (login · signup · forgot password)
   Standalone entry rendered by login.html.
   ============================================================ */
import React from 'react';
import ReactDOM from 'react-dom/client';
import '../../styles.css';
import './auth.css';

const { useState } = React;

/* ---------- icons ---------- */
function GoogleG() {
  return (
    <svg width="19" height="19" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  );
}
function Eye({ off }) {
  return off ? (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><path d="M6.61 6.61A18.5 18.5 0 0 0 2 12s3 8 10 8a9.12 9.12 0 0 0 5.39-1.61M2 2l20 20"/></svg>
  ) : (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8Z"/><circle cx="12" cy="12" r="3"/></svg>
  );
}
function CheckIc() {
  return <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>;
}
function BrandMark() {
  return (
    <div className="brand-mark">
      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 18V9M9 18V5M14 18v-6M19 18v-9" />
      </svg>
    </div>
  );
}
function Piggy() {
  return (
    <div className="auth-piggy" aria-hidden="true">
      <svg viewBox="0 0 220 210" width="100%" height="100%">
        <defs>
          <radialGradient id="pg" cx="42%" cy="34%" r="78%"><stop offset="0%" stopColor="#FFE2DC"/><stop offset="62%" stopColor="#FFC4BC"/><stop offset="100%" stopColor="#FFA59C"/></radialGradient>
          <radialGradient id="sn" cx="45%" cy="35%" r="75%"><stop offset="0%" stopColor="#FFC9C2"/><stop offset="100%" stopColor="#F89E96"/></radialGradient>
          <radialGradient id="co" cx="40%" cy="35%" r="75%"><stop offset="0%" stopColor="#FAD27A"/><stop offset="100%" stopColor="#E7A23B"/></radialGradient>
        </defs>
        <ellipse className="piggy-shadow" cx="110" cy="192" rx="60" ry="8.5" fill="rgba(120,70,60,.14)" />
        <g className="piggy-bob">
          <ellipse cx="84" cy="178" rx="13" ry="11" fill="#F8ABA2" />
          <ellipse cx="136" cy="178" rx="13" ry="11" fill="#F8ABA2" />
          <path className="ear ear-l" d="M66 64 C52 40 60 30 74 36 C86 41 92 58 88 74 C82 72 73 70 66 64 Z" fill="#F89E96" />
          <path className="ear ear-r" d="M154 64 C168 40 160 30 146 36 C134 41 128 58 132 74 C138 72 147 70 154 64 Z" fill="#F89E96" />
          <path className="ear ear-l" d="M70 62 C61 47 65 40 74 44 C82 48 85 59 82 69 C78 67 73 66 70 62 Z" fill="#FFD2CC" />
          <path className="ear ear-r" d="M150 62 C159 47 155 40 146 44 C138 48 135 59 138 69 C142 67 147 66 150 62 Z" fill="#FFD2CC" />
          <ellipse cx="110" cy="120" rx="73" ry="66" fill="url(#pg)" />
          <ellipse cx="92" cy="98" rx="34" ry="26" fill="#FFFFFF" opacity="0.22" />
          <rect x="92" y="58" width="36" height="9" rx="4.5" fill="#E08982" />
          <circle cx="70" cy="130" r="11" fill="#FF9A96" opacity="0.4" />
          <circle cx="150" cy="130" r="11" fill="#FF9A96" opacity="0.4" />
          <g className="eye eye-l"><ellipse cx="89" cy="108" rx="8.5" ry="9.5" fill="#5A463E" /><circle cx="86" cy="104.5" r="3" fill="#fff" /><circle cx="91.5" cy="111" r="1.5" fill="#fff" opacity="0.85" /></g>
          <g className="eye eye-r"><ellipse cx="131" cy="108" rx="8.5" ry="9.5" fill="#5A463E" /><circle cx="128" cy="104.5" r="3" fill="#fff" /><circle cx="133.5" cy="111" r="1.5" fill="#fff" opacity="0.85" /></g>
          <path d="M101 126 Q110 133 119 126" fill="none" stroke="#D77E78" strokeWidth="2.6" strokeLinecap="round" />
          <ellipse cx="110" cy="144" rx="25" ry="19" fill="url(#sn)" />
          <ellipse cx="103" cy="129" rx="9" ry="5" fill="#FFFFFF" opacity="0.3" />
          <ellipse cx="101.5" cy="144" rx="4" ry="7" fill="#D77E78" />
          <ellipse cx="118.5" cy="144" rx="4" ry="7" fill="#D77E78" />
        </g>
        <g className="coin"><circle cx="110" cy="40" r="15" fill="url(#co)" stroke="#D9912F" strokeWidth="2" /><text x="110" y="46" textAnchor="middle" fontSize="17" fontWeight="700" fill="#B9791F" fontFamily="Prompt, sans-serif">฿</text></g>
      </svg>
    </div>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function pwStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[0-9]/.test(pw) && /[a-zA-Z]/.test(pw)) s++;
  if (/[^a-zA-Z0-9]/.test(pw)) s++;
  return Math.min(s, 3);
}
const STRENGTH = [
  { label: '', color: 'var(--line)' },
  { label: 'อ่อน', color: 'var(--bad)' },
  { label: 'พอใช้', color: 'var(--warn)' },
  { label: 'แข็งแรง', color: 'var(--good)' },
];

const LEGAL = {
  terms: {
    title: 'เงื่อนไขการใช้งาน', emoji: '📋',
    updated: 'ปรับปรุงล่าสุด 1 มิถุนายน 2569',
    intro: 'ยินดีต้อนรับสู่ Piggy Plan โปรดอ่านเงื่อนไขต่อไปนี้ การสร้างบัญชีถือว่าคุณยอมรับเงื่อนไขทั้งหมด',
    secs: [
      { h: '1. การยอมรับเงื่อนไข', p: 'การสมัครและใช้งาน Piggy Plan ถือว่าคุณได้อ่านและยอมรับเงื่อนไขการใช้งานนี้ทั้งหมด หากไม่ยอมรับ กรุณางดใช้บริการ' },
      { h: '2. การใช้บริการ', p: 'Piggy Plan เป็นเครื่องมือช่วยวางแผนและบันทึกข้อมูลการเงินส่วนบุคคล คุณตกลงจะใช้บริการเพื่อวัตถุประสงค์ที่ถูกต้องตามกฎหมายเท่านั้น' },
      { h: '3. บัญชีผู้ใช้', p: 'คุณมีหน้าที่รักษารหัสผ่านและข้อมูลบัญชีของคุณให้ปลอดภัย และรับผิดชอบต่อกิจกรรมทั้งหมดที่เกิดขึ้นภายใต้บัญชีของคุณ' },
      { h: '4. ข้อมูลทางการเงิน', p: 'ตัวเลขภาษี เงินออม และการคำนวณต่าง ๆ มีไว้เพื่อการวางแผนเบื้องต้นเท่านั้น ไม่ถือเป็นคำแนะนำทางการเงินหรือการลงทุน โปรดปรึกษาผู้เชี่ยวชาญก่อนตัดสินใจ' },
      { h: '5. การจำกัดความรับผิด', p: 'เราพยายามให้บริการอย่างต่อเนื่องและถูกต้อง แต่ไม่รับประกันความสมบูรณ์ และไม่รับผิดต่อความเสียหายที่เกิดจากการใช้งาน' },
      { h: '6. การเปลี่ยนแปลงเงื่อนไข', p: 'เราอาจปรับปรุงเงื่อนไขเป็นครั้งคราว การใช้งานต่อหลังการเปลี่ยนแปลงถือว่าคุณยอมรับเงื่อนไขฉบับใหม่' },
    ],
  },
  privacy: {
    title: 'นโยบายความเป็นส่วนตัว', emoji: '🔒',
    updated: 'ปรับปรุงล่าสุด 1 มิถุนายน 2569',
    intro: 'เราให้ความสำคัญกับความเป็นส่วนตัวของคุณ นโยบายนี้อธิบายว่าเราเก็บและใช้ข้อมูลของคุณอย่างไร',
    secs: [
      { h: '1. ข้อมูลที่เราเก็บ', p: 'ชื่อที่ใช้แสดง อีเมล และข้อมูลการเงินที่คุณกรอกเอง เช่น งบรายเดือน ภาษี และเงินออม' },
      { h: '2. การใช้ข้อมูล', p: 'เราใช้ข้อมูลเพื่อแสดงผล คำนวณ และช่วยคุณวางแผนการเงินภายในแอปเท่านั้น' },
      { h: '3. การจัดเก็บและความปลอดภัย', p: 'ข้อมูลการเงินของคุณถูกจัดเก็บไว้ในอุปกรณ์ของคุณเอง (local storage) เราไม่ส่งออกไปยังเซิร์ฟเวอร์ภายนอกโดยไม่ได้รับอนุญาต' },
      { h: '4. การเปิดเผยต่อบุคคลที่สาม', p: 'เราจะไม่ขายหรือให้เช่าข้อมูลส่วนบุคคลของคุณแก่บุคคลที่สามเพื่อการตลาด' },
      { h: '5. สิทธิของคุณ', p: 'คุณสามารถดู แก้ไข หรือลบข้อมูลของคุณได้ตลอดเวลาผ่านหน้าตั้งค่าของแอป' },
      { h: '6. ติดต่อเรา', p: 'หากมีคำถามเกี่ยวกับความเป็นส่วนตัว ติดต่อได้ที่ privacy@piggyplan.app (ตัวอย่าง)' },
    ],
  },
};

function LegalModal({ which, onClose, onAccept }) {
  const [tab, setTab] = useState(which);
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const d = LEGAL[tab];
  return (
    <div className="legal-overlay" onClick={onClose}>
      <div className="legal-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="legal-close" onClick={onClose} aria-label="ปิด">✕</button>
        <div className="legal-tabs">
          {['terms', 'privacy'].map((k) => (
            <button key={k} type="button" className={'legal-tab' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>
              {LEGAL[k].emoji} {LEGAL[k].title}
            </button>
          ))}
        </div>
        <div className="legal-body">
          <p className="legal-updated">{d.updated}</p>
          <p className="legal-intro">{d.intro}</p>
          {d.secs.map((s, i) => (
            <div className="legal-sec" key={i}>
              <h4>{s.h}</h4>
              <p>{s.p}</p>
            </div>
          ))}
        </div>
        <div className="legal-foot">
          <button type="button" className="btn-ghost-legal" onClick={onClose}>ปิด</button>
          <button type="button" className="btn-accept-legal" onClick={onAccept}>ยอมรับเงื่อนไข</button>
        </div>
      </div>
    </div>
  );
}

function BrandPanel() {
  return (
    <div className="auth-brand">
      <div className="auth-brand-top">
        <BrandMark />
        <div>
          <div className="auth-brand-name">Piggy Plan</div>
          <div className="auth-brand-sub">วางแผนการเงินส่วนตัว</div>
        </div>
      </div>

      <div className="auth-brand-mid">
        <Piggy />
        <h1 className="auth-hero-title">วางแผนการเงิน<br/>ให้เป็นเรื่องสนุก</h1>
        <p className="auth-hero-sub">จัดการรายรับ–รายจ่าย วางแผนภาษี คำนวณ OT และติดตามเงินออม ครบในที่เดียว</p>
        <div className="auth-feats">
          <div className="auth-feat"><span className="auth-feat-ic">🗓️</span><span>วางแผนงบรายเดือนล่วงหน้า</span></div>
          <div className="auth-feat"><span className="auth-feat-ic">🧾</span><span>คำนวณภาษีและค่าล่วงเวลา</span></div>
          <div className="auth-feat"><span className="auth-feat-ic">🐖</span><span>ติดตามเงินออมสะสมรายปี</span></div>
        </div>
      </div>

      <div className="auth-brand-foot">🔒 ข้อมูลของคุณถูกเก็บเป็นความลับและปลอดภัย</div>

      <div className="auth-brand-compact">
        <h1 className="auth-hero-title">วางแผนการเงินให้เป็นเรื่องสนุก 🐷</h1>
        <p className="auth-hero-sub">จัดการเงิน ภาษี และเงินออม ครบในที่เดียว</p>
      </div>
    </div>
  );
}

function AuthApp() {
  const [view, setView] = useState(() => (location.hash === '#signup' ? 'signup' : location.hash === '#forgot' ? 'forgot' : 'login'));
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [vals, setVals] = useState({ name: '', email: '', pw: '', pw2: '' });
  const [errs, setErrs] = useState({});
  const [remember, setRemember] = useState(true);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null); // null | 'login' | 'signup' | 'google'
  const [sentTo, setSentTo] = useState(null); // อีเมลที่ส่งลิงก์รีเซ็ตไปแล้ว
  const [legal, setLegal] = useState(null); // null | 'terms' | 'privacy'

  const isSignup = view === 'signup';
  const isForgot = view === 'forgot';
  const set = (k, v) => { setVals(p => ({ ...p, [k]: v })); if (errs[k]) setErrs(p => ({ ...p, [k]: null })); };

  const swap = (v) => {
    setView(v); setErrs({}); setSentTo(null);
    history.replaceState(null, '', v === 'signup' ? '#signup' : v === 'forgot' ? '#forgot' : '#login');
  };

  const sendReset = (ev) => {
    ev.preventDefault();
    const e = {};
    if (!vals.email.trim()) e.email = 'กรุณากรอกอีเมล';
    else if (!EMAIL_RE.test(vals.email.trim())) e.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    setErrs(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    setTimeout(() => { setBusy(false); setSentTo(vals.email.trim()); }, 950);
  };

  const validate = () => {
    const e = {};
    if (isSignup && !vals.name.trim()) e.name = 'กรุณากรอกชื่อของคุณ';
    if (!vals.email.trim()) e.email = 'กรุณากรอกอีเมล';
    else if (!EMAIL_RE.test(vals.email.trim())) e.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    if (!vals.pw) e.pw = 'กรุณากรอกรหัสผ่าน';
    else if (isSignup && vals.pw.length < 6) e.pw = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    if (isSignup && vals.pw2 !== vals.pw) e.pw2 = 'รหัสผ่านไม่ตรงกัน';
    if (isSignup && !agree) e.agree = 'กรุณายอมรับเงื่อนไขการใช้งาน';
    return e;
  };

  const persistAuth = (provider, extra = {}) => {
    let base = { name: 'สมหญิง ใจดี', email: 'somying@email.com', color: 'mint', pic: '', provider: 'email' };
    try {
      const s = localStorage.getItem('finplan:profile');
      if (s) base = { ...base, ...JSON.parse(s) };
    } catch (e) {}
    const next = { ...base, provider, ...extra };
    try { localStorage.setItem('finplan:profile', JSON.stringify(next)); } catch (e) {}
  };

  const submit = (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrs(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      const extra = { email: vals.email.trim(), provider: 'email' };
      if (isSignup && vals.name.trim()) extra.name = vals.name.trim();
      persistAuth('email', extra);
      setDone(isSignup ? 'signup' : 'login');
    }, 950);
  };

  const google = () => {
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      const gmail = (vals.email.trim() && /@gmail\.com$/i.test(vals.email.trim())) ? vals.email.trim() : 'somying@gmail.com';
      const extra = { email: gmail, provider: 'google' };
      if (isSignup && vals.name.trim()) extra.name = vals.name.trim();
      persistAuth('google', extra);
      setDone('google');
    }, 900);
  };

  if (done) {
    const msg = done === 'signup'
      ? { t: 'สร้างบัญชีสำเร็จ! 🎉', d: 'ยินดีต้อนรับสู่ Piggy Plan เริ่มวางแผนการเงินของคุณได้เลย' }
      : { t: 'เข้าสู่ระบบสำเร็จ', d: 'กำลังพาคุณเข้าสู่ Piggy Plan…' };
    return (
      <div className="auth">
        <BrandPanel />
        <div className="auth-form-side">
          <div className="auth-card auth-success">
            <div className="auth-success-ic"><CheckIc /></div>
            <h1 className="auth-title">{msg.t}</h1>
            <p className="auth-desc" style={{ marginBottom: 26 }}>{msg.d}</p>
            <a className="auth-submit" href="/index.html">เข้าสู่ Piggy Plan</a>
          </div>
        </div>
      </div>
    );
  }

  const st = pwStrength(vals.pw);

  /* ---------- ลืมรหัสผ่าน ---------- */
  if (isForgot) {
    return (
      <div className="auth">
        <BrandPanel />
        <div className="auth-form-side">
          <div className="auth-card">
            {sentTo ? (
              <div className="auth-view auth-success" key="sent">
                <div className="auth-success-ic" style={{ background: 'linear-gradient(140deg, #FF8E84, #F8A78F)' }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3.5 7l8.5 6 8.5-6"/></svg>
                </div>
                <h1 className="auth-title">ตรวจสอบอีเมลของคุณ</h1>
                <p className="auth-desc" style={{ marginBottom: 8 }}>เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปที่</p>
                <p className="auth-desc" style={{ marginBottom: 26, fontWeight: 600, color: 'var(--ink)' }}>{sentTo}</p>
                <button className="auth-submit" type="button" onClick={() => swap('login')} style={{ background: 'linear-gradient(120deg, var(--coral-deep), #FF8E84)' }}>กลับไปหน้าเข้าสู่ระบบ</button>
                <div className="auth-foot">
                  ไม่ได้รับอีเมล? <button className="auth-link" onClick={() => setSentTo(null)}>ส่งอีกครั้ง</button>
                </div>
              </div>
            ) : (
              <div className="auth-view" key="forgot">
                <div className="auth-head">
                  <div className="auth-eyebrow">กู้คืนบัญชี</div>
                  <h1 className="auth-title">ลืมรหัสผ่าน?</h1>
                  <p className="auth-desc">กรอกอีเมลที่ใช้สมัคร แล้วเราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้</p>
                </div>

                <form onSubmit={sendReset} noValidate>
                  <div className="auth-fields">
                    <div className="field">
                      <label htmlFor="f-fmail">อีเมล</label>
                      <input id="f-fmail" className={'input' + (errs.email ? ' err' : '')} type="email" placeholder="you@email.com"
                        value={vals.email} onChange={e => set('email', e.target.value)} autoComplete="email" autoFocus />
                      {errs.email && <div className="auth-err">{errs.email}</div>}
                    </div>
                  </div>

                  <button className="auth-submit" type="submit" disabled={busy}>
                    {busy ? <span className="auth-spinner" /> : 'ส่งลิงก์ตั้งรหัสผ่านใหม่'}
                  </button>
                </form>

                <div className="auth-foot">
                  จำรหัสผ่านได้แล้ว? <button className="auth-link" onClick={() => swap('login')}>เข้าสู่ระบบ</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth">
      <BrandPanel />
      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-view" key={view}>
            <div className="auth-head">
              <div className="auth-eyebrow">{isSignup ? 'สมัครใช้งาน' : 'เข้าสู่ระบบ'}</div>
              <h1 className="auth-title">{isSignup ? 'สร้างบัญชีใหม่' : 'ยินดีต้อนรับกลับมา'}</h1>
              <p className="auth-desc">{isSignup ? 'กรอกข้อมูลด้านล่างเพื่อเริ่มต้นใช้งาน Piggy Plan ฟรี' : 'เข้าสู่ระบบเพื่อจัดการแผนการเงินของคุณ'}</p>
            </div>

            <button className="gbtn" type="button" onClick={google} disabled={busy}>
              <GoogleG /> {isSignup ? 'สมัครด้วย Google' : 'เข้าสู่ระบบด้วย Google'}
            </button>

            <div className="auth-divider">หรือใช้อีเมล</div>

            <form onSubmit={submit} noValidate>
              <div className="auth-fields">
                {isSignup && (
                  <div className="field">
                    <label htmlFor="f-name">ชื่อที่ใช้แสดง</label>
                    <input id="f-name" className={'input' + (errs.name ? ' err' : '')} type="text" placeholder="เช่น สมหญิง ใจดี"
                      value={vals.name} onChange={e => set('name', e.target.value)} autoComplete="name" />
                    {errs.name && <div className="auth-err">{errs.name}</div>}
                  </div>
                )}

                <div className="field">
                  <label htmlFor="f-email">อีเมล</label>
                  <input id="f-email" className={'input' + (errs.email ? ' err' : '')} type="email" placeholder="you@email.com"
                    value={vals.email} onChange={e => set('email', e.target.value)} autoComplete="email" />
                  {errs.email && <div className="auth-err">{errs.email}</div>}
                </div>

                <div className="field">
                  <label htmlFor="f-pw">รหัสผ่าน</label>
                  <div className="auth-pw-wrap">
                    <input id="f-pw" className={'input has-suffix' + (errs.pw ? ' err' : '')} type={showPw ? 'text' : 'password'}
                      placeholder={isSignup ? 'อย่างน้อย 6 ตัวอักษร' : 'รหัสผ่านของคุณ'}
                      value={vals.pw} onChange={e => set('pw', e.target.value)} autoComplete={isSignup ? 'new-password' : 'current-password'} />
                    <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(s => !s)} aria-label={showPw ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}><Eye off={showPw} /></button>
                  </div>
                  {errs.pw && <div className="auth-err">{errs.pw}</div>}
                  {isSignup && vals.pw && (
                    <div className="auth-strength">
                      <div className="auth-strength-bars">
                        {[1,2,3].map(i => <span key={i} style={{ background: i <= st ? STRENGTH[st].color : 'var(--line)' }} />)}
                      </div>
                      <span className="auth-strength-label" style={{ color: STRENGTH[st].color }}>{STRENGTH[st].label}</span>
                    </div>
                  )}
                </div>

                {isSignup && (
                  <div className="field">
                    <label htmlFor="f-pw2">ยืนยันรหัสผ่าน</label>
                    <div className="auth-pw-wrap">
                      <input id="f-pw2" className={'input has-suffix' + (errs.pw2 ? ' err' : '')} type={showPw2 ? 'text' : 'password'} placeholder="กรอกรหัสผ่านอีกครั้ง"
                        value={vals.pw2} onChange={e => set('pw2', e.target.value)} autoComplete="new-password" />
                      <button type="button" className="auth-pw-toggle" onClick={() => setShowPw2(s => !s)} aria-label={showPw2 ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}><Eye off={showPw2} /></button>
                    </div>
                    {errs.pw2 && <div className="auth-err">{errs.pw2}</div>}
                  </div>
                )}
              </div>

              {!isSignup ? (
                <div className="auth-options">
                  <label className="auth-check"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />จดจำฉันไว้</label>
                  <button type="button" className="auth-link" onClick={() => swap('forgot')}>ลืมรหัสผ่าน?</button>
                </div>
              ) : (
                <div className="auth-options" style={{ alignItems: 'flex-start' }}>
                  <label className="auth-check"><input type="checkbox" checked={agree} onChange={e => { setAgree(e.target.checked); if (errs.agree) setErrs(p => ({ ...p, agree: null })); }} />
                    <span>ยอมรับ<button type="button" className="auth-link" onClick={(ev)=>{ev.preventDefault();setLegal('terms');}}>เงื่อนไขการใช้งาน</button>และ<button type="button" className="auth-link" onClick={(ev)=>{ev.preventDefault();setLegal('privacy');}}>นโยบายความเป็นส่วนตัว</button></span>
                  </label>
                </div>
              )}
              {errs.agree && <div className="auth-err" style={{ marginTop: 6 }}>{errs.agree}</div>}

              <button className="auth-submit" type="submit" disabled={busy}>
                {busy ? <span className="auth-spinner" /> : (isSignup ? 'สร้างบัญชี' : 'เข้าสู่ระบบ')}
              </button>
            </form>

            <div className="auth-foot">
              {isSignup ? (
                <span>มีบัญชีอยู่แล้ว? <button className="auth-link" onClick={() => swap('login')}>เข้าสู่ระบบ</button></span>
              ) : (
                <span>ยังไม่มีบัญชี? <button className="auth-link" onClick={() => swap('signup')}>สมัครใช้งานฟรี</button></span>
              )}
            </div>
          </div>
        </div>
      </div>
      {legal && <LegalModal which={legal} onClose={() => setLegal(null)} onAccept={() => { setAgree(true); setErrs(p => ({ ...p, agree: null })); setLegal(null); }} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AuthApp />);
