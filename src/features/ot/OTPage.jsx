import React from 'react';
import ReactDOM from 'react-dom';
import '../../shared/globals.js';
const { fmt, baht, fmtK, useStored, ClearBtn, calcTax, taxBreakdown, TAX_BRACKETS, DEDUCTION_ITEMS, DED_CATS, THAI_MONTHS, EXPENSE_CATS, catById, INCOME_CATS, incomeCat, INITIAL_TX, CAT_COLORS, PLAN_SEED, MONTH_LABELS, MONTHLY_HISTORY, retirementPlan, Ic, ICONS, pvdPlan, niceStep, MoneyInput, CustomSelect, Donut, GroupedBars, AreaChart, LineChart, Ring, CompareBars, ConfirmHost, useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider, TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton, ProfileMenu, SettingsModal, Avatar, PROFILE_DEFAULT, GoogleMark, isGoogle, ProfileTab, SecurityTab, AccountTab, NAV, PAGE_META, Sidebar, Topbar, MobileTop, MobileNav, BrandMark } = window;
/* ============================================================
   pages_ot.jsx — คำนวณค่าล่วงเวลา (OT)
   ดีไซน์แบบ "ใบคำนวณ OT" (worksheet/สลิป) — ไม่ใช่การ์ดแยกบล็อกแบบหน้าอื่น
   อ้างอิงอัตราตาม พ.ร.บ.คุ้มครองแรงงาน
   ============================================================ */

/* ---------- ช่องกรอกแบบ "เติมในช่องว่าง" (ขีดเส้นใต้) ---------- */
function BlankNum({ value, onChange, w = 60, placeholder = '0', max = 744 }) {
  return (
    <span className="ot-blank" style={{ width: w }}>
      <input className="ot-blank-input" type="text" inputMode="decimal"
      value={value === 0 ? '' : value} placeholder={placeholder}
      onChange={(e) => {
        let v = e.target.value.replace(/[^\d.]/g, '');
        const p = v.split('.');
        if (p.length > 2) v = p[0] + '.' + p.slice(1).join('');
        let n = parseFloat(v);
        if (isNaN(n)) n = 0;
        n = Math.min(n, max);
        onChange(v === '' ? 0 : v.endsWith('.') ? v : n);
      }} />
    </span>);

}

function BlankMoney({ value, onChange, w = 130 }) {
  const display = value ? Number(value).toLocaleString('en-US') : '';
  return (
    <span className="ot-blank ot-blank-money" style={{ width: w }}>
      <span className="ot-blank-baht">฿</span>
      <input className="ot-blank-input" type="text" inputMode="numeric"
      value={display} placeholder="0"
      onChange={(e) => onChange(parseInt(e.target.value.replace(/[^\d]/g, '')) || 0)} />
    </span>);

}

/* นิยามประเภทค่าล่วงเวลา — ตัวคูณบางตัวขึ้นกับประเภทลูกจ้าง */
const OT_DEFS = [
{ id: 'workday', emoji: '🌙', name: 'OT วันทำงาน', mult: 1.5, color: 'var(--coral-deep)', soft: '#FFE3DD',
  when: 'ชั่วโมงที่ทำเกินจากเวลาทำงานปกติในวันทำงาน (เช่น อยู่ต่อหลังเลิกงาน จันทร์–ศุกร์)' },
{ id: 'holiday', emoji: '📅', name: 'ทำงานในวันหยุด', mult: { monthly: 1, daily: 2 }, color: 'var(--peach-deep)', soft: '#FCE3D6',
  when: 'มาทำงานในวันหยุดประจำสัปดาห์ / นักขัตฤกษ์ / วันหยุดพักผ่อน ในช่วงเวลางานปกติ (ไม่เกิน 8 ชม.)' },
{ id: 'holidayOt', emoji: '✨', name: 'OT วันหยุด', mult: 3, color: 'var(--mint-deep)', soft: '#E7F2E0',
  when: 'ชั่วโมงที่ทำเกิน 8 ชม. ในวันหยุด (ส่วนที่เกินจากเวลางานปกติของวันหยุด)' }];

const otMult = (def, empType) => typeof def.mult === 'object' ? def.mult[empType] : def.mult;

function OTRateModal({ onClose }) {
  React.useEffect(() => {
    const onKey = (e) => {if (e.key === 'Escape') onClose();};
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="ปิด"><Ic d={ICONS.close} size={20} /></button>
        <div className="row-sub" style={{ fontWeight: 600, color: 'var(--coral-deep)', letterSpacing: '.02em' }}>ที่มา: พ.ร.บ.คุ้มครองแรงงาน</div>
        <h3 style={{ fontSize: 21, marginBottom: 4 }}>อัตราค่าล่วงเวลาตามกฎหมาย</h3>
        <p className="modal-lead">ค่าล่วงเวลาคิดจาก <b>ค่าจ้างต่อชั่วโมง × ตัวคูณ × จำนวนชั่วโมง</b> ตัวคูณบางประเภทต่างกันระหว่างลูกจ้างรายเดือนกับรายวัน</p>

        <div className="saltax-wrap">
          <table className="saltax">
            <thead>
              <tr>
                <th style={{ textAlign: 'left', paddingLeft: 14 }}>ประเภทการทำงาน</th>
                <th>ลูกจ้างรายเดือน</th>
                <th>ลูกจ้างรายวัน</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ textAlign: 'left', paddingLeft: 14, fontWeight: 500 }}>OT วันทำงาน<div className="row-sub">ทำเกินเวลางานปกติในวันทำงาน</div></td>
                <td>1.5 เท่า</td>
                <td>1.5 เท่า</td>
              </tr>
              <tr>
                <td style={{ textAlign: 'left', paddingLeft: 14, fontWeight: 500 }}>ทำงานในวันหยุด<div className="row-sub">ในเวลาทำงานปกติ</div></td>
                <td>1 เท่า</td>
                <td>2 เท่า</td>
              </tr>
              <tr>
                <td style={{ textAlign: 'left', paddingLeft: 14, fontWeight: 500 }}>OT วันหยุด<div className="row-sub">ทำเกินเวลางานปกติในวันหยุด</div></td>
                <td>3 เท่า</td>
                <td>3 เท่า</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="plan-note" style={{ marginTop: 16 }}>
          <b>ลูกจ้างรายเดือน</b> ได้รับค่าจ้างในวันหยุดอยู่แล้ว เมื่อมาทำงานวันหยุดในเวลาปกติจึงได้ค่าจ้าง <b>เพิ่มอีก 1 เท่า</b> ส่วน<b>ลูกจ้างรายวัน</b>ปกติไม่ได้ค่าจ้างวันหยุด เมื่อมาทำงานจึงได้ <b>2 เท่า</b><br />
          ค่าจ้างต่อชั่วโมงของลูกจ้างรายเดือน = (เงินเดือน ÷ จำนวนวันทำงาน) ÷ ชั่วโมงทำงานต่อวัน
        </div>
      </div>
    </div>,
    document.body
  );
}

function OTPage() {
  const [empType, setEmpType] = useStored('ot.empType', 'monthly'); // 'monthly' | 'daily'
  const [salary, setSalary] = useStored('ot.salary', 0);
  const [dailyWage, setDaily] = useStored('ot.dailyWage', 0);
  const [workDays, setWorkDays] = useStored('ot.workDays.v2', 0);
  const [hoursPerDay, setHoursPerDay] = useStored('ot.hoursPerDay.v2', 0);
  const [hours, setHours] = useStored('ot.hours.v1', { workday: 0, holiday: 0, holidayOt: 0 });
  const [refOpen, setRefOpen] = React.useState(false);

  const setHr = (id, v) => setHours((prev) => ({ ...prev, [id]: v }));
  const numHr = (id) => parseFloat(hours[id]) || 0;

  const hourly = empType === 'monthly' ?
  workDays > 0 && hoursPerDay > 0 ? salary / workDays / hoursPerDay : 0 :
  hoursPerDay > 0 ? dailyWage / hoursPerDay : 0;

  const rows = OT_DEFS.map((d) => {
    const m = otMult(d, empType);
    const hrs = numHr(d.id);
    return { ...d, m, hrs, amount: hrs * hourly * m };
  });
  const totalOT = rows.reduce((s, r) => s + r.amount, 0);
  const totalHrs = rows.reduce((s, r) => s + r.hrs, 0);
  const filled = rows.filter((r) => r.hrs > 0);

  const clearAll = () => {
    setSalary(0);setDaily(0);setWorkDays(0);setHoursPerDay(0);
    setHours({ workday: 0, holiday: 0, holidayOt: 0 });
  };

  const money = (n) => baht(n, n % 1 ? 2 : 0);

  return (
    <div className="content page-anim ot-page">

      {/* แบนเนอร์ระบุตัวตนหน้า OT */}
      <div className="ot-banner">
        <div className="ot-banner-ic"><Ic d={ICONS.clock} size={28} /></div>
        <div className="ot-banner-txt">
          <div className="ot-banner-kicker" data-comment-anchor="1cb3d97f8a-div-142-11">OVERTIME · ค่าล่วงเวลา</div>
          <h2 className="ot-banner-title">ใบคำนวณค่า OT</h2>
        </div>
        <ClearBtn label="ล้างข้อมูล" confirmMsg="ล้างข้อมูลค่าจ้างและชั่วโมง OT ทั้งหมดใช่หรือไม่?" onClear={clearAll} />
      </div>

      {/* ===== แผ่นใบคำนวณ (worksheet) — ทุกอย่างอยู่บนแผ่นเดียว คั่นด้วยเส้น ===== */}
      <div className="ot-sheet">

        {/* — ส่วนที่ 1: ฐานค่าจ้าง แบบเติมประโยค — */}
        <div className="ot-step">
          <span className="ot-step-no">1</span>
          <span className="ot-step-label">ฐานค่าจ้างของฉัน</span>
          <button className="ot-step-info" onClick={() => setRefOpen(true)} aria-label="ดูอัตราตามกฎหมาย"><Ic d={ICONS.info} size={17} /> วิธีคิด</button>
        </div>

        <div className="ot-fields">
          <div className="ot-field-row">
            <span className="ot-field-label">ประเภทลูกจ้าง</span>
            <span className="ot-pick">
              <button className={'ot-pick-btn' + (empType === 'monthly' ? ' on' : '')} onClick={() => setEmpType('monthly')}>รายเดือน</button>
              <button className={'ot-pick-btn' + (empType === 'daily' ? ' on' : '')} onClick={() => setEmpType('daily')}>รายวัน</button>
            </span>
          </div>
          <div className="ot-field-row">
            <span className="ot-field-label">{empType === 'monthly' ? 'เงินเดือน' : 'ค่าจ้างต่อวัน'}</span>
            <span className="ot-field-control">
              <BlankMoney value={empType === 'monthly' ? salary : dailyWage} onChange={empType === 'monthly' ? setSalary : setDaily} w={150} />
            </span>
          </div>
          <div className="ot-field-row">
            <span className="ot-field-label">วันทำงานต่อเดือน</span>
            <span className="ot-field-control">
              <BlankNum value={workDays} onChange={(v) => setWorkDays(parseFloat(v) || 0)} w={58} placeholder="" max={31} />
              <span className="ot-unit">วัน</span>
            </span>
          </div>
          <div className="ot-field-row">
            <span className="ot-field-label">ชั่วโมงทำงานต่อวัน</span>
            <span className="ot-field-control">
              <BlankNum value={hoursPerDay} onChange={(v) => setHoursPerDay(parseFloat(v) || 0)} w={54} placeholder="" max={24} />
              <span className="ot-unit">ชม.</span>
            </span>
          </div>
        </div>

        <div className="ot-hourly">
          <span className="ot-hourly-label">คิดเป็นค่าจ้าง</span>
          <span className="ot-hourly-val">{money(hourly)}</span>
          <span className="ot-hourly-unit">/ ชั่วโมง</span>
          {empType === 'monthly' && hourly > 0 &&
          <span className="ot-hourly-formula">= {fmt(salary)} ÷ {fmt(workDays)} วัน ÷ {fmt(hoursPerDay)} ชม.</span>
          }
        </div>

        {/* — ส่วนที่ 2: รายการชั่วโมง OT แบบบัญชี (ledger) — */}
        <div className="ot-step" style={{ marginTop: 34 }}>
          <span className="ot-step-no">2</span>
          <span className="ot-step-label">กรอกชั่วโมงล่วงเวลาในงวดนี้</span>
        </div>

        <div className="ot-ledger">
          {rows.map((r) =>
          <div key={r.id} className="ot-line">
              <div className="ot-stamp" style={{ color: r.color, background: r.soft, borderColor: r.color }}>
                <span className="ot-stamp-cap">คูณ</span>
                <span className="ot-stamp-num">{r.m}</span>
                <span className="ot-stamp-cap">เท่า</span>
              </div>
              <div className="ot-line-info">
                <div className="ot-line-name"><span className="ot-line-emoji">{r.emoji}</span>{r.name}</div>
                <div className="ot-line-when">{r.when}</div>
              </div>
              <div className="ot-line-foot">
                <label className="ot-entry">
                  <span className="ot-entry-lab">ทำไป</span>
                  <BlankNum value={hours[r.id]} onChange={(v) => setHr(r.id, v)} w={56} />
                  <span className="ot-entry-lab">ชม.</span>
                </label>
                <span className="ot-line-amt" style={{ color: r.amount > 0 ? r.color : 'var(--ink-faint)' }}>
                  {r.amount > 0 ? money(r.amount) : '—'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* — ท้ายใบ: สรุปแบบใบเสร็จ — */}
        <div className="ot-receipt">
          {filled.length > 0 &&
          <div className="ot-receipt-lines">
              {filled.map((r) =>
            <div key={r.id} className="ot-receipt-line">
                  <span className="ot-receipt-dot" style={{ background: r.color }} />
                  <span className="ot-receipt-name">{r.name}</span>
                  <span className="ot-receipt-calc">{fmt(r.hrs)} ชม. × {money(hourly)} × {r.m}</span>
                  <span className="ot-receipt-val">{money(r.amount)}</span>
                </div>
            )}
            </div>
          }

          {totalOT > 0 &&
          <div className="ot-propbar">
              {filled.map((r) =>
            <span key={r.id} style={{ width: r.amount / totalOT * 100 + '%', background: r.color }} />
            )}
            </div>
          }

          <div className="ot-grand" data-comment-anchor="65298d2afb-div-252-11">
            <div className="ot-grand-l">
              <span className="ot-grand-label">ค่าล่วงเวลารวม</span>
              <span className="ot-grand-hrs">รวม {fmt(totalHrs)} ชั่วโมง</span>
            </div>
            <span className="ot-grand-val">{money(totalOT)}</span>
          </div>
        </div>
      </div>

      <p className="ot-foot-note">อ้างอิงอัตราตาม พ.ร.บ.คุ้มครองแรงงาน — สำหรับลูกจ้าง{empType === 'monthly' ? 'รายเดือน' : 'รายวัน'} · เวลางานปกติไม่เกิน 8 ชม./วัน · กด“วิธีคิด” เพื่อดูตารางอัตราเต็ม</p>

      {refOpen && <OTRateModal onClose={() => setRefOpen(false)} />}
    </div>);

}

Object.assign(window, { OTPage });