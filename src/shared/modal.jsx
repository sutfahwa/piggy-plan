import React from 'react';
import ReactDOM from 'react-dom';
import './data.jsx';
const { Ic, ICONS } = window;
/* ============================================================
   modal.jsx — confirm / alert modal กลาง (Delete · Warning · Success)
   เรียกใช้แบบ:
     const ok = await window.showConfirm({ type:'delete', title, message });
     await window.showAlert({ type:'success', title, message });
   ============================================================ */

const MODAL_TYPES = {
  delete: {
    color: '#E0606A', soft: 'rgba(224,96,106,.13)',
    icon: ['M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2', 'M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13'],
    title: 'ลบรายการ' },
  warning: {
    color: '#E6A33C', soft: 'rgba(230,163,60,.15)',
    icon: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z', 'M12 8v5', 'M12 15.6h.01'],
    title: 'ยืนยันการทำรายการ' },
  success: {
    color: '#5FB58C', soft: 'rgba(95,181,140,.16)',
    icon: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z', 'M8.5 12.5l2.4 2.4 4.6-5'],
    single: true, title: 'สำเร็จ' },
};

function ConfirmHost() {
  const [state, setState] = React.useState(null);

  React.useEffect(function () {
    window.showConfirm = function (opts) {
      return new Promise(function (resolve) {setState({ opts: opts || {}, resolve: resolve });});
    };
    window.showAlert = function (opts) {
      return new Promise(function (resolve) {setState({ opts: Object.assign({ single: true, type: 'success' }, opts || {}), resolve: resolve });});
    };
    return function () {window.showConfirm = undefined;window.showAlert = undefined;};
  }, []);

  React.useEffect(function () {
    if (!state) return;
    function onKey(e) {if (e.key === 'Escape') done(false);if (e.key === 'Enter') done(true);}
    document.addEventListener('keydown', onKey);
    return function () {document.removeEventListener('keydown', onKey);};
  }, [state]);

  if (!state) return null;
  const o = state.opts;
  const cfg = MODAL_TYPES[o.type] || MODAL_TYPES.warning;
  const single = o.single != null ? o.single : cfg.single;

  function done(val) {
    const r = state.resolve;
    setState(null);
    if (r) r(val);
  }

  return ReactDOM.createPortal(
    <div className="cmodal-overlay" onMouseDown={function (e) {if (e.target === e.currentTarget) done(false);}}>
      <div className="cmodal" role="dialog" aria-modal="true">
        <button className="cmodal-x" onClick={function () {done(false);}} aria-label="ปิด">
          <Ic d={ICONS.close} size={15} />
        </button>
        <div className="cmodal-badge" style={{ background: cfg.soft }}>
          <span style={{ color: cfg.color, display: 'flex' }}><Ic d={cfg.icon} size={27} /></span>
        </div>
        <div className="cmodal-title">{o.title || cfg.title}</div>
        {o.message && <div className="cmodal-msg">{o.message}</div>}
        <div className="cmodal-btns">
          {!single &&
          <button className="cmodal-btn cmodal-cancel" onClick={function () {done(false);}}>
            {o.cancelText || 'ยกเลิก'}
          </button>}
          <button className="cmodal-btn" style={{ background: cfg.color, color: '#fff' }} onClick={function () {done(true);}}>
            {o.confirmText || 'ยืนยัน'}
          </button>
        </div>
      </div>
    </div>,
    document.body);

}

Object.assign(window, { ConfirmHost, MODAL_TYPES });
