import React from 'react';
/* ============================================================
   data.jsx — helpers, mock data, สูตรคำนวณ, ไอคอน
   ============================================================ */

/* ---------- format ---------- */
const fmt = (n, d = 0) =>
  (Number(n) || 0).toLocaleString('th-TH', { minimumFractionDigits: d, maximumFractionDigits: d });
const baht = (n, d = 0) => '฿' + fmt(n, d);
const fmtK = (n) => {
  n = Number(n) || 0;
  if (Math.abs(n) >= 1e6) return (n / 1e6).toLocaleString('th-TH', { maximumFractionDigits: 1 }) + ' ล้าน';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toLocaleString('th-TH', { maximumFractionDigits: 0 }) + 'K';
  return fmt(n);
};

/* ---------- persisted state hook ---------- */
function useStored(key, initial) {
  const K = 'finplan:' + key;
  const [v, setV] = React.useState(() => {
    try { const s = localStorage.getItem(K); return s ? JSON.parse(s) : initial; }
    catch (e) { return initial; }
  });
  React.useEffect(() => {
    try { localStorage.setItem(K, JSON.stringify(v)); } catch (e) {}
  }, [v]);
  return [v, setV];
}

/* ============================================================
   ภาษีเงินได้บุคคลธรรมดา (ขั้นบันได ปีภาษี 2569)
   ============================================================ */
const TAX_BRACKETS = [
  { up: 150000,  rate: 0    },
  { up: 300000,  rate: 0.05 },
  { up: 500000,  rate: 0.10 },
  { up: 750000,  rate: 0.15 },
  { up: 1000000, rate: 0.20 },
  { up: 2000000, rate: 0.25 },
  { up: 5000000, rate: 0.30 },
  { up: Infinity,rate: 0.35 },
];

function calcTax(netIncome) {
  let tax = 0, prev = 0, lastFilled = 0;
  for (const b of TAX_BRACKETS) {
    if (netIncome > prev) {
      const slice = Math.min(netIncome, b.up) - prev;
      tax += slice * b.rate;
      if (netIncome > prev) lastFilled = b.rate;
    }
    prev = b.up;
    if (netIncome <= b.up) break;
  }
  return { tax: Math.max(0, tax), marginalRate: lastFilled };
}

/* breakdown per bracket for visualization */
function taxBreakdown(netIncome) {
  const out = []; let prev = 0;
  for (const b of TAX_BRACKETS) {
    const top = b.up === Infinity ? Math.max(netIncome, prev) : b.up;
    const slice = Math.max(0, Math.min(netIncome, b.up) - prev);
    out.push({ from: prev, to: b.up, rate: b.rate, taxable: slice, tax: slice * b.rate });
    prev = b.up;
    if (netIncome <= b.up) break;
  }
  return out;
}

/* ---------- เดือน (ใช้กับการปรับเงินเดือนระหว่างปี) ---------- */
const THAI_MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

/* ---------- รายการลดหย่อนภาษี — อ้างอิงสิทธิปีภาษี 2569 ----------
   pct    = เพดานคิดเป็น % ของเงินได้ทั้งปี (เลือกค่าที่น้อยกว่าระหว่าง pct×เงินได้ กับ max)
   pctNet = เพดานคิดเป็น % ของเงินได้หลังหักค่าลดหย่อน (กลุ่มเงินบริจาค)
   หมวด (cat): ส่วนตัว/ครอบครัว · ประกันชีวิต/การลงทุน · กระตุ้นเศรษฐกิจ · เงินบริจาค  */
const DED_CATS = ['ส่วนตัว/ครอบครัว', 'ประกันชีวิต/การลงทุน', 'กระตุ้นเศรษฐกิจ', 'เงินบริจาค'];
const DEDUCTION_ITEMS = [
  /* ---- กลุ่มลดหย่อนส่วนตัว / ครอบครัว ---- */
  { id: 'personal', name: 'ค่าลดหย่อนส่วนตัว', sub: 'อัตโนมัติ 60,000', amount: 60000, locked: true, cat: 'ส่วนตัว/ครอบครัว', max: 60000 },
  { id: 'spouse', name: 'คู่สมรส', sub: 'คู่สมรสไม่มีเงินได้ 60,000', amount: 0, on: false, cat: 'ส่วนตัว/ครอบครัว', max: 60000 },
  { id: 'child', name: 'บุตร', sub: 'คนละ 30,000 (คนที่ 2 เป็นต้นไป เพิ่มเป็น 60,000)', amount: 0, on: false, cat: 'ส่วนตัว/ครอบครัว', max: 300000 },
  { id: 'newborn', name: 'ค่าคลอดบุตร', sub: 'คนละ 60,000', amount: 0, on: false, cat: 'ส่วนตัว/ครอบครัว', max: 60000 },
  { id: 'parent', name: 'ค่าเลี้ยงดูบิดามารดา', sub: 'คนละ 30,000', amount: 0, on: false, cat: 'ส่วนตัว/ครอบครัว', max: 120000 },
  { id: 'disabled', name: 'ค่าเลี้ยงดูผู้พิการ / ทุพพลภาพ', sub: 'คนละ 60,000', amount: 0, on: false, cat: 'ส่วนตัว/ครอบครัว', max: 240000 },

  /* ---- กลุ่มประกันชีวิต และการลงทุน ---- */
  { id: 'lifeins', name: 'ประกันชีวิตทั่วไป / สะสมทรัพย์', sub: 'สูงสุด 100,000', amount: 0, on: false, cat: 'ประกันชีวิต/การลงทุน', max: 100000 },
  { id: 'health', name: 'ประกันสุขภาพตัวเอง', sub: 'สูงสุด 25,000 · รวมประกันชีวิตไม่เกิน 100,000', amount: 0, on: false, cat: 'ประกันชีวิต/การลงทุน', max: 25000 },
  { id: 'parentHealth', name: 'ประกันสุขภาพบิดามารดา', sub: 'สูงสุด 15,000 · พ่อแม่รายได้ไม่เกิน 30,000/ปี', amount: 0, on: false, cat: 'ประกันชีวิต/การลงทุน', max: 15000 },
  { id: 'sso', name: 'ประกันสังคม', sub: 'สูงสุด 10,500', amount: 0, on: false, cat: 'ประกันชีวิต/การลงทุน', max: 10500 },
  { id: 'pension', name: 'ประกันชีวิตแบบบำนาญ', sub: '15% ของรายได้ ไม่เกิน 200,000', amount: 0, on: false, cat: 'ประกันชีวิต/การลงทุน', max: 200000, pct: 0.15 },
  { id: 'rmf', name: 'กองทุน RMF', sub: '30% ของรายได้ ไม่เกิน 500,000', amount: 0, on: false, cat: 'ประกันชีวิต/การลงทุน', max: 500000, pct: 0.30 },
  { id: 'pvd', name: 'กองทุนสำรองเลี้ยงชีพ (PVD)', sub: '15% ของรายได้ ไม่เกิน 500,000', amount: 0, on: false, cat: 'ประกันชีวิต/การลงทุน', max: 500000, pct: 0.15 },
  { id: 'gpf', name: 'กบข. / กองทุนสงเคราะห์ครู รร.เอกชน', sub: 'ตามจ่ายจริง ไม่เกิน 500,000', amount: 0, on: false, cat: 'ประกันชีวิต/การลงทุน', max: 500000 },
  { id: 'nsf', name: 'กองทุนการออมแห่งชาติ (กอช.)', sub: 'สูงสุด 30,000', amount: 0, on: false, cat: 'ประกันชีวิต/การลงทุน', max: 30000 },
  { id: 'tesg', name: 'กองทุน Thai ESG', sub: '30% ของรายได้ ไม่เกิน 300,000', amount: 0, on: false, cat: 'ประกันชีวิต/การลงทุน', max: 300000, pct: 0.30 },
  { id: 'tesgx', name: 'กองทุน Thai ESGX (ลงทุนใหม่)', sub: '30% ของรายได้ ไม่เกิน 300,000', amount: 0, on: false, cat: 'ประกันชีวิต/การลงทุน', max: 300000, pct: 0.30 },
  { id: 'tesgxltf', name: 'กองทุน Thai ESGX (โยกจาก LTF)', sub: 'ไม่เกิน 300,000', amount: 0, on: false, cat: 'ประกันชีวิต/การลงทุน', max: 300000 },

  /* ---- กลุ่มกระตุ้นเศรษฐกิจ ---- */
  { id: 'homeloan', name: 'ดอกเบี้ยบ้าน', sub: 'สูงสุด 100,000', amount: 0, on: false, cat: 'กระตุ้นเศรษฐกิจ', max: 100000 },
  { id: 'easysave', name: 'Easy E-Receipt', sub: 'สูงสุด 50,000', amount: 0, on: false, cat: 'กระตุ้นเศรษฐกิจ', max: 50000 },
  { id: 'newhome', name: 'สร้างบ้านใหม่', sub: '10,000 ต่อค่าก่อสร้าง 1 ล้าน · สูงสุด 100,000', amount: 0, on: false, cat: 'กระตุ้นเศรษฐกิจ', max: 100000 },
  { id: 'travel', name: 'เที่ยวดี มีคืน', sub: 'สูงสุด 30,000', amount: 0, on: false, cat: 'กระตุ้นเศรษฐกิจ', max: 30000 },

  /* ---- กลุ่มเงินบริจาค ---- */
  { id: 'donateParty', name: 'เงินบริจาคพรรคการเมือง', sub: 'สูงสุด 10,000', amount: 0, on: false, cat: 'เงินบริจาค', max: 10000 },
  { id: 'donateEdu', name: 'การศึกษา / กีฬา / พัฒนาสังคม / รพ.รัฐ', sub: '2 เท่าของที่จ่าย ไม่เกิน 10% ของเงินได้หลังหักลดหย่อน', amount: 0, on: false, cat: 'เงินบริจาค', max: 5000000, pctNet: 0.10, factor: 2 },
  { id: 'donate', name: 'เงินบริจาคทั่วไป', sub: 'ตามจ่ายจริง ไม่เกิน 10% ของเงินได้หลังหักลดหย่อน', amount: 0, on: false, cat: 'เงินบริจาค', max: 5000000, pctNet: 0.10 },
];

/* ============================================================
   รายรับ-รายจ่าย (mock)
   ============================================================ */
const EXPENSE_CATS = [
  { id: 'food',     name: 'อาหาร',        color: '#FF8787', icon: '🍜' },
  { id: 'home',     name: 'ที่อยู่อาศัย',   color: '#F8C4B4', icon: '🏠' },
  { id: 'transit',  name: 'เดินทาง',       color: '#BCE29E', icon: '🚗' },
  { id: 'shopping', name: 'ช้อปปิ้ง',       color: '#E5EBB2', icon: '🛍️' },
  { id: 'fun',      name: 'บันเทิง',        color: '#F2A0C0', icon: '🎬' },
  { id: 'health',   name: 'สุขภาพ',         color: '#9BD4D0', icon: '💊' },
  { id: 'bill',     name: 'ค่าบิล',         color: '#C9B6E4', icon: '💡' },
  { id: 'save',     name: 'เงินออม/ลงทุน',  color: '#9BD4D0', icon: '🐖' },
  { id: 'other',    name: 'อื่นๆ',          color: '#D9C3B0', icon: '📦' },
];
const catById = (id) => EXPENSE_CATS.find(c => c.id === id) || EXPENSE_CATS[EXPENSE_CATS.length - 1];

/* สีสำหรับประเภทค่าใช้จ่ายที่ผู้ใช้เพิ่มเอง */
const CAT_COLORS = ['#FF8787', '#F8C4B4', '#E5EBB2', '#BCE29E', '#F2A0C0', '#9BD4D0', '#C9B6E4', '#F4B860', '#86C5A8', '#E59A82'];

/* ค่าตั้งต้นของแผนการเงินรายเดือน (วางแผนต้นเดือน) */
const PLAN_SEED = {
  income: [
    { id: 'pi1', name: 'เงินเดือน', cat: 'salary', amount: 45000 },
    { id: 'pi2', name: 'รายได้เสริม / ฟรีแลนซ์', cat: 'side', amount: 8000 },
  ],
  expense: [
    { id: 'pe1', name: 'ค่าเช่า / ผ่อนบ้าน', cat: 'home', amount: 9500 },
    { id: 'pe2', name: 'ค่าอาหาร', cat: 'food', amount: 8000 },
    { id: 'pe3', name: 'ค่าเดินทาง', cat: 'transit', amount: 2500 },
    { id: 'pe4', name: 'ค่าน้ำ-ไฟ-เน็ต-มือถือ', cat: 'bill', amount: 2300 },
    { id: 'pe5', name: 'ช้อปปิ้ง / ของใช้', cat: 'shopping', amount: 3000 },
    { id: 'pe6', name: 'เงินออม + ลงทุน', cat: 'save', amount: 6000 },
  ],
  customCats: [],
};

const INITIAL_TX = [
  { id: 't1', type: 'in',  cat: 'salary', name: 'เงินเดือน',          amount: 45000, date: '2026-06-01' },
  { id: 't2', type: 'out', cat: 'home',   name: 'ค่าเช่าหอพัก',        amount: 9500,  date: '2026-06-01' },
  { id: 't3', type: 'out', cat: 'food',   name: 'ซื้อของเข้าบ้าน',      amount: 3200,  date: '2026-06-02' },
  { id: 't4', type: 'out', cat: 'transit',name: 'เติมน้ำมัน',          amount: 1200,  date: '2026-06-03' },
  { id: 't5', type: 'out', cat: 'bill',   name: 'ค่าไฟ + ค่าน้ำ',       amount: 1450,  date: '2026-06-05' },
  { id: 't6', type: 'in',  cat: 'side',   name: 'รับงานฟรีแลนซ์',       amount: 8000,  date: '2026-06-08' },
  { id: 't7', type: 'out', cat: 'food',   name: 'กินข้าวนอกบ้าน',       amount: 2400,  date: '2026-06-10' },
  { id: 't8', type: 'out', cat: 'shopping',name: 'เสื้อผ้า',            amount: 1890,  date: '2026-06-12' },
  { id: 't9', type: 'out', cat: 'fun',    name: 'ดูหนัง + คาเฟ่',       amount: 980,   date: '2026-06-14' },
  { id: 't10',type: 'out', cat: 'health', name: 'หาหมอ + ยา',          amount: 1350,  date: '2026-06-16' },
  { id: 't11',type: 'out', cat: 'transit',name: 'ค่าโดยสาร BTS',       amount: 760,   date: '2026-06-18' },
  { id: 't12',type: 'out', cat: 'bill',   name: 'เน็ต + มือถือ',        amount: 899,   date: '2026-06-20' },
];

const INCOME_CATS = {
  salary: { name: 'เงินเดือน', icon: '💼', color: '#7FB46A' },
  side:   { name: 'รายได้เสริม', icon: '✨', color: '#7FB46A' },
  invest: { name: 'ผลตอบแทนลงทุน', icon: '📈', color: '#7FB46A' },
  bonus:  { name: 'โบนัส', icon: '🎁', color: '#7FB46A' },
  other:  { name: 'อื่นๆ', icon: '💰', color: '#7FB46A' },
};
const incomeCat = (id) => INCOME_CATS[id] || INCOME_CATS.other;

/* 12-month history for charts */
const MONTH_LABELS = ['ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.'];
const MONTHLY_HISTORY = [
  { income: 48000, expense: 31000 },
  { income: 52000, expense: 34500 },
  { income: 49000, expense: 29800 },
  { income: 53000, expense: 38000 },
  { income: 51000, expense: 33200 },
  { income: 58000, expense: 41000 },
  { income: 50000, expense: 30500 },
  { income: 53000, expense: 32800 },
  { income: 55000, expense: 36000 },
  { income: 52000, expense: 31500 },
  { income: 57000, expense: 34000 },
  { income: 53000, expense: 27629 },
];

/* ============================================================
   เกษียณ
   ============================================================ */
function retirementPlan({ currentAge, retireAge, lifeExpect, monthlyExpense, currentSavings, monthlyInvest, returnRate, inflation }) {
  const yearsToRetire = Math.max(0, retireAge - currentAge);
  const yearsInRetire = Math.max(1, lifeExpect - retireAge);
  // future monthly expense adjusted for inflation
  const futMonthly = monthlyExpense * Math.pow(1 + inflation, yearsToRetire);
  const annualNeed = futMonthly * 12;
  // real return during retirement
  const realReturn = (1 + returnRate) / (1 + inflation) - 1;
  // present value of annuity (nest egg needed at retirement)
  let nestEgg;
  if (Math.abs(realReturn) < 1e-6) nestEgg = annualNeed * yearsInRetire;
  else nestEgg = annualNeed * (1 - Math.pow(1 + realReturn, -yearsInRetire)) / realReturn;

  // projected savings at retirement
  const r = returnRate;
  const fvCurrent = currentSavings * Math.pow(1 + r, yearsToRetire);
  const months = yearsToRetire * 12;
  const mr = Math.pow(1 + r, 1 / 12) - 1;
  let fvContrib;
  if (Math.abs(mr) < 1e-9) fvContrib = monthlyInvest * months;
  else fvContrib = monthlyInvest * ((Math.pow(1 + mr, months) - 1) / mr);
  const projected = fvCurrent + fvContrib;

  // monthly saving required to hit the target
  const targetFromContrib = Math.max(0, nestEgg - fvCurrent);
  let requiredMonthly;
  if (months <= 0) requiredMonthly = 0;
  else if (Math.abs(mr) < 1e-9) requiredMonthly = targetFromContrib / months;
  else requiredMonthly = targetFromContrib * mr / (Math.pow(1 + mr, months) - 1);

  // year-by-year projection
  const series = [];
  let bal = currentSavings;
  for (let y = 0; y <= yearsToRetire; y++) {
    series.push({ age: currentAge + y, balance: bal });
    for (let m = 0; m < 12; m++) bal = bal * (1 + mr) + monthlyInvest;
  }

  return {
    yearsToRetire, yearsInRetire, futMonthly, nestEgg, projected,
    requiredMonthly, gap: projected - nestEgg, series, annualNeed,
  };
}

/* ============================================================
   กองทุนสำรองเลี้ยงชีพ (Provident Fund / PVD)
   ============================================================ */
function pvdPlan({
  currentAge, retireAge, salary, startBalance,
  empRate, companyRate, salaryGrowth,
  assets = [], drawYears,
}) {
  const years = Math.max(0, retireAge - currentAge);
  // blended annual return จากสัดส่วนการลงทุน (ถ่วงน้ำหนักทุกประเภท)
  const blended = assets.reduce((t, a) => t + (a.pct / 100) * (a.ret / 100), 0);
  const mr = Math.pow(1 + blended, 1 / 12) - 1;
  const rate = empRate + companyRate; // % รวมที่ส่งต่อเดือน

  let bal = startBalance;
  let contributed = startBalance;          // เงินที่ส่งสะสม (รวมยอดตั้งต้น)
  let curSalary = salary;
  const series = [{ age: currentAge, balance: bal, contributed }];

  for (let y = 0; y < years; y++) {
    const monthly = curSalary * rate / 100;
    for (let m = 0; m < 12; m++) {
      bal = bal * (1 + mr) + monthly;
      contributed += monthly;
    }
    curSalary *= (1 + salaryGrowth / 100);
    series.push({ age: currentAge + y + 1, balance: bal, contributed });
  }

  const finalBal = bal;
  const gain = finalBal - contributed;

  // ทยอยถอนใช้หลังเกษียณ (annuity ที่หมดพอดีใน drawYears ปี)
  const dMonths = Math.max(1, drawYears * 12);
  let monthlyDraw;
  if (Math.abs(mr) < 1e-9) monthlyDraw = finalBal / dMonths;
  else monthlyDraw = finalBal * mr / (1 - Math.pow(1 + mr, -dMonths));

  const empMonthly = salary * empRate / 100;
  const companyMonthly = salary * companyRate / 100;

  return {
    years, blended, finalBal, contributed, gain, monthlyDraw,
    empMonthly, companyMonthly, monthlyContrib: empMonthly + companyMonthly, series,
  };
}

/* ขั้นแกน Y ที่ "สวย" (1 / 2 / 2.5 / 5 × 10ⁿ) */
function niceStep(raw) {
  raw = Math.max(raw, 1e-9);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / mag;
  let s;
  if (n <= 1) s = 1; else if (n <= 2) s = 2; else if (n <= 2.5) s = 2.5; else if (n <= 5) s = 5; else s = 10;
  return s * mag;
}

/* ============================================================
   Icons (stroke, inherit currentColor)
   ============================================================ */
const Ic = ({ d, size = 22, fill = false, stroke = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'}
       stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);
const ICONS = {
  home:     'M3 11.5 12 4l9 7.5M5 10v10h14V10',
  tax:      ['M7 3h7l5 5v13H7zM14 3v5h5', 'M9.5 13.5l5-5M10 13.5h.01M14 9h.01'],
  wallet:   ['M3 8a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2', 'M3 8v9a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-3M3 8v0', 'M21 11h-4a2 2 0 0 0 0 4h4z'],
  retire:   ['M12 3c-3 4-5 6-5 9a5 5 0 0 0 10 0c0-3-2-5-5-9Z', 'M12 21v-5'],
  plus:     'M12 5v14M5 12h14',
  calendar: ['M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z', 'M4 10h16M8 3v4M16 3v4'],
  arrowDown:'M12 5v14M19 12l-7 7-7-7',
  arrowUp:  'M12 19V5M5 12l7-7 7 7',
  bag:      ['M5 8h14l-1 11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 8Z', 'M9 8V6.5a3 3 0 0 1 6 0V8'],
  trash:    ['M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2', 'M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13'],
  check:    'M5 13l4 4L19 7',
  trend:    ['M3 17l6-6 4 4 8-8', 'M21 7v5M21 7h-5'],
  spark:    ['M12 3v4M12 17v4M3 12h4M17 12h4', 'M6.3 6.3l2.4 2.4M15.3 15.3l2.4 2.4M17.7 6.3l-2.4 2.4M8.7 15.3l-2.4 2.4'],
  target:   ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z'],
  piggy:    ['M19 10c1.5 0 2 1 2 2.5S20.5 15 19 15M3 13a6 5 0 0 1 6-5h4a6 5 0 0 1 6 5 6 5 0 0 1-6 5H9a6 5 0 0 1-6-5Z', 'M9 8V6a2 2 0 0 1 2-2M7 18v2M15 18v2M16 11h.01'],
  chevron:  'M9 6l6 6-6 6',
  info:     ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 11v5M12 7.5h.01'],
  clock:    ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 7v5l3.5 2'],
  userEdit: ['M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M3 21a7 7 0 0 1 11-5.7', 'M21.5 13.5l-5 5-2.5.6.6-2.5 5-5a1.3 1.3 0 0 1 1.9 1.9Z'],
  logout:   ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5M21 12H9'],
  close:    'M6 6l12 12M18 6L6 18',
  lock:     ['M6 10V7a6 6 0 0 1 12 0v3', 'M5 10h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z', 'M12 14.5v3'],
  shield:   ['M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3Z', 'M8.5 12l2.5 2.5 4.5-4.5'],
  user:     ['M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z', 'M4 20a8 8 0 0 1 16 0'],
  mail:     ['M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M3.5 7l8.5 6 8.5-6'],
  eye:      ['M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'],
  eyeOff:   ['M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a18.3 18.3 0 0 1-2.16 3.19M6.6 6.6A18.3 18.3 0 0 0 2 11s3.5 7 10 7a9.1 9.1 0 0 0 3.4-.65', 'M14.1 14.1a3 3 0 0 1-4.2-4.2', 'M2 2l20 20'],
};

/* ---------- ปุ่มล้างค่าทั้งฟอร์ม ---------- */
function ClearBtn({ onClear, label, confirmMsg, style }) {
  return (
    <button
      type="button"
      onClick={async () => {
        const msg = confirmMsg || 'ต้องการล้างค่าที่กรอกทั้งหมดในหน้านี้ใช่หรือไม่?';
        const ok = window.showConfirm
          ? await window.showConfirm({ type: 'delete', title: label || 'ล้างค่า', message: msg, confirmText: 'ล้างค่า', cancelText: 'ยกเลิก' })
          : window.confirm(msg);
        if (ok) onClear();
      }}
      style={Object.assign({ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 10, border: '1.5px solid var(--line)', background: '#fff', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, color: 'var(--coral-deep)', whiteSpace: 'nowrap', flexShrink: 0 }, style)}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(240,99,95,.07)'; e.currentTarget.style.borderColor = 'var(--coral)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--line)'; }}>
      <Ic d={ICONS.trash} size={14} /> {label || 'ล้างค่าทั้งหมด'}
    </button>
  );
}

Object.assign(window, {
  fmt, baht, fmtK, useStored, ClearBtn,
  calcTax, taxBreakdown, TAX_BRACKETS, DEDUCTION_ITEMS, DED_CATS, THAI_MONTHS,
  EXPENSE_CATS, catById, INCOME_CATS, incomeCat, INITIAL_TX,
  CAT_COLORS, PLAN_SEED,
  MONTH_LABELS, MONTHLY_HISTORY,
  retirementPlan, Ic, ICONS,
  pvdPlan, niceStep,
});
