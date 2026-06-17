import React from 'react';
import '../../shared/globals.js';
const { fmt, baht, fmtK, useStored, ClearBtn, calcTax, taxBreakdown, TAX_BRACKETS, DEDUCTION_ITEMS, DED_CATS, THAI_MONTHS, EXPENSE_CATS, catById, INCOME_CATS, incomeCat, INITIAL_TX, CAT_COLORS, PLAN_SEED, MONTH_LABELS, MONTHLY_HISTORY, retirementPlan, Ic, ICONS, pvdPlan, niceStep, MoneyInput, CustomSelect, Donut, GroupedBars, AreaChart, LineChart, Ring, CompareBars, ConfirmHost, useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider, TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton, ProfileMenu, SettingsModal, Avatar, PROFILE_DEFAULT, GoogleMark, isGoogle, ProfileTab, SecurityTab, AccountTab, NAV, PAGE_META, Sidebar, Topbar, MobileTop, MobileNav, BrandMark } = window;
/* ============================================================
   pages_retire.jsx — คำนวณกองทุนสำรองเลี้ยงชีพ (PVD)
   ============================================================ */

/* สีกราฟ: เขียว = การเติบโต/กำไร, น้ำเงิน = เงินที่ส่ง/ตราสารหนี้ */
const COL_GROW = 'var(--mint-deep)';   /* #7FB46A */
const COL_PUT  = '#5E86C9';            /* น้ำเงินนุ่ม เข้ากับโทนพาสเทล */

const RATE_OPTS = [2, 3, 4, 5, 10, 15];

/* จานสีพาสเทลสำหรับประเภทการลงทุน (โทนเดียวกับธีม) */
const ASSET_COLORS = ['#5E86C9', '#7FB46A', '#E59A82', '#B6BE63', '#C99BC7', '#6FB6C9', '#D98C8C', '#9CA8E0'];
const nextColor = (assets) => ASSET_COLORS.find(c => !assets.some(a => a.color === c)) || ASSET_COLORS[assets.length % ASSET_COLORS.length];

/* แกน Y เป็นเงิน: ฿0K / ฿500K / ฿1.0M */
const axisMoney = (v) => v >= 1e6
  ? '฿' + (v / 1e6).toFixed(1) + 'M'
  : '฿' + Math.round(v / 1e3) + 'K';

function SliderField({ label, value, onChange, min, max, step = 1, suffix, dot }) {
  const dec = Number.isInteger(step) ? 0 : 1;
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const commit = () => {
    setEditing(false);
    let n = parseFloat(draft);
    if (isNaN(n)) return;
    onChange(Math.min(max, Math.max(min, n)));
  };
  return (
    <div className="field" style={{ gap: 9 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
        <label style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          {dot && <span style={{ width: 10, height: 10, borderRadius: 3, background: dot, flex: '0 0 auto' }} />}
          {label}
        </label>
        <span className="num-edit" title="คลิกเพื่อกรอกตัวเลข">
          <input className="num-edit-in" type="text" inputMode="decimal"
            value={editing ? draft : fmt(value, dec)}
            onFocus={e => { setEditing(true); setDraft(String(value)); e.target.select(); }}
            onChange={e => setDraft(e.target.value.replace(/[^\d.]/g, ''))}
            onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }} />
          <span className="num-edit-suffix">{suffix}</span>
        </span>
      </div>
      <input className="rng" type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
    </div>
  );
}

/* ปุ่มเลือก % สมทบ */
function RatePicker({ label, value, onChange }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="rate-row">
        {RATE_OPTS.map(o => (
          <button key={o} className={'rate-pill' + (value === o ? ' on' : '')} onClick={() => onChange(o)}>{o}%</button>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color, accentBg }) {
  return (
    <div className="card" style={{ padding: '18px 20px', minWidth: 0, background: accentBg || 'var(--surface)' }}>
      <div className="stat-label" style={{ marginBottom: 8 }}>{label}</div>
      <div className="bignum" style={{ fontSize: 27, color: color || 'var(--ink)', lineHeight: 1.05 }}>{value}</div>
      {sub && <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

/* แถวประเภทการลงทุน: ชื่อ (แก้ได้) + สัดส่วน % + ปุ่มลบ */
function AssetRow({ asset, canRemove, onName, onPct, onRemove }) {
  return (
    <div className="asset-row">
      <span className="dot" style={{ background: asset.color, flex: '0 0 auto' }} />
      <input className="asset-name" type="text" value={asset.name} placeholder="ชื่อประเภท"
        onChange={e => onName(e.target.value)} />
      <div className="input-wrap asset-pct">
        <input className="input has-suffix" type="text" inputMode="numeric" value={asset.pct}
          onChange={e => onPct(Math.max(0, Math.min(100, parseInt(e.target.value.replace(/[^\d]/g, ''), 10) || 0)))} />
        <span className="input-suffix">%</span>
      </div>
      <button className="asset-del" disabled={!canRemove} onClick={onRemove} title="ลบประเภท" aria-label="ลบประเภท">×</button>
    </div>
  );
}

function RetirePage() {
  const [s, setS] = useStored('pvd.v3', {
    currentAge: 27, retireAge: 60, salary: 0, startBalance: 0,
    empRate: 3, companyRate: 3, salaryGrowth: 3,
    assets: [
      { id: 'a1', name: 'ตราสารหนี้', pct: 90, ret: 2.5, color: '#5E86C9' },
      { id: 'a2', name: 'ตราสารทุน', pct: 10, ret: 7, color: '#7FB46A' },
    ],
    desiredExpense: 0, drawYears: 20,
  });
  const set = (k, v) => setS({ ...s, [k]: v });
  const DEFAULT_ASSETS = [
    { id: 'a1', name: 'ตราสารหนี้', pct: 90, ret: 2.5, color: '#5E86C9' },
    { id: 'a2', name: 'ตราสารทุน', pct: 10, ret: 7, color: '#7FB46A' },
  ];
  // ล้างค่าที่กรอกทั้งหมด
  const clearAll = () => setS({
    currentAge: 27, retireAge: 60, salary: 0, startBalance: 0,
    empRate: 3, companyRate: 3, salaryGrowth: 3,
    assets: DEFAULT_ASSETS.map(a => ({ ...a })),
    desiredExpense: 0, drawYears: 20,
  });

  /* --- จัดการประเภทการลงทุน --- */
  const setAsset = (id, patch) => setS({ ...s, assets: s.assets.map(a => a.id === id ? { ...a, ...patch } : a) });
  const addAsset = () => setS({
    ...s,
    assets: [...s.assets, { id: 'a' + Date.now(), name: 'ประเภทใหม่', pct: 0, ret: 5, color: nextColor(s.assets) }],
  });
  const removeAsset = (id) => { if (s.assets.length <= 1) return; setS({ ...s, assets: s.assets.filter(a => a.id !== id) }); };

  const totalPct = s.assets.reduce((t, a) => t + (a.pct || 0), 0);
  const allocOk = totalPct === 100;

  const plan = pvdPlan(s);
  const gainPct = plan.contributed > 0 ? Math.round(plan.gain / plan.contributed * 100) : 0;
  const hasGoal = s.desiredExpense > 0;
  const enough = plan.monthlyDraw >= s.desiredExpense;
  const diff = Math.abs(plan.monthlyDraw - s.desiredExpense);

  /* เป้าหมายหลังเกษียณ: ต้องมีเงินก้อนเท่าไหร่ / ขาดอีกกี่บาท / ต้องออมเพิ่มเดือนละเท่าไหร่ */
  const mr = Math.pow(1 + plan.blended, 1 / 12) - 1;
  const dMonths = Math.max(1, s.drawYears * 12);
  const requiredNest = Math.abs(mr) < 1e-9
    ? s.desiredExpense * dMonths
    : s.desiredExpense * (1 - Math.pow(1 + mr, -dMonths)) / mr;
  const shortLump = Math.max(0, requiredNest - plan.finalBal);
  const surplusLump = Math.max(0, plan.finalBal - requiredNest);
  const saveMonths = Math.max(1, plan.years * 12);
  const extraMonthly = shortLump <= 0 ? 0 : (Math.abs(mr) < 1e-9
    ? shortLump / saveMonths
    : shortLump * mr / (Math.pow(1 + mr, saveMonths) - 1));

  const balSeries = plan.series.map(p => ({ x: p.age, y: p.balance }));
  const putSeries = plan.series.map(p => ({ x: p.age, y: p.contributed }));

  return (
    <div className="content page-anim">

      {/* ---------- warning (บนสุด) ---------- */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="risk-warning" style={{ flex: 1, marginBottom: 0 }}>
          <span className="risk-ic">⚠️</span>
          <span>ผลตอบแทนเป็นประมาณการ ไม่รับประกันผลในอนาคต การลงทุนมีความเสี่ยง</span>
        </div>
        <ClearBtn
          label="ล้างค่าทั้งหมด"
          confirmMsg="ล้างค่าที่กรอกในหน้านี้ใช่หรือไม่?"
          onClear={clearAll} />
      </div>

      {/* ---------- inputs ---------- */}
      <div className="grid cols-2" style={{ alignItems: 'start', marginTop: 18 }}>

        {/* personal + assumptions */}
        <div className="card card-pad-lg">
          <div className="card-h"><span style={{ fontSize: 20 }}>👤</span><h3>ข้อมูลส่วนตัว</h3></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="grid cols-2" style={{ gap: 14 }}>
              <div className="field">
                <label>อายุปัจจุบัน</label>
                <MoneyInput value={s.currentAge} suffix="ปี" onChange={v => set('currentAge', Math.min(Math.max(v, 18), s.retireAge - 1))} />
              </div>
              <div className="field">
                <label>เงินเดือนปัจจุบัน</label>
                <MoneyInput value={s.salary} suffix="บาท" onChange={v => set('salary', v)} />
              </div>
            </div>
            <div className="field">
              <label>ยอดสะสมตั้งต้น (เงินในกองทุนตอนนี้)</label>
              <MoneyInput value={s.startBalance} onChange={v => set('startBalance', v)} />
            </div>
            <RatePicker label="% ส่วนของตัวเอง : หักสมทบ" value={s.empRate} onChange={v => set('empRate', v)} />
            <RatePicker label="% ส่วนของบริษัท : บริษัทสมทบ" value={s.companyRate} onChange={v => set('companyRate', v)} />

            <div className="pvd-note">
              ส่งรวม/เดือน: <b>{baht(plan.monthlyContrib)}</b>
              <span className="pvd-note-sep">·</span>
              ตัวเอง {baht(plan.empMonthly)} + บริษัท {baht(plan.companyMonthly)}
            </div>

            {/* สมมติฐานผลตอบแทน — รวมในกล่องเดียวกับข้อมูลส่วนตัว */}
            <hr className="divider" style={{ margin: '4px 0' }} />
            <div className="card-h" style={{ marginBottom: 0 }}><span style={{ fontSize: 20 }}>⚙️</span><h3>สมมติฐานผลตอบแทน</h3></div>
            <SliderField label="อายุเกษียณ" value={s.retireAge} min={0} max={100} suffix="ปี" onChange={v => set('retireAge', Math.max(v, s.currentAge + 1))} />
            <SliderField label="เงินเดือนขึ้น/ปี" value={s.salaryGrowth} min={0} max={100} step={0.5} suffix="%" onChange={v => set('salaryGrowth', v)} />
            <hr className="divider" style={{ margin: '2px 0' }} />
            <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', fontWeight: 600, letterSpacing: '.02em' }}>ผลตอบแทนคาดหวังต่อปี · ต่อประเภท</div>
            {s.assets.map(a => (
              <SliderField key={a.id} label={a.name + ' ผลตอบแทน'} value={a.ret} min={0} max={100} step={0.5} suffix="%" dot={a.color}
                onChange={v => setAsset(a.id, { ret: v })} />
            ))}
            <div className="pvd-note">
              Blended rate: <b>{fmt(plan.blended * 100, 2)}%/ปี</b>
              <span className="pvd-note-sep">·</span>
              ระยะเวลาออม: <b>{plan.years} ปี</b>
            </div>
          </div>
        </div>

        {/* allocation + summary */}
        <div className="grid" style={{ gap: 18 }}>
          <div className="card card-pad-lg">
            <div className="card-h" style={{ flexWrap: 'wrap' }}>
              <span style={{ fontSize: 20 }}>📊</span><h3>สัดส่วนการลงทุน</h3>
              <span className="sub">รวมต้องเท่ากับ 100% พอดี</span>
            </div>
            <div className="asset-list">
              {s.assets.map(a => (
                <AssetRow key={a.id} asset={a} canRemove={s.assets.length > 1}
                  onName={v => setAsset(a.id, { name: v })}
                  onPct={v => setAsset(a.id, { pct: v })}
                  onRemove={() => removeAsset(a.id)} />
              ))}
            </div>
            <button className="btn btn-ghost btn-sm asset-add" onClick={addAsset}>+ เพิ่มประเภทการลงทุน</button>
            <div className="alloc-bar" style={{ marginTop: 16 }}>
              {s.assets.map(a => a.pct > 0 && (
                <div key={a.id} style={{ width: a.pct + '%', background: a.color }}>{a.pct >= 10 ? a.pct + '%' : ''}</div>
              ))}
            </div>
            <div className={'alloc-total' + (allocOk ? ' ok' : ' bad')}>
              {allocOk
                ? <span>✓ รวม 100% พอดี</span>
                : <span>รวม {totalPct}% — ต้องเท่ากับ 100% พอดี ({totalPct > 100 ? 'เกิน ' + (totalPct - 100) : 'ขาด ' + (100 - totalPct)}%)</span>}
            </div>
          </div>

          {/* สรุปข้อมูลสำคัญ */}
          <div className="card card-pad-lg">
            <div className="card-h"><span style={{ fontSize: 20 }}>📌</span><h3>สรุปข้อมูลสำคัญ</h3></div>
            <div className="summary-list">
              <div className="summary-row"><span>อายุเริ่มออม</span><b>{fmt(s.currentAge, 0)} <i>ปี</i></b></div>
              <div className="summary-row"><span>อายุเกษียณ</span><b>{fmt(s.retireAge, 0)} <i>ปี</i></b></div>
              <div className="summary-row"><span>ระยะเวลาออม</span><b>{fmt(plan.years, 0)} <i>ปี</i></b></div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- post-retirement goal (เหนือผลลัพธ์ · ไม่บังคับ) ---------- */}
      <div className="card card-pad-lg" style={{ marginTop: 18 }}>
        <div className="card-h" style={{ flexWrap: 'wrap' }}>
          <span style={{ fontSize: 20 }}>🌴</span><h3>วางแผนหลังเกษียณ</h3>
          <span className="sub">ไม่บังคับ — กรอกเพื่อดูว่าต้องเตรียมเงินก้อนเท่าไหร่ และต้องออมเพิ่มเดือนละกี่บาท</span>
        </div>
        <div className="goal-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="field">
              <label>ค่าใช้จ่ายที่อยากมีต่อเดือน (หลังเกษียณ) · ไม่บังคับ</label>
              <MoneyInput value={s.desiredExpense} onChange={v => set('desiredExpense', v)} />
            </div>
            <SliderField label="อยากใช้เงินก้อนนี้ได้นาน" value={s.drawYears} min={0} max={50} suffix="ปี" onChange={v => set('drawYears', v)} />
          </div>

          {hasGoal ? (
            <div className="verdict" style={{ background: enough ? '#EAF6E0' : '#FFEAE6' }}>
              <div className="goal-row"><span>ต้องมีเงินก้อน ณ วันเกษียณ</span><b>{baht(requiredNest)}</b></div>
              <div className="goal-row"><span>คาดว่าจะมีจากกองทุน</span><b>{baht(plan.finalBal)}</b></div>
              <hr className="divider" style={{ margin: '11px 0' }} />
              {enough ? (
                <div>
                  <div style={{ color: 'var(--mint-deep)', fontWeight: 700, fontSize: 16 }}>🎉 เพียงพอ! เกินเป้าอีก {baht(surplusLump)}</div>
                  <div style={{ color: 'var(--ink-soft)', fontSize: 13, marginTop: 4 }}>ใช้ได้จริงเดือนละ {baht(plan.monthlyDraw)} · มากกว่าเป้า {baht(diff)}/เดือน</div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <div className="goal-gap-box">
                    <div className="goal-gap-label">ยังขาดอีกรวม</div>
                    <div className="bignum" style={{ fontSize: 23, color: 'var(--coral-deep)' }}>{baht(shortLump)}</div>
                  </div>
                  <div className="goal-gap-box">
                    <div className="goal-gap-label">ต้องออมเพิ่มเดือนละ</div>
                    <div className="bignum" style={{ fontSize: 23, color: 'var(--coral-deep)' }}>{baht(extraMonthly)}</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="verdict" style={{ background: 'var(--surface-2)', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
              <div style={{ color: 'var(--ink-soft)', fontSize: 13.5, lineHeight: 1.6 }}>
                กรอก “ค่าใช้จ่ายที่อยากมีต่อเดือน” เพื่อคำนวณว่าต้องเตรียมเงินก้อนเท่าไหร่<br />และต้องออมเพิ่มเดือนละกี่บาท
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---------- results ---------- */}
      <h2 className="pvd-section-h">ผลลัพธ์</h2>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <StatCard label="ยอดเงินหลังเกษียณ" value={baht(plan.finalBal)} sub={'อายุ ' + s.retireAge + ' ปี'} color={COL_GROW} accentBg="var(--surface-2)" />
        <StatCard label="เงินที่ส่งทั้งหมด" value={baht(plan.contributed)} sub="ตัวเอง + บริษัทสมทบ" color={COL_PUT} />
        <StatCard label="กำไรจากกองทุน" value={baht(plan.gain)} sub={'+' + gainPct + '% จากที่ส่งไป'} color={COL_GROW} />
        <StatCard label={'ใช้ได้/เดือน (' + s.drawYears + ' ปี)'} value={baht(plan.monthlyDraw)} sub={'หลังเกษียณถึงอายุ ' + (s.retireAge + s.drawYears)} color="var(--ink)" />
      </div>

      {/* ---------- donut ---------- */}
      <div className="card card-pad-lg" style={{ marginTop: 18 }}>
        <div className="card-h"><h3>สัดส่วนเงินส่ง VS กำไร</h3></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 26, flexWrap: 'wrap' }}>
          <Donut size={186} thick={28}
            data={[{ value: plan.contributed, color: COL_PUT }, { value: plan.gain, color: COL_GROW }]}
            centerTop="กำไร" centerMain={gainPct + '%'} centerSub="ของยอดรวม" />
          <div style={{ flex: 1, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="legend-row">
              <span className="dot" style={{ background: COL_PUT }} />
              <div style={{ flex: 1 }}><div className="row-sub">เงินที่ส่ง</div></div>
              <span className="bignum" style={{ fontSize: 16 }}>{baht(plan.contributed)}</span>
            </div>
            <div className="legend-row">
              <span className="dot" style={{ background: COL_GROW }} />
              <div style={{ flex: 1 }}><div className="row-sub">กำไรจากกองทุน</div></div>
              <span className="bignum" style={{ fontSize: 16, color: COL_GROW }}>{baht(plan.gain)}</span>
            </div>
            <hr className="divider" style={{ margin: '2px 0' }} />
            <div className="legend-row">
              <div style={{ flex: 1 }}><div className="row-sub" style={{ fontWeight: 600, color: 'var(--ink)' }}>ยอดรวมหลังเกษียณ</div></div>
              <span className="bignum" style={{ fontSize: 18 }}>{baht(plan.finalBal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- growth chart (ล่างสุด) ---------- */}
      <div className="card card-pad-lg" style={{ marginTop: 18 }}>
        <div className="card-h" style={{ flexWrap: 'wrap', gap: 14 }}>
          <h3>การเติบโตของกองทุน</h3>
          <div className="chart-legend">
            <span><span className="lg-line" style={{ background: COL_GROW }} />ยอดสะสมรวม</span>
            <span><span className="lg-line dash" style={{ backgroundImage: `repeating-linear-gradient(90deg, ${COL_PUT} 0 5px, transparent 5px 9px)` }} />เงินที่ส่งรวม</span>
          </div>
        </div>
        <LineChart
          series={[
            { points: balSeries, color: COL_GROW, fill: COL_GROW },
            { points: putSeries, color: COL_PUT, dash: true },
          ]}
          height={340}
          xFmt={x => x + ' ปี'}
          yFmt={axisMoney}
        />
      </div>

    </div>
  );
}

Object.assign(window, { RetirePage, SliderField });
