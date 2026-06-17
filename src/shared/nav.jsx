import React from 'react';
import './data.jsx';
import '../features/profile/profile.jsx';
const { Ic, ICONS, ProfileMenu } = window;
/* ============================================================
   nav.jsx — Sidebar, Topbar, MobileTop, MobileNav
   ============================================================ */

const NAV = [
{ id: 'plan', label: 'วางแผนการเงินส่วนตัว', short: 'การเงิน', icon: 'wallet',
  subs: [
  { id: 'monthly', label: 'วางแผนการเงินรายเดือน' },
  { id: 'summary', label: 'สรุปรายรับ-รายจ่าย' },
  { id: 'savings', label: 'สรุปเงินเก็บรายปี' }]
},
{ id: 'tax', label: 'วางแผนภาษี', short: 'ภาษี', icon: 'tax' },
{ id: 'ot', label: 'คำนวณค่าล่วงเวลา (OT)', short: 'OT', icon: 'clock' },
{ id: 'retire', label: 'กองทุนสำรองเลี้ยงชีพ', short: 'กองทุน', icon: 'trend' }];


const PAGE_META = {
  plan: { h: 'วางแผนการเงินส่วนตัว', subs: {
      monthly: 'วางแผนรายรับรายจ่ายล่วงหน้าทั้งเดือน',
      summary: 'สรุปภาพรวมรายรับ-รายจ่าย รายเดือน/รายปี',
      savings: 'ติดตามเงินเก็บสะสมตลอดทั้งปี' } },
  tax: { h: 'วางแผนภาษี', sub: 'คำนวณภาษีและวางแผนลดหย่อนให้คุ้มที่สุด (เฉพาะกรณีรายได้ประเภทงานประจำ เงินเดือน ม.40(1))' },
  ot: { h: 'คำนวณค่าล่วงเวลา (OT)', sub: 'คำนวณค่า OT ตามอัตรากฎหมาย — วันทำงาน วันหยุด และ OT วันหยุด' },
  retire: { h: 'กองทุนสำรองเลี้ยงชีพ', sub: 'คำนวณเงินกองทุน PVD ที่จะมีตอนเกษียณ' },
  settings: { h: 'การตั้งค่าบัญชี', sub: 'จัดการโปรไฟล์ ความปลอดภัย และบัญชีของคุณ' }
};

function BrandMark() {
  return (
    <div className="brand-mark">
      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11.5c0-2.8 2.6-5 6-5h3.5c.8-1 2-1.6 3.2-1.6 0 .8-.3 1.5-.7 2 .9.6 1.6 1.5 1.9 2.6l1.6.5c.4.1.6.5.6.9V14c0 .5-.4.9-.9.9h-1.2c-.4.6-.9 1.1-1.5 1.5V18a1 1 0 0 1-1 1h-1.2a1 1 0 0 1-1-1v-.6a7.7 7.7 0 0 1-2.7 0V18a1 1 0 0 1-1 1H7.9a1 1 0 0 1-1-1v-1.7C5 15.2 3.8 13.5 3.6 11.5Z" data-comment-anchor="958734be7a-path-32-9" />
        <circle cx="15" cy="11" r="0.9" fill="#fff" stroke="none" />
      </svg>
    </div>);

}

function Sidebar({ page, setPage, sub, setSub }) {
  const go = (n) => {setPage(n.id);if (n.subs) setSub(n.subs[0].id);};
  return (
    <aside className="sidebar">
      <button className="brand" onClick={() => setPage('welcome')} style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%' }}>
        <BrandMark />
        <div style={{ textAlign: 'left' }}>
          <div className="brand-name">Piggy Plan</div>
          <div className="brand-sub">วางแผนการเงินส่วนตัว</div>
        </div>
      </button>

      <button className="nav-item home-item" onClick={() => setPage('welcome')}>
        <span className="ni-ic"><Ic d={ICONS.home} size={21} /></span>
        หน้าแรก
      </button>

      <div className="nav-group-label">เมนูหลัก</div>
      {NAV.map((n) =>
      <React.Fragment key={n.id}>
          <button className={'nav-item' + (page === n.id ? ' active' : '')} onClick={() => go(n)}>
            <span className="ni-ic"><Ic d={ICONS[n.icon]} size={21} /></span>
            {n.label}
            {page === n.id && <span className="nav-dot" />}
          </button>
          {n.subs && page === n.id &&
        <div className="nav-subs">
              {n.subs.map((s) =>
          <button key={s.id} className={'nav-sub' + (sub === s.id ? ' on' : '')} onClick={() => setSub(s.id)}>
                  <span className="nav-sub-dot" />{s.label}
                </button>
          )}
            </div>
        }
        </React.Fragment>
      )}

      <div className="side-foot">
        <div className="side-card">
          <div style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 4, fontFamily: 'var(--font-head)' }}>💡 รู้ไหม?</div>
          วางแผนเงินตั้งแต่ต้นเดือน ช่วยให้คุณคุมรายจ่ายและออมได้ตามเป้า
        </div>
      </div>
    </aside>);

}

function Topbar({ page, sub, month, setPage, profile, setProfile, onOpenSettings }) {
  const meta = PAGE_META[page];
  const subText = meta.subs ? meta.subs[sub] : meta.sub;
  return (
    <header className="topbar">
      <button className="home-btn" onClick={() => setPage('welcome')} title="กลับหน้าแรก">
        <Ic d={ICONS.home} size={20} />
      </button>
      <div>
        <div className="page-h">{meta.h}</div>
        <div className="page-sub">{subText}</div>
      </div>
      <div className="topbar-spacer" />
      <ProfileMenu profile={profile} setProfile={setProfile} onOpenSettings={onOpenSettings} />
    </header>);

}

function MobileTop({ page, setPage, profile, setProfile, onOpenSettings }) {
  const meta = PAGE_META[page];
  return (
    <div className="mobile-top">
      <button onClick={() => setPage('welcome')} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}><BrandMark /></button>
      <h1>{meta.h}</h1>
      <div style={{ flex: 1 }} />
      <button className="home-btn" onClick={() => setPage('welcome')} title="กลับหน้าแรก">
        <Ic d={ICONS.home} size={19} />
      </button>
      <ProfileMenu profile={profile} setProfile={setProfile} size={38} onOpenSettings={onOpenSettings} />
    </div>);

}

function MobileNav({ page, setPage, sub, setSub }) {
  const go = (n) => {setPage(n.id);if (n.subs) setSub(n.subs[0].id);};
  return (
    <nav className="mobile-nav">
      <button className="mnav-item" onClick={() => setPage('welcome')}>
        <span className="mnav-ic"><Ic d={ICONS.home} size={21} /></span>
        หน้าแรก
      </button>
      {NAV.map((n) =>
      <button key={n.id} className={'mnav-item' + (page === n.id ? ' active' : '')} onClick={() => go(n)}>
          <span className="mnav-ic"><Ic d={ICONS[n.icon]} size={21} /></span>
          {n.short}
        </button>
      )}
    </nav>);

}

Object.assign(window, { NAV, PAGE_META, Sidebar, Topbar, MobileTop, MobileNav, BrandMark });