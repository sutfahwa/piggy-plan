/* ============================================================
   AuthAction.jsx — branded handler for Firebase email links.
   Firebase's "Customize action URL" points here (e.g. https://<site>/?mode=…&oobCode=…).
   Handles verifyEmail + resetPassword with a pretty, on-brand screen
   instead of Firebase's default page. Rendered by App.jsx when the URL
   carries ?mode=&oobCode=.
   ============================================================ */
import React from 'react';
import './auth.css';
import { BrandPanel } from './AuthScreen.jsx';
import { applyVerify, verifyResetCode, confirmReset, authMessage } from '../../shared/firebase.js';

const { useState, useEffect } = React;

const Card = ({ children }) => (
  <div className="auth">
    <BrandPanel />
    <div className="auth-form-side">
      <div className="auth-card auth-view" style={{ textAlign: 'center' }}>{children}</div>
    </div>
  </div>
);

const SuccessIcon = () => (
  <div className="auth-success-ic">
    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
  </div>
);
const SadIcon = () => (
  <div className="auth-success-ic" style={{ background: 'linear-gradient(140deg, #F0635F, #FF8E84)' }}>
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v5M12 16.5h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" /></svg>
  </div>
);

const goApp = () => { window.location.href = '/'; };

export default function AuthAction({ mode, oobCode }) {
  if (mode === 'resetPassword') return <ResetPassword oobCode={oobCode} />;
  if (mode === 'verifyEmail' || mode === 'verifyAndChangeEmail') return <VerifyAction oobCode={oobCode} />;
  // recoverEmail / unknown → just bounce to the app
  return (
    <Card>
      <SuccessIcon />
      <h1 className="auth-title">เสร็จเรียบร้อย</h1>
      <p className="auth-desc" style={{ marginBottom: 24 }}>ดำเนินการเรียบร้อยแล้ว</p>
      <button className="auth-submit" type="button" onClick={goApp}>เข้าสู่ Piggy Plan</button>
    </Card>
  );
}

function VerifyAction({ oobCode }) {
  const [status, setStatus] = useState('working'); // working | done | error
  const [err, setErr] = useState('');
  useEffect(() => {
    let alive = true;
    applyVerify(oobCode)
      .then(() => { if (alive) setStatus('done'); })
      .catch((e) => { if (alive) { setErr(authMessage(e)); setStatus('error'); } });
    return () => { alive = false; };
  }, [oobCode]);

  if (status === 'working') {
    return (
      <Card>
        <div className="auth-success-ic" style={{ background: 'linear-gradient(140deg, #FF8E84, #F8A78F)' }}>
          <span className="auth-spinner" style={{ width: 30, height: 30, borderWidth: 3 }} />
        </div>
        <h1 className="auth-title">กำลังยืนยันอีเมล…</h1>
        <p className="auth-desc">รอสักครู่นะครับ 🐷</p>
      </Card>
    );
  }
  if (status === 'error') {
    return (
      <Card>
        <SadIcon />
        <h1 className="auth-title">ยืนยันไม่สำเร็จ</h1>
        <p className="auth-desc" style={{ marginBottom: 8 }}>{err}</p>
        <p className="auth-desc" style={{ marginBottom: 24 }}>ลิงก์อาจหมดอายุหรือถูกใช้ไปแล้ว — ลองขอลิงก์ใหม่จากหน้าเข้าสู่ระบบ</p>
        <button className="auth-submit" type="button" onClick={goApp}>ไปหน้าเข้าสู่ระบบ</button>
      </Card>
    );
  }
  return (
    <Card>
      <SuccessIcon />
      <h1 className="auth-title">ยืนยันอีเมลสำเร็จ! 🎉</h1>
      <p className="auth-desc" style={{ marginBottom: 24 }}>บัญชีของคุณพร้อมใช้งานแล้ว เข้าสู่ระบบเพื่อเริ่มวางแผนการเงินได้เลย</p>
      <button className="auth-submit" type="button" onClick={goApp}>เข้าสู่ Piggy Plan</button>
    </Card>
  );
}

function ResetPassword({ oobCode }) {
  const [phase, setPhase] = useState('check'); // check | form | done | error
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    verifyResetCode(oobCode)
      .then((mail) => { if (alive) { setEmail(mail); setPhase('form'); } })
      .catch((e) => { if (alive) { setErr(authMessage(e)); setPhase('error'); } });
    return () => { alive = false; };
  }, [oobCode]);

  const submit = async (e) => {
    e.preventDefault();
    if (pw.length < 6) { setErr('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return; }
    if (pw !== pw2) { setErr('รหัสผ่านยืนยันไม่ตรงกัน'); return; }
    setBusy(true); setErr('');
    try { await confirmReset(oobCode, pw); setPhase('done'); }
    catch (er) { setErr(authMessage(er)); setBusy(false); }
  };

  if (phase === 'check') {
    return (
      <Card>
        <div className="auth-success-ic" style={{ background: 'linear-gradient(140deg, #FF8E84, #F8A78F)' }}>
          <span className="auth-spinner" style={{ width: 30, height: 30, borderWidth: 3 }} />
        </div>
        <h1 className="auth-title">กำลังตรวจสอบลิงก์…</h1>
      </Card>
    );
  }
  if (phase === 'error') {
    return (
      <Card>
        <SadIcon />
        <h1 className="auth-title">ลิงก์ใช้ไม่ได้</h1>
        <p className="auth-desc" style={{ marginBottom: 24 }}>{err} — ลองขอลิงก์รีเซ็ตรหัสผ่านใหม่</p>
        <button className="auth-submit" type="button" onClick={goApp}>ไปหน้าเข้าสู่ระบบ</button>
      </Card>
    );
  }
  if (phase === 'done') {
    return (
      <Card>
        <SuccessIcon />
        <h1 className="auth-title">ตั้งรหัสผ่านใหม่แล้ว 🎉</h1>
        <p className="auth-desc" style={{ marginBottom: 24 }}>เข้าสู่ระบบด้วยรหัสผ่านใหม่ได้เลย</p>
        <button className="auth-submit" type="button" onClick={goApp}>เข้าสู่ระบบ</button>
      </Card>
    );
  }
  return (
    <Card>
      <h1 className="auth-title">ตั้งรหัสผ่านใหม่</h1>
      <p className="auth-desc" style={{ marginBottom: 18 }}>สำหรับบัญชี <b style={{ color: 'var(--ink)' }}>{email}</b></p>
      <form onSubmit={submit} noValidate style={{ textAlign: 'left' }}>
        <div className="auth-fields">
          <div className="field">
            <label htmlFor="np">รหัสผ่านใหม่</label>
            <input id="np" className="input" type="password" placeholder="อย่างน้อย 6 ตัวอักษร"
              value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" autoFocus />
          </div>
          <div className="field">
            <label htmlFor="np2">ยืนยันรหัสผ่านใหม่</label>
            <input id="np2" className="input" type="password" placeholder="กรอกอีกครั้ง"
              value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
          </div>
        </div>
        {err && <div className="auth-err" style={{ marginTop: 10 }}>{err}</div>}
        <button className="auth-submit" type="submit" disabled={busy}>
          {busy ? <span className="auth-spinner" /> : 'บันทึกรหัสผ่านใหม่'}
        </button>
      </form>
    </Card>
  );
}
