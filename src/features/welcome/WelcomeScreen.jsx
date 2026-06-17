import React from 'react';
import '../../shared/globals.js';
const { fmt, baht, fmtK, useStored, ClearBtn, calcTax, taxBreakdown, TAX_BRACKETS, DEDUCTION_ITEMS, DED_CATS, THAI_MONTHS, EXPENSE_CATS, catById, INCOME_CATS, incomeCat, INITIAL_TX, CAT_COLORS, PLAN_SEED, MONTH_LABELS, MONTHLY_HISTORY, retirementPlan, Ic, ICONS, pvdPlan, niceStep, MoneyInput, CustomSelect, Donut, GroupedBars, AreaChart, LineChart, Ring, CompareBars, ConfirmHost, useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider, TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton, ProfileMenu, SettingsModal, Avatar, PROFILE_DEFAULT, GoogleMark, isGoogle, ProfileTab, SecurityTab, AccountTab, NAV, PAGE_META, Sidebar, Topbar, MobileTop, MobileNav, BrandMark } = window;
/* ============================================================
   pages_welcome.jsx — หน้า Welcome (เลือกเมนู)
   ============================================================ */

function PiggyAnim() {
  return (
    <div className="piggy-anim" aria-label="piggy bank" role="img">
      <svg viewBox="0 0 220 210" width="100%" height="100%">
        <defs>
          <radialGradient id="pigGrad" cx="42%" cy="34%" r="78%">
            <stop offset="0%" stopColor="#FFD3CC" />
            <stop offset="62%" stopColor="#FFB3AA" />
            <stop offset="100%" stopColor="#FF9189" />
          </radialGradient>
          <radialGradient id="snoutGrad" cx="45%" cy="35%" r="75%">
            <stop offset="0%" stopColor="#FFB9B1" />
            <stop offset="100%" stopColor="#F58E86" />
          </radialGradient>
          <radialGradient id="coinGrad" cx="40%" cy="35%" r="75%">
            <stop offset="0%" stopColor="#FAD27A" />
            <stop offset="100%" stopColor="#E7A23B" />
          </radialGradient>
        </defs>

        {/* ground shadow */}
        <ellipse className="piggy-shadow" cx="110" cy="192" rx="60" ry="8.5" fill="rgba(120,70,60,.10)" />

        <g className="piggy-bob">
          {/* feet — little rounded nubs */}
          <ellipse cx="84" cy="178" rx="13" ry="11" fill="#F49A92" />
          <ellipse cx="136" cy="178" rx="13" ry="11" fill="#F49A92" />

          {/* ears — soft floppy curved */}
          <path className="ear ear-l" d="M66 64 C52 40 60 30 74 36 C86 41 92 58 88 74 C82 72 73 70 66 64 Z" fill="#F58E86" />
          <path className="ear ear-r" d="M154 64 C168 40 160 30 146 36 C134 41 128 58 132 74 C138 72 147 70 154 64 Z" fill="#F58E86" />
          <path className="ear ear-l" d="M70 62 C61 47 65 40 74 44 C82 48 85 59 82 69 C78 67 73 66 70 62 Z" fill="#FFC3BD" />
          <path className="ear ear-r" d="M150 62 C159 47 155 40 146 44 C138 48 135 59 138 69 C142 67 147 66 150 62 Z" fill="#FFC3BD" />

          {/* body — plump & round */}
          <ellipse cx="110" cy="120" rx="73" ry="66" fill="url(#pigGrad)" />
          {/* belly highlight */}
          <ellipse cx="92" cy="98" rx="34" ry="26" fill="#FFFFFF" opacity="0.18" />

          {/* coin slot */}
          <rect x="92" y="58" width="36" height="9" rx="4.5" fill="#D07D77" />

          {/* cheeks */}
          <circle cx="70" cy="130" r="11" fill="#FF8A86" opacity="0.34" />
          <circle cx="150" cy="130" r="11" fill="#FF8A86" opacity="0.34" />

          {/* eyes — big & shiny */}
          <g className="eye eye-l">
            <ellipse cx="89" cy="108" rx="8.5" ry="9.5" fill="#4A3A34" />
            <circle cx="86" cy="104.5" r="3" fill="#fff" />
            <circle cx="91.5" cy="111" r="1.5" fill="#fff" opacity="0.85" />
          </g>
          <g className="eye eye-r">
            <ellipse cx="131" cy="108" rx="8.5" ry="9.5" fill="#4A3A34" />
            <circle cx="128" cy="104.5" r="3" fill="#fff" />
            <circle cx="133.5" cy="111" r="1.5" fill="#fff" opacity="0.85" />
          </g>

          {/* little smile */}
          <path d="M101 126 Q110 133 119 126" fill="none" stroke="#C76B66" strokeWidth="2.6" strokeLinecap="round" />

          {/* snout */}
          <ellipse cx="110" cy="144" rx="25" ry="19" fill="url(#snoutGrad)" />
          <ellipse cx="103" cy="129" rx="9" ry="5" fill="#FFFFFF" opacity="0.25" />
          <ellipse cx="101.5" cy="144" rx="4" ry="7" fill="#C76B66" />
          <ellipse cx="118.5" cy="144" rx="4" ry="7" fill="#C76B66" />
        </g>

        {/* dropping coin */}
        <g className="coin">
          <circle cx="110" cy="40" r="15" fill="url(#coinGrad)" stroke="#D9912F" strokeWidth="2" />
          <text x="110" y="46" textAnchor="middle" fontSize="17" fontWeight="700" fill="#B9791F" fontFamily="Prompt, sans-serif">฿</text>
        </g>
      </svg>
    </div>
  );
}

function WelcomeScreen({ open, profile, setProfile, onOpenSettings }) {
  const subs = [
    { id: 'monthly', emoji: '🗓️', title: 'วางแผนการเงินรายเดือน', desc: 'ตั้งงบรายรับ-รายจ่ายล่วงหน้า' },
    { id: 'summary', emoji: '📊', title: 'สรุปรายรับ-รายจ่าย', desc: 'ภาพรวมรายเดือน / รายปี' },
    { id: 'savings', emoji: '🐖', title: 'สรุปเงินเก็บรายปี', desc: 'ติดตามเงินออมสะสม' },
  ];

  return (
    <div className="welcome page-anim">
      <div className="welcome-blob b1" />
      <div className="welcome-blob b2" />
      <div className="welcome-blob b3" />

      <header className="welcome-top">
        <div className="brand" style={{ padding: 0 }}>
          <BrandMark />
          <div>
            <div className="brand-name" style={{ fontSize: 19 }}>Piggy Plan</div>
            <div className="brand-sub">วางแผนการเงินส่วนตัว</div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <ProfileMenu profile={profile} setProfile={setProfile} onOpenSettings={onOpenSettings} />
      </header>

      <div className="welcome-body">
        <div className="welcome-hero">
          <PiggyAnim />
          <h1 className="welcome-title">วางแผนการเงิน<br /><span className="hl">ให้เป็นเรื่องสนุก</span></h1>
          <p className="welcome-sub">เลือกเมนูด้านล่างเพื่อเริ่มต้น — ดูแลการเงินรายเดือน ภาษี และเงินเกษียณ ครบจบในที่เดียว 🐽</p>
        </div>

        <div className="welcome-menu">
          {/* การ์ดหลัก: วางแผนการเงินส่วนตัว + 3 เมนูย่อย */}
          <div className="welcome-bigcard">
            <div className="welcome-bigcard-head">
              <span className="welcome-tile-ic" style={{ boxShadow: '0 0 0 4px #BCE29E55', fontSize: 26 }}>💰</span>
              <div>
                <div className="welcome-bigcard-title">วางแผนการเงินส่วนตัว</div>
                <div className="welcome-tile-desc">จัดการเงินเข้า-ออก และเงินออมของคุณ</div>
              </div>
            </div>
            <div className="welcome-sub-grid">
              {subs.map(s => (
                <button key={s.id} className="welcome-sub-tile" onClick={() => open('plan', s.id)}>
                  <span className="welcome-sub-emoji">{s.emoji}</span>
                  <div className="welcome-sub-title">{s.title}</div>
                  <div className="welcome-sub-desc">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* การ์ดรอง: ภาษี + OT + เกษียณ */}
          <div className="welcome-duo welcome-trio">
            <button className="welcome-tile" style={{ background: 'linear-gradient(150deg,#FBE0D2,#FFF1EA)' }} onClick={() => open('tax')}>
              <span className="welcome-tile-ic" style={{ boxShadow: '0 0 0 4px #F8C4B455' }}>🧾</span>
              <div className="welcome-tile-main">
                <div className="welcome-tile-title">วางแผนภาษี</div>
                <div className="welcome-tile-desc">คำนวณภาษี + วางแผนลดหย่อน</div>
              </div>
              <span className="welcome-tile-go"><Ic d={ICONS.chevron} size={20} /></span>
            </button>
            <button className="welcome-tile" style={{ background: 'linear-gradient(150deg,#FCE8DD,#FFF6F0)' }} onClick={() => open('ot')}>
              <span className="welcome-tile-ic" style={{ boxShadow: '0 0 0 4px #F8C4B455' }}>⏱️</span>
              <div className="welcome-tile-main">
                <div className="welcome-tile-title">คำนวณค่าล่วงเวลา (OT)</div>
                <div className="welcome-tile-desc">คิดค่า OT ตามอัตรากฎหมาย</div>
              </div>
              <span className="welcome-tile-go"><Ic d={ICONS.chevron} size={20} /></span>
            </button>
            <button className="welcome-tile" style={{ background: 'linear-gradient(150deg,#F0F3D2,#FAFBE8)' }} onClick={() => open('retire')}>
              <span className="welcome-tile-ic" style={{ boxShadow: '0 0 0 4px #E5EBB255' }}>🌴</span>
              <div className="welcome-tile-main">
                <div className="welcome-tile-title">กองทุนสำรองเลี้ยงชีพ</div>
                <div className="welcome-tile-desc">คำนวณเงินกองทุน PVD ตอนเกษียณ</div>
              </div>
              <span className="welcome-tile-go"><Ic d={ICONS.chevron} size={20} /></span>
            </button>
          </div>
        </div>
      </div>

      <div className="welcome-foot">🐽 Piggy Plan · ออมเงินอย่างมีความสุข</div>
    </div>
  );
}

Object.assign(window, { WelcomeScreen });
