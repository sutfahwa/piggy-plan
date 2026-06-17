import React from 'react';
import './data.jsx';
const { fmt, fmtK, baht, niceStep } = window;
/* ============================================================
   charts.jsx — Donut, GroupedBars, AreaChart, ProgressRing
   ============================================================ */

/* ---------- Donut chart ---------- */
function Donut({ data, size = 190, thick = 26, centerTop, centerMain, centerSub }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const R = (size - thick) / 2;
  const C = 2 * Math.PI * R;
  let offset = 0;
  const cx = size / 2;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cx} r={R} fill="none" stroke="var(--line-soft)" strokeWidth={thick} />
        {data.map((d, i) => {
          const len = (d.value / total) * C;
          const el = (
            <circle key={i} cx={cx} cy={cx} r={R} fill="none"
              stroke={d.color} strokeWidth={thick} strokeLinecap="round"
              strokeDasharray={`${Math.max(0, len - 3)} ${C}`}
              strokeDashoffset={-offset}
              style={{ transition: 'stroke-dasharray .6s cubic-bezier(.2,.8,.2,1), stroke-dashoffset .6s' }} />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeContent: 'center', textAlign: 'center', lineHeight: 1.2 }}>
        {centerTop && <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{centerTop}</div>}
        <div className="bignum" style={{ fontSize: size > 170 ? 26 : 21 }}>{centerMain}</div>
        {centerSub && <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{centerSub}</div>}
      </div>
    </div>
  );
}

/* ---------- Grouped bars (income vs expense per month) ---------- */
function GroupedBars({ data, labels, height = 200, colorA = 'var(--mint-deep)', colorB = 'var(--coral)' }) {
  const max = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);
  const [hover, setHover] = React.useState(null);
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'min(2.2%, 14px)', height, padding: '0 2px' }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end', position: 'relative' }}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            {hover === i && (
              <div style={{ position: 'absolute', bottom: '100%', marginBottom: 6, background: 'var(--ink)', color: '#fff', padding: '7px 11px', borderRadius: 10, fontSize: 12, whiteSpace: 'nowrap', zIndex: 5, boxShadow: 'var(--shadow)' }}>
                <div style={{ color: '#BCE29E' }}>รับ {fmtK(d.income)}</div>
                <div style={{ color: '#FFB3B3' }}>จ่าย {fmtK(d.expense)}</div>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: '100%', width: '100%', justifyContent: 'center' }}>
              <div style={{ width: '38%', maxWidth: 16, height: `${(d.income / max) * 100}%`, background: colorA, borderRadius: '6px 6px 0 0', transition: 'height .5s', opacity: hover === null || hover === i ? 1 : .45 }} />
              <div style={{ width: '38%', maxWidth: 16, height: `${(d.expense / max) * 100}%`, background: colorB, borderRadius: '6px 6px 0 0', transition: 'height .5s', opacity: hover === null || hover === i ? 1 : .45 }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{labels[i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Area / line chart ---------- */
function AreaChart({ points, height = 220, color = 'var(--accent-deep)', fillFrom = 'var(--accent-soft)', labelFmt, markerLabel }) {
  const W = 600, H = height;
  const pad = { l: 8, r: 8, t: 14, b: 26 };
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const maxY = Math.max(...ys, 1), minY = Math.min(...ys, 0);
  const sx = x => pad.l + ((x - minX) / (maxX - minX || 1)) * (W - pad.l - pad.r);
  const sy = y => pad.t + (1 - (y - minY) / (maxY - minY || 1)) * (H - pad.t - pad.b);
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ');
  const area = `${line} L${sx(maxX)},${H - pad.b} L${sx(minX)},${H - pad.b} Z`;
  const gid = 'ag' + Math.round(maxY);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillFrom} stopOpacity="0.9" />
          <stop offset="100%" stopColor={fillFrom} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map(f => (
        <line key={f} x1={pad.l} x2={W - pad.r} y1={pad.t + f * (H - pad.t - pad.b)} y2={pad.t + f * (H - pad.t - pad.b)} stroke="var(--line-soft)" strokeWidth="1" />
      ))}
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (i % Math.ceil(points.length / 6) === 0 || i === points.length - 1) && (
        <g key={i}>
          <circle cx={sx(p.x)} cy={sy(p.y)} r="4" fill="#fff" stroke={color} strokeWidth="2.5" />
          {labelFmt && <text x={sx(p.x)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--ink-faint)">{labelFmt(p)}</text>}
        </g>
      ))}
    </svg>
  );
}

/* ---------- Multi-series line chart (axes, uniform scale) ---------- */
function LineChart({ series, height = 340, yTicks = 6, xFmt = x => x, yFmt = y => y }) {
  const W = 820, H = height;
  const pad = { l: 64, r: 22, t: 18, b: 38 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;

  const all = series.flatMap(s => s.points);
  const xs = all.map(p => p.x);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const dataMax = Math.max(...all.map(p => p.y), 1);

  const step = niceStep(dataMax / yTicks);
  const niceMax = step * Math.ceil(dataMax / step - 1e-9);
  const yvals = [];
  for (let v = 0; v <= niceMax + 1e-6; v += step) yvals.push(v);

  const sx = x => pad.l + ((x - minX) / (maxX - minX || 1)) * iw;
  const sy = y => pad.t + (1 - y / niceMax) * ih;

  // ป้ายแกน X ~8 จุด (กันป้ายสุดท้ายชนกับขอบ)
  const span = maxX - minX;
  const stepX = Math.max(1, Math.round(span / 8));
  const xvals = [];
  for (let x = minX; x <= maxX + 1e-9; x += stepX) xvals.push(x);
  if (xvals[xvals.length - 1] < maxX - stepX * 0.35) xvals.push(maxX);
  else xvals[xvals.length - 1] = maxX;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', height: 'auto', maxWidth: '100%' }} preserveAspectRatio="xMidYMid meet">
      {yvals.map((v, i) => (
        <g key={'y' + i}>
          <line x1={pad.l} x2={W - pad.r} y1={sy(v)} y2={sy(v)} stroke="var(--line-soft)" strokeWidth="1" />
          <text x={pad.l - 12} y={sy(v) + 4} textAnchor="end" fontSize="12.5" fill="var(--ink-faint)" fontFamily="var(--font-body)">{yFmt(v)}</text>
        </g>
      ))}
      {xvals.map((x, i) => (
        <text key={'x' + i} x={sx(x)} y={H - 12} textAnchor="middle" fontSize="12.5" fill="var(--ink-faint)" fontFamily="var(--font-body)">{xFmt(x)}</text>
      ))}
      {series.map((s, si) => {
        const line = s.points.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ');
        return (
          <g key={'s' + si}>
            {s.fill && <path d={`${line} L${sx(maxX).toFixed(1)},${sy(0)} L${sx(minX).toFixed(1)},${sy(0)} Z`} fill={s.fill} opacity="0.15" />}
            <path d={line} fill="none" stroke={s.color} strokeWidth={s.dash ? 2.6 : 3.2}
              strokeLinecap="round" strokeLinejoin="round" strokeDasharray={s.dash ? '7 6' : 'none'} />
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- Progress ring ---------- */
function Ring({ pct, size = 130, thick = 13, color = 'var(--accent-deep)', label, sub }) {
  const R = (size - thick) / 2;
  const C = 2 * Math.PI * R;
  const p = Math.max(0, Math.min(1, pct));
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="var(--line-soft)" strokeWidth={thick} />
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke={color} strokeWidth={thick} strokeLinecap="round"
          strokeDasharray={`${p * C} ${C}`} style={{ transition: 'stroke-dasharray .7s cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeContent: 'center', textAlign: 'center', lineHeight: 1.15 }}>
        <div className="bignum" style={{ fontSize: 24 }}>{label}</div>
        {sub && <div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ---------- Horizontal compare bars (tax before/after) ---------- */
function CompareBars({ rows, max }) {
  const m = max || Math.max(...rows.map(r => r.value), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {rows.map((r, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-soft)' }}>{r.label}</span>
            <span className="bignum" style={{ fontSize: 16, color: r.color }}>{baht(r.value)}</span>
          </div>
          <div style={{ height: 16, borderRadius: 999, background: 'var(--line-soft)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(r.value / m) * 100}%`, background: r.color, borderRadius: 999, transition: 'width .6s cubic-bezier(.2,.8,.2,1)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { Donut, GroupedBars, AreaChart, LineChart, Ring, CompareBars });
