import React from 'react';
import ReactDOM from 'react-dom';
import '../../shared/globals.js';
const { fmt, baht, fmtK, useStored, ClearBtn, calcTax, taxBreakdown, TAX_BRACKETS, DEDUCTION_ITEMS, DED_CATS, THAI_MONTHS, EXPENSE_CATS, catById, INCOME_CATS, incomeCat, INITIAL_TX, CAT_COLORS, PLAN_SEED, MONTH_LABELS, MONTHLY_HISTORY, retirementPlan, Ic, ICONS, pvdPlan, niceStep, MoneyInput, CustomSelect, Donut, GroupedBars, AreaChart, LineChart, Ring, CompareBars, ConfirmHost, useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider, TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton, ProfileMenu, SettingsModal, Avatar, PROFILE_DEFAULT, GoogleMark, isGoogle, ProfileTab, SecurityTab, AccountTab, NAV, PAGE_META, Sidebar, Topbar, MobileTop, MobileNav, BrandMark } = window;
/* ============================================================
   pages_tax.jsx — วางแผนภาษี (อ้างอิงสิทธิลดหย่อนปีภาษี 2569)
   ============================================================ */

function SummaryRow({ label, value, note, color, strong, onInfo }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '11px 0', borderBottom: '1px dashed var(--line-soft)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: strong ? 600 : 500, fontSize: strong ? 16 : 15 }}>{label}</span>
          {onInfo && (
            <button className="info-btn" onClick={onInfo} aria-label="อธิบายขั้นภาษี"><Ic d={ICONS.info} size={16} /></button>
          )}
        </div>
        {note && <div className="row-sub" style={{ marginTop: 2 }}>{note}</div>}
      </div>
      <span className="bignum" style={{ fontSize: strong ? 20 : 17, color: color || 'var(--ink)', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}

function TaxBracketModal({ netTaxable, onClose }) {
  // สร้างแถวจาก TAX_BRACKETS
  const rows = (() => {
    const out = []; let prev = 0;
    for (const b of TAX_BRACKETS) {
      const sliceMax = b.up === Infinity ? null : (b.up - prev);
      const maxTax   = sliceMax != null ? sliceMax * b.rate : null;
      const userSlice = Math.max(0, Math.min(netTaxable, b.up === Infinity ? netTaxable : b.up) - prev);
      const userTax   = userSlice * b.rate;
      const isActive  = netTaxable > prev && (b.up === Infinity || netTaxable <= b.up);
      const rangeLabel = b.up === Infinity
        ? `${(prev + 1).toLocaleString('th-TH')} บาทขึ้นไป`
        : `${prev.toLocaleString('th-TH')} – ${b.up.toLocaleString('th-TH')}`;
      out.push({ from: prev, to: b.up, rate: b.rate, rangeLabel, maxTax, userTax, isActive });
      prev = b.up;
    }
    return out;
  })();

  React.useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="ปิด"><Ic d={ICONS.close} size={20} /></button>
        <div className="row-sub" style={{ fontWeight: 600, color: 'var(--coral-deep)', letterSpacing: '.02em' }}>ที่มา: กรมสรรพากร</div>
        <h3 style={{ fontSize: 21, marginBottom: 4 }}>อัตราภาษีเงินได้ บุคคลธรรมดา</h3>
        <p className="modal-lead">ภาษีคิดแบบ <b>ขั้นบันได</b> — เฉพาะส่วนที่เกินแต่ละขั้นเสียภาษีในอัตรานั้น แถวสีเน้น = ขั้นที่เงินได้สุทธิของคุณตกอยู่</p>

        <div className="saltax-wrap">
          <table className="saltax brktax">
            <thead>
              <tr>
                <th style={{ textAlign: 'left', paddingLeft: 14 }}>รายได้สุทธิ<small>บาท</small></th>
                <th>อัตราเสียภาษี</th>
                <th>ภาษีสูงสุดในขั้นนี้<small>บาท</small></th>
                <th>ภาษีของคุณ<small>ในขั้นนี้</small></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className={r.isActive ? 'active' : ''}>
                  <td style={{ textAlign: 'left', paddingLeft: 14, fontWeight: r.isActive ? 700 : 500 }}>{r.rangeLabel}</td>
                  {r.rate === 0 ? (
                    <td colSpan={3} style={{ textAlign: 'center', color: 'var(--mint-deep)', fontWeight: 600 }}>ได้รับการยกเว้นภาษี</td>
                  ) : (
                    <>
                      <td>{Math.round(r.rate * 100)}%</td>
                      <td>{r.to === Infinity ? <span className="row-sub">ขึ้นอยู่กับรายได้</span> : fmt(r.maxTax)}</td>
                      <td>{r.userTax > 0 ? <b>{fmt(r.userTax)}</b> : <span className="row-sub">—</span>}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="brk-foot">
          <div>
            <div className="row-sub">เงินได้สุทธิของคุณ</div>
            <div className="bignum" style={{ fontSize: 17 }}>{baht(netTaxable)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="row-sub">ภาษีรวมทั้งปี</div>
            <div className="bignum" style={{ fontSize: 20, color: 'var(--coral-deep)' }}>{baht(rows.reduce((s,r)=>s+r.userTax,0))}</div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function TaxPage() {
  const [salary, setSalary] = useStored('tax.salary.v3', 0);
  const [bonus, setBonus] = useStored('tax.bonus.v3', 0);
  const [otherIncome, setOtherIncome] = useStored('tax.otherIncome', 0); // OT + รายได้อื่นๆ รวมต่อปี
  const [withholding, setWithholding] = useStored('tax.withholding', 0); // ภาษีหัก ณ ที่จ่ายที่บริษัทหักไปแล้วต่อปี
  // ปรับเงินเดือนระหว่างปี (ไม่บังคับกรอก)
  const [raiseOn, setRaiseOn] = useStored('tax.raiseOn', false);
  const [raiseMonth, setRaiseMonth] = useStored('tax.raiseMonth', 7); // 1–12 (เดือนแรกที่ได้เงินเดือนใหม่)
  const [newSalary, setNewSalary] = useStored('tax.newSalary', 0);
  // สิทธิลดหย่อน (คีย์ใหม่สำหรับชุดข้อมูลปี 2569)
  const [ded, setDed] = useStored('tax.ded2569.v3', DEDUCTION_ITEMS.map(d => ({ id: d.id, on: !!d.on, amount: d.amount || 0 })));
  // รายการลดหย่อนที่ผู้ใช้เพิ่มเอง
  const [customDed, setCustomDed] = useStored('tax.customDed', []);
  const [newName, setNewName] = React.useState('');
  const [newAmt, setNewAmt] = React.useState(0);
  // รายการที่ผู้ใช้กดเพิ่มจากตัวเลือก (แบบ iTax) + สถานะเปิดตัวเลือก
  const [revealed, setRevealed] = useStored('tax.revealed', []);
  const [pickOpen, setPickOpen] = React.useState(false);
  const [brkOpen, setBrkOpen] = React.useState(false);
  // รายการที่แสดงเป็นค่าเริ่มต้นเสมอ
  const FEATURED = React.useRef(new Set([
    'spouse', 'child', 'newborn', 'parent', 'disabled',   // ส่วนตัว/ครอบครัว (ทั้งหมด)
    'health', 'lifeins', 'sso', 'pvd',                    // ประกันชีวิต/การลงทุน (4 รายการหลัก)
  ])).current;

  /* ---- รายได้รวมทั้งปี (รองรับการปรับเงินเดือน) ---- */
  // ถ้าปรับเงินเดือนตั้งแต่เดือน M: เงินเดือนเดิม × (M−1) เดือน + เงินเดือนใหม่ × (13−M) เดือน
  const monthsOld = raiseOn ? Math.max(0, raiseMonth - 1) : 12;
  const monthsNew = raiseOn ? (12 - monthsOld) : 0;
  const useNew = raiseOn && newSalary > 0;
  const salaryIncome = useNew ? (salary * monthsOld + newSalary * monthsNew) : salary * 12;
  const annual = salaryIncome + bonus + otherIncome;
  const expenseDeduction = Math.min(annual * 0.5, 100000);
  const personal = 60000;

  /* ---- helpers ---- */
  const dedState = id => ded.find(d => d.id === id) || { on: false, amount: 0 };
  const setItem = (id, patch) => setDed(prev =>
    prev.some(d => d.id === id)
      ? prev.map(d => d.id === id ? { ...d, ...patch } : d)
      : [...prev, { id, on: false, amount: 0, ...patch }]
  );

  // เพดานสูงสุดของแต่ละรายการ (รองรับเพดาน % ของรายได้)
  const capOf = (d) => {
    if (d.pct) return Math.min(d.max, Math.floor(annual * d.pct));
    return d.max;
  };

  /* ---- รวมค่าลดหย่อน (เพดานรายข้อ + เพดานรวมกลุ่มตามสรรพากร แล้วค่อยคิดเพดานเงินบริจาค) ---- */
  const optItems = DEDUCTION_ITEMS.filter(d => !d.locked && !d.pctNet);
  // หักเพดานรายข้อก่อน
  const capById = {};
  optItems.forEach(d => { const st = dedState(d.id); capById[d.id] = st.on ? Math.min(st.amount, capOf(d)) : 0; });
  const groupSum = ids => ids.reduce((s, id) => s + (capById[id] || 0), 0);
  // เพดาน "รวมกลุ่ม" ตามกฎหมาย — แม้แต่ละข้อจะไม่เกินเพดานของตัวเอง รวมกันต้องไม่เกินเพดานกลุ่ม
  const RETIRE_GROUP = ['pension', 'rmf', 'pvd', 'gpf', 'nsf']; // ประกันบำนาญ+RMF+PVD+กบข.+กอช. รวมไม่เกิน 500,000
  const INSURE_GROUP = ['lifeins', 'health'];                  // ประกันชีวิตทั่วไป+ประกันสุขภาพตนเอง รวมไม่เกิน 100,000
  const retireExcess = Math.max(0, groupSum(RETIRE_GROUP) - 500000);
  const insureExcess = Math.max(0, groupSum(INSURE_GROUP) - 100000);
  const nonDonationTotal = optItems.reduce((s, d) => s + capById[d.id], 0) - retireExcess - insureExcess;
  const customTotal = customDed.reduce((s, c) => s + (Number(c.amount) || 0), 0);

  // เพดานเงินบริจาค = 10% ของเงินได้หลังหักค่าลดหย่อนอื่น
  const netBeforeDonation = Math.max(0, annual - personal - expenseDeduction - nonDonationTotal - customTotal);
  const donationCap = Math.floor(netBeforeDonation * 0.10);
  const donationItems = DEDUCTION_ITEMS.filter(d => d.pctNet);
  const donationTotal = donationItems.reduce((s, d) => {
    const st = dedState(d.id);
    return s + (st.on ? Math.min(st.amount, donationCap) : 0);
  }, 0);

  const optionalDeductions = nonDonationTotal + customTotal + donationTotal;
  const totalDeductions = personal + expenseDeduction + optionalDeductions;
  const netTaxable = Math.max(0, annual - totalDeductions);

  const after = calcTax(netTaxable);
  const baseNet = Math.max(0, annual - personal - expenseDeduction);
  const before = calcTax(baseNet);
  const saved = before.tax - after.tax;

  const effRate = annual > 0 ? (after.tax / annual) * 100 : 0;
  const monthlyTax = after.tax / 12;
  const remaining = after.tax - withholding; // >0 = ต้องชำระเพิ่ม, <0 = ขอคืนได้
  const savedPct = before.tax > 0 ? (saved / before.tax) * 100 : 0;
  // ขั้นบันไดภาษีที่เงินได้สุทธิตกอยู่
  const bracket = (() => {
    let prev = 0;
    for (const b of TAX_BRACKETS) {
      if (netTaxable <= b.up || b.up === Infinity) return { from: prev, to: b.up, rate: b.rate };
      prev = b.up;
    }
    return { from: 0, to: Infinity, rate: 0 };
  })();
  const brkRange = bracket.to === Infinity
    ? `มากกว่า ${baht(bracket.from)}`
    : `${baht(bracket.from)} – ${baht(bracket.to)}`;

  // เพดานที่ใช้กรอกของแต่ละรายการ
  const inputCap = (d) => d.pctNet ? Math.max(donationCap, dedState(d.id).amount) : capOf(d);

  const addCustom = () => {
    const nm = newName.trim();
    if (!nm) return;
    const id = 'cust_' + Date.now();
    setCustomDed([...customDed, { id, name: nm, amount: Number(newAmt) || 0 }]);
    setNewName(''); setNewAmt(0);
  };
  const setCustom = (id, patch) => setCustomDed(customDed.map(c => c.id === id ? { ...c, ...patch } : c));
  const delCustom = (id) => setCustomDed(customDed.filter(c => c.id !== id));

  // แสดงรายการที่เป็นรายการหลัก / ถูกเพิ่ม / กำลังเปิดใช้อยู่
  const isVisible = (d) => FEATURED.has(d.id) || revealed.includes(d.id) || dedState(d.id).on;
  const reveal = (id) => {
    if (!revealed.includes(id)) setRevealed([...revealed, id]);
    setItem(id, { on: true });
  };

  // ล้างค่าที่กรอกทั้งหมดในหน้าภาษี
  const clearAll = () => {
    setSalary(0); setBonus(0); setOtherIncome(0); setWithholding(0);
    setRaiseOn(false); setRaiseMonth(7); setNewSalary(0);
    setDed(DEDUCTION_ITEMS.map(d => ({ id: d.id, on: false, amount: 0 })));
    setCustomDed([]); setRevealed([]);
    setNewName(''); setNewAmt(0);
  };

  return (
    <div className="content page-anim">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <ClearBtn
          label="ล้างค่าทั้งหมด"
          confirmMsg="ล้างข้อมูลรายได้และสิทธิลดหย่อนทั้งหมดใช่หรือไม่?"
          onClear={clearAll} />
      </div>
      <div className="grid cols-2" style={{ alignItems: 'start' }}>

        {/* LEFT: inputs */}
        <div className="grid" style={{ gap: 18 }}>

          {/* ---------- รายได้ ---------- */}
          <div className="card card-pad-lg">
            <div className="card-h"><span style={{ fontSize: 20 }}>💼</span><h3>รายได้ของคุณ</h3></div>
            <div className="grid cols-2" style={{ gap: 14 }}>
              <div className="field">
                <label>เงินเดือน (ต่อเดือน)</label>
                <MoneyInput value={salary} onChange={setSalary} />
              </div>
              <div className="field">
                <label>โบนัสต่อปี</label>
                <MoneyInput value={bonus} onChange={setBonus} />
              </div>
              <div className="field">
                <label>OT / รายได้อื่นๆ (รวมต่อปี)</label>
                <MoneyInput value={otherIncome} onChange={setOtherIncome} />
              </div>
              <div className="field">
                <label>ภาษีหัก ณ ที่จ่าย (ต่อปี)</label>
                <MoneyInput value={withholding} onChange={setWithholding} />
                <div className="row-sub">ภาษีที่บริษัทหักจากเงินเดือนไปแล้ว</div>
              </div>
            </div>

            {/* ปรับเงินเดือนระหว่างปี (ไม่บังคับ) */}
            <div className="row" style={{ borderBottom: 'none', marginTop: 10, paddingBottom: raiseOn ? 4 : 0 }}>
              <div className="row-main">
                <div className="row-title">ปรับขึ้นเงินเดือนระหว่างปี</div>
                <div className="row-sub">ไม่บังคับ — เปิดเมื่อมีการปรับเงินเดือนในปีนี้</div>
              </div>
              <button className={'tg' + (raiseOn ? ' on' : '')} onClick={() => setRaiseOn(!raiseOn)} />
            </div>

            {raiseOn && (
              <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--r)', padding: 14, marginTop: 4 }}>
                <div className="grid cols-2" style={{ gap: 14 }}>
                  <div className="field">
                    <label>ปรับตั้งแต่เดือน</label>
                    <CustomSelect
                      value={raiseMonth}
                      onChange={v => setRaiseMonth(parseInt(v, 10))}
                      options={THAI_MONTHS.map((m, i) => ({ value: i + 1, label: m }))}
                    />
                  </div>
                  <div className="field">
                    <label>เงินเดือนใหม่ (ต่อเดือน)</label>
                    <MoneyInput value={newSalary} onChange={setNewSalary} />
                  </div>
                </div>
                {useNew && (
                  <div className="row-sub" style={{ marginTop: 10, lineHeight: 1.55 }}>
                    คิดจาก <b>{baht(salary)}</b> × {monthsOld} เดือน + <b>{baht(newSalary)}</b> × {monthsNew} เดือน
                    {' = '}<b style={{ color: 'var(--coral-deep)' }}>{baht(salaryIncome)}</b> / ปี
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, padding: '14px 16px', background: 'var(--surface-2)', borderRadius: 'var(--r)' }}>
              <span className="muted" style={{ fontSize: 14 }}>เงินได้รวมทั้งปี</span>
              <span className="bignum" style={{ fontSize: 19 }}>{baht(annual)}</span>
            </div>
          </div>

          {/* ---------- รายการลดหย่อน ---------- */}
          <div className="card card-pad-lg">
            <div className="card-h"><span style={{ fontSize: 20 }}>🧾</span><h3>รายการลดหย่อนภาษี</h3>
              <span className="sub" style={{ marginLeft: 'auto' }}>เปิดสิทธิ์ที่คุณมี</span></div>
            <div className="ref-note">อ้างอิงสิทธิลดหย่อนภาษีเงินได้บุคคลธรรมดา — ปีภาษี 2569</div>
            {(retireExcess > 0 || insureExcess > 0) && (
              <div className="ref-note" style={{ background: '#FFF1E0', color: 'var(--warn)', border: '1px solid #F6D9A8', marginTop: 8 }}>
                {retireExcess > 0 && <div>⚠️ กลุ่มเกษียณ (บำนาญ + RMF + PVD + กบข. + กอช.) รวมกันเกินเพดาน — หักได้สูงสุด 500,000 (เกินมา {baht(retireExcess)})</div>}
                {insureExcess > 0 && <div>⚠️ ประกันชีวิต + ประกันสุขภาพตนเอง รวมกันเกินเพดาน — หักได้สูงสุด 100,000 (เกินมา {baht(insureExcess)})</div>}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 14px', background: 'var(--surface-2)', borderRadius: 14, marginBottom: 6, marginTop: 12 }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14.5 }}>ค่าลดหย่อนส่วนตัว + ค่าใช้จ่าย</div>
                <div className="row-sub">หักให้อัตโนมัติ</div>
              </div>
              <span className="bignum" style={{ fontSize: 15 }}>{baht(personal + expenseDeduction)}</span>
            </div>

            {DED_CATS.map(cat => {
              const items = DEDUCTION_ITEMS.filter(d => d.cat === cat && !d.locked && isVisible(d));
              if (!items.length) return null;
              return (
                <div key={cat} style={{ marginTop: 14 }}>
                  <div className="nav-group-label" style={{ padding: '0 2px 8px' }}>{cat}</div>
                  {items.map(d => {
                    const st = dedState(d.id);
                    return (
                      <div key={d.id} style={{ borderBottom: '1px solid var(--line-soft)', paddingBottom: st.on ? 12 : 0 }}>
                        <div className="row" style={{ borderBottom: 'none' }}>
                          <div className="row-main">
                            <div className="row-title">{d.name}</div>
                            <div className="row-sub">{d.sub}</div>
                          </div>
                          <button className={'tg' + (st.on ? ' on' : '')} onClick={() => setItem(d.id, { on: !st.on, amount: !st.on && st.amount === 0 ? 10000 : st.amount })} />
                        </div>
                        {st.on && (
                          <MoneyInput value={st.amount} max={inputCap(d)} onChange={v => setItem(d.id, { amount: v })} />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* ---- เพิ่มค่าลดหย่อนจากตัวเลือก (แบบ iTax) ---- */}
            <div style={{ marginTop: 16 }}>
              <button className={'add-ded-btn' + (pickOpen ? ' open' : '')} onClick={() => setPickOpen(!pickOpen)}>
                <Ic d={ICONS.plus} size={18} /> เพิ่มค่าลดหย่อน
              </button>
              {pickOpen && (() => {
                const groups = DED_CATS
                  .map(cat => ({ cat, items: DEDUCTION_ITEMS.filter(d => d.cat === cat && !d.locked && !isVisible(d)) }))
                  .filter(g => g.items.length);
                if (!groups.length) return <div className="ded-picker"><div className="row-sub" style={{ padding: '6px 2px' }}>เพิ่มครบทุกรายการแล้ว</div></div>;
                return (
                  <div className="ded-picker">
                    {groups.map(g => (
                      <div key={g.cat} className="ded-picker-grp">
                        <div className="nav-group-label" style={{ padding: '4px 2px 6px' }}>{g.cat}</div>
                        {g.items.map(d => (
                          <button key={d.id} className="ded-pick-item" onClick={() => reveal(d.id)}>
                            <div style={{ minWidth: 0 }}>
                              <div className="row-title">{d.name}</div>
                              <div className="row-sub">{d.sub}</div>
                            </div>
                            <span className="ded-pick-plus"><Ic d={ICONS.plus} size={18} /></span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* ---- เพิ่มรายการลดหย่อนเอง ---- */}
            <div style={{ marginTop: 18 }}>
              <div className="nav-group-label" style={{ padding: '0 2px 8px' }}>รายการลดหย่อนเพิ่มเติม (กรอกเอง)</div>
              {customDed.map(c => (
                <div key={c.id} className="row" style={{ borderBottom: '1px solid var(--line-soft)', gap: 10 }}>
                  <input className="input" style={{ flex: 1, padding: '11px 14px', fontSize: 15 }}
                    value={c.name} placeholder="ชื่อรายการ"
                    onChange={e => setCustom(c.id, { name: e.target.value })} />
                  <div style={{ flex: '0 0 150px' }}>
                    <MoneyInput value={c.amount} onChange={v => setCustom(c.id, { amount: v })} />
                  </div>
                  <button className="asset-del" onClick={() => delCustom(c.id)} aria-label="ลบ"><Ic d={ICONS.trash} size={18} /></button>
                </div>
              ))}
              <div className="row" style={{ borderBottom: 'none', gap: 10, marginTop: customDed.length ? 4 : 0 }}>
                <input className="input" style={{ flex: 1, padding: '11px 14px', fontSize: 15 }}
                  value={newName} placeholder="เช่น ค่าลดหย่อนอื่นๆ"
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addCustom(); }} />
                <div style={{ flex: '0 0 150px' }}>
                  <MoneyInput value={newAmt} onChange={setNewAmt} />
                </div>
                <button className="add-ded" onClick={addCustom} aria-label="เพิ่ม"><Ic d={ICONS.plus} size={18} /></button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: results (sticky) */}
        <div className="grid" style={{ gap: 18, position: 'sticky', top: 16 }}>
          <div className="card card-pad-lg" style={{ background: 'linear-gradient(150deg, #FFE6E0, #FFF6F3)', border: 'none' }}>
            <div className="card-h"><h3>ภาษีที่ต้องจ่าย</h3>
              <span className="tag" style={{ marginLeft: 'auto', background: '#fff', color: 'var(--coral-deep)' }}>ขั้นบันได {Math.round(after.marginalRate * 100)}%</span></div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="bignum" style={{ fontSize: 48, color: 'var(--coral-deep)', lineHeight: 1.05 }}>{baht(after.tax)}</span>
              <span className="row-sub" style={{ fontSize: 14 }}>/ ปี</span>
            </div>
            <div style={{ display: 'flex', gap: 22, marginTop: 14 }}>
              <div><div className="row-sub">เฉลี่ยต่อเดือน</div><div className="bignum" style={{ fontSize: 17 }}>{baht(monthlyTax)}</div></div>
              <div><div className="row-sub">อัตราภาษีที่แท้จริง</div><div className="bignum" style={{ fontSize: 17 }}>{effRate.toFixed(1)}%</div></div>
            </div>
          </div>

          {withholding > 0 && (
            <div className="card card-pad-lg">
              <div className="card-h"><h3>หักภาษี ณ ที่จ่าย</h3></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="muted">ภาษีที่ต้องจ่ายทั้งปี</span><span className="bignum">{baht(after.tax)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="muted">หัก ณ ที่จ่ายไปแล้ว</span><span className="bignum" style={{ color: 'var(--mint-deep)' }}>− {baht(withholding)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 10, borderTop: '1px dashed var(--line)', fontWeight: 600 }}>
                  <span>{remaining >= 0 ? 'ต้องชำระเพิ่ม' : 'ขอคืนภาษีได้'}</span>
                  <span className="bignum" style={{ fontSize: 22, color: remaining >= 0 ? 'var(--coral-deep)' : 'var(--mint-deep)' }}>{baht(Math.abs(remaining))}</span>
                </div>
              </div>
            </div>
          )}

          <div className="card card-pad-lg" style={{ background: 'linear-gradient(150deg, #DDF1D0, #F2F9EC)', border: 'none' }}>
            <div className="card-h" style={{ marginBottom: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: '#fff', display: 'grid', placeContent: 'center', color: 'var(--mint-deep)' }}><Ic d={ICONS.target} size={20} /></div>
              <h3>สิทธิลดหย่อนของคุณ</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div className="row-sub">ลดหย่อนได้รวมต่อปี</div>
                <div className="bignum" style={{ fontSize: 28, color: 'var(--mint-deep)', lineHeight: 1.1 }}>{baht(personal + optionalDeductions)}</div>
              </div>
              <div style={{ borderLeft: '1px solid #ffffff', paddingLeft: 16 }}>
                <div className="row-sub">การลดหย่อนช่วยให้คุณประหยัดได้</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <span className="bignum" style={{ fontSize: 28, color: 'var(--mint-deep)', lineHeight: 1.1 }}>{baht(saved)}</span>
                  {saved > 0.5 && <span className="tag" style={{ background: '#fff', color: 'var(--mint-deep)' }}>ลดลง {savedPct.toFixed(1)}%</span>}
                </div>
              </div>
            </div>
          </div>

          {/* ---------- สรุปรวม (ย้ายมาไว้ใต้สิทธิลดหย่อน) ---------- */}
          <div className="card card-pad-lg">
            <div className="card-h"><span style={{ fontSize: 20 }}>📋</span><h3>สรุปรวม</h3></div>
            <SummaryRow label="รายได้ต่อปี" value={baht(annual)} />
            <SummaryRow label="ค่าใช้จ่ายต่อปี" note="หักได้ 50% ของรายได้ สูงสุด 100,000 (ตามที่สรรพากรกำหนด)" value={baht(expenseDeduction)} color="var(--mint-deep)" />
            <SummaryRow label="ลดหย่อนรวมต่อปี" note="ค่าลดหย่อนส่วนตัว + สิทธิที่เลือก" value={baht(personal + optionalDeductions)} color="var(--mint-deep)" />
            <div style={{ marginTop: 4 }}>
              <SummaryRow label="เงินได้สุทธิ (ฐานภาษี)" value={baht(netTaxable)} strong />
            </div>
            <SummaryRow label="ขั้นภาษีที่ต้องเสีย" note={'เงินได้สุทธิช่วง ' + brkRange} value={Math.round(bracket.rate * 100) + '%'} color="var(--coral-deep)" onInfo={() => setBrkOpen(true)} />
          </div>

          <div className="card card-pad-lg">
            <div className="card-h"><h3>เปรียบเทียบก่อน-หลังลดหย่อน</h3></div>
            <CompareBars rows={[
              { label: 'ก่อนใช้สิทธิ์ลดหย่อน', value: before.tax, color: 'var(--peach-deep)' },
              { label: 'หลังใช้สิทธิ์ลดหย่อน', value: after.tax, color: 'var(--mint-deep)' },
            ]} />
            <hr className="divider" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="muted">เงินได้ทั้งปี</span><span className="bignum">{baht(annual)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="muted">หักค่าลดหย่อนรวม</span><span className="bignum" style={{ color: 'var(--mint-deep)' }}>− {baht(totalDeductions)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 9, borderTop: '1px dashed var(--line)', fontWeight: 600 }}><span>เงินได้สุทธิ (ฐานภาษี)</span><span className="bignum">{baht(netTaxable)}</span></div>
            </div>
          </div>
        </div>

      </div>

      {brkOpen && <TaxBracketModal netTaxable={netTaxable} salary={salary} onClose={() => setBrkOpen(false)} />}
    </div>
  );
}

Object.assign(window, { TaxPage });
