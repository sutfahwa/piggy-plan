import React from 'react';
import '../../shared/data.jsx';
const { Ic, ICONS } = window;
import { logout as fbLogout, changePassword as fbChangePassword, deleteAccount as fbDeleteAccount, resetCloudState, authMessage } from '../../shared/firebase.js';
/* ============================================================
   profile.jsx — ไอคอนโปรไฟล์มุมขวาบน + เมนู + ตั้งค่าบัญชี
   (จัดการโปรไฟล์ · เปลี่ยนรหัสผ่าน · ลบบัญชี · ออกจากระบบ)
   ============================================================ */

/* ค่าเริ่มต้นของโปรไฟล์ผู้ใช้ */
const PROFILE_DEFAULT = {
  name: 'สมหญิง ใจดี',
  email: 'somying@email.com',
  color: 'mint',
  pic: '',   // '' = ตัวอักษรย่อ · 'preset:<id>' = รูประบบ · 'data:...' = รูปที่อัปโหลด
  provider: 'email',  // 'email' = สมัครด้วยอีเมล+รหัสผ่าน · 'google' = เข้าสู่ระบบด้วย Google
};

/* โลโก้ Google (ตัว G สี) สำหรับแสดงบัญชีที่เชื่อมต่อ */
function GoogleMark({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" style={{ flex: '0 0 auto' }}>
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  );
}
const isGoogle = (profile) => (profile && profile.provider) === 'google';

/* สีพื้นของไอคอนโปรไฟล์ (ไล่เฉด) */
const AVATAR_GRADS = {
  mint:     { grad: 'linear-gradient(135deg, #BCE29E, #E5EBB2)', ink: '#4a5b38' },
  coral:    { grad: 'linear-gradient(135deg, #FF9A96, #F8C4B4)', ink: '#7a3b35' },
  peach:    { grad: 'linear-gradient(135deg, #F8C4B4, #FAD27A)', ink: '#7a5230' },
  lavender: { grad: 'linear-gradient(135deg, #C9B6E4, #F2A0C0)', ink: '#5b3f6b' },
  sky:      { grad: 'linear-gradient(135deg, #9BD4D0, #BCE29E)', ink: '#2f5b58' },
};
const AVATAR_KEYS = Object.keys(AVATAR_GRADS);

/* รูปโปรไฟล์สำเร็จรูปของระบบ (อิโมจิธีมบนพื้นสีไล่เฉด) */
const AVATAR_PRESETS = [
  { id: 'pig',    emoji: '🐷' },
  { id: 'cat',    emoji: '🐱' },
  { id: 'dog',    emoji: '🐶' },
  { id: 'fox',    emoji: '🦊' },
  { id: 'bear',   emoji: '🐻' },
  { id: 'rabbit', emoji: '🐰' },
];
const presetById = (id) => AVATAR_PRESETS.find(p => p.id === id);
const isPhoto = (pic) => typeof pic === 'string' && (pic.startsWith('data:') || pic.startsWith('blob:') || pic.startsWith('http'));

/* ย่อ + ครอปรูปให้เป็นสี่เหลี่ยมจัตุรัส (ไม่ให้ localStorage บวม) */
function resizeImage(file, max = 256) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const out = Math.min(side, max);
        const sx = (img.width - side) / 2, sy = (img.height - side) / 2;
        const canvas = document.createElement('canvas');
        canvas.width = out; canvas.height = out;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, sx, sy, side, side, 0, 0, out, out);
        try { resolve(canvas.toDataURL('image/jpeg', 0.85)); } catch (e) { reject(e); }
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ตัวอักษรย่อจากชื่อ */
function initials(name) {
  const n = (name || '').trim();
  if (!n) return '👤';
  const parts = n.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] || '') + (parts[1][0] || '');
  return n.slice(0, 1);
}

/* รูปไอคอนโปรไฟล์ (อวตาร) */
function Avatar({ profile, size = 42 }) {
  const a = AVATAR_GRADS[profile.color] || AVATAR_GRADS.mint;
  const pic = profile.pic || '';

  if (isPhoto(pic)) {
    return (
      <div className="avatar avatar-photo" style={{ width: size, height: size }}>
        <img src={pic} alt="" />
      </div>
    );
  }

  if (pic.startsWith('preset:')) {
    const p = presetById(pic.slice(7));
    if (p) return (
      <div className="avatar" style={{ width: size, height: size, background: a.grad, fontSize: size * 0.54 }}>
        <span style={{ lineHeight: 1 }}>{p.emoji}</span>
      </div>
    );
  }

  return (
    <div className="avatar" style={{
      width: size, height: size, background: a.grad, color: a.ink,
      fontSize: size * 0.4,
    }}>
      {initials(profile.name)}
    </div>
  );
}

/* ช่องรหัสผ่าน + ปุ่มแสดง/ซ่อน */
function PwField({ id, label, value, onChange, placeholder, err, autoComplete }) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="pw-wrap">
        <input id={id} className={'input has-suffix' + (err ? ' err' : '')} type={show ? 'text' : 'password'}
          value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete || 'off'} />
        <button type="button" className="pw-toggle" onClick={() => setShow(s => !s)}
          aria-label={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}>
          <Ic d={show ? ICONS.eyeOff : ICONS.eye} size={18} />
        </button>
      </div>
      {err && <div className="field-err">{err}</div>}
    </div>
  );
}

/* วัดความแข็งแรงรหัสผ่าน */
function pwStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[0-9]/.test(pw) && /[a-zA-Z]/.test(pw)) s++;
  if (/[^a-zA-Z0-9]/.test(pw)) s++;
  return Math.min(s, 3);
}
const PW_LABELS = ['', 'อ่อน', 'พอใช้', 'แข็งแรง'];
const PW_COLORS = ['var(--line)', 'var(--bad)', 'var(--warn)', 'var(--good)'];

/* ============================================================
   Feature flag — ฟีเจอร์บัญชี/โปรไฟล์ (ล็อกอิน · จัดการโปรไฟล์ · เปลี่ยนรหัสผ่าน
   · ตั้งค่าบัญชี · ออกจากระบบ) ถูก "ซ่อน" ไว้ชั่วคราว โค้ดยังอยู่ครบ
   ตั้งเป็น true เพื่อเปิดใช้งานกลับ — ตอนนี้แอปทำงานโดยเก็บข้อมูลในเครื่อง (localStorage)
   ============================================================ */
const ACCOUNT_ENABLED = true;

/* ---------- เมนูโปรไฟล์ (ปุ่มไอคอน + dropdown) ---------- */
function ProfileMenu({ profile, setProfile, size = 42, onOpenSettings }) {
  if (!ACCOUNT_ENABLED) return null;   // ซ่อนทางเข้าฟีเจอร์บัญชีทั้งหมด (เว็บ + มือถือ)
  const [open, setOpen] = React.useState(false);
  const [settingsTab, setSettingsTab] = React.useState(null); // null | 'profile' | 'security' | 'account'
  const wrapRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const openTab = (tab) => {
    setOpen(false);
    if (onOpenSettings) onOpenSettings(tab);   // นำทางไปหน้าตั้งค่าเต็มหน้า
    else setSettingsTab(tab);                  // fallback: เปิดแบบ modal
  };

  const logout = async () => {
    const ok = window.showConfirm
      ? await window.showConfirm({ type: 'warning', title: 'ออกจากระบบ', message: 'ต้องการออกจากระบบ Piggy Plan ใช่หรือไม่?', confirmText: 'ออกจากระบบ', cancelText: 'ยกเลิก' })
      : window.confirm('ต้องการออกจากระบบใช่หรือไม่?');
    if (ok) await fbLogout();
  };

  return (
    <div className="profile-wrap" ref={wrapRef}>
      <button className={'profile-btn' + (open ? ' on' : '')} onClick={() => setOpen(o => !o)}
        aria-label="เมนูโปรไฟล์" aria-expanded={open}>
        <Avatar profile={profile} size={size} />
      </button>

      {open && (
        <div className="profile-menu" role="menu">
          <div className="profile-menu-head">
            <Avatar profile={profile} size={46} />
            <div className="profile-menu-id">
              <div className="profile-menu-name">{profile.name || 'ผู้ใช้งาน'}</div>
              <div className="profile-menu-email">{profile.email}</div>
            </div>
          </div>

          <div className="profile-menu-sep" />

          <button className="profile-menu-item" role="menuitem" onClick={() => openTab('profile')}>
            <span className="pmi-ic"><Ic d={ICONS.userEdit} size={19} /></span>
            จัดการโปรไฟล์
          </button>
          <button className="profile-menu-item" role="menuitem" onClick={() => openTab('security')}>
            <span className="pmi-ic"><Ic d={ICONS.lock} size={19} /></span>
            {isGoogle(profile) ? 'ความปลอดภัย' : 'เปลี่ยนรหัสผ่าน'}
          </button>
          <button className="profile-menu-item" role="menuitem" onClick={() => openTab('account')}>
            <span className="pmi-ic"><Ic d={ICONS.shield} size={19} /></span>
            ตั้งค่าบัญชี
          </button>

          <div className="profile-menu-sep" />

          <button className="profile-menu-item danger" role="menuitem" onClick={() => { setOpen(false); logout(); }}>
            <span className="pmi-ic"><Ic d={ICONS.logout} size={19} /></span>
            ออกจากระบบ
          </button>
        </div>
      )}

      {settingsTab && (
        <SettingsModal profile={profile} setProfile={setProfile} initialTab={settingsTab}
          onLogout={logout} onClose={() => setSettingsTab(null)} />
      )}
    </div>
  );
}

/* ---------- หน้าตั้งค่าบัญชี (modal แบบแท็บ) ---------- */
const SET_TABS = [
  { id: 'profile',  label: 'โปรไฟล์',    icon: 'user' },
  { id: 'security', label: 'ความปลอดภัย', icon: 'lock' },
  { id: 'account',  label: 'บัญชี',       icon: 'shield' },
];

function SettingsModal({ profile, setProfile, initialTab, onLogout, onClose }) {
  const [tab, setTab] = React.useState(initialTab || 'profile');

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal set-modal" role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose} aria-label="ปิด"><Ic d={ICONS.close} size={18} /></button>

        <div className="set-head">
          <Avatar profile={profile} size={52} />
          <div className="set-head-id">
            <div className="set-head-name">{profile.name || 'ผู้ใช้งาน'}</div>
            <div className="set-head-email">
              {isGoogle(profile) && <GoogleMark size={14} />}
              {profile.email}
            </div>
          </div>
        </div>

        <div className="set-tabs" role="tablist">
          {SET_TABS.map(t => (
            <button key={t.id} role="tab" aria-selected={tab === t.id}
              className={'set-tab' + (tab === t.id ? ' on' : '')} onClick={() => setTab(t.id)}>
              <Ic d={ICONS[t.icon]} size={17} /> <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="set-body">
          {tab === 'profile'  && <ProfileTab  profile={profile} setProfile={setProfile} onClose={onClose} />}
          {tab === 'security' && <SecurityTab profile={profile} onClose={onClose} />}
          {tab === 'account'  && <AccountTab  profile={profile} onLogout={onLogout} onClose={onClose} />}
        </div>
      </div>
    </div>
  );
}

/* ---------- แท็บ 1: แก้ไขข้อมูลส่วนตัว ---------- */
function ProfileTab({ profile, setProfile, onClose }) {
  const [name, setName] = React.useState(profile.name);
  const email = profile.email;            // อีเมลเป็นตัวระบุบัญชี — แก้ไขไม่ได้
  const [color, setColor] = React.useState(profile.color);
  const [pic, setPic] = React.useState(profile.pic || '');
  const [err, setErr] = React.useState({});
  const fileRef = React.useRef(null);
  const google = isGoogle(profile);

  const ag = AVATAR_GRADS[color] || AVATAR_GRADS.mint;
  const photo = isPhoto(pic);
  const dirty = name !== profile.name || color !== profile.color || pic !== (profile.pic || '');
  const draft = { name, email, color, pic };

  const onUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      if (window.showAlert) await window.showAlert({ type: 'warning', title: 'ไฟล์ไม่ถูกต้อง', message: 'กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, ฯลฯ)' });
      return;
    }
    try {
      const url = await resizeImage(file, 256);
      setPic(url);
    } catch (er) {
      if (window.showAlert) await window.showAlert({ title: 'อัปโหลดไม่สำเร็จ', message: 'ไม่สามารถอ่านไฟล์รูปนี้ได้ ลองรูปอื่นอีกครั้ง' });
    }
  };

  const save = async () => {
    const e = {};
    if (!name.trim()) e.name = 'กรุณากรอกชื่อ';
    setErr(e);
    if (Object.keys(e).length) return;
    setProfile({ ...profile, name: name.trim(), color, pic });
    if (window.showAlert) await window.showAlert({ title: 'บันทึกแล้ว', message: 'อัปเดตข้อมูลโปรไฟล์เรียบร้อย' });
    onClose();
  };

  return (
    <div className="set-pane">
      <div className="set-avatar-row">
        <Avatar profile={draft} size={68} />
        <div>
          <div className="set-avatar-name">{name || 'ผู้ใช้งาน'}</div>
          <div className="set-avatar-mail">{email || '—'}</div>
          <span className={'provider-chip' + (google ? ' google' : '')}>
            {google ? <GoogleMark size={14} /> : <Ic d={ICONS.mail} size={13} stroke={2} />}
            {google ? 'เชื่อมต่อผ่าน Google' : 'สมัครด้วยอีเมล'}
          </span>
        </div>
      </div>

      <div className="field">
        <label>รูปโปรไฟล์</label>
        <div className="pic-grid">
          {/* ตัวอักษรย่อ */}
          <button type="button" className={'pic-opt' + (!pic ? ' on' : '')}
            style={{ background: ag.grad, color: ag.ink }} onClick={() => setPic('')} title="ตัวอักษรย่อ">
            <span className="pic-initials">{initials(name)}</span>
            {!pic && <span className="pic-check"><Ic d={ICONS.check} size={12} stroke={2.8} /></span>}
          </button>

          {/* รูประบบ */}
          {AVATAR_PRESETS.map(p => {
            const sel = pic === 'preset:' + p.id;
            return (
              <button key={p.id} type="button" className={'pic-opt' + (sel ? ' on' : '')}
                style={{ background: ag.grad }} onClick={() => setPic('preset:' + p.id)} title={p.id}>
                <span className="pic-emoji">{p.emoji}</span>
                {sel && <span className="pic-check"><Ic d={ICONS.check} size={12} stroke={2.8} /></span>}
              </button>
            );
          })}

          {/* รูปที่อัปโหลดเอง */}
          {photo && (
            <button type="button" className="pic-opt on" title="รูปที่อัปโหลด">
              <img src={pic} alt="" />
              <span className="pic-check"><Ic d={ICONS.check} size={12} stroke={2.8} /></span>
            </button>
          )}

          {/* ปุ่มอัปโหลด */}
          <button type="button" className="pic-upload" onClick={() => fileRef.current && fileRef.current.click()} title="อัปโหลดรูป">
            <Ic d={ICONS.plus} size={22} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onUpload} />
        </div>

        {photo
          ? <button type="button" className="pic-remove" onClick={() => setPic('')}><Ic d={ICONS.trash} size={13} /> ลบรูปที่อัปโหลด</button>
          : <div className="set-note" style={{ marginTop: 4 }}>เลือกรูปจากระบบ หรืออัปโหลดรูปของคุณเอง (ระบบย่อรูปให้อัตโนมัติ)</div>}
      </div>

      <div className="field">
        <label htmlFor="pf-name">ชื่อที่ใช้แสดง</label>
        <input id="pf-name" className={'input' + (err.name ? ' err' : '')} type="text" value={name}
          onChange={e => { setName(e.target.value); if (err.name) setErr(p => ({ ...p, name: null })); }}
          placeholder="เช่น สมหญิง ใจดี" />
        {err.name && <div className="field-err">{err.name}</div>}
      </div>

      <div className="field">
        <label htmlFor="pf-email">
          อีเมล <span className="field-lock-tag"><Ic d={ICONS.lock} size={12} stroke={2.2} /> แก้ไขไม่ได้</span>
        </label>
        <div className="locked-field">
          <span className="locked-field-ic">
            {google ? <GoogleMark size={18} /> : <Ic d={ICONS.mail} size={18} />}
          </span>
          <span className="locked-field-val">{email}</span>
        </div>
        <div className="set-note" style={{ marginTop: 2 }}>
          {google
            ? 'อีเมลนี้เชื่อมต่อกับบัญชี Google หากต้องการเปลี่ยน โปรดจัดการผ่านบัญชี Google'
            : 'อีเมลนี้ใช้สำหรับเข้าสู่ระบบจึงไม่สามารถเปลี่ยนได้เอง หากต้องการเปลี่ยน โปรดติดต่อฝ่ายสนับสนุน'}
        </div>
      </div>

      <div className="field">
        <label>สีพื้นหลังไอคอน <span style={{ color: 'var(--ink-faint)', fontWeight: 400 }}>(สำหรับตัวอักษร / อิโมจิ)</span></label>
        <div className="profile-swatches">
          {AVATAR_KEYS.map(k => (
            <button key={k} type="button" className={'profile-swatch' + (color === k ? ' on' : '')}
              style={{ background: AVATAR_GRADS[k].grad }} onClick={() => setColor(k)} aria-label={k}>
              {color === k && <Ic d={ICONS.check} size={18} stroke={2.6} />}
            </button>
          ))}
        </div>
      </div>

      <div className="set-actions">
        <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
        <button className="btn btn-primary" onClick={save} disabled={!dirty}>บันทึกการเปลี่ยนแปลง</button>
      </div>
    </div>
  );
}

/* ---------- แท็บ 2: ความปลอดภัย / เปลี่ยนรหัสผ่าน ---------- */
function SecurityTab({ profile, onClose }) {
  const [cur, setCur] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [pw2, setPw2] = React.useState('');
  const [err, setErr] = React.useState({});
  const st = pwStrength(pw);

  /* บัญชี Google — ไม่มีรหัสผ่านในระบบ รหัสผ่านถูกจัดการฝั่ง Google */
  if (isGoogle(profile)) {
    return (
      <div className="set-pane">
        <div className="google-managed">
          <div className="google-managed-ic"><GoogleMark size={30} /></div>
          <div className="google-managed-title">บัญชีนี้จัดการโดย Google</div>
          <p className="google-managed-desc">
            คุณเข้าสู่ระบบ Piggy Plan ด้วยบัญชี Google (<b>{profile.email}</b>)
            จึงไม่มีรหัสผ่านแยกสำหรับแอปนี้ หากต้องการเปลี่ยนรหัสผ่านหรือตั้งค่าความปลอดภัย
            โปรดจัดการจากบัญชี Google ของคุณ
          </p>
          <a className="btn btn-ghost btn-sm google-managed-link" href="https://myaccount.google.com/security"
            target="_blank" rel="noopener noreferrer">
            <GoogleMark size={16} /> จัดการบัญชี Google
          </a>
        </div>
        <p className="set-note">
          <Ic d={ICONS.shield} size={14} stroke={2} /> ความปลอดภัยของการเข้าสู่ระบบ — เช่น การยืนยันสองขั้นตอน — ถูกดูแลโดย Google ทั้งหมด
        </p>
        <div className="set-actions">
          <button className="btn btn-ghost" onClick={onClose}>ปิด</button>
        </div>
      </div>
    );
  }

  const clr = (k) => { if (err[k]) setErr(p => ({ ...p, [k]: null })); };

  const save = async () => {
    const e = {};
    if (!cur) e.cur = 'กรอกรหัสผ่านปัจจุบัน';
    if (!pw) e.pw = 'กรอกรหัสผ่านใหม่';
    else if (pw.length < 6) e.pw = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    else if (pw === cur) e.pw = 'รหัสผ่านใหม่ต้องต่างจากเดิม';
    if (pw2 !== pw) e.pw2 = 'รหัสผ่านยืนยันไม่ตรงกัน';
    setErr(e);
    if (Object.keys(e).length) return;
    try {
      await fbChangePassword(cur, pw);
    } catch (err) {
      setErr({ cur: authMessage(err) });
      return;
    }
    if (window.showAlert) await window.showAlert({ title: 'เปลี่ยนรหัสผ่านแล้ว', message: 'รหัสผ่านของคุณได้รับการอัปเดตเรียบร้อย' });
    onClose();
  };

  return (
    <div className="set-pane">
      <p className="set-note">เพื่อความปลอดภัย โปรดยืนยันรหัสผ่านปัจจุบันก่อนตั้งรหัสใหม่</p>

      <PwField id="sec-cur" label="รหัสผ่านปัจจุบัน" value={cur}
        onChange={e => { setCur(e.target.value); clr('cur'); }} placeholder="รหัสผ่านเดิม" err={err.cur} autoComplete="current-password" />

      <PwField id="sec-new" label="รหัสผ่านใหม่" value={pw}
        onChange={e => { setPw(e.target.value); clr('pw'); }} placeholder="อย่างน้อย 6 ตัวอักษร" err={err.pw} autoComplete="new-password" />

      {pw && (
        <div className="pw-strength">
          <div className="pw-strength-bars">
            {[1, 2, 3].map(i => <span key={i} style={{ background: i <= st ? PW_COLORS[st] : 'var(--line)' }} />)}
          </div>
          <span className="pw-strength-label" style={{ color: PW_COLORS[st] }}>{PW_LABELS[st]}</span>
        </div>
      )}

      <PwField id="sec-pw2" label="ยืนยันรหัสผ่านใหม่" value={pw2}
        onChange={e => { setPw2(e.target.value); clr('pw2'); }} placeholder="กรอกรหัสผ่านใหม่อีกครั้ง" err={err.pw2} autoComplete="new-password" />

      <div className="set-actions">
        <button className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
        <button className="btn btn-primary" onClick={save}>อัปเดตรหัสผ่าน</button>
      </div>
    </div>
  );
}

/* ---------- แท็บ 3: บัญชี (ออกจากระบบ + ลบบัญชี) ---------- */
function AccountTab({ profile, onLogout, onClose }) {
  const deleteAccount = async () => {
    const ok = window.showConfirm
      ? await window.showConfirm({
          type: 'delete', title: 'ลบบัญชีถาวร',
          message: 'การลบบัญชีจะลบข้อมูลแผนการเงิน ภาษี และเงินออมทั้งหมดอย่างถาวร และไม่สามารถกู้คืนได้ ต้องการดำเนินการต่อหรือไม่?',
          confirmText: 'ลบบัญชีของฉัน', cancelText: 'ยกเลิก' })
      : window.confirm('ลบบัญชีถาวร?');
    if (!ok) return;
    try {
      await fbDeleteAccount();   // deletes the Firebase user + their cloud doc + local data
    } catch (err) {
      if (window.showAlert) await window.showAlert({ type: 'warning', title: 'ลบบัญชีไม่สำเร็จ', message: authMessage(err) });
      return;
    }
    // auth gate flips back to the login screen automatically
  };

  /* ล้างข้อมูลที่จัดเก็บไว้ทั้งหมด (รีเซ็ตแอป — ไม่ลบบัญชี) */
  const clearAllData = async () => {
    const ok = window.showConfirm
      ? await window.showConfirm({ type: 'delete', title: 'ล้างข้อมูลที่จัดเก็บไว้ทั้งหมด',
          message: 'จะลบข้อมูลที่บันทึกไว้ทั้งหมด — แผนการเงิน ภาษี OT กองทุน และการตั้งค่า แล้วเริ่มต้นใหม่ (บัญชีของคุณยังอยู่) ต้องการดำเนินการต่อหรือไม่?',
          confirmText: 'ล้างข้อมูล', cancelText: 'ยกเลิก' })
      : window.confirm('ล้างข้อมูลที่จัดเก็บไว้ทั้งหมด?');
    if (!ok) return;
    try { await resetCloudState(); } catch (e) {}   // clears local + this user's cloud doc
    if (window.showAlert) await window.showAlert({ title: 'ล้างข้อมูลแล้ว', message: 'กำลังเริ่มต้นแอปใหม่…' });
    window.location.reload();
  };

  return (
    <div className="set-pane">
      <div className="set-row">
        <div className="set-row-ic"><Ic d={ICONS.logout} size={20} /></div>
        <div className="set-row-txt">
          <div className="set-row-title">ออกจากระบบ</div>
          <div className="set-row-sub">ออกจากบัญชีนี้บนอุปกรณ์ปัจจุบัน</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onLogout}>ออกจากระบบ</button>
      </div>

      <div className="danger-zone">
        <div className="danger-zone-head">
          <Ic d={ICONS.shield} size={17} /> โซนอันตราย
        </div>
        <div className="set-row">
          <div className="set-row-ic" style={{ background: '#FFF1E0', color: 'var(--warn)' }}><Ic d={ICONS.trash} size={20} /></div>
          <div className="set-row-txt">
            <div className="set-row-title">ล้างข้อมูลที่จัดเก็บไว้ทั้งหมด</div>
            <div className="set-row-sub">รีเซ็ตแผนการเงิน ภาษี OT กองทุน และการตั้งค่ากลับเป็นค่าเริ่มต้น — บัญชียังอยู่</div>
          </div>
          <button className="btn btn-sm" onClick={clearAllData}
            style={{ background: '#fff', color: 'var(--coral-deep)', border: '1.5px solid #F3C8C2' }}>ล้างข้อมูล</button>
        </div>
        <div className="set-row">
          <div className="set-row-ic danger"><Ic d={ICONS.trash} size={20} /></div>
          <div className="set-row-txt">
            <div className="set-row-title">ลบบัญชีถาวร</div>
            <div className="set-row-sub">ลบบัญชีและข้อมูลทั้งหมด — ไม่สามารถกู้คืนได้</div>
          </div>
          <button className="btn btn-danger btn-sm" onClick={deleteAccount}>ลบบัญชี</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  ProfileMenu, SettingsModal, Avatar, PROFILE_DEFAULT, GoogleMark, isGoogle,
  ProfileTab, SecurityTab, AccountTab, PwField,
  pwStrength, PW_LABELS, PW_COLORS,
  AVATAR_GRADS, AVATAR_KEYS, initials,
});
