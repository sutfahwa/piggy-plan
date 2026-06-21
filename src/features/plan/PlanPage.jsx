import React from 'react';
import * as XLSX from 'xlsx';
window.XLSX = XLSX;
import '../../shared/globals.js';
const { fmt, baht, fmtK, useStored, ClearBtn, calcTax, taxBreakdown, TAX_BRACKETS, DEDUCTION_ITEMS, DED_CATS, THAI_MONTHS, EXPENSE_CATS, catById, INCOME_CATS, incomeCat, INITIAL_TX, CAT_COLORS, PLAN_SEED, MONTH_LABELS, MONTHLY_HISTORY, retirementPlan, Ic, ICONS, pvdPlan, niceStep, MoneyInput, CustomSelect, Donut, GroupedBars, AreaChart, LineChart, Ring, CompareBars, ConfirmHost, useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider, TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton, ProfileMenu, SettingsModal, Avatar, PROFILE_DEFAULT, GoogleMark, isGoogle, ProfileTab, SecurityTab, AccountTab, NAV, PAGE_META, Sidebar, Topbar, MobileTop, MobileNav, BrandMark } = window;
/* ============================================================
   pages_plan.jsx — วางแผนการเงินส่วนตัว (3 เมนูย่อย)
   v2: 4-section monthly plan + yearly savings tracker
   ============================================================ */

const INCOME_CATS_ARR = Object.keys(INCOME_CATS).map((k) => ({
  id: k, name: INCOME_CATS[k].name, icon: INCOME_CATS[k].icon
}));

/* ============================================================
   Seed data v2 — อ้างอิง Sheet รายรับรายจ่าย ปี 2569
   ============================================================ */
const PLAN_SEED_V2 = {
  income: [],
  saving: [],
  fixedExp: [],
  varExp: []
};

/* ============================================================
   Savings Seed — อ้างอิง Sheet เงินเก็บ
   save   = B  เงินออมจากรายได้เดือนนี้
   bonus  = D  โบนัส / รายได้พิเศษเข้าเงินเก็บ
   deduct = E  รายจ่ายหักออกจากเงินเก็บ
   adj    = F/G ปรับ ดาวน์/ลงทุน/อื่นๆ (บวก=เข้า, ลบ=ออก)
   bal    = H  ยอดสะสมสุทธิ (running balance)
   ============================================================ */
const MO = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const blankMonths = () => MO.map(() => ({ save: 0, bonus: 0, deduct: 0, note: '', custom: {} }));

const SAVINGS_SEED = {};

/* ---------- hooks ---------- */
function usePlanV2() {return useStored('plan.v2', PLAN_SEED_V2);}
function useSavings() {return useStored('savings.v2', SAVINGS_SEED);}
function rowSum(arr) {return arr.reduce((s, r) => s + (r.amount || 0), 0);}
function makeId(p) {return p + Date.now() + Math.random().toString(36).slice(2, 5);}

/* ── default categories per section ── */
const DEFAULT_PLAN_CATS = {
  income: [
  { id: 'salary', name: 'เงินเดือน' },
  { id: 'side', name: 'รายได้เสริม' },
  { id: 'invest', name: 'ผลตอบแทนลงทุน' },
  { id: 'bonus', name: 'โบนัส' },
  { id: 'other', name: 'อื่นๆ' }],

  saving: [
  { id: 'fund', name: 'กองทุน' },
  { id: 'stock', name: 'หุ้น' },
  { id: 'insure', name: 'ประกัน' },
  { id: 'deposit', name: 'เงินฝาก' },
  { id: 'other', name: 'อื่นๆ' }],

  fixedExp: [
  { id: 'home', name: 'ที่พัก' },
  { id: 'food', name: 'อาหาร' },
  { id: 'transit', name: 'เดินทาง' },
  { id: 'bill', name: 'บิลประจำ' },
  { id: 'debt', name: 'ผ่อนชำระ' },
  { id: 'other', name: 'อื่นๆ' }],

  varExp: [
  { id: 'shop', name: 'ช้อปปิ้ง' },
  { id: 'fun', name: 'บันเทิง' },
  { id: 'health', name: 'สุขภาพ' },
  { id: 'travel', name: 'ท่องเที่ยว' },
  { id: 'other', name: 'อื่นๆ' }]

};
function usePlanCats() {return useStored('plan.cats.v1', DEFAULT_PLAN_CATS);}

/* ============================================================
   Excel export helpers (SheetJS)
   ============================================================ */
function exportXLSX(filename, sheets) {
  if (!window.XLSX) {window.alert('ยังโหลดตัวช่วยสร้างไฟล์ Excel ไม่เสร็จ กรุณาลองอีกครั้งสักครู่');return;}
  const wb = XLSX.utils.book_new();
  sheets.forEach(function (s) {
    const ws = XLSX.utils.aoa_to_sheet(s.aoa);
    if (s.cols) ws['!cols'] = s.cols;
    XLSX.utils.book_append_sheet(wb, ws, (s.name || 'Sheet').slice(0, 31));
  });
  XLSX.writeFile(wb, filename);
}

function ExportBtn({ label, onClick, primary, disabled }) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      className={'btn btn-sm ' + (primary ? 'btn-soft' : 'btn-ghost')}
      style={{ fontSize: 12.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, opacity: disabled ? .45 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v11m0 0l-4-4m4 4l4-4M5 19h14" />
      </svg>
      {label}
    </button>);

}

/* ============================================================
   Shared UI pieces
   ============================================================ */
function AmtInput({ value, onChange, style }) {
  return (
    <div className="input-wrap" style={{ flex: '0 0 126px', ...style }}>
      <input
        className="input has-suffix tnum"
        type="text" inputMode="numeric"
        value={value === 0 ? '' : fmt(value)}
        placeholder="0"
        onChange={(e) => {
          const n = parseInt(e.target.value.replace(/[^\d]/g, ''), 10);
          onChange(isNaN(n) ? 0 : n);
        }}
        style={{ padding: '9px 40px 9px 12px', fontSize: 14 }} />
      
      <span className="input-suffix" style={{ fontSize: 13 }}>฿</span>
    </div>);

}

function SRow({ row, onUpdate, onDelete, cats, showSaveFlag, placeholder }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--line-soft)' }}>
      <input
        className="input"
        value={row.name}
        placeholder={placeholder || 'รายการ'}
        onChange={(e) => onUpdate({ name: e.target.value })}
        style={{ flex: 1, padding: '9px 12px', fontSize: 14 }} />
      
      {cats && cats.length > 0 &&
      <CustomSelect
        size="sm"
        value={row.cat || cats[0] && cats[0].id || ''}
        onChange={(v) => onUpdate({ cat: v })}
        options={cats.map(function (cat) {return { value: cat.id, label: cat.name };})}
        style={{ flex: '0 0 110px' }} />

      }
      <AmtInput value={row.amount} onChange={(v) => onUpdate({ amount: v })} />
      {showSaveFlag &&
      <button
        className="plan-del"
        onClick={() => onUpdate({ toSave: !row.toSave })}
        title={row.toSave ? 'นับในเงินเก็บรายปี · คลิกเพื่อยกเลิก' : 'ส่งไปเงินเก็บรายปี (คอลัมน์ เงินออม)'}
        style={{ color: row.toSave ? 'var(--mint-deep)' : 'var(--ink-faint)', transition: 'color .15s', flexShrink: 0 }}>
        
          <Ic d={ICONS.piggy} size={15} />
        </button>
      }
      <button className="plan-del" onClick={onDelete} title="ลบ">
        <Ic d={ICONS.trash} size={15} />
      </button>
    </div>);

}

/* Section configurations */
const SEC_CFG = {
  income: { label: 'รายรับ', icon: '💵', tint: 'tint-mint', color: 'var(--mint-deep)', addCat: { cat: 'salary' } },
  saving: { label: 'เงินออม / Fixed Saving', icon: '🐖', tint: 'tint-lime', color: 'var(--lime-deep)', addCat: {} },
  fixedExp: { label: 'ค่าใช้จ่ายประจำ', icon: '🧾', tint: 'tint-peach', color: 'var(--peach-deep)', addCat: {} },
  varExp: { label: 'ค่าใช้จ่ายแปรผัน', icon: '🛍️', tint: 'tint-coral', color: 'var(--coral-deep)', addCat: {} }
};

function SectionCard({ sKey, rows, total, onUpdate, onDelete, onAdd, cats, onCatsChange }) {
  const c = SEC_CFG[sKey];
  const [showMgr, setShowMgr] = React.useState(false);
  const [newName, setNewName] = React.useState('');

  function addCat() {
    const name = newName.trim();
    if (!name) return;
    onCatsChange([...(cats || []), { id: 'u' + Date.now(), name }]);
    setNewName('');
  }

  return (
    <div className={'stat ' + c.tint} style={{ borderRadius: 'var(--r-lg)', padding: '18px 20px', border: '1px solid var(--line-soft)' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 22, lineHeight: 1 }}>{c.icon}</span>
        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 16, flex: 1 }}>{c.label}</div>
        <button
          onClick={() => setShowMgr((v) => !v)}
          title="จัดการประเภท"
          style={{ display: 'flex', gap: 4, padding: '4px 9px', background: showMgr ? 'rgba(0,0,0,.06)' : 'rgba(255,255,255,.5)', border: '1px solid var(--line-soft)', borderRadius: 8, cursor: 'pointer', fontSize: 12, color: 'var(--ink-soft)', fontFamily: 'var(--font-body)', flexShrink: 0, flexDirection: "row", justifyContent: "flex-start", alignItems: "center" }}>
          
          ⚙ ประเภท
        </button>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', fontWeight: 500 }}>รวม</div>
          <div className="bignum tnum" style={{ fontSize: 19, color: c.color }}>{baht(total)}</div>
        </div>
      </div>

      {/* category manager */}
      {showMgr &&
      <div style={{ background: 'rgba(255,255,255,.75)', borderRadius: 'var(--r)', padding: '10px 12px', marginBottom: 10, border: '1px solid var(--line-soft)' }}>
          <div style={{ fontSize: 11, color: 'var(--ink-faint)', fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 8 }}>ประเภททั้งหมด</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {(cats || []).map(function (cat) {
            return (
              <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(0,0,0,.06)', borderRadius: 99, padding: '3px 6px 3px 10px', fontSize: 12.5 }}>
                  <span>{cat.name}</span>
                  <button
                  onClick={() => onCatsChange((cats || []).filter((x) => x.id !== cat.id))}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0 3px', color: 'var(--ink-soft)', fontSize: 16, lineHeight: 1 }}
                  title="ลบประเภท">
                  ×</button>
                </div>);

          })}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
            className="input"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCat()}
            placeholder="ชื่อประเภทใหม่..."
            style={{ flex: 1, padding: '7px 10px', fontSize: 13 }} />
          
            <button className="btn btn-ghost btn-sm" onClick={addCat} style={{ flexShrink: 0, fontSize: 13, background: 'rgba(255,255,255,.6)' }}>
              <Ic d={ICONS.plus} size={13} /> เพิ่ม
            </button>
          </div>
        </div>
      }

      {/* saving flag indicator */}
      {sKey === 'saving' && rows.some((r) => r.toSave) &&
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--mint-deep)', marginBottom: 10, padding: '6px 10px', background: 'rgba(255,255,255,.65)', borderRadius: 'var(--r)', border: '1px dashed var(--mint)' }}>
          <Ic d={ICONS.piggy} size={14} />
          <span>ส่งไปเงินเก็บรายปี (เงินออม): <b className="tnum">{baht(rows.filter((r) => r.toSave).reduce((s, r) => s + (r.amount || 0), 0))}</b></span>
        </div>
      }

      {/* column headers */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '0 10px 5px' }}>
        <span style={{ flex: 1, fontSize: 11, color: 'var(--ink-faint)', fontWeight: 500, letterSpacing: '.03em' }}>รายการ</span>
        {cats && cats.length > 0 && <span style={{ width: 110, fontSize: 11, color: 'var(--ink-faint)', fontWeight: 500, letterSpacing: '.03em', flexShrink: 0 }}>ประเภท</span>}
        <span style={{ width: 126, fontSize: 11, color: 'var(--ink-faint)', fontWeight: 500, textAlign: 'right', letterSpacing: '.03em', flexShrink: 0 }}>จำนวน (฿)</span>
        {sKey === 'saving' && <span style={{ width: 31, flexShrink: 0 }} />}
        <span style={{ width: 31, flexShrink: 0 }} />
      </div>

      {/* rows */}
      <div style={{ background: 'rgba(255,255,255,.55)', borderRadius: 'var(--r)', padding: '4px 10px 2px', marginBottom: 10 }}>
        {rows.length === 0 &&
        <div className="empty" style={{ padding: '10px 0', fontSize: 13 }}>ยังไม่มีรายการ</div>
        }
        {rows.map((r) =>
        <SRow
          key={r.id} row={r}
          cats={cats}
          showSaveFlag={sKey === 'saving'}
          placeholder={c.label}
          onUpdate={(p) => onUpdate(r.id, p)}
          onDelete={() => onDelete(r.id)} />

        )}
      </div>

      <button
        className="btn btn-ghost btn-sm"
        onClick={onAdd}
        style={{ fontSize: 13, width: '100%', justifyContent: 'center', background: 'rgba(255,255,255,.55)' }}>
        
        <Ic d={ICONS.plus} size={15} /> เพิ่มรายการ
      </button>
    </div>);

}


/* ============================================================
   1) วางแผนการเงินรายเดือน
   ============================================================ */
/* ─── all-months overview table (inline-editable) ─── */
function AllMonthsView({ year, allPlans, onPick, onEdit }) {
  const rows = MO.map(function (mo, i) {
    const p = allPlans[year + '-' + i];
    const inc = p ? rowSum(p.income) : 0;
    const sav = p ? rowSum(p.saving) : 0;
    const fix = p ? rowSum(p.fixedExp) : 0;
    const vr = p ? rowSum(p.varExp) : 0;
    return { i, mo, inc, sav, fix, vr, bal: inc - sav - fix - vr, has: !!p };
  });
  const sum = rows.reduce(function (a, r) {
    return { inc: a.inc + r.inc, sav: a.sav + r.sav, fix: a.fix + r.fix, vr: a.vr + r.vr, bal: a.bal + r.bal };
  }, { inc: 0, sav: 0, fix: 0, vr: 0, bal: 0 });
  const curMonthIdx = year === CURRENT_YEAR ? new Date().getMonth() : -1;

  const cols = [
  { key: 'inc', sk: 'income', label: 'รายรับ', color: 'var(--mint-deep)' },
  { key: 'sav', sk: 'saving', label: 'เงินออม', color: 'var(--lime-deep)' },
  { key: 'fix', sk: 'fixedExp', label: 'ค่าใช้จ่ายประจำ', color: 'var(--peach-deep)' },
  { key: 'vr', sk: 'varExp', label: 'ค่าใช้จ่ายแปรผัน', color: 'var(--coral-deep)' }];


  return (
    <React.Fragment>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 12.5, color: 'var(--ink-faint)' }}>
        <Ic d={ICONS.info} size={13} />
        <span>สรุปยอดรวมแต่ละเดือน (แสดงผลอย่างเดียว) · แก้ไขตัวเลขได้ที่แท็บ “กรอกแยกแต่ละรายการ” · กดลูกศรท้ายแถวเพื่อเปิดดูรายละเอียดเดือนนั้น</span>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'visible' }}>
        <div style={{ overflowX: 'auto', borderRadius: 'var(--r-lg)' }}>
          <table className="plan-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead>
              <tr style={{ background: 'var(--surface-2, #f7f7f5)' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600, position: 'sticky', left: 0, background: 'var(--surface-2, #f7f7f5)', zIndex: 1 }}>เดือน</th>
                {cols.map(function (c) {
                  return <th key={c.key} style={{ textAlign: 'right', padding: '12px 16px', fontSize: 12, color: c.color, fontWeight: 600, whiteSpace: 'nowrap' }}>{c.label}</th>;
                })}
                <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: 12, color: 'var(--ink)', fontWeight: 700, whiteSpace: 'nowrap' }}>คงเหลือ</th>
                <th style={{ width: 40 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map(function (r) {
                const isCurr = r.i === curMonthIdx;
                return (
                  <tr
                    key={r.i}
                    style={{ borderTop: '1px solid var(--line-soft)', background: isCurr ? 'var(--accent-soft)' : 'transparent' }}>
                    
                    <td style={{ padding: '9px 16px', fontWeight: 600, fontSize: 14, color: 'var(--ink)', position: 'sticky', left: 0, background: isCurr ? 'var(--accent-soft)' : 'var(--surface, #fff)', whiteSpace: 'nowrap' }}>
                      {r.mo}{isCurr && <span style={{ marginLeft: 6, fontSize: 10.5, color: 'var(--accent-deep)', fontWeight: 600 }}>● ตอนนี้</span>}
                    </td>
                    {cols.map(function (c) {
                      return (
                        <td key={c.key} className="tnum" style={{ textAlign: 'right', padding: '9px 16px', fontSize: 13.5, color: r[c.key] === 0 ? 'var(--ink-faint)' : c.color, whiteSpace: 'nowrap' }}>
                          {r[c.key] === 0 ? '—' : fmt(r[c.key])}
                        </td>);

                    })}
                    <td className="tnum" style={{ textAlign: 'right', padding: '9px 16px', fontSize: 13.5, fontWeight: 700, color: !r.has ? 'var(--ink-faint)' : r.bal >= 0 ? 'var(--mint-deep)' : 'var(--coral-deep)', whiteSpace: 'nowrap' }}>
                      {r.has ? baht(r.bal) : '—'}
                    </td>
                    <td style={{ textAlign: 'center', padding: '0 8px' }}>
                      <button
                        onClick={function () {onPick(r.i);}}
                        title="เปิดดูรายละเอียดเดือนนี้"
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-faint)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6, borderRadius: 8 }}
                        onMouseEnter={function (e) {e.currentTarget.style.background = 'rgba(0,0,0,.05)';e.currentTarget.style.color = 'var(--ink)';}}
                        onMouseLeave={function (e) {e.currentTarget.style.background = 'transparent';e.currentTarget.style.color = 'var(--ink-faint)';}}>
                        
                        <Ic d={ICONS.chevron} size={15} />
                      </button>
                    </td>
                  </tr>);

              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--line)', background: 'var(--surface-2, #f7f7f5)' }}>
                <td style={{ padding: '13px 16px', fontWeight: 700, fontSize: 14, position: 'sticky', left: 0, background: 'var(--surface-2, #f7f7f5)' }}>รวมทั้งปี</td>
                {cols.map(function (c) {
                  return <td key={c.key} className="tnum" style={{ textAlign: 'right', padding: '13px 16px', fontSize: 14, fontWeight: 700, color: c.color, whiteSpace: 'nowrap' }}>{baht(sum[c.key])}</td>;
                })}
                <td className="tnum" style={{ textAlign: 'right', padding: '13px 16px', fontSize: 14, fontWeight: 800, color: sum.bal >= 0 ? 'var(--mint-deep)' : 'var(--coral-deep)', whiteSpace: 'nowrap' }}>{baht(sum.bal)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </React.Fragment>);

}

/* ─── compact inline-editable number cell for the all-months grid ─── */
function DCell({ value, onChange, color, bg, selected, onMouseDownCell, onMouseEnterCell }) {
  const [editing, setEditing] = React.useState(false);
  const [raw, setRaw] = React.useState('');
  const start = function () {setRaw(value === 0 ? '' : String(value));setEditing(true);};
  const commit = function () {
    const n = parseInt(raw.replace(/[^\d]/g, ''), 10);
    onChange(isNaN(n) ? 0 : n);
    setEditing(false);
  };
  if (editing) {
    return (
      <input
        autoFocus type="text" inputMode="numeric" value={raw}
        onChange={function (e) {setRaw(e.target.value);}}
        onBlur={commit}
        onKeyDown={function (e) {if (e.key === 'Enter') commit();if (e.key === 'Escape') setEditing(false);}}
        style={{ width: '100%', boxSizing: 'border-box', border: 'none', borderBottom: '2px solid var(--accent)', background: '#fff', textAlign: 'right', font: 'inherit', fontSize: 13, color: color, padding: '5px 8px', outline: 'none', fontVariantNumeric: 'tabular-nums' }} />);


  }
  return (
    <div
      className="tnum"
      onMouseDown={onMouseDownCell}
      onMouseEnter={onMouseEnterCell}
      onDoubleClick={start}
      title="คลิกเลือก · ดับเบิลคลิกเพื่อแก้ไข · ลากเลือกหลายช่อง · Ctrl/⌘ C-V คัดลอก/วาง"
      style={{ display: 'block', textAlign: 'right', fontSize: 13, padding: '8px 11px', cursor: 'cell', color: value === 0 ? 'var(--ink-faint)' : color, whiteSpace: 'nowrap', userSelect: 'none',
        background: selected ? 'rgba(240,99,95,.18)' : bg,
        boxShadow: selected ? 'inset 0 0 0 1px var(--accent-deep)' : 'none' }}>
      {value === 0 ? '·' : fmt(value)}
    </div>);

}

/* ─── editable row-name (renames the item across all 12 months) ─── */
function RowName({ name, cat, cats, onRename, onDelete, onSetCat }) {
  const [editing, setEditing] = React.useState(false);
  const [val, setVal] = React.useState(name);
  React.useEffect(function () {if (!editing) setVal(name);}, [name, editing]);
  const commit = function () {const v = val.trim();if (v && v !== name) onRename(v);setEditing(false);};
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {editing ?
        <input
          autoFocus value={val}
          onChange={function (e) {setVal(e.target.value);}}
          onBlur={commit}
          onKeyDown={function (e) {if (e.key === 'Enter') commit();if (e.key === 'Escape') {setVal(name);setEditing(false);}}}
          style={{ flex: 1, minWidth: 0, border: 'none', borderBottom: '2px solid var(--accent)', background: '#fff', font: 'inherit', fontSize: 13.5, padding: '3px 2px', outline: 'none' }} /> :

        <span
          onClick={function () {setEditing(true);}} title="คลิกเพื่อเปลี่ยนชื่อรายการ"
          style={{ flex: 1, minWidth: 0, fontSize: 13.5, cursor: 'text', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}</span>
        }
        <button
          onClick={onDelete} title="ลบรายการนี้ (ทั้งปี)"
          onMouseEnter={function (e) {e.currentTarget.style.opacity = 1;e.currentTarget.style.color = 'var(--coral-deep)';}}
          onMouseLeave={function (e) {e.currentTarget.style.opacity = .4;e.currentTarget.style.color = 'var(--ink-faint)';}}
          style={{ flexShrink: 0, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-faint)', padding: '2px 3px', opacity: .4, transition: 'opacity .15s, color .15s', display: 'flex' }}>
          <Ic d={ICONS.trash} size={13} /></button>
      </div>
      {/* ป้ายประเภท (เลือก/แก้ได้ในตารางนี้เลย) */}
      {cats && cats.length > 0 && onSetCat &&
      <select
        value={cat || ''}
        onChange={function (e) {onSetCat(e.target.value);}}
        title="ประเภทของรายการนี้ — เปลี่ยนได้"
        style={{ alignSelf: 'flex-start', maxWidth: '100%', border: '1px solid var(--line)', background: 'var(--surface-2)', borderRadius: 99, fontSize: 10.5, color: 'var(--ink-soft)', padding: '1px 6px', fontFamily: 'var(--font-body)', cursor: 'pointer', appearance: 'auto' }}>
        {cats.map(function (c) {return <option key={c.id} value={c.id}>{c.name}</option>;})}
      </select>}
    </div>);

}

/* ============================================================
   All-months DETAIL grid — แต่ละรายการเป็นแถว · เดือนเป็นคอลัมน์
   (กรอกแยกแต่ละประเภทได้เหมือนสเปรดชีต)
   ============================================================ */
const DETAIL_SECS = [
{ key: 'income', label: 'รายรับ', icon: '💵', color: 'var(--mint-deep)', nameBg: '#F4FBEF', sumBg: '#DDF1D0' },
{ key: 'saving', label: 'เงินออม', icon: '🐖', color: 'var(--lime-deep)', nameBg: '#FBFBEF', sumBg: '#F0F3D2' },
{ key: 'fixedExp', label: 'ค่าใช้จ่ายประจำ', icon: '🧾', color: 'var(--peach-deep)', nameBg: '#FFF5EF', sumBg: '#FBE0D2' },
{ key: 'varExp', label: 'ค่าใช้จ่ายแปรผัน', icon: '🛍️', color: 'var(--coral-deep)', nameBg: '#FFF6F3', sumBg: '#FFE6E0' }];

const NAME_W = 184;
const MONTH_W = 82;

function AllMonthsDetail({ year, allPlans, cats, onCell, onAddRow, onRenameRow, onDeleteRow, onSetCat, rowOrder, onReorder, onPickMonth }) {
  const curMonthIdx = year === CURRENT_YEAR ? new Date().getMonth() : -1;
  const [drag, setDrag] = React.useState(null); // { sec, from } ระหว่างลากแถว
  const [sel, setSel] = React.useState(null);   // { r1,c1,r2,c2 } เลือกช่อง (global row × เดือน)
  const dragSel = React.useRef(false);
  // ประเภทปัจจุบันของรายการ (อ่านจากเดือนแรกที่เจอชื่อนี้)
  function rowCat(section, name) {
    for (let m = 0; m < 12; m++) {
      const p = allPlans[year + '-' + m];
      const it = p && (p[section] || []).find(function (r) {return r.name === name;});
      if (it) return it.cat || '';
    }
    return '';
  }

  function masterRows(section) {
    const order = [],seen = {};
    (PLAN_SEED_V2[section] || []).forEach(function (it) {if (it.name && !seen[it.name]) {seen[it.name] = 1;order.push(it.name);}});
    for (let m = 0; m < 12; m++) {
      const p = allPlans[year + '-' + m];
      if (!p) continue;
      (p[section] || []).forEach(function (it) {if (it.name && !seen[it.name]) {seen[it.name] = 1;order.push(it.name);}});
    }
    // จัดลำดับตามที่ผู้ใช้ลากไว้ (ชื่อที่บันทึกลำดับก่อน แล้วต่อด้วยรายการใหม่)
    const saved = (rowOrder && rowOrder[section]) || [];
    if (!saved.length) return order;
    return saved.filter(function (n) {return seen[n];}).concat(order.filter(function (n) {return saved.indexOf(n) < 0;}));
  }
  // ย้ายแถว from→to ในลำดับปัจจุบัน แล้วบันทึก
  function moveRow(section, from, to) {
    const names = masterRows(section);
    if (from === to || from < 0 || to < 0 || from >= names.length) return;
    const arr = names.slice();
    const m = arr.splice(from, 1)[0];
    arr.splice(to, 0, m);
    onReorder(section, arr);
  }
  function cellVal(section, name, m) {
    const p = allPlans[year + '-' + m];
    if (!p) return 0;
    const it = (p[section] || []).find(function (r) {return r.name === name;});
    return it ? it.amount || 0 : 0;
  }
  function secMonthTotal(section, m) {const p = allPlans[year + '-' + m];return p ? rowSum(p[section]) : 0;}
  function rowYearTotal(section, name) {let s = 0;for (let m = 0; m < 12; m++) s += cellVal(section, name, m);return s;}

  const thBase = { padding: '11px 11px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', borderBottom: '1px solid var(--line)' };
  const stickyName = { position: 'sticky', left: 0, zIndex: 2 };

  /* ── ช่องที่เลือก (สำหรับ copy/paste เดี่ยว+หลายช่อง) ── */
  const flatRows = [];
  DETAIL_SECS.forEach(function (s) {masterRows(s.key).forEach(function (n) {flatRows.push({ sec: s.key, name: n });});});
  const gidx = {}; flatRows.forEach(function (fr, i) {gidx[fr.sec + '|' + fr.name] = i;});
  const norm = sel ? { r1: Math.min(sel.r1, sel.r2), r2: Math.max(sel.r1, sel.r2), c1: Math.min(sel.c1, sel.c2), c2: Math.max(sel.c1, sel.c2) } : null;
  const isSel = function (gr, c) {return norm && gr >= norm.r1 && gr <= norm.r2 && c >= norm.c1 && c <= norm.c2;};
  const cellDown = function (gr, c, e) {
    if (e.shiftKey && sel) setSel({ r1: sel.r1, c1: sel.c1, r2: gr, c2: c });
    else { setSel({ r1: gr, c1: c, r2: gr, c2: c }); dragSel.current = true; }
  };
  const cellEnter = function (gr, c) {if (dragSel.current) setSel(function (s) {return s ? { r1: s.r1, c1: s.c1, r2: gr, c2: c } : s;});};

  React.useEffect(function () {
    const up = function () {dragSel.current = false;};
    document.addEventListener('mouseup', up);
    return function () {document.removeEventListener('mouseup', up);};
  }, []);

  React.useEffect(function () {
    const inEditable = function () {const a = document.activeElement; return a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName);};
    const parse = function (s) {const n = parseInt(String(s).replace(/[^\d-]/g, ''), 10); return isNaN(n) ? 0 : n;};
    function onCopy(e) {
      if (!norm || inEditable()) return;
      e.preventDefault();
      const out = [];
      for (let r = norm.r1; r <= norm.r2; r++) {const fr = flatRows[r]; if (!fr) continue; const line = []; for (let c = norm.c1; c <= norm.c2; c++) line.push(cellVal(fr.sec, fr.name, c)); out.push(line.join('\t'));}
      e.clipboardData.setData('text/plain', out.join('\n'));
    }
    function onPaste(e) {
      if (!norm || inEditable()) return;
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text');
      if (text == null) return;
      const grid = text.replace(/\r/g, '').replace(/\n+$/, '').split('\n').map(function (l) {return l.split('\t');});
      const single = grid.length === 1 && grid[0].length === 1;
      if (single) {
        const v = parse(grid[0][0]);
        for (let r = norm.r1; r <= norm.r2; r++) {const fr = flatRows[r]; if (!fr) continue; for (let c = norm.c1; c <= norm.c2; c++) {if (c >= 0 && c <= 11) onCell(c, fr.sec, fr.name, v);}}
      } else {
        for (let i = 0; i < grid.length; i++) {const fr = flatRows[norm.r1 + i]; if (!fr) break; for (let j = 0; j < grid[i].length; j++) {const c = norm.c1 + j; if (c > 11) break; onCell(c, fr.sec, fr.name, parse(grid[i][j]));}}
      }
    }
    function onKey(e) {
      if (!norm || inEditable()) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {e.preventDefault(); for (let r = norm.r1; r <= norm.r2; r++) {const fr = flatRows[r]; if (!fr) continue; for (let c = norm.c1; c <= norm.c2; c++) onCell(c, fr.sec, fr.name, 0);}}
      else if (e.key === 'Escape') setSel(null);
    }
    document.addEventListener('copy', onCopy);
    document.addEventListener('paste', onPaste);
    document.addEventListener('keydown', onKey);
    return function () {document.removeEventListener('copy', onCopy); document.removeEventListener('paste', onPaste); document.removeEventListener('keydown', onKey);};
  }, [sel, allPlans]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <React.Fragment>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 12.5, color: 'var(--ink-faint)', flexWrap: 'wrap' }}>
        <Ic d={ICONS.spark} size={13} />
        <span>ดับเบิลคลิกช่องเพื่อกรอกตัวเลข · คลิก/ลากเลือกช่อง แล้ว <b>Ctrl/⌘ + C</b> คัดลอก · <b>Ctrl/⌘ + V</b> วาง (เดี่ยวหรือหลายช่อง) · <b>Delete</b> ล้าง · ลากไอคอน ⠿ เพื่อสลับตำแหน่งแถว · เลื่อนซ้าย-ขวาดูครบ 12 เดือน</span>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', borderRadius: 'var(--r-lg)' }}>
          <table className="detail-grid" style={{ borderCollapse: 'separate', borderSpacing: 0, width: 'max-content', minWidth: '100%' }}>
            <thead>
              <tr>
                <th style={Object.assign({}, thBase, stickyName, { textAlign: 'left', background: 'var(--surface-2)', minWidth: NAME_W, width: NAME_W, zIndex: 3 })}>รายการ</th>
                {MO.map(function (mo, i) {
                  const cur = i === curMonthIdx;
                  return (
                    <th key={i} onClick={function () {onPickMonth(i);}} title={'เปิดเดือน ' + mo}
                    style={Object.assign({}, thBase, { textAlign: 'right', minWidth: MONTH_W, width: MONTH_W, cursor: 'pointer', color: cur ? 'var(--accent-deep)' : 'var(--ink-soft)', background: cur ? 'var(--accent-soft)' : 'var(--surface-2)' })}>
                      {mo}{cur && <span style={{ display: 'block', fontSize: 9.5, fontWeight: 700 }}>● ตอนนี้</span>}
                    </th>);

                })}
                <th style={Object.assign({}, thBase, { textAlign: 'right', minWidth: 96, width: 96, color: 'var(--ink)', background: 'var(--surface-2)' })}>รวมทั้งปี</th>
              </tr>
            </thead>
            <tbody>
              {DETAIL_SECS.map(function (sec) {
                const names = masterRows(sec.key);
                return (
                  <React.Fragment key={sec.key}>
                    {/* section header */}
                    <tr>
                      <td colSpan={14} style={Object.assign({}, stickyName, { background: sec.sumBg, padding: '8px 12px', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line-soft)' })}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'sticky', left: 12, width: 'fit-content' }}>
                          <span style={{ fontSize: 15 }}>{sec.icon}</span>
                          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 13.5, color: sec.color }}>{sec.label}</span>
                          <button
                            onClick={function () {onAddRow(sec.key);}} title="เพิ่มรายการในกลุ่มนี้"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginLeft: 4, padding: '2px 8px', border: '1px solid ' + sec.color, background: 'rgba(255,255,255,.55)', color: sec.color, borderRadius: 99, cursor: 'pointer', fontSize: 11.5, fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                            <Ic d={ICONS.plus} size={12} /> เพิ่ม</button>
                        </div>
                      </td>
                    </tr>
                    {/* item rows */}
                    {names.length === 0 &&
                    <tr>
                        <td style={Object.assign({}, stickyName, { background: '#fff', padding: '8px 14px', fontSize: 12.5, color: 'var(--ink-faint)' })}>ยังไม่มีรายการ — กด “เพิ่ม”</td>
                        <td colSpan={13} style={{ background: '#fff' }} />
                      </tr>
                    }
                    {names.map(function (name, ri) {
                      const dragOver = drag && drag.sec === sec.key && drag.from !== ri;
                      return (
                        <tr key={name} className="dg-row">
                          <td
                            onDragOver={function (e) {if (drag && drag.sec === sec.key) e.preventDefault();}}
                            onDrop={function () {if (drag && drag.sec === sec.key) {moveRow(sec.key, drag.from, ri);} setDrag(null);}}
                            style={Object.assign({}, stickyName, { background: sec.nameBg, padding: '4px 12px 4px 6px', minWidth: NAME_W, width: NAME_W, borderBottom: '1px solid var(--line-soft)', boxShadow: dragOver ? 'inset 0 2px 0 var(--accent-deep)' : 'none' })}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                              <span
                                draggable
                                onDragStart={function () {setDrag({ sec: sec.key, from: ri });}}
                                onDragEnd={function () {setDrag(null);}}
                                title="ลากเพื่อสลับตำแหน่งแถว"
                                style={{ cursor: 'grab', color: 'var(--ink-faint)', fontSize: 13, lineHeight: 1.4, userSelect: 'none', padding: '2px 1px', flexShrink: 0 }}>⠿</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <RowName
                                  name={name}
                                  cat={rowCat(sec.key, name)}
                                  cats={(cats && cats[sec.key]) || []}
                                  onRename={function (nn) {onRenameRow(sec.key, name, nn);}}
                                  onDelete={function () {onDeleteRow(sec.key, name);}}
                                  onSetCat={function (c) {onSetCat(sec.key, name, c);}} />
                              </div>
                            </div>
                          </td>
                          {MO.map(function (mo, i) {
                            const gr = gidx[sec.key + '|' + name];
                            return (
                              <td key={i} style={{ padding: 0, borderBottom: '1px solid var(--line-soft)', borderLeft: '1px solid var(--line-soft)', background: i === curMonthIdx ? 'rgba(240,99,95,.05)' : 'transparent' }}>
                                <DCell value={cellVal(sec.key, name, i)} color={sec.color}
                                selected={isSel(gr, i)}
                                onMouseDownCell={function (e) {cellDown(gr, i, e);}}
                                onMouseEnterCell={function () {cellEnter(gr, i);}}
                                onChange={function (v) {onCell(i, sec.key, name, v);}} />
                              </td>);

                          })}
                          <td className="tnum" style={{ textAlign: 'right', padding: '8px 12px', fontSize: 13, fontWeight: 600, color: 'var(--ink)', borderBottom: '1px solid var(--line-soft)', borderLeft: '1px solid var(--line)', background: '#fff', whiteSpace: 'nowrap' }}>
                            {rowYearTotal(sec.key, name) === 0 ? '·' : fmt(rowYearTotal(sec.key, name))}
                          </td>
                        </tr>);

                    })}
                    {/* section subtotal */}
                    <tr>
                      <td style={Object.assign({}, stickyName, { background: sec.sumBg, padding: '8px 12px', fontWeight: 700, fontSize: 12.5, color: sec.color, borderTop: '1px solid var(--line-soft)', borderBottom: '1px solid var(--line)' })}>รวม{sec.label}</td>
                      {MO.map(function (mo, i) {
                        const v = secMonthTotal(sec.key, i);
                        return (
                          <td key={i} className="tnum" style={{ textAlign: 'right', padding: '8px 11px', fontSize: 12.5, fontWeight: 700, color: v === 0 ? 'var(--ink-faint)' : sec.color, background: i === curMonthIdx ? 'var(--accent-soft)' : sec.sumBg, borderTop: '1px solid var(--line-soft)', borderBottom: '1px solid var(--line)', borderLeft: '1px solid rgba(255,255,255,.5)', whiteSpace: 'nowrap' }}>
                            {v === 0 ? '·' : fmt(v)}
                          </td>);

                      })}
                      <td className="tnum" style={{ textAlign: 'right', padding: '8px 12px', fontSize: 12.5, fontWeight: 800, color: sec.color, background: sec.sumBg, borderTop: '1px solid var(--line-soft)', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap' }}>
                        {function () {let s = 0;for (let m = 0; m < 12; m++) s += secMonthTotal(sec.key, m);return s === 0 ? '·' : fmt(s);}()}
                      </td>
                    </tr>
                  </React.Fragment>);

              })}
              {/* grand balance row */}
              <tr>
                <td style={Object.assign({}, stickyName, { background: '#4A3A34', color: '#fff', padding: '11px 12px', fontWeight: 700, fontSize: 13 })}>คงเหลือ (รับ − ออม − จ่าย)</td>
                {MO.map(function (mo, i) {
                  const bal = secMonthTotal('income', i) - secMonthTotal('saving', i) - secMonthTotal('fixedExp', i) - secMonthTotal('varExp', i);
                  const has = !!allPlans[year + '-' + i];
                  return (
                    <td key={i} className="tnum" style={{ textAlign: 'right', padding: '11px 11px', fontSize: 13, fontWeight: 700, color: !has ? 'rgba(255,255,255,.4)' : bal >= 0 ? '#BCE29E' : '#FF8787', background: '#4A3A34', whiteSpace: 'nowrap' }}>
                      {has ? fmt(bal) : '·'}
                    </td>);

                })}
                <td className="tnum" style={{ textAlign: 'right', padding: '11px 12px', fontSize: 13.5, fontWeight: 800, color: '#fff', background: '#3C2F2A', whiteSpace: 'nowrap' }}>
                  {function () {
                    let s = 0;
                    for (let m = 0; m < 12; m++) s += secMonthTotal('income', m) - secMonthTotal('saving', m) - secMonthTotal('fixedExp', m) - secMonthTotal('varExp', m);
                    return fmt(s);
                  }()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </React.Fragment>);

}

function PlanMonthly() {
  const [allPlans, setAllPlans] = useStored('plan.months.v3', {});

  const now = new Date();
  const curMonthIdx = now.getMonth();

  const [year, setYear] = React.useState(CURRENT_YEAR);
  const [month, setMonth] = React.useState(curMonthIdx);
  const [mView, setMView] = React.useState('month'); // 'month' | 'all'
  const [allMode, setAllMode] = React.useState('detail'); // 'detail' | 'summary'
  const [rowOrder, setRowOrder] = useStored('plan.roworder.v1', {}); // { sectionKey: [name,...] } ลำดับแถวในตารางแยก
  const importRef = React.useRef(null);

  const planKey = year + '-' + month;
  const isCurrentMonth = year === CURRENT_YEAR && month === curMonthIdx;
  const plan = allPlans[planKey] || { income: [], saving: [], fixedExp: [], varExp: [] };

  function setPlan(p) {
    setAllPlans(function (prev) {return Object.assign({}, prev, { [planKey]: p });});
  }

  // ล้างข้อมูลเฉพาะเดือนที่เลือกอยู่
  function clearMonthPlan() {
    setAllPlans(function (prev) {
      const next = Object.assign({}, prev);
      delete next[year + '-' + month];
      return next;
    });
  }
  // ล้างข้อมูลที่กรอกของปีที่เลือกอยู่ (ทั้ง 12 เดือน)
  function clearYearPlans() {
    setAllPlans(function (prev) {
      const next = Object.assign({}, prev);
      for (let m = 0; m < 12; m++) delete next[year + '-' + m];
      return next;
    });
  }

  /* ── Excel export: per-item detail (กรอกแยกแต่ละรายการ) ── */
  function secMonthTotalFor(section, m) {const p = allPlans[year + '-' + m];return p ? rowSum(p[section]) : 0;}
  function exportDetailXLSX() {
    function masterRows(section) {
      const order = [],seen = {};
      (PLAN_SEED_V2[section] || []).forEach(function (it) {if (it.name && !seen[it.name]) {seen[it.name] = 1;order.push(it.name);}});
      for (let m = 0; m < 12; m++) {
        const p = allPlans[year + '-' + m];
        if (!p) continue;
        (p[section] || []).forEach(function (it) {if (it.name && !seen[it.name]) {seen[it.name] = 1;order.push(it.name);}});
      }
      return order;
    }
    function cellVal(section, name, m) {
      const p = allPlans[year + '-' + m];
      if (!p) return 0;
      const it = (p[section] || []).find(function (r) {return r.name === name;});
      return it ? it.amount || 0 : 0;
    }
    const aoa = [['รายการ'].concat(MO).concat(['รวมทั้งปี'])];
    DETAIL_SECS.forEach(function (sec) {
      aoa.push([sec.label]);
      masterRows(sec.key).forEach(function (name) {
        const vals = MO.map(function (_, i) {return cellVal(sec.key, name, i);});
        aoa.push([name].concat(vals).concat([vals.reduce(function (s, v) {return s + v;}, 0)]));
      });
      const sub = MO.map(function (_, i) {return secMonthTotalFor(sec.key, i);});
      aoa.push(['รวม' + sec.label].concat(sub).concat([sub.reduce(function (s, v) {return s + v;}, 0)]));
    });
    const bal = MO.map(function (_, i) {return secMonthTotalFor('income', i) - secMonthTotalFor('saving', i) - secMonthTotalFor('fixedExp', i) - secMonthTotalFor('varExp', i);});
    aoa.push(['คงเหลือ (รับ − ออม − จ่าย)'].concat(bal).concat([bal.reduce(function (s, v) {return s + v;}, 0)]));
    const widths = [{ wch: 26 }].concat(MO.map(function () {return { wch: 9 };})).concat([{ wch: 12 }]);
    exportXLSX('แผนรายเดือน_รายการแยก_' + yearLabel(year) + '.xlsx', [{ name: 'รายการแยก ' + year, aoa: aoa, cols: widths }]);
  }

  /* ── Excel export: month totals (สรุปยอดรวม) ── */
  function exportSummaryXLSX() {
    const aoa = [['เดือน', 'รายรับ', 'เงินออม', 'ค่าใช้จ่ายประจำ', 'ค่าใช้จ่ายแปรผัน', 'คงเหลือ']];
    const tot = { inc: 0, sav: 0, fix: 0, vr: 0, bal: 0 };
    MO.forEach(function (mo, i) {
      const inc = secMonthTotalFor('income', i),sav = secMonthTotalFor('saving', i),fix = secMonthTotalFor('fixedExp', i),vr = secMonthTotalFor('varExp', i);
      const b = inc - sav - fix - vr;
      tot.inc += inc;tot.sav += sav;tot.fix += fix;tot.vr += vr;tot.bal += b;
      aoa.push([mo, inc, sav, fix, vr, b]);
    });
    aoa.push(['รวมทั้งปี', tot.inc, tot.sav, tot.fix, tot.vr, tot.bal]);
    const widths = [{ wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 12 }];
    exportXLSX('แผนรายเดือน_สรุปยอดรวม_' + yearLabel(year) + '.xlsx', [{ name: 'สรุปยอดรวม ' + year, aoa: aoa, cols: widths }]);
  }

  const [planCats, setPlanCats] = usePlanCats();
  function updCats(key) {
    return function (newCats) {setPlanCats(Object.assign({}, planCats, { [key]: newCats }));};
  }

  // ชื่อหมวดหมู่จาก id
  const catLabel = (sec, catId) => {
    const c = (planCats[sec] || []).find((x) => x.id === catId);
    return c ? c.name : '';
  };
  // id หมวดจากชื่อ (ใช้จับคู่เวลาตั้งชื่อรายการให้ตรงกับหมวด)
  const catIdByName = (sec, nm) => {
    const c = (planCats[sec] || []).find((x) => x.name === String(nm).trim());
    return c ? c.id : '';
  };
  // หมวด "อื่นๆ" (ตัวสุดท้าย) ใช้เป็นค่าเริ่มต้นของรายการที่เพิ่มจากตารางแยก — ดีกว่าใส่หมวดแรกผิดๆ
  const genericCatOf = (sec) => {
    const cs = planCats[sec] || [];
    const o = cs.find((x) => x.name === 'อื่นๆ');
    return o ? o.id : (cs.length ? cs[cs.length - 1].id : '');
  };
  // เลือกหมวดให้เหมาะกับชื่อรายการ: ถ้าชื่อตรงกับหมวด ใช้หมวดนั้น ไม่งั้นใช้ "อื่นๆ"
  const catForName = (sec, nm) => catIdByName(sec, nm) || genericCatOf(sec);
  // ชื่อรายการที่ไม่ซ้ำกับที่มีอยู่แล้วในทั้งปีของ section นั้น (กันยุบรวมในตารางแยก)
  const uniqueRowName = (sec, base) => {
    const used = new Set();
    for (let m = 0; m < 12; m++) { const p = allPlans[year + '-' + m]; if (p) (p[sec] || []).forEach((r) => { if (r.name) used.add(r.name); }); }
    if (!used.has(base)) return base;
    let n = 2; while (used.has(base + ' ' + n)) n++;
    return base + ' ' + n;
  };
  // เติมชื่อให้รายการที่เว้นว่าง (ใช้ชื่อหมวด) — ตาราง "กรอกแยกแต่ละรายการ" จับคู่ด้วยชื่อ
  // รายการที่ไม่มีชื่อจึงเคยหายไป ตรงนี้ backfill ของเดิมให้แสดงครบ (รันครั้งเดียวตอนโหลด)
  React.useEffect(() => {
    const SECS = ['income', 'saving', 'fixedExp', 'varExp'];
    let changed = false;
    const next = {};
    Object.keys(allPlans).forEach((k) => {
      const p = allPlans[k] || {};
      const np = Object.assign({}, p);
      SECS.forEach((sec) => {
        np[sec] = (p[sec] || []).map((it) => {
          if (it.name && String(it.name).trim()) return it;
          changed = true;
          return Object.assign({}, it, { name: catLabel(sec, it.cat) || 'รายการ' });
        });
      });
      next[k] = np;
    });
    if (changed) setAllPlans(next);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Inline edit of a month's section TOTAL from the all-months table.
  // Non-destructive: keeps existing item breakdown by scaling proportionally;
  // creates a single labelled row when the month/section is still empty.
  function setSectionTotal(monthIdx, key, newTotal) {
    const mkey = year + '-' + monthIdx;
    const p = allPlans[mkey] || { income: [], saving: [], fixedExp: [], varExp: [] };
    const rows = p[key] || [];
    const cur = rowSum(rows);
    let newRows;
    if (rows.length === 0) {
      const firstCat = planCats[key] && planCats[key][0] ? planCats[key][0].id : '';
      newRows = newTotal === 0 ? [] : [{ id: makeId(key[0]), name: SEC_CFG[key].label, amount: newTotal, cat: firstCat }];
    } else if (rows.length === 1) {
      newRows = [Object.assign({}, rows[0], { amount: newTotal })];
    } else if (cur > 0) {
      const f = newTotal / cur;
      let acc = 0;
      newRows = rows.map(function (r, i) {
        if (i === rows.length - 1) return Object.assign({}, r, { amount: Math.max(0, newTotal - acc) });
        const v = Math.round(r.amount * f);acc += v;
        return Object.assign({}, r, { amount: v });
      });
    } else {
      newRows = rows.map(function (r, i) {return i === 0 ? Object.assign({}, r, { amount: newTotal }) : r;});
    }
    setAllPlans(function (prev) {return Object.assign({}, prev, { [mkey]: Object.assign({}, p, { [key]: newRows }) });});
  }

  /* ── handlers for the all-months DETAIL grid (per-item × per-month) ── */
  const emptyPlan = function () {return { income: [], saving: [], fixedExp: [], varExp: [] };};
  const firstCatOf = function (section) {const c = planCats[section];return c && c[0] ? c[0].id : '';};

  function detailSetCell(monthIdx, section, name, value) {
    const mkey = year + '-' + monthIdx;
    setAllPlans(function (prev) {
      const p = prev[mkey] || emptyPlan();
      const rows = p[section] || [];
      const idx = rows.findIndex(function (r) {return r.name === name;});
      let nr;
      if (idx >= 0) nr = rows.map(function (r, i) {return i === idx ? Object.assign({}, r, { amount: value }) : r;});else
      nr = rows.concat([{ id: makeId(section[0]), name: name, amount: value, cat: catForName(section, name) }]);
      return Object.assign({}, prev, { [mkey]: Object.assign({}, p, { [section]: nr }) });
    });
  }
  function detailAddRow(section) {
    // unique default name across the year
    const used = {};
    for (let m = 0; m < 12; m++) {const p = allPlans[year + '-' + m];if (p) (p[section] || []).forEach(function (r) {used[r.name] = 1;});}
    (PLAN_SEED_V2[section] || []).forEach(function (r) {used[r.name] = 1;});
    let name = 'รายการใหม่',n = 1;
    while (used[name]) {n += 1;name = 'รายการใหม่ ' + n;}
    setAllPlans(function (prev) {
      const next = Object.assign({}, prev);
      for (let m = 0; m < 12; m++) {
        const mkey = year + '-' + m;
        const p = next[mkey] || emptyPlan();
        const rows = (p[section] || []).slice();
        if (!rows.some(function (r) {return r.name === name;})) rows.push({ id: makeId(section[0]), name: name, amount: 0, cat: catForName(section, name) });
        next[mkey] = Object.assign({}, p, { [section]: rows });
      }
      return next;
    });
  }
  function detailRenameRow(section, oldName, newName) {
    if (!newName || newName === oldName) return;
    const matchCat = catIdByName(section, newName); // ตั้งชื่อตรงหมวด → ผูกหมวดให้ด้วย
    setAllPlans(function (prev) {
      const next = Object.assign({}, prev);
      for (let m = 0; m < 12; m++) {
        const mkey = year + '-' + m;
        const p = next[mkey];
        if (!p || !p[section]) continue;
        next[mkey] = Object.assign({}, p, { [section]: p[section].map(function (r) {return r.name === oldName ? Object.assign({}, r, { name: newName }, matchCat ? { cat: matchCat } : {}) : r;}) });
      }
      return next;
    });
  }
  function detailDeleteRow(section, name) {
    setAllPlans(function (prev) {
      const next = Object.assign({}, prev);
      for (let m = 0; m < 12; m++) {
        const mkey = year + '-' + m;
        const p = next[mkey];
        if (!p || !p[section]) continue;
        next[mkey] = Object.assign({}, p, { [section]: p[section].filter(function (r) {return r.name !== name;}) });
      }
      return next;
    });
  }
  // เปลี่ยนประเภทของรายการ (ทั้งปี) จากตารางแยกรายการ
  function detailSetRowCat(section, name, catId) {
    setAllPlans(function (prev) {
      const next = Object.assign({}, prev);
      for (let m = 0; m < 12; m++) {
        const mkey = year + '-' + m;
        const p = next[mkey];
        if (!p || !p[section]) continue;
        next[mkey] = Object.assign({}, p, { [section]: p[section].map(function (r) {return r.name === name ? Object.assign({}, r, { cat: catId }) : r;}) });
      }
      return next;
    });
  }

  /* ── ดาวน์โหลดเทมเพลตตัวอย่างสำหรับนำเข้า ── */
  function downloadPlanTemplate() {
    const header = ['ประเภทหลัก', 'รายการ', 'หมวดหมู่'].concat(MO);
    const ex = (sec, name, catName, amt) => [sec, name, catName].concat(MO.map(function () {return amt;}));
    const aoa = [header,
      ex('รายรับ', 'เงินเดือน', 'เงินเดือน', 45000),
      ex('เงินออม', 'กองทุนรวม', 'กองทุน', 5000),
      ex('ค่าใช้จ่ายประจำ', 'ค่าเช่าบ้าน', 'ที่พัก', 9000),
      ex('ค่าใช้จ่ายแปรผัน', 'ช้อปปิ้ง', 'ช้อปปิ้ง', 2000),
    ];
    const widths = [{ wch: 16 }, { wch: 20 }, { wch: 14 }].concat(MO.map(function () {return { wch: 8 };}));
    // ชีตวิธีใช้ — บอกค่าที่กรอกได้
    const guide = [['วิธีกรอก'], ['• คอลัมน์ "ประเภทหลัก" ใช้ได้เฉพาะ 4 ค่านี้:'],
      ...DETAIL_SECS.map(function (s) {return ['   - ' + s.label];}), [''],
      ['• คอลัมน์ "หมวดหมู่" (ตัวเลือกในแต่ละประเภทหลัก):']];
    DETAIL_SECS.forEach(function (s) {
      guide.push(['   ' + s.label + ':', ((planCats[s.key] || []).map(function (c) {return c.name;})).join(', ')]);
    });
    guide.push([''], ['• ม.ค.–ธ.ค. = จำนวนเงินของแต่ละเดือน (ว่าง/0 ได้)']);
    exportXLSX('เทมเพลตนำเข้า_แผนรายเดือน.xlsx', [
      { name: 'แผนรายเดือน', aoa: aoa, cols: widths },
      { name: 'วิธีใช้', aoa: guide, cols: [{ wch: 22 }, { wch: 60 }] },
    ]);
  }

  /* ── นำเข้าข้อมูลจากไฟล์ Excel (รูปแบบเดียวกับเทมเพลต) → แทนที่ข้อมูลของปีที่เลือก ── */
  async function importPlanXLSX(file) {
    if (!file || !window.XLSX) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const labelToKey = {}; DETAIL_SECS.forEach(function (s) {labelToKey[s.label] = s.key;});
      const newMonths = {}; for (let m = 0; m < 12; m++) newMonths[year + '-' + m] = { income: [], saving: [], fixedExp: [], varExp: [] };
      let imported = 0;
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]; if (!r) continue;
        const secKey = labelToKey[String(r[0] || '').trim()];
        const name = String(r[1] || '').trim();
        if (!secKey || !name) continue;
        const catId = catIdByName(secKey, String(r[2] || '').trim()) || genericCatOf(secKey);
        for (let m = 0; m < 12; m++) {
          const amt = parseInt(String(r[3 + m] == null ? '' : r[3 + m]).replace(/[^\d.-]/g, ''), 10) || 0;
          newMonths[year + '-' + m][secKey].push({ id: makeId(secKey[0]), name: name, amount: amt, cat: catId });
        }
        imported++;
      }
      if (imported === 0) {
        if (window.showAlert) await window.showAlert({ type: 'warning', title: 'ไม่พบข้อมูล', message: 'ไม่พบรายการที่นำเข้าได้ — ตรวจรูปแบบไฟล์กับเทมเพลตอีกครั้ง' });
        return;
      }
      const ok = window.showConfirm
        ? await window.showConfirm({ type: 'warning', title: 'นำเข้าข้อมูล', message: 'จะแทนที่ข้อมูลของ ' + yearLabel(year) + ' ด้วย ' + imported + ' รายการจากไฟล์ ใช่หรือไม่?', confirmText: 'นำเข้า', cancelText: 'ยกเลิก' })
        : window.confirm('แทนที่ข้อมูลของ ' + yearLabel(year) + ' ใช่หรือไม่?');
      if (!ok) return;
      setAllPlans(function (prev) {return Object.assign({}, prev, newMonths);});
      if (window.showAlert) await window.showAlert({ title: 'นำเข้าสำเร็จ', message: 'นำเข้า ' + imported + ' รายการของ ' + yearLabel(year) + ' เรียบร้อย' });
    } catch (e) {
      if (window.showAlert) await window.showAlert({ type: 'warning', title: 'นำเข้าไม่สำเร็จ', message: 'อ่านไฟล์ไม่ได้ ใช้ไฟล์ .xlsx ตามเทมเพลต' });
    }
  }

  const totIncome = rowSum(plan.income);
  const totSaving = rowSum(plan.saving);
  const totFixed = rowSum(plan.fixedExp);
  const totVar = rowSum(plan.varExp);
  const balance = totIncome - totSaving - totFixed - totVar;
  const totAll = totSaving + totFixed + totVar;

  const W = (v) => totIncome > 0 ? `${Math.max(0, v / totIncome * 100).toFixed(1)}%` : '0%';

  function updSec(key) {
    return (id, patch) => {
      const cur = (plan[key] || []).find((r) => r.id === id);
      const oldName = cur ? cur.name : null;
      const propName = Object.prototype.hasOwnProperty.call(patch, 'name');
      const propCat = Object.prototype.hasOwnProperty.call(patch, 'cat');
      // ชื่อ/ประเภท เป็นคุณสมบัติของ "รายการ" → อัปเดตให้ตรงกันทุกเดือน (ตารางทุกเดือนจับคู่ด้วยชื่อ)
      // ส่วนจำนวน/ธงเงินออม เป็นของเฉพาะเดือนนั้น
      if ((propName || propCat) && oldName != null) {
        setAllPlans((prev) => {
          const next = Object.assign({}, prev);
          for (let m = 0; m < 12; m++) {
            const mk = year + '-' + m;
            const p = next[mk];
            if (!p || !p[key]) continue;
            next[mk] = Object.assign({}, p, { [key]: p[key].map((r) => {
              if (mk === planKey && r.id === id) return Object.assign({}, r, patch);   // เดือนปัจจุบัน: ใส่ทั้ง patch
              if (r.name === oldName) {                                                // เดือนอื่น: เฉพาะ ชื่อ/ประเภท
                const np = {};
                if (propName) np.name = patch.name;
                if (propCat) np.cat = patch.cat;
                return Object.assign({}, r, np);
              }
              return r;
            }) });
          }
          return next;
        });
        return;
      }
      setPlan({ ...plan, [key]: plan[key].map((r) => r.id === id ? { ...r, ...patch } : r) });
    };
  }
  function delSec(key) {
    return (id) => setPlan({ ...plan, [key]: plan[key].filter((r) => r.id !== id) });
  }
  function addSec(key) {
    const firstCat = planCats[key] && planCats[key][0] ? planCats[key][0].id : '';
    return () => setPlan({ ...plan, [key]: [...plan[key], { id: makeId(key[0]), name: uniqueRowName(key, 'รายการใหม่'), amount: 0, cat: firstCat }] });
  }

  return (
    <div className="plan-pane">

      {/* ── View toggle + selectors ── */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'inline-flex', background: 'var(--surface-2, #f0f0ee)', borderRadius: 12, padding: 3, gap: 3 }}>
          {[{ id: 'month', label: 'รายเดือน' }, { id: 'all', label: 'ทุกเดือน' }].map(function (v) {
            const on = mView === v.id;
            return (
              <button key={v.id} onClick={function () {setMView(v.id);}}
              style={{
                padding: '7px 16px', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: 600,
                background: on ? '#fff' : 'transparent',
                color: on ? 'var(--ink)' : 'var(--ink-soft)',
                boxShadow: on ? '0 1px 3px rgba(0,0,0,.08)' : 'none', transition: 'all .15s'
              }}>
                {v.label}
              </button>);

          })}
        </div>
        <div style={{ flex: 1 }} />
        <CustomSelect
          value={year}
          onChange={setYear}
          options={YEAR_KEYS.map(function (y) {return { value: y, label: yearLabel(y) };})}
          align="right"
          style={{ minWidth: 130 }} />
        
        {mView === 'month' &&
        <CustomSelect
          value={month}
          onChange={function (v) {setMonth(Number(v));}}
          options={MO.map(function (mo, i) {
            const isCurr = year === CURRENT_YEAR && i === curMonthIdx;
            const hasData = !!allPlans[year + '-' + i];
            return { value: i, label: mo + (isCurr ? ' ●' : '') + (hasData && !isCurr ? ' ·' : '') };
          })}
          align="right"
          style={{ minWidth: 125 }} />

        }
        {mView === 'month' && isCurrentMonth &&
        <span style={{ fontSize: 12, background: 'var(--accent-soft)', color: 'var(--accent-deep)', borderRadius: 99, padding: '3px 10px', fontWeight: 600 }}>
            เดือนปัจจุบัน
          </span>
        }
        {mView === 'month' ?
        <ClearBtn
          label={'ล้างค่า ' + MO[month]}
          confirmMsg={'ล้างข้อมูลที่กรอกของ ' + MO[month] + ' ' + yearLabel(year) + ' ใช่หรือไม่?'}
          onClear={clearMonthPlan} /> :
        <ClearBtn
          label={'ล้างทั้งปี'}
          confirmMsg={'ล้างข้อมูลที่กรอกทั้ง 12 เดือนของ' + yearLabel(year) + ' ใช่หรือไม่?'}
          onClear={clearYearPlans} />}
      </div>

      {mView === 'all' ?
      <React.Fragment>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', background: 'var(--surface-2)', borderRadius: 12, padding: 3, gap: 3, border: '1px solid var(--line-soft)' }}>
            {[{ id: 'detail', label: 'กรอกแยกแต่ละรายการ' }, { id: 'summary', label: 'สรุปยอดรวม' }].map(function (v) {
              const on = allMode === v.id;
              return (
                <button key={v.id} onClick={function () {setAllMode(v.id);}}
                style={{ padding: '7px 15px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, background: on ? '#fff' : 'transparent', color: on ? 'var(--ink)' : 'var(--ink-soft)', boxShadow: on ? '0 1px 3px rgba(0,0,0,.08)' : 'none', transition: 'all .15s' }}>
                  {v.label}
                </button>);

            })}
          </div>
          <div style={{ flex: 1 }} />
          <ExportBtn label="Excel: รายการแยก" onClick={exportDetailXLSX} primary={allMode === 'detail'} />
          <ExportBtn label="Excel: สรุปยอดรวม" onClick={exportSummaryXLSX} primary={allMode === 'summary'} />
          {allMode === 'detail' && <button className="btn btn-ghost btn-sm" style={{ fontSize: 12.5, fontWeight: 600 }} onClick={downloadPlanTemplate}>📄 เทมเพลตตัวอย่าง</button>}
          {allMode === 'detail' && <button className="btn btn-ghost btn-sm" style={{ fontSize: 12.5, fontWeight: 600 }} onClick={function () {importRef.current && importRef.current.click();}}>⬆️ นำเข้า Excel</button>}
          <input ref={importRef} type="file" accept=".xlsx,.xls" hidden onChange={function (e) {const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) importPlanXLSX(f);}} />
          </div>
          {allMode === 'detail' ?
        <AllMonthsDetail
          year={year}
          allPlans={allPlans}
          cats={planCats}
          onCell={detailSetCell}
          onAddRow={detailAddRow}
          onRenameRow={detailRenameRow}
          onDeleteRow={detailDeleteRow}
          onSetCat={detailSetRowCat}
          rowOrder={rowOrder}
          onReorder={function (section, names) {setRowOrder(function (prev) {return Object.assign({}, prev, { [section]: names });});}}
          onPickMonth={function (i) {setMonth(i);setMView('month');}} /> :


        <AllMonthsView
          year={year}
          allPlans={allPlans}
          onPick={function (i) {setMonth(i);setMView('month');}}
          onEdit={setSectionTotal} />

        }
        </React.Fragment> :

      <React.Fragment>

      {/* ── Summary stat row ── */}
      <div className="grid cols-4 stat-duo" style={{ marginBottom: 16 }}>
        <div className="stat tint-mint" style={{ borderRadius: 'var(--r-lg)', padding: '16px 18px' }}>
          <div className="stat-ic" style={{ color: 'var(--mint-deep)', marginBottom: 10 }}><Ic d={ICONS.arrowDown} size={20} /></div>
          <div className="stat-label">รายรับรวม</div>
          <div className="stat-val tnum" style={{ fontSize: 22 }}>{baht(totIncome)}</div>
        </div>
        <div className="stat tint-lime" style={{ borderRadius: 'var(--r-lg)', padding: '16px 18px' }}>
          <div className="stat-ic" style={{ color: 'var(--lime-deep)', marginBottom: 10 }}><Ic d={ICONS.piggy} size={20} /></div>
          <div className="stat-label">เงินออมรวม</div>
          <div className="stat-val tnum" style={{ fontSize: 22 }}>{baht(totSaving)}</div>
          {totIncome > 0 && <div className="stat-delta muted">{(totSaving / totIncome * 100).toFixed(0)}% ของรายรับ</div>}
        </div>
        <div className="stat tint-peach" style={{ borderRadius: 'var(--r-lg)', padding: '16px 18px' }}>
          <div className="stat-ic" style={{ color: 'var(--peach-deep)', marginBottom: 10 }}><Ic d={ICONS.arrowUp} size={20} /></div>
          <div className="stat-label">ค่าใช้จ่ายประจำ</div>
          <div className="stat-val tnum" style={{ fontSize: 22 }}>{baht(totFixed)}</div>
        </div>
        <div className="stat tint-coral" style={{ borderRadius: 'var(--r-lg)', padding: '16px 18px' }}>
          <div className="stat-ic" style={{ color: 'var(--coral-deep)', marginBottom: 10 }}><Ic d={ICONS.arrowUp} size={20} /></div>
          <div className="stat-label">ค่าใช้จ่ายแปรผัน</div>
          <div className="stat-val tnum" style={{ fontSize: 22 }}>{baht(totVar)}</div>
        </div>
      </div>

      {/* ── Budget balance bar ── */}
      <div className="card" style={{ marginBottom: 18, padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>
            ใช้ไปแล้ว <b style={{ color: 'var(--ink)' }}>{totIncome > 0 ? (totAll / totIncome * 100).toFixed(0) : 0}%</b> ของรายรับ
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>
            คงเหลือ <b className="tnum" style={{ fontFamily: 'var(--font-head)', color: balance >= 0 ? 'var(--mint-deep)' : 'var(--coral-deep)', fontSize: 16 }}>{baht(balance)}</b>
          </div>
        </div>
        {/* Stacked bar */}
        <div style={{ display: 'flex', height: 18, borderRadius: 999, overflow: 'hidden', background: 'var(--line)' }}>
          <div style={{ width: W(totSaving), background: 'var(--lime-deep)', transition: 'width .5s' }} />
          <div style={{ width: W(totFixed), background: 'var(--peach-deep)', transition: 'width .5s' }} />
          <div style={{ width: W(totVar), background: 'var(--coral)', transition: 'width .5s' }} />
          <div style={{ width: W(Math.max(0, balance)), background: 'var(--mint)', transition: 'width .5s' }} />
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 9, flexWrap: 'wrap' }}>
          {[
            { label: 'เงินออม', color: 'var(--lime-deep)', val: totSaving },
            { label: 'ค่าใช้จ่ายประจำ', color: 'var(--peach-deep)', val: totFixed },
            { label: 'ค่าใช้จ่ายแปรผัน', color: 'var(--coral)', val: totVar },
            { label: 'คงเหลือ', color: 'var(--mint-deep)', val: Math.max(0, balance) }].
            map((l) =>
            <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--ink-soft)' }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: l.color, display: 'inline-block', flexShrink: 0 }} />
              {l.label} <b className="tnum" style={{ color: 'var(--ink)', fontFamily: 'var(--font-head)' }}>{baht(l.val)}</b>
            </span>
            )}
        </div>
      </div>

      {/* ── 4 section cards ── */}
      <div className="grid cols-2" style={{ alignItems: 'start', gap: 16 }}>
        <SectionCard sKey="income" rows={plan.income} total={totIncome}
          onUpdate={updSec('income')} onDelete={delSec('income')} onAdd={addSec('income')}
          cats={planCats.income} onCatsChange={updCats('income')} />
        <SectionCard sKey="saving" rows={plan.saving} total={totSaving}
          onUpdate={updSec('saving')} onDelete={delSec('saving')} onAdd={addSec('saving')}
          cats={planCats.saving} onCatsChange={updCats('saving')} />
        <SectionCard sKey="fixedExp" rows={plan.fixedExp} total={totFixed}
          onUpdate={updSec('fixedExp')} onDelete={delSec('fixedExp')} onAdd={addSec('fixedExp')}
          cats={planCats.fixedExp} onCatsChange={updCats('fixedExp')} />
        <SectionCard sKey="varExp" rows={plan.varExp} total={totVar}
          onUpdate={updSec('varExp')} onDelete={delSec('varExp')} onAdd={addSec('varExp')}
          cats={planCats.varExp} onCatsChange={updCats('varExp')} />
      </div>

      <div className="plan-note" style={{ marginTop: 18 }}>
        💡 จัดสรร <b>เงินออม</b> ก่อนเป็นอันดับแรก ตามด้วยค่าใช้จ่ายประจำ แล้วค่อยดูว่าเหลือค่าใช้จ่ายแปรผันได้เท่าไหร่
      </div>
      </React.Fragment>
      }
    </div>);

}

/* ============================================================
   2) สรุปรายรับ-รายจ่าย
   ============================================================ */
function PlanSummary() {
  const [allPlans] = useStored('plan.months.v3', {});
  const [planCats] = usePlanCats();
  const now = new Date();
  const [year, setYear] = React.useState(CURRENT_YEAR);
  const [view, setView] = React.useState('month');
  const [catView, setCatView] = React.useState('bar');
  const [month, setMonth] = React.useState(CURRENT_YEAR === '2569' ? now.getMonth() : 0);
  const curMonthIdx = year === CURRENT_YEAR ? now.getMonth() : -1;

  // per-month totals for the selected year
  const monthly = MO.map(function (mo, i) {
    const p = allPlans[year + '-' + i];
    const income = p ? rowSum(p.income) : 0;
    const saving = p ? rowSum(p.saving) : 0;
    const fixed = p ? rowSum(p.fixedExp) : 0;
    const variable = p ? rowSum(p.varExp) : 0;
    return { income: income, saving: saving, fixed: fixed, variable: variable, expense: saving + fixed + variable };
  });
  const yearT = monthly.reduce(function (a, m) {
    return { income: a.income + m.income, saving: a.saving + m.saving, fixed: a.fixed + m.fixed, variable: a.variable + m.variable };
  }, { income: 0, saving: 0, fixed: 0, variable: 0 });

  const src = view === 'year' ? yearT : monthly[month];
  const totIncome = src.income;
  const totSaving = src.saving;
  const totFixed = src.fixed;
  const totVar = src.variable;
  const totExp = totSaving + totFixed + totVar;
  const remaining = totIncome - totExp;

  const donutData = [
  { name: 'เงินออม', color: 'var(--lime-deep)', value: totSaving },
  { name: 'ค่าใช้จ่ายประจำ', color: 'var(--peach-deep)', value: totFixed },
  { name: 'ค่าใช้จ่ายแปรผัน', color: 'var(--coral)', value: totVar },
  { name: 'คงเหลือ', color: 'var(--mint)', value: Math.max(0, remaining) }].
  filter((d) => d.value > 0);

  // สรุปการใช้จ่ายแยกตามหมวดหมู่ (รวมค่าใช้จ่ายประจำ + แปรผัน, จัดกลุ่มตามประเภท)
  const plansInScope = view === 'year' ?
  MO.map(function (_, i) {return allPlans[year + '-' + i];}).filter(Boolean) :
  [allPlans[year + '-' + month]].filter(Boolean);
  const CAT_PALETTE = [
  'var(--coral-deep)', 'var(--peach-deep)', 'var(--lime-deep)', 'var(--mint-deep)',
  'var(--coral)', 'var(--peach)', 'var(--mint)', 'var(--lime)'];
  const catTotals = {};
  plansInScope.forEach(function (p) {
    ['fixedExp', 'varExp'].forEach(function (sec) {
      (p[sec] || []).forEach(function (r) {
        const amt = r.amount || 0;
        if (!amt) return;
        const def = (planCats[sec] || []).find(function (c) {return c.id === r.cat;});
        const label = def ? def.name : r.cat || 'อื่นๆ';
        catTotals[label] = (catTotals[label] || 0) + amt;
      });
    });
  });
  const catRows = Object.keys(catTotals).
  map(function (name) {return { label: name, value: catTotals[name] };}).
  sort(function (a, b) {return b.value - a.value;}).
  map(function (r, i) {return Object.assign({}, r, { color: CAT_PALETTE[i % CAT_PALETTE.length] });});
  const catTotal = catRows.reduce(function (s, r) {return s + r.value;}, 0);

  return (
    <div className="plan-pane">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <div className="seg">
          <button className={view === 'month' ? 'on' : ''} onClick={() => setView('month')}>รายเดือน</button>
          <button className={view === 'year' ? 'on' : ''} onClick={() => setView('year')}>รายปี</button>
        </div>
        <div style={{ flex: 1 }} />
        <CustomSelect
          value={year}
          onChange={setYear}
          options={YEAR_KEYS.map(function (y) {return { value: y, label: yearLabel(y) };})}
          align="right"
          style={{ minWidth: 130 }} />
        
        {view === 'month' &&
        <CustomSelect
          value={month}
          onChange={function (v) {setMonth(Number(v));}}
          options={MO.map(function (mo, i) {
            const isCurr = i === curMonthIdx;
            const hasData = !!allPlans[year + '-' + i];
            return { value: i, label: mo + (isCurr ? ' ●' : '') + (hasData && !isCurr ? ' ·' : '') };
          })}
          align="right"
          style={{ minWidth: 125 }} />

        }
      </div>

      <div className="grid cols-3 stat-duo" style={{ marginBottom: 18 }}>
        <div className="stat tint-mint">
          <div className="stat-ic" style={{ color: 'var(--mint-deep)' }}><Ic d={ICONS.arrowDown} size={21} /></div>
          <div className="stat-label">รายรับ{view === 'year' ? 'ทั้งปี' : 'เดือนนี้'}</div>
          <div className="stat-val tnum">{baht(totIncome)}</div>
        </div>
        <div className="stat tint-coral">
          <div className="stat-ic" style={{ color: 'var(--coral-deep)' }}><Ic d={ICONS.bag} size={21} /></div>
          <div className="stat-label">รายจ่าย{view === 'year' ? 'ทั้งปี' : 'เดือนนี้'}</div>
          <div className="stat-val tnum">{baht(totExp)}</div>
        </div>
        <div className="stat tint-lime">
          <div className="stat-ic" style={{ color: 'var(--lime-deep)' }}><Ic d={ICONS.piggy} size={21} /></div>
          <div className="stat-label">คงเหลือ / ออม</div>
          <div className="stat-val tnum">{baht(remaining)}</div>
        </div>
      </div>

      <div className="grid cols-2" style={{ alignItems: 'start' }}>
        <div className="card card-pad-lg">
          <div className="card-h"><h3>สัดส่วนการใช้เงิน</h3></div>
          <div style={{ display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap' }}>
            <Donut data={donutData} centerTop="ใช้จ่ายรวม" centerMain={fmtK(totExp)} centerSub={view === 'year' ? 'บาท/ปี' : 'บาท/เดือน'} />
            <div style={{ flex: 1, minWidth: 140, display: 'flex', flexDirection: 'column', gap: 11 }}>
              {donutData.map((c) =>
              <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="legend-dot" style={{ background: c.color }} />
                  <span style={{ fontSize: 14, flex: 1 }}>{c.name}</span>
                  <span className="bignum tnum" style={{ fontSize: 14 }}>
                    {totIncome > 0 ? (c.value / totIncome * 100).toFixed(0) : 0}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card card-pad-lg">
          <div className="card-h">
            <h3>รับ vs จ่าย รายเดือน {yearLabel(year)}</h3>
            <div className="legend" style={{ marginLeft: 'auto' }}>
              <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--mint-deep)' }} />รับ</span>
              <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--coral)' }} />จ่าย</span>
            </div>
          </div>
          <GroupedBars data={monthly.map(function (m) {return { income: m.income, expense: m.expense };})} labels={MO} height={200} />
        </div>

        <div className="card card-pad-lg span-2">
          <div className="card-h"><h3>เปรียบเทียบรายรับ-รายจ่าย</h3></div>
          <CompareBars rows={[
          { label: 'รายรับรวม', value: totIncome, color: 'var(--mint-deep)' },
          { label: 'เงินออมรวม', value: totSaving, color: 'var(--lime-deep)' },
          { label: 'ค่าใช้จ่ายประจำ', value: totFixed, color: 'var(--peach-deep)' },
          { label: 'ค่าใช้จ่ายแปรผัน', value: totVar, color: 'var(--coral-deep)' }]
          } max={totIncome} />
        </div>

        <div className="card card-pad-lg span-2">
          <div className="card-h">
            <h3>สรุปหมวดหมู่การใช้จ่าย{view === 'year' ? 'ทั้งปี' : 'เดือนนี้'}</h3>
            <div className="seg" style={{ marginLeft: 'auto' }}>
              <button className={catView === 'bar' ? 'on' : ''} onClick={() => setCatView('bar')}>รายประเภท</button>
              <button className={catView === 'donut' ? 'on' : ''} onClick={() => setCatView('donut')}>กราฟ</button>
            </div>
          </div>
          {catRows.length > 0 ?
          catView === 'bar' ?
          <CompareBars rows={catRows} max={catRows[0].value} /> :
          <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', padding: '10px 0 6px' }}>
              <Donut
              data={catRows.map(function (r) {return { name: r.label, color: r.color, value: r.value };})}
              size={224} thick={32}
              centerTop="ใช้จ่ายรวม" centerMain={fmtK(catTotal)} centerSub={view === 'year' ? 'บาท/ปี' : 'บาท/เดือน'} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13, flex: 1, minWidth: 240, maxWidth: 360 }}>
                {catRows.map(function (c) {
                return (
                  <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <span className="legend-dot" style={{ background: c.color }} />
                      <span style={{ fontSize: 14.5, flex: 1 }}>{c.label}</span>
                      <span style={{ fontSize: 13, color: 'var(--ink-faint)' }} data-comment-anchor="4414c73562-span-1264-23">{catTotal > 0 ? (c.value / catTotal * 100).toFixed(0) : 0}%</span>
                      <span className="bignum tnum" style={{ fontSize: 14, minWidth: 78, textAlign: 'right' }}>{baht(c.value)}</span>
                    </div>);

              })}
              </div>
            </div> :

          <div style={{ padding: '28px 4px', textAlign: 'center', color: 'var(--ink-faint)', fontSize: 14 }}>
              ยังไม่มีรายการใช้จ่ายในช่วงนี้
            </div>}
        </div>
      </div>
    </div>);

}

/* ============================================================
   3) สรุปเงินเก็บรายปี
   ============================================================ */
const CURRENT_YEAR = String(new Date().getFullYear() + 543);
const _CY = parseInt(CURRENT_YEAR, 10);
/* ปีที่เลือกได้: ย้อนหลัง 3 ปี + ไปข้างหน้า 20 ปี (default เป็นปีปัจจุบันเสมอ) */
const YEAR_KEYS = function () {const a = [];for (let y = _CY - 3; y <= _CY + 20; y++) a.push(String(y));return a;}();
function yearLabel(y) {return 'ปี ' + y;}
function ydataOf(savings, y) {
  const d = savings && savings[y] || SAVINGS_SEED[y] || {};
  return { label: d.label || yearLabel(y), target: d.target || 0, months: d.months || blankMonths(), cols: d.cols || [] };
}
/* สุทธิที่เปลี่ยนแปลงของเงินเก็บในเดือนนั้น (รวมคอลัมน์ที่เพิ่มเอง) */
function monthNet(row, cols) {
  let v = (row.save || 0) + (row.bonus || 0) - (row.deduct || 0);
  (cols || []).forEach(function (c) {
    const a = row.custom && row.custom[c.id] || 0;
    v += c.type === 'out' ? -a : a;
  });
  return v;
}
/* สุทธิทั้งปี (เงินเก็บที่เพิ่มขึ้นสุทธิในปีนั้น) */
function yearNet(savings, y) {
  const yd = ydataOf(savings, y);
  return yd.months.reduce(function (s, m) {return s + monthNet(m, yd.cols);}, 0);
}
/* ยอดยกมาต้นปี = ผลรวมสุทธิของทุกปีก่อนหน้า (ยกยอดข้ามปี) */
function priorBal(savings, y) {
  let s = 0;
  YEAR_KEYS.forEach(function (k) {if (k < y) s += yearNet(savings, k);});
  return s;
}

/* Savings area chart (ใช้ยอดสะสมที่คำนวณได้) */
function SavingsChart({ bals, target }) {
  const W = 600,H = 210;
  const pad = { l: 8, r: 8, t: 20, b: 30 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const maxBal = Math.max(...bals.map((b) => Math.max(b, 0)), target || 0, 1);
  const sx = (i) => pad.l + i / 11 * iw;
  const sy = (y) => pad.t + (1 - Math.max(0, y) / maxBal) * ih;

  const linePath = bals.map((b, i) => `${i ? 'L' : 'M'}${sx(i).toFixed(1)},${sy(b).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${sx(11).toFixed(1)},${pad.t + ih} L${sx(0).toFixed(1)},${pad.t + ih} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', height: 'auto', maxHeight: H }}>
      <defs>
        <linearGradient id="sav-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--mint)" stopOpacity="0.85" />
          <stop offset="100%" stopColor="var(--mint)" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((f) =>
      <line key={f} x1={pad.l} x2={W - pad.r} y1={pad.t + f * ih} y2={pad.t + f * ih}
      stroke="var(--line-soft)" strokeWidth="1" />
      )}
      {[0.25, 0.5, 0.75, 1].map((f) =>
      <text key={f} x={pad.l + 4} y={pad.t + (1 - f) * ih - 4} fontSize="10" fill="var(--ink-faint)">
          {fmtK(Math.round(maxBal * f))}
        </text>
      )}
      {target > 0 &&
      <g>
        <line x1={pad.l} x2={W - pad.r} y1={sy(target)} y2={sy(target)} stroke="var(--coral-deep)" strokeWidth="1.5" strokeDasharray="5 4" />
        <text x={W - pad.r} y={sy(target) - 5} textAnchor="end" fontSize="10" fill="var(--coral-deep)" fontWeight="700">เป้า {fmtK(target)}</text>
      </g>
      }
      <path d={areaPath} fill="url(#sav-grad)" />
      <path d={linePath} fill="none" stroke="var(--mint-deep)" strokeWidth="2.8"
      strokeLinecap="round" strokeLinejoin="round" />
      {bals.map((b, i) =>
      <g key={i}>
          <circle cx={sx(i)} cy={sy(b)} r="4.5" fill="#fff" stroke="var(--mint-deep)" strokeWidth="2.2" />
          {b > 0 &&
        <text x={sx(i)} y={sy(b) - 8} textAnchor="middle" fontSize="10" fill="var(--mint-deep)" fontWeight="600">
              {i === 0 || i === 11 || Math.abs(b - bals[Math.max(0, i - 1)]) > maxBal * 0.18 ?
          fmtK(b) : ''}
            </text>
        }
          <text x={sx(i)} y={H - 8} textAnchor="middle" fontSize="10.5" fill="var(--ink-faint)">{MO[i]}</text>
        </g>
      )}
    </svg>);

}

/* Inline editable number cell */
function NumCell({ value, onChange, color, allowNeg }) {
  const [editing, setEditing] = React.useState(false);
  const [raw, setRaw] = React.useState('');

  const startEdit = () => {setRaw(value === 0 ? '' : String(value));setEditing(true);};
  const commit = () => {
    const n = parseInt(raw.replace(allowNeg ? /[^0-9\-]/g : /[^\d]/g, ''), 10);
    onChange(isNaN(n) ? 0 : n);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        type="text" inputMode={allowNeg ? 'text' : 'numeric'}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        style={{
          width: 88, border: 'none', borderBottom: '2px solid var(--accent)', background: 'transparent',
          textAlign: 'right', fontFamily: 'var(--font-body)', fontSize: 13.5, color, padding: '2px 4px',
          outline: 'none', fontVariantNumeric: 'tabular-nums'
        }} />);


  }
  return (
    <span
      className="tnum"
      onClick={startEdit}
      title="คลิกเพื่อแก้ไข"
      style={{
        fontSize: 13.5, color: value === 0 ? 'var(--ink-faint)' : color,
        cursor: 'text', display: 'block', textAlign: 'right', padding: '2px 4px',
        borderBottom: '1.5px solid transparent', minWidth: 72
      }}>
      
      {value === 0 ? '—' : fmt(value)}
    </span>);

}

/* Savings table row — คอลัมน์คงที่ 3 ช่อง + คอลัมน์ที่ผู้ใช้เพิ่ม + ยอดสะสม (คำนวณ) */
function SavingsRow({ mo, row, cols, bal, onUpdate, onUpdateCustom, isEditable, isCurrent, planSave, target }) {
  const rowBg = isCurrent ? 'var(--accent-soft)' : undefined;
  const dash = <span style={{ color: 'var(--ink-faint)' }}>—</span>;
  const ro = (v, color) =>
  <span className="tnum" style={{ fontSize: 13.5, color: v ? color : 'var(--ink-faint)', display: 'block', textAlign: 'right' }}>{v ? fmt(v) : dash}</span>;

  return (
    <tr style={{ background: rowBg }}>
      <td style={{ padding: '9px 12px', fontWeight: isCurrent ? 700 : 400, fontSize: 14, whiteSpace: 'nowrap', color: isCurrent ? 'var(--accent-deep)' : 'var(--ink)' }}>
        {isCurrent && <span style={{ marginRight: 4, fontSize: 10 }}>●</span>}
        {mo}
      </td>
      {/* เงินออม + flag จากแผนเดือน */}
      <td style={{ padding: '7px 8px' }}>
        {planSave > 0 &&
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 3 }}>
            <button
            onClick={isEditable ? () => onUpdate({ save: planSave }) : undefined}
            title={row.save === planSave ? 'ตรงกับแผนเดือน' : isEditable ? 'คลิกเพื่อใช้จากแผนเดือน' : 'จากแผนเดือน'}
            style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10.5,
              cursor: isEditable && row.save !== planSave ? 'pointer' : 'default',
              color: row.save === planSave ? 'var(--mint-deep)' : 'var(--ink-soft)',
              background: row.save === planSave ? '#e4f5ec' : 'var(--surface-2)',
              border: row.save === planSave ? '1px solid var(--mint)' : '1px solid var(--line)',
              borderRadius: 99, padding: '1px 7px', fontFamily: 'var(--font-body)' }}>
              <Ic d={ICONS.piggy} size={10} />
              {fmt(planSave)}
              {row.save === planSave && <span style={{ marginLeft: 2 }}>✓</span>}
            </button>
          </div>
        }
        {isEditable ?
        <NumCell value={row.save} onChange={(v) => onUpdate({ save: v })} color="var(--mint-deep)" /> :
        ro(row.save, 'var(--mint-deep)')}
      </td>
      {/* โบนัส */}
      <td style={{ padding: '7px 8px' }}>
        {isEditable ?
        <NumCell value={row.bonus} onChange={(v) => onUpdate({ bonus: v })} color="#7B6DD4" /> :
        ro(row.bonus, '#7B6DD4')}
      </td>
      {/* รายการหักจากเงินเก็บ */}
      <td style={{ padding: '7px 8px' }}>
        {isEditable ?
        <NumCell value={row.deduct} onChange={(v) => onUpdate({ deduct: v })} color="var(--coral-deep)" /> :
        ro(row.deduct, 'var(--coral-deep)')}
      </td>
      {/* คอลัมน์ที่ผู้ใช้เพิ่ม */}
      {cols.map(function (c) {
        const color = c.type === 'out' ? 'var(--coral-deep)' : 'var(--lime-deep)';
        const v = row.custom && row.custom[c.id] || 0;
        return (
          <td key={c.id} style={{ padding: '7px 8px' }}>
            {isEditable ?
            <NumCell value={v} onChange={(nv) => onUpdateCustom(c.id, nv)} color={color} /> :
            ro(v, color)}
          </td>);

      })}
      {/* ยอดสะสมสุทธิ — คำนวณ แก้ไขไม่ได้ */}
      <td style={{ padding: '7px 12px', textAlign: 'right' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <span className="bignum tnum" style={{ fontSize: 15, color: bal > 0 ? 'var(--ink)' : bal < 0 ? 'var(--coral-deep)' : 'var(--ink-faint)' }}>
            {bal !== 0 ? baht(bal) : '—'}
          </span>
          {target > 0 && bal > 0 &&
          <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99, whiteSpace: 'nowrap',
            color: bal >= target ? 'var(--good)' : 'var(--ink-faint)',
            background: bal >= target ? 'rgba(127,180,106,.16)' : 'var(--surface-2)' }}>
            {bal >= target ? '✓ ถึงเป้า' : (bal / target * 100).toFixed(0) + '% ของเป้า'}
          </span>}
        </div>
      </td>
      {/* หมายเหตุ */}
      <td style={{ padding: '7px 8px' }}>
        {isEditable ?
        <input
          type="text" value={row.note}
          onChange={(e) => onUpdate({ note: e.target.value })}
          placeholder="หมายเหตุ..."
          style={{ width: 180, border: 'none', background: 'transparent', borderBottom: '1.5px solid var(--line)',
            fontFamily: 'var(--font-body)', fontSize: 12.5, color: 'var(--ink-soft)', padding: '3px 4px', outline: 'none' }} /> :
        <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{row.note}</span>}
      </td>
    </tr>);

}

/* ── editable yearly-goal chip ── */
function TargetField({ value, onChange }) {
  const [editing, setEditing] = React.useState(false);
  const [raw, setRaw] = React.useState('');
  const start = function () {setRaw(value ? String(value) : '');setEditing(true);};
  const commit = function () {const n = parseInt(String(raw).replace(/[^\d]/g, ''), 10);onChange(isNaN(n) ? 0 : n);setEditing(false);};
  if (editing) {
    return (
      <input
        autoFocus type="text" inputMode="numeric" value={raw}
        onChange={function (e) {setRaw(e.target.value);}}
        onBlur={commit}
        onKeyDown={function (e) {if (e.key === 'Enter') commit();if (e.key === 'Escape') setEditing(false);}}
        placeholder="ตั้งเป้า..."
        style={{ width: 120, border: 'none', borderBottom: '2px solid var(--accent)', background: 'transparent', textAlign: 'left', fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--ink)', padding: '2px 4px', outline: 'none', fontVariantNumeric: 'tabular-nums' }} />);

  }
  return (
    <button onClick={start} title="คลิกเพื่อตั้ง / แก้เป้าหมายรายปี"
    style={{ border: '1px dashed var(--accent)', background: 'rgba(255,255,255,.5)', borderRadius: 99, padding: '4px 12px', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: value ? 'var(--accent-deep)' : 'var(--ink-faint)', fontFamily: 'var(--font-body)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      🎯 {value ? 'เป้าปีนี้ ' + baht(value) : 'ตั้งเป้าหมายรายปี'}
    </button>);

}

/* ============================================================
   3a) เงินเก็บ — รายปี
   ============================================================ */
function SavingsByYear({ savings, setSavings }) {
  const [allMonthPlans] = useStored('plan.months.v3', {});
  const [startBalance, setStartBalance] = useStored('savings.start.v1', 0); // เงินเก็บตั้งต้น (ฐานก่อนเริ่มบันทึก)
  const [year, setYear] = React.useState(CURRENT_YEAR);
  const [addingCol, setAddingCol] = React.useState(false);
  const [newColName, setNewColName] = React.useState('');
  const [newColType, setNewColType] = React.useState('in');

  const ydata = ydataOf(savings, year);
  const months = ydata.months;
  const cols = ydata.cols || [];
  const target = ydata.target || 0;
  const curMonthIdx = year === CURRENT_YEAR ? new Date().getMonth() : -1;
  const editable = year >= CURRENT_YEAR;

  // ยอดสะสมสุทธิ = เงินเก็บตั้งต้น + ยอดยกมาต้นปี + สุทธิรายเดือนสะสม (ยกยอดข้ามปี → คำนวณ แก้ไม่ได้)
  const prior = priorBal(savings, year);
  const bals = [];
  let acc = (Number(startBalance) || 0) + prior;
  for (let i = 0; i < 12; i++) {acc += monthNet(months[i], cols);bals.push(acc);}

  const totSave = months.reduce((s, m) => s + m.save, 0);
  const totBonus = months.reduce((s, m) => s + m.bonus, 0);
  const totDed = months.reduce((s, m) => s + m.deduct, 0);
  const colTotals = cols.map((c) => months.reduce((s, m) => s + (m.custom && m.custom[c.id] || 0), 0));

  const uptoIdx = year < CURRENT_YEAR ? 11 : curMonthIdx < 0 ? 11 : curMonthIdx;
  const displayBal = bals[uptoIdx];            // ยอดล่าสุด (ถึงเดือนปัจจุบัน) — ใช้ในการ์ดสรุป
  const yearEndBal = bals[11];                  // ยอดสิ้นปี (รวมทุกเดือนที่กรอก) — ใช้ในแถว "รวมทั้งปี"
  const reached = target > 0 && displayBal >= target;

  const flaggedSaves = months.map(function (_, i) {
    const key = year + '-' + i;
    const mp = allMonthPlans[key] || null;
    if (!mp || !mp.saving) return 0;
    return mp.saving.filter(function (r) {return r.toSave;}).reduce(function (s, r) {return s + (r.amount || 0);}, 0);
  });

  function updMonth(idx, patch) {
    const nm = months.map((m, i) => i === idx ? { ...m, ...patch } : m);
    setSavings({ ...savings, [year]: { ...ydata, months: nm, cols } });
  }
  function updMonthCustom(idx, colId, val) {
    const nm = months.map((m, i) => i === idx ? { ...m, custom: { ...(m.custom || {}), [colId]: val } } : m);
    setSavings({ ...savings, [year]: { ...ydata, months: nm, cols } });
  }
  function setTarget(v) {setSavings({ ...savings, [year]: { ...ydata, target: v, cols } });}

  // เพิ่มคอลัมน์ใหม่ (เลือกได้ว่าเป็นรายรับหรือรายจ่าย)
  function addCol() {
    const name = newColName.trim() || (newColType === 'out' ? 'รายจ่ายใหม่' : 'รายรับใหม่');
    const col = { id: 'c' + Date.now() + Math.random().toString(36).slice(2, 5), name, type: newColType };
    setSavings({ ...savings, [year]: { ...ydata, months, cols: [...cols, col] } });
    setNewColName('');setNewColType('in');setAddingCol(false);
  }
  // ลบได้เฉพาะคอลัมน์ที่เพิ่มเอง
  function delCol(id) {
    const nm = months.map((m) => {const c = { ...(m.custom || {}) };delete c[id];return { ...m, custom: c };});
    setSavings({ ...savings, [year]: { ...ydata, months: nm, cols: cols.filter((c) => c.id !== id) } });
  }

  // ล้างข้อมูลเงินเก็บของปีที่เลือกอยู่ (รวมเป้าหมาย + คอลัมน์ที่เพิ่ม)
  function clearYearSavings() {
    const next = Object.assign({}, savings);
    next[year] = { label: yearLabel(year), target: 0, months: blankMonths(), cols: [] };
    setSavings(next);
  }

  /* ── Excel export: yearly savings table ── */
  function exportYearXLSX() {
    const head = ['เดือน', 'เงินออม ฿', 'โบนัส ฿', 'รายการหักจากเงินเก็บ ฿'].
    concat(cols.map(function (c) {return c.name + ' ฿ (' + (c.type === 'out' ? 'รายจ่าย' : 'รายรับ') + ')';})).
    concat(['ยอดสะสมสุทธิ ฿', 'หมายเหตุ']);
    const aoa = [head];
    months.forEach(function (row, i) {
      const customVals = cols.map(function (c) {return row.custom && row.custom[c.id] || 0;});
      aoa.push([MO[i], row.save || 0, row.bonus || 0, row.deduct || 0].concat(customVals).concat([bals[i], row.note || '']));
    });
    aoa.push(['รวมทั้งปี', totSave, totBonus, totDed].concat(colTotals).concat([yearEndBal, '']));
    const widths = [{ wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 22 }].concat(cols.map(function () {return { wch: 16 };})).concat([{ wch: 16 }, { wch: 26 }]);
    exportXLSX('เงินเก็บ_' + yearLabel(year) + '.xlsx', [{ name: 'เงินเก็บ ' + year, aoa: aoa, cols: widths }]);
  }

  return (
    <React.Fragment>
      {/* Year selector + goal */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>เลือกปี</span>
        <CustomSelect
          value={year}
          onChange={setYear}
          options={YEAR_KEYS.map(function (y) {return { value: y, label: yearLabel(y) + (y === CURRENT_YEAR ? ' ● ปีนี้' : '') };})}
          style={{ minWidth: 150 }} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 13.5, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>เงินเก็บตั้งต้น</span>
          <AmtInput value={Number(startBalance) || 0} onChange={setStartBalance} style={{ flex: '0 0 120px' }} />
        </span>
        <div style={{ flex: 1 }} />
        <ExportBtn label="Export Excel" onClick={exportYearXLSX} />
        <TargetField value={target} onChange={setTarget} />
        {editable &&
        <ClearBtn
          label={'ล้างค่า ' + yearLabel(year)}
          confirmMsg={'ล้างยอดเงินเก็บและเป้าหมายทั้งหมดของ' + yearLabel(year) + ' ใช่หรือไม่?'}
          onClear={clearYearSavings} />
        }
      </div>

      {/* Stats */}
      <div className="grid cols-3 stat-duo" style={{ marginBottom: 18 }}>
        <div className="stat tint-lime">
          <div className="stat-ic" style={{ color: 'var(--lime-deep)' }}><Ic d={ICONS.piggy} size={21} /></div>
          <div className="stat-label">{year < CURRENT_YEAR ? 'ยอดสะสมสิ้นปี' : 'ยอดสะสมล่าสุด'}</div>
          <div className="stat-val tnum">{baht(displayBal)}</div>
          {target > 0 &&
          <div className="stat-delta" style={{ color: reached ? 'var(--good)' : 'var(--warn)' }}>
              {reached ? '✓ ถึงเป้าแล้ว · ' : displayBal > 0 ? (displayBal / target * 100).toFixed(0) + '% · ' : ''}เป้า {baht(target)}
            </div>
          }
        </div>
        <div className="stat tint-mint">
          <div className="stat-ic" style={{ color: 'var(--mint-deep)' }}><Ic d={ICONS.trend} size={21} /></div>
          <div className="stat-label">เงินออมรวมทั้งปี</div>
          <div className="stat-val tnum">{baht(totSave)}</div>
          {totBonus > 0 && <div className="stat-delta muted">+ โบนัส {baht(totBonus)}</div>}
        </div>
        <div className="stat tint-coral">
          <div className="stat-ic" style={{ color: 'var(--coral-deep)' }}><Ic d={ICONS.arrowUp} size={21} /></div>
          <div className="stat-label">รายจ่ายจากเงินเก็บ</div>
          <div className="stat-val tnum">{baht(totDed)}</div>
        </div>
      </div>

      {/* Monthly table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        <div style={{ padding: '16px 20px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: 17 }}>รายการรายเดือน · {yearLabel(year)}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {editable && <span className="ref-note">คลิกตัวเลขเพื่อแก้ไข</span>}
            {editable && !addingCol &&
            <button onClick={() => setAddingCol(true)} className="btn btn-ghost btn-sm" style={{ fontSize: 12.5, background: 'rgba(255,255,255,.6)' }}>
                <Ic d={ICONS.plus} size={14} /> เพิ่มคอลัมน์
              </button>
            }
          </div>
        </div>
        {editable && addingCol &&
        <div style={{ margin: '0 20px 12px', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 12, padding: '10px 12px', flexWrap: 'wrap' }}>
          <input autoFocus value={newColName} onChange={(e) => setNewColName(e.target.value)}
          onKeyDown={(e) => {if (e.key === 'Enter') addCol();if (e.key === 'Escape') setAddingCol(false);}}
          placeholder="ชื่อคอลัมน์ใหม่..."
          style={{ flex: '1 1 160px', minWidth: 120, border: '1.5px solid var(--line)', borderRadius: 9, background: '#fff', fontFamily: 'var(--font-body)', fontSize: 13.5, color: 'var(--ink)', padding: '8px 11px', outline: 'none' }} />
          <div style={{ display: 'inline-flex', background: '#fff', border: '1px solid var(--line)', borderRadius: 9, padding: 3, gap: 3 }}>
            {[{ id: 'in', label: '↓ รายรับ', c: 'var(--lime-deep)' }, { id: 'out', label: '↑ รายจ่าย', c: 'var(--coral-deep)' }].map(function (o) {
              const on = newColType === o.id;
              return (
                <button key={o.id} onClick={() => setNewColType(o.id)}
                style={{ padding: '6px 13px', border: 'none', borderRadius: 7, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, background: on ? 'var(--surface-2)' : 'transparent', color: on ? o.c : 'var(--ink-soft)', boxShadow: on ? 'inset 0 0 0 1.5px ' + o.c : 'none' }}>
                  {o.label}
                </button>);
            })}
          </div>
          <button onClick={addCol} style={{ padding: '8px 16px', border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, background: 'var(--accent)', color: '#fff' }}>เพิ่ม</button>
          <button onClick={() => {setAddingCol(false);setNewColName('');}} className="btn btn-ghost btn-sm" style={{ fontSize: 13 }}>ยกเลิก</button>
        </div>
        }
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 660 + cols.length * 108 }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)', borderBottom: '2px solid var(--line)' }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600, letterSpacing: '.02em' }}>เดือน</th>
              <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600, letterSpacing: '.02em' }}>เงินออม ฿</th>
              <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600, letterSpacing: '.02em' }}>โบนัส ฿</th>
              <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600, letterSpacing: '.02em' }}>รายการหักจากเงินเก็บ ฿</th>
              {cols.map(function (c) {
                const cc = c.type === 'out' ? 'var(--coral-deep)' : 'var(--lime-deep)';
                return (
                  <th key={c.id} style={{ padding: '8px 8px', textAlign: 'right', fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600, letterSpacing: '.02em' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 2, background: cc, flexShrink: 0 }} />
                      <span>{c.name} ฿</span>
                      {editable &&
                      <button onClick={async () => {const ok = window.showConfirm ? await window.showConfirm({ type: 'delete', title: 'ลบคอลัมน์', message: 'ลบคอลัมน์ “' + c.name + '” พร้อมข้อมูลในคอลัมน์นี้ทั้งหมด ใช่หรือไม่?', confirmText: 'ลบ' }) : true;if (ok) delCol(c.id);}} title="ลบคอลัมน์นี้"
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-faint)', fontSize: 15, lineHeight: 1, padding: '0 1px' }}
                      onMouseEnter={(e) => {e.currentTarget.style.color = 'var(--coral-deep)';}}
                      onMouseLeave={(e) => {e.currentTarget.style.color = 'var(--ink-faint)';}}>×</button>}
                    </div>
                    <div style={{ fontSize: 9.5, fontWeight: 700, color: cc }}>{c.type === 'out' ? 'รายจ่าย' : 'รายรับ'}</div>
                  </th>);
              })}
              <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, color: 'var(--ink)', fontWeight: 700, letterSpacing: '.02em' }}>
                ยอดสะสมสุทธิ ฿
                <div style={{ fontSize: 9.5, fontWeight: 500, color: 'var(--ink-faint)' }}>คำนวณอัตโนมัติ</div>
              </th>
              <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600, letterSpacing: '.02em' }}>หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>
            {months.map((row, i) =>
            <SavingsRow
              key={i} mo={MO[i]} row={row}
              cols={cols}
              bal={bals[i]}
              isCurrent={i === curMonthIdx}
              isEditable={editable}
              target={target}
              onUpdate={(p) => updMonth(i, p)}
              onUpdateCustom={(colId, v) => updMonthCustom(i, colId, v)}
              planSave={flaggedSaves[i]} />

            )}
          </tbody>
          <tfoot>
            <tr style={{ background: 'var(--surface-2)', borderTop: '2px solid var(--line)', fontWeight: 700 }}>
              <td style={{ padding: '10px 12px', fontSize: 14, color: 'var(--ink)' }}>รวมทั้งปี</td>
              <td style={{ padding: '10px 8px', textAlign: 'right', fontSize: 14, color: 'var(--mint-deep)', fontFamily: 'var(--font-head)' }}>{baht(totSave)}</td>
              <td style={{ padding: '10px 8px', textAlign: 'right', fontSize: 14, color: '#7B6DD4', fontFamily: 'var(--font-head)' }}>{baht(totBonus)}</td>
              <td style={{ padding: '10px 8px', textAlign: 'right', fontSize: 14, color: 'var(--coral-deep)', fontFamily: 'var(--font-head)' }}>{baht(totDed)}</td>
              {cols.map(function (c, ci) {
                const cc = c.type === 'out' ? 'var(--coral-deep)' : 'var(--lime-deep)';
                return <td key={c.id} style={{ padding: '10px 8px', textAlign: 'right', fontSize: 14, color: cc, fontFamily: 'var(--font-head)' }}>{baht(colTotals[ci])}</td>;
              })}
              <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 15, color: 'var(--ink)', fontFamily: 'var(--font-head)' }}>{baht(yearEndBal)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Chart — ล่างสุด · ขนาดคงที่ ไม่ขยาย */}
      <div className="card card-pad-lg" style={{ marginTop: 18 }}>
        <div className="card-h">
          <h3>ยอดเงินเก็บสะสม {yearLabel(year)}</h3>
          <span className="sub" style={{ marginLeft: 'auto' }}>สูงสุด <b style={{ color: 'var(--mint-deep)', fontFamily: 'var(--font-head)' }}>{baht(Math.max(...bals, 0))}</b></span>
        </div>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <SavingsChart bals={bals} target={target} />
        </div>
      </div>
    </React.Fragment>);

}

/* ============================================================
   3b) เงินเก็บ — รวมหลายปี (ยกยอดข้ามปี)
   ============================================================ */
function SavingsMultiYear({ savings }) {
  const [startBalance] = useStored('savings.start.v1', 0); // เงินเก็บตั้งต้น (ฐานเดียวกับหน้ารายปี)
  const [sel, setSel] = React.useState([CURRENT_YEAR]);
  function toggle(y) {
    setSel(function (prev) {return prev.indexOf(y) >= 0 ? prev.filter(function (x) {return x !== y;}) : prev.concat([y]);});
  }
  const selOrdered = YEAR_KEYS.filter(function (y) {return sel.indexOf(y) >= 0;});

  const rows = selOrdered.map(function (y) {
    const months = ydataOf(savings, y).months;
    return {
      y: y, label: yearLabel(y),
      totSave: months.reduce(function (s, m) {return s + m.save;}, 0),
      totBonus: months.reduce(function (s, m) {return s + m.bonus;}, 0),
      totDed: months.reduce(function (s, m) {return s + m.deduct;}, 0),
      contrib: yearNet(savings, y)
    };
  });
  let run = 0;
  const withRun = rows.map(function (r) {run += r.contrib;return Object.assign({}, r, { run: run });});
  const combined = run;
  const sumSave = rows.reduce(function (s, r) {return s + r.totSave;}, 0);
  const sumBonus = rows.reduce(function (s, r) {return s + r.totBonus;}, 0);
  const sumDed = rows.reduce(function (s, r) {return s + r.totDed;}, 0);

  // ยอดเงินเก็บปัจจุบัน = เงินเก็บตั้งต้น + ยกยอดข้ามปีของทุกปีจนถึงปีปัจจุบัน
  let current = (Number(startBalance) || 0);
  YEAR_KEYS.forEach(function (y) {if (y <= CURRENT_YEAR) current += yearNet(savings, y);});

  /* ── Excel export: selected years ── */
  function exportMultiYearXLSX() {
    if (selOrdered.length === 0) return;
    const aoa = [['ปี', 'เงินออม ฿', 'โบนัส ฿', 'รายจ่ายหัก ฿', 'สุทธิปีนี้ ฿', 'สะสมยกยอด ฿']];
    withRun.forEach(function (r) {aoa.push([yearLabel(r.y), r.totSave, r.totBonus, r.totDed, r.contrib, r.run]);});
    aoa.push(['รวม ' + selOrdered.length + ' ปี', sumSave, sumBonus, sumDed, combined, combined]);
    const widths = [{ wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 16 }];
    exportXLSX('เงินเก็บ_รวม' + selOrdered.length + 'ปี.xlsx', [{ name: 'รวมหลายปี', aoa: aoa, cols: widths }]);
  }

  return (
    <React.Fragment>
      {/* year selection */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 11, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>เลือกปีที่จะรวม</span>
          <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>({selOrdered.length} ปี)</span>
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost btn-sm" style={{ fontSize: 12.5 }} onClick={function () {setSel([String(_CY - 2), String(_CY - 1), CURRENT_YEAR]);}}>ล่าสุด 3 ปี</button>
          <button className="btn btn-ghost btn-sm" style={{ fontSize: 12.5 }} onClick={function () {setSel(YEAR_KEYS.filter(function (y) {return y <= CURRENT_YEAR;}));}}>ถึงปีนี้</button>
          <button className="btn btn-ghost btn-sm" style={{ fontSize: 12.5 }} onClick={function () {setSel([CURRENT_YEAR]);}}>ล้าง</button>
          <ExportBtn label="Export Excel" onClick={exportMultiYearXLSX} disabled={selOrdered.length === 0} primary />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {YEAR_KEYS.map(function (y) {
            const on = sel.indexOf(y) >= 0;
            const isCur = y === CURRENT_YEAR;
            return (
              <button key={y} onClick={function () {toggle(y);}}
              style={{ padding: '5px 12px', borderRadius: 99, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600,
                border: on ? '1.5px solid var(--accent-deep)' : '1.5px solid var(--line)',
                background: on ? 'var(--accent-soft)' : '#fff',
                color: on ? 'var(--accent-deep)' : 'var(--ink-soft)' }}>
                {y}{isCur ? ' ●' : ''}
              </button>);

          })}
        </div>
      </div>

      {/* headline */}
      <div className="grid cols-2 stat-duo" style={{ marginBottom: 16 }}>
        <div className="stat tint-lime">
          <div className="stat-ic" style={{ color: 'var(--lime-deep)' }}><Ic d={ICONS.piggy} size={21} /></div>
          <div className="stat-label">ยอดเงินเก็บรวม ({selOrdered.length} ปีที่เลือก)</div>
          <div className="stat-val tnum">{baht(combined)}</div>
          <div className="stat-delta muted">ออมรวม {baht(sumSave)} · หักใช้ {baht(sumDed)}</div>
        </div>
        <div className="stat tint-mint">
          <div className="stat-ic" style={{ color: 'var(--mint-deep)' }}><Ic d={ICONS.trend} size={21} /></div>
          <div className="stat-label">ยอดเงินเก็บปัจจุบัน (ยกยอดถึงปีนี้)</div>
          <div className="stat-val tnum">{baht(current)}</div>
          <div className="stat-delta muted">สะสมข้ามปี {yearLabel(YEAR_KEYS[0])} → {yearLabel(CURRENT_YEAR)}</div>
        </div>
      </div>

      {/* explainer */}
      <div className="plan-note" style={{ marginBottom: 16 }}>
        💡 ยอดเงินเก็บจะ <b>ยกยอดข้ามปี</b> — เงินเก็บสิ้นปีก่อนถูกบวกต่อในปีถัดไป เช่น สิ้นปี {baht(50000)} + ออม ม.ค. {baht(1000)} − หักใช้ {baht(5000)} = <b>{baht(46000)}</b>
      </div>

      {/* per-year table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
          <thead>
            <tr style={{ background: 'var(--surface-2)', borderBottom: '2px solid var(--line)' }}>
              {[
              { h: 'ปี', align: 'left' },
              { h: 'เงินออม ฿', align: 'right' },
              { h: 'โบนัส ฿', align: 'right' },
              { h: 'รายจ่ายหัก ฿', align: 'right' },
              { h: 'สุทธิปีนี้ ฿', align: 'right' },
              { h: 'สะสมยกยอด ฿', align: 'right' }].
              map((col, i) =>
              <th key={i} style={{ padding: '10px ' + (i === 0 ? '14px' : '10px'), textAlign: col.align, fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600 }}>{col.h}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {withRun.length === 0 &&
            <tr><td colSpan={6} style={{ padding: '22px', textAlign: 'center', color: 'var(--ink-faint)', fontSize: 13.5 }}>ยังไม่ได้เลือกปี</td></tr>}
            {withRun.map(function (r) {
              const isCur = r.y === CURRENT_YEAR;
              return (
                <tr key={r.y} style={{ borderTop: '1px solid var(--line-soft)', background: isCur ? 'var(--accent-soft)' : 'transparent' }}>
                  <td style={{ padding: '10px 14px', fontWeight: isCur ? 700 : 600, fontSize: 14, color: isCur ? 'var(--accent-deep)' : 'var(--ink)', whiteSpace: 'nowrap' }}>{yearLabel(r.y)}{isCur ? ' ●' : ''}</td>
                  <td className="tnum" style={{ padding: '10px', textAlign: 'right', fontSize: 13.5, color: 'var(--mint-deep)' }}>{r.totSave ? fmt(r.totSave) : '—'}</td>
                  <td className="tnum" style={{ padding: '10px', textAlign: 'right', fontSize: 13.5, color: '#7B6DD4' }}>{r.totBonus ? fmt(r.totBonus) : '—'}</td>
                  <td className="tnum" style={{ padding: '10px', textAlign: 'right', fontSize: 13.5, color: 'var(--coral-deep)' }}>{r.totDed ? fmt(r.totDed) : '—'}</td>
                  <td className="tnum" style={{ padding: '10px', textAlign: 'right', fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{r.contrib ? fmt(r.contrib) : '—'}</td>
                  <td className="tnum" style={{ padding: '10px', textAlign: 'right', fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>{baht(r.run)}</td>
                </tr>);

            })}
          </tbody>
          <tfoot>
            <tr style={{ background: 'var(--surface-2)', borderTop: '2px solid var(--line)', fontWeight: 700 }}>
              <td style={{ padding: '11px 14px', fontSize: 14 }}>รวม</td>
              <td className="tnum" style={{ padding: '11px 10px', textAlign: 'right', fontSize: 14, color: 'var(--mint-deep)', fontFamily: 'var(--font-head)' }}>{baht(sumSave)}</td>
              <td className="tnum" style={{ padding: '11px 10px', textAlign: 'right', fontSize: 14, color: '#7B6DD4', fontFamily: 'var(--font-head)' }}>{baht(sumBonus)}</td>
              <td className="tnum" style={{ padding: '11px 10px', textAlign: 'right', fontSize: 14, color: 'var(--coral-deep)', fontFamily: 'var(--font-head)' }}>{baht(sumDed)}</td>
              <td className="tnum" style={{ padding: '11px 10px', textAlign: 'right', fontSize: 14, fontFamily: 'var(--font-head)' }}>{baht(combined)}</td>
              <td className="tnum" style={{ padding: '11px 10px', textAlign: 'right', fontSize: 15, fontFamily: 'var(--font-head)', color: 'var(--mint-deep)' }}>{baht(combined)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </React.Fragment>);

}

function PlanSavings() {
  const [savings, setSavings] = useSavings();
  const [view, setView] = React.useState('year');
  return (
    <div className="plan-pane">
      <div style={{ display: 'inline-flex', background: 'var(--surface-2)', borderRadius: 12, padding: 3, gap: 3, marginBottom: 18, border: '1px solid var(--line-soft)' }}>
        {[{ id: 'year', label: 'รายปี' }, { id: 'multi', label: 'รวมหลายปี' }].map(function (v) {
          const on = view === v.id;
          return (
            <button key={v.id} onClick={function () {setView(v.id);}}
            style={{ padding: '7px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13.5, fontWeight: 600, background: on ? '#fff' : 'transparent', color: on ? 'var(--ink)' : 'var(--ink-soft)', boxShadow: on ? '0 1px 3px rgba(0,0,0,.08)' : 'none', transition: 'all .15s' }}>
              {v.label}
            </button>);

        })}
      </div>
      {view === 'year' ?
      <SavingsByYear savings={savings} setSavings={setSavings} /> :
      <SavingsMultiYear savings={savings} />}
    </div>);

}

/* ============================================================
   Plan container with sub-tabs
   ============================================================ */
function PlanPage({ sub, setSub }) {
  const Sub = { monthly: PlanMonthly, summary: PlanSummary, savings: PlanSavings }[sub] || PlanMonthly;
  const tabs = [
  { id: 'monthly', label: 'วางแผนรายเดือน', emoji: '🗓️' },
  { id: 'summary', label: 'สรุปรายรับ-รายจ่าย', emoji: '📊' },
  { id: 'savings', label: 'เงินเก็บรายปี', emoji: '🐖' }];

  return (
    <div className="content page-anim">
      <div className="plan-tabs">
        {tabs.map((t) =>
        <button key={t.id} className={'plan-tab' + (sub === t.id ? ' on' : '')} onClick={() => setSub(t.id)} style={{ backgroundColor: "rgb(255, 221, 221)" }}>
            <span>{t.emoji}</span> {t.label}
          </button>
        )}
      </div>
      <Sub key={sub} />
    </div>);

}

Object.assign(window, { PlanPage, PlanMonthly, PlanSummary, PlanSavings });