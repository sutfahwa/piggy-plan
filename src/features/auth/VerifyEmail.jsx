/* ============================================================
   VerifyEmail.jsx — shown after email signup until the user clicks
   the verification link sent to their inbox. Google accounts skip
   this (already verified). Gated by App.jsx.
   ============================================================ */
import React from 'react';
import './auth.css';
import { BrandPanel } from './AuthScreen.jsx';
import { resendVerification, reloadUser, logout, authMessage } from '../../shared/firebase.js';

const { useState } = React;

export default function VerifyEmail({ user }) {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState(null);

  const resend = async () => {
    setBusy(true); setMsg(null);
    try { await resendVerification(); setSent(true); }
    catch (e) { setMsg(authMessage(e)); }
    setBusy(false);
  };

  const check = async () => {
    setBusy(true); setMsg(null);
    try {
      const u = await reloadUser();
      if (u && u.emailVerified) { window.location.reload(); return; }  // verified → gate lets the app in
      setMsg('ยังไม่พบการยืนยัน — กดลิงก์ในอีเมลก่อน แล้วลองอีกครั้ง');
    } catch (e) { setMsg(authMessage(e)); }
    setBusy(false);
  };

  return (
    <div className="auth">
      <BrandPanel />
      <div className="auth-form-side">
        <div className="auth-card auth-view" style={{ textAlign: 'center' }}>
          <div className="auth-success-ic" style={{ background: 'linear-gradient(140deg, #FF8E84, #F8A78F)' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <path d="M3.5 7l8.5 6 8.5-6" />
            </svg>
          </div>
          <h1 className="auth-title">ยืนยันอีเมลของคุณ</h1>
          <p className="auth-desc" style={{ marginBottom: 4 }}>เราส่งลิงก์ยืนยันไปที่</p>
          <p className="auth-desc" style={{ marginBottom: 14, fontWeight: 600, color: 'var(--ink)' }}>{user.email}</p>
          <p className="auth-desc" style={{ marginBottom: 22 }}>
            เปิดอีเมลแล้วกดลิงก์เพื่อยืนยันการสมัคร จากนั้นกลับมากดปุ่มด้านล่าง
            <br />(ถ้าไม่เจอ ลองดูในกล่อง <b>สแปม/Junk</b>)
          </p>

          {sent && <div style={{ color: 'var(--mint-deep)', fontSize: 13.5, marginBottom: 12 }}>✓ ส่งอีเมลยืนยันใหม่แล้ว</div>}
          {msg && <div className="auth-err" style={{ justifyContent: 'center', marginBottom: 12 }}>{msg}</div>}

          <button className="auth-submit" type="button" onClick={check} disabled={busy}>
            {busy ? <span className="auth-spinner" /> : 'ฉันยืนยันแล้ว'}
          </button>

          <div className="auth-foot">
            ไม่ได้รับอีเมล? <button className="auth-link" onClick={resend} disabled={busy}>ส่งอีกครั้ง</button>
            {' · '}
            <button className="auth-link" onClick={() => logout()}>ใช้บัญชีอื่น</button>
          </div>
        </div>
      </div>
    </div>
  );
}
