import React from 'react';
import '../../shared/globals.js';
const { fmt, baht, fmtK, useStored, ClearBtn, calcTax, taxBreakdown, TAX_BRACKETS, DEDUCTION_ITEMS, DED_CATS, THAI_MONTHS, EXPENSE_CATS, catById, INCOME_CATS, incomeCat, INITIAL_TX, CAT_COLORS, PLAN_SEED, MONTH_LABELS, MONTHLY_HISTORY, retirementPlan, Ic, ICONS, pvdPlan, niceStep, MoneyInput, CustomSelect, Donut, GroupedBars, AreaChart, LineChart, Ring, CompareBars, ConfirmHost, useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider, TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton, ProfileMenu, SettingsModal, Avatar, PROFILE_DEFAULT, GoogleMark, isGoogle, ProfileTab, SecurityTab, AccountTab, NAV, PAGE_META, Sidebar, Topbar, MobileTop, MobileNav, BrandMark } = window;
/* ============================================================
   pages_settings.jsx — หน้าตั้งค่าบัญชีแบบเต็มหน้า
   (จัดการโปรไฟล์ · เปลี่ยนรหัสผ่าน · ตั้งค่าบัญชี)
   ใช้ฟอร์มเดิมจาก profile.jsx: ProfileTab / SecurityTab / AccountTab
   ============================================================ */

const SETTINGS_SECTIONS = [
  { id: 'profile',  icon: 'userEdit', label: 'จัดการโปรไฟล์', desc: 'ชื่อ อีเมล และรูปโปรไฟล์',
    h: 'จัดการโปรไฟล์', hsub: 'แก้ไขชื่อที่ใช้แสดง อีเมล และสีไอคอนโปรไฟล์ของคุณ' },
  { id: 'security', icon: 'lock',     label: 'เปลี่ยนรหัสผ่าน', desc: 'รหัสผ่านและความปลอดภัย',
    h: 'เปลี่ยนรหัสผ่าน', hsub: 'ตั้งรหัสผ่านใหม่เพื่อรักษาความปลอดภัยของบัญชี' },
  { id: 'account',  icon: 'shield',   label: 'ตั้งค่าบัญชี', desc: 'ออกจากระบบ และลบบัญชี',
    h: 'ตั้งค่าบัญชี', hsub: 'จัดการการเข้าใช้งานและข้อมูลบัญชีของคุณ' },
];

function SettingsPage({ section, setSection, profile, setProfile, onClose, onLogout }) {
  const sec = SETTINGS_SECTIONS.find(s => s.id === section) || SETTINGS_SECTIONS[0];

  return (
    <div className="content page-anim" data-screen-label="settings">
      <div className="settings-shell">

        <aside className="settings-nav">
          <div className="settings-nav-card">
            <Avatar profile={profile} size={54} />
            <div className="settings-nav-id">
              <div className="settings-nav-name">{profile.name || 'ผู้ใช้งาน'}</div>
              <div className="settings-nav-email">{profile.email}</div>
            </div>
          </div>

          <div className="settings-nav-list">
            {SETTINGS_SECTIONS.map(s => (
              <button key={s.id} className={'settings-nav-item' + (section === s.id ? ' on' : '')}
                onClick={() => setSection(s.id)}>
                <span className="settings-nav-ic"><Ic d={ICONS[s.icon]} size={20} /></span>
                <span className="settings-nav-txt">
                  <span className="settings-nav-item-label">{s.label}</span>
                  <span className="settings-nav-item-desc">{s.desc}</span>
                </span>
                <span className="settings-nav-go"><Ic d={ICONS.chevron} size={16} /></span>
              </button>
            ))}
          </div>
        </aside>

        <div className="settings-main">
          <div className="settings-sec-head">
            <div className="settings-sec-ic"><Ic d={ICONS[sec.icon]} size={22} /></div>
            <div>
              <h2 className="settings-sec-title">{sec.h}</h2>
              <p className="settings-sec-sub">{sec.hsub}</p>
            </div>
          </div>

          <div className="card settings-pane-card" key={section}>
            {section === 'profile'  && <ProfileTab  profile={profile} setProfile={setProfile} onClose={onClose} />}
            {section === 'security' && <SecurityTab profile={profile} onClose={onClose} />}
            {section === 'account'  && <AccountTab  profile={profile} onLogout={onLogout} onClose={onClose} />}
          </div>
        </div>

      </div>
    </div>
  );
}

Object.assign(window, { SettingsPage, SETTINGS_SECTIONS });
