/* ============================================================
   inputs.jsx — shared form inputs used across multiple features.
   MoneyInput originated in the tax page; CustomSelect in the plan
   page. Both are reused elsewhere (retire, tax), so they live here.
   ============================================================ */
import React from 'react';
import ReactDOM from 'react-dom';
import './data.jsx';
const { fmt, Ic, ICONS } = window;

function MoneyInput({ value, onChange, suffix = 'บาท', max, disabled, placeholder = '0' }) {
  return (
    <div className="input-wrap">
      <input className="input has-suffix" type="text" inputMode="numeric" disabled={disabled}
        value={value === 0 ? '' : fmt(value)} placeholder={placeholder}
        onChange={e => {
          let n = parseInt(e.target.value.replace(/[^\d]/g, ''), 10);
          if (isNaN(n)) n = 0;
          if (max != null) n = Math.min(n, max);
          onChange(n);
        }} />
      <span className="input-suffix">{suffix}</span>
    </div>
  );
}

/* ─── custom floating dropdown ─── */
function CustomSelect({ value, onChange, options, style, size, placeholder, align }) {
  const [open, setOpen] = React.useState(false);
  const [rect, setRect] = React.useState(null);
  const wrapRef = React.useRef(null);
  const popRef = React.useRef(null);
  const sm = size === 'sm';

  const measure = React.useCallback(function () {
    if (wrapRef.current) setRect(wrapRef.current.getBoundingClientRect());
  }, []);

  React.useEffect(function () {
    if (!open) return;
    measure();
    function onDown(e) {
      if (wrapRef.current && wrapRef.current.contains(e.target)) return;
      if (popRef.current && popRef.current.contains(e.target)) return;
      setOpen(false);
    }
    function onMove() {measure();}
    document.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return function () {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [open, measure]);

  const sel = options.find(function (o) {return String(o.value) === String(value);});
  const CHEV_D = 'M6 9l6 6 6-6';
  const CHEV_U = 'M18 15l-6-6-6 6';

  /* dropdown แสดงผ่าน portal + ตำแหน่งแบบ fixed — กันโดน section ตัด/บังจนเลื่อนไม่ได้ */
  let menu = null;
  if (open && rect) {
    const vh = window.innerHeight;
    const spaceBelow = vh - rect.bottom;
    const flipUp = spaceBelow < 220 && rect.top > spaceBelow;
    const maxH = Math.max(140, (flipUp ? rect.top : spaceBelow) - 16);
    menu = ReactDOM.createPortal(
      <div ref={popRef} style={{
        position: 'fixed',
        top: flipUp ? 'auto' : rect.bottom + 6,
        bottom: flipUp ? vh - rect.top + 6 : 'auto',
        left: align === 'right' ? 'auto' : rect.left,
        right: align === 'right' ? Math.max(8, window.innerWidth - rect.right) : 'auto',
        width: Math.max(rect.width, sm ? 130 : 150),
        zIndex: 6000,
        background: '#fff', borderRadius: 14,
        boxShadow: '0 8px 32px rgba(0,0,0,.16)',
        padding: '6px', maxHeight: maxH, overflowY: 'auto'
      }}>
        {options.map(function (o) {
          const isSel = String(o.value) === String(value);
          return (
            <div
              key={o.value}
              onClick={function () {onChange(o.value);setOpen(false);}}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                padding: sm ? '8px 12px' : '10px 14px', borderRadius: 9, cursor: 'pointer',
                background: isSel ? 'var(--accent-soft)' : 'transparent',
                color: isSel ? 'var(--accent-deep)' : 'var(--ink)',
                fontSize: sm ? 13.5 : 14.5, fontWeight: isSel ? 600 : 400,
                transition: 'background .1s', whiteSpace: 'nowrap'
              }}
              onMouseEnter={function (e) {if (!isSel) e.currentTarget.style.background = 'var(--surface-2)';}}
              onMouseLeave={function (e) {if (!isSel) e.currentTarget.style.background = 'transparent';}}>
              <span>{o.label}</span>
              {isSel &&
              <span style={{ color: 'var(--accent-deep)', display: 'flex', flexShrink: 0 }}>
                <Ic d={ICONS.check} size={16} />
              </span>}
            </div>);
        })}
      </div>,
      document.body);
  }

  return (
    <div ref={wrapRef} style={Object.assign({ position: 'relative' }, style)}>
      <button
        onClick={function () {setOpen(function (v) {return !v;});}}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: sm ? 6 : 10, width: '100%',
          padding: sm ? '8px 10px' : '10px 16px',
          background: '#fff',
          border: open ? '2px solid var(--accent)' : '1.5px solid var(--line)',
          borderRadius: sm ? 10 : 12, cursor: 'pointer',
          fontFamily: 'var(--font-body)', fontSize: sm ? 13 : 14.5,
          color: sel ? 'var(--ink)' : 'var(--ink-faint)', textAlign: 'left',
          transition: 'border-color .15s',
          boxSizing: 'border-box',
          whiteSpace: 'nowrap', overflow: 'hidden'
        }}>

        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{sel ? sel.label : placeholder || ''}</span>
        <span style={{ color: 'var(--ink-soft)', display: 'flex', flexShrink: 0 }}>
          <Ic d={open ? CHEV_U : CHEV_D} size={sm ? 14 : 16} />
        </span>
      </button>
      {menu}
    </div>);
}

Object.assign(window, { MoneyInput, CustomSelect });
