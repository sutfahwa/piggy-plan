/* ============================================================
   AuthScreen.jsx — login / signup / forgot-password gate.
   Real Firebase auth (email + Google). On success the app's auth
   gate (App.jsx) flips automatically via onAuthStateChanged, so
   there is no manual redirect here.
   ============================================================ */
import React from 'react';
import './auth.css';
import { signInEmail, signUpEmail, signInGoogle, resetPassword, authMessage } from '../../shared/firebase.js';

const { useState } = React;

/* ---------- icons ---------- */
function GoogleG() {
  return (
    <svg width="19" height="19" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  );
}
function Eye({ off }) {
  return off ? (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><path d="M6.61 6.61A18.5 18.5 0 0 0 2 12s3 8 10 8a9.12 9.12 0 0 0 5.39-1.61M2 2l20 20"/></svg>
  ) : (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8Z"/><circle cx="12" cy="12" r="3"/></svg>
  );
}
function BrandMark() {
  return (
    <div className="brand-mark">
      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11.5c0-2.8 2.6-5 6-5h3.5c.8-1 2-1.6 3.2-1.6 0 .8-.3 1.5-.7 2 .9.6 1.6 1.5 1.9 2.6l1.6.5c.4.1.6.5.6.9V14c0 .5-.4.9-.9.9h-1.2c-.4.6-.9 1.1-1.5 1.5V18a1 1 0 0 1-1 1h-1.2a1 1 0 0 1-1-1v-.6a7.7 7.7 0 0 1-2.7 0V18a1 1 0 0 1-1 1H7.9a1 1 0 0 1-1-1v-1.7C5 15.2 3.8 13.5 3.6 11.5Z"/>
        <circle cx="15" cy="11" r="0.9" fill="#fff" stroke="none" />
      </svg>
    </div>
  );
}
function Piggy() {
  return (
    <div className="auth-piggy" aria-hidden="true">
      <svg viewBox="0 0 220 210" width="100%" height="100%">
        <defs>
          <radialGradient id="pg" cx="42%" cy="34%" r="78%"><stop offset="0%" stopColor="#FFE2DC"/><stop offset="62%" stopColor="#FFC4BC"/><stop offset="100%" stopColor="#FFA59C"/></radialGradient>
          <radialGradient id="sn" cx="45%" cy="35%" r="75%"><stop offset="0%" stopColor="#FFC9C2"/><stop offset="100%" stopColor="#F89E96"/></radialGradient>
          <radialGradient id="co" cx="40%" cy="35%" r="75%"><stop offset="0%" stopColor="#FAD27A"/><stop offset="100%" stopColor="#E7A23B"/></radialGradient>
        </defs>
        <ellipse className="piggy-shadow" cx="110" cy="192" rx="60" ry="8.5" fill="rgba(120,70,60,.14)" />
        <g className="piggy-bob">
          <ellipse cx="84" cy="178" rx="13" ry="11" fill="#F8ABA2" />
          <ellipse cx="136" cy="178" rx="13" ry="11" fill="#F8ABA2" />
          <path className="ear ear-l" d="M66 64 C52 40 60 30 74 36 C86 41 92 58 88 74 C82 72 73 70 66 64 Z" fill="#F89E96" />
          <path className="ear ear-r" d="M154 64 C168 40 160 30 146 36 C134 41 128 58 132 74 C138 72 147 70 154 64 Z" fill="#F89E96" />
          <path className="ear ear-l" d="M70 62 C61 47 65 40 74 44 C82 48 85 59 82 69 C78 67 73 66 70 62 Z" fill="#FFD2CC" />
          <path className="ear ear-r" d="M150 62 C159 47 155 40 146 44 C138 48 135 59 138 69 C142 67 147 66 150 62 Z" fill="#FFD2CC" />
          <ellipse cx="110" cy="120" rx="73" ry="66" fill="url(#pg)" />
          <ellipse cx="92" cy="98" rx="34" ry="26" fill="#FFFFFF" opacity="0.22" />
          <rect x="92" y="58" width="36" height="9" rx="4.5" fill="#E08982" />
          <circle cx="70" cy="130" r="11" fill="#FF9A96" opacity="0.4" />
          <circle cx="150" cy="130" r="11" fill="#FF9A96" opacity="0.4" />
          <g className="eye eye-l"><ellipse cx="89" cy="108" rx="8.5" ry="9.5" fill="#5A463E" /><circle cx="86" cy="104.5" r="3" fill="#fff" /><circle cx="91.5" cy="111" r="1.5" fill="#fff" opacity="0.85" /></g>
          <g className="eye eye-r"><ellipse cx="131" cy="108" rx="8.5" ry="9.5" fill="#5A463E" /><circle cx="128" cy="104.5" r="3" fill="#fff" /><circle cx="133.5" cy="111" r="1.5" fill="#fff" opacity="0.85" /></g>
          <path d="M101 126 Q110 133 119 126" fill="none" stroke="#D77E78" strokeWidth="2.6" strokeLinecap="round" />
          <ellipse cx="110" cy="144" rx="25" ry="19" fill="url(#sn)" />
          <ellipse cx="103" cy="129" rx="9" ry="5" fill="#FFFFFF" opacity="0.3" />
          <ellipse cx="101.5" cy="144" rx="4" ry="7" fill="#D77E78" />
          <ellipse cx="118.5" cy="144" rx="4" ry="7" fill="#D77E78" />
        </g>
        <g className="coin"><circle cx="110" cy="40" r="15" fill="url(#co)" stroke="#D9912F" strokeWidth="2" /><text x="110" y="46" textAnchor="middle" fontSize="17" fontWeight="700" fill="#B9791F" fontFamily="Prompt, sans-serif">฿</text></g>
      </svg>
    </div>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function pwStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[0-9]/.test(pw) && /[a-zA-Z]/.test(pw)) s++;
  if (/[^a-zA-Z0-9]/.test(pw)) s++;
  return Math.min(s, 3);
}
const STRENGTH = [
  { label: '', color: 'var(--line)' },
  { label: 'อ่อน', color: 'var(--bad)' },
  { label: 'พอใช้', color: 'var(--warn)' },
  { label: 'แข็งแรง', color: 'var(--good)' },
];

const LEGAL = {
  terms: {
    title: 'ข้อตกลงและเงื่อนไขการใช้บริการ', emoji: '📋',
    updated: 'วันที่มีผลบังคับใช้: 18 มิถุนายน 2569',
    intro: 'ยินดีต้อนรับสู่ Piggy Plan (ซึ่งต่อไปนี้จะเรียกว่า "ผู้ให้บริการ" หรือ "เว็บไซต์") โปรดอ่านข้อตกลงและเงื่อนไขการใช้บริการฉบับนี้โดยละเอียดก่อนทำการสมัครสมาชิกและใช้งานระบบ การที่ผู้ใช้บริการทำการลงทะเบียนสมัครสมาชิกและกดปุ่ม "ยอมรับเงื่อนไข" ถือว่าผู้ใช้บริการได้อ่าน เข้าใจ และยินยอมผูกพันตนเองตามข้อตกลงและเงื่อนไขทั้งหมดที่ระบุไว้ดังต่อไปนี้:',
    secs: [
      { h: '1. การลงทะเบียนและการรักษาความปลอดภัยของบัญชีผู้ใช้', p: 'ความถูกต้องของข้อมูล: ผู้ใช้บริการตกลงจะให้ข้อมูลที่เป็นความจริง ถูกต้อง และเป็นปัจจุบันในการสมัครสมาชิก หากผู้ให้บริการพบว่าข้อมูลที่ให้เป็นเท็จ หรือมีเหตุอันควรสงสัยว่าเป็นเท็จ ผู้ให้บริการขอสงวนสิทธิ์ในการระงับหรือยกเลิกบัญชีใช้งานทันที\n\nการดูแลรักษาบัญชี: ผู้ใช้บริการมีหน้าที่รับผิดชอบแต่เพียงผู้เดียวในการรักษาความลับของชื่อผู้ใช้ (Username) และรหัสผ่าน (Password) ของตนเอง\n\nความรับผิดชอบต่อความเสียหาย: การกระทำใด ๆ ที่เกิดขึ้นภายใต้บัญชีของผู้ใช้บริการ จะถือเป็นการกระทำของผู้ใช้บริการเองทั้งสิ้น ผู้ให้บริการจะไม่รับผิดชอบต่อความเสียหาย ความสูญเสีย หรือการเข้าถึงข้อมูลโดยไม่ได้รับอนุญาต อันเกิดจากการที่ผู้ใช้บริการละเลย นำรหัสผ่านไปเปิดเผย หรือส่งต่อให้บุคคลอื่น' },
      { h: '2. ขอบเขตการให้บริการและข้อจำกัดความรับผิดชอบ (Disclaimer)', p: 'วัตถุประสงค์ของระบบ: เว็บไซต์นี้จัดทำขึ้นเพื่อเป็นเครื่องมือจำลอง คำนวณ และวางแผนทางการเงินส่วนบุคคลเบื้องต้นเท่านั้น (ประกอบด้วย ฟังก์ชันวางแผนเงินเก็บ, คำนวณชั่วโมงทำงานและค่าล่วงเวลา (OT), วางแผนภาษีเงินได้บุคคลธรรมดา และคำนวณกองทุนสำรองเลี้ยงชีพ)\n\nไม่ใช่คำแนะนำที่เป็นทางการ: ข้อมูลและผลลัพธ์ทั้งหมดที่ได้จากการคำนวณบนเว็บไซต์นี้ ไม่ใช่คำแนะนำทางกฎหมาย คำแนะนำทางภาษี หรือคำแนะนำการลงทุนอย่างเป็นทางการ ผลลัพธ์อาจคลาดเคลื่อนได้ตามข้อมูลที่ผู้ใช้บริการกรอก และการเปลี่ยนแปลงของโครงสร้างภาษีหรือนโยบายของรัฐบาลในอนาคต\n\nการปฏิเสธความรับผิด: ผู้ให้บริการจะไม่รับผิดชอบต่อความเสียหายทางการเงิน ความผิดพลาดในการยื่นภาษี ความสูญเสีย หรือผลกระทบใด ๆ ทั้งทางตรงและทางอ้อม ที่เกิดจากการที่ผู้ใช้บริการนำผลลัพธ์จากเว็บไซต์นี้ไปอ้างอิงหรือใช้ในการตัดสินใจจริง ผู้ใช้บริการมีหน้าที่ต้องตรวจสอบความถูกต้องกับหน่วยงานราชการ (เช่น กรมสรรพากร) หรือผู้เชี่ยวชาญก่อนดำเนินการใด ๆ' },
      { h: '3. การใช้งานที่ต้องห้าม', p: 'ผู้ใช้บริการตกลงว่าจะไม่กระทำการใด ๆ ดังต่อไปนี้:\n• พยายามเข้าถึงระบบ ฐานข้อมูล หรือเซิร์ฟเวอร์ของเว็บไซต์โดยไม่ได้รับอนุญาต (การแฮก หรือ Reverse Engineering)\n• ใช้โปรแกรมอัตโนมัติ (เช่น Bot, Spider, Scraper) เพื่อดึงข้อมูล หรือสร้างบัญชีผู้ใช้ในปริมาณมาก\n• ป้อนข้อมูลที่เป็นข้อมูลขยะ (Spam) ข้อมูลที่สร้างความเสียหายต่อระบบ หรืออัปโหลดไฟล์ที่มีไวรัส/มัลแวร์เข้าสู่ระบบ' },
      { h: '4. การระงับและการยกเลิกการให้บริการ', p: 'ผู้ใช้บริการสามารถขอยกเลิกบัญชีและลบข้อมูลทั้งหมดออกจากระบบได้ตลอดเวลาผ่านทางเมนูตั้งค่าในระบบ\n\nผู้ให้บริการขอสงวนสิทธิ์ในการระงับ หรือปิดบัญชีของผู้ใช้บริการชั่วคราวหรือถาวร โดยไม่ต้องแจ้งให้ทราบล่วงหน้า หากผู้ใช้บริการละเมิดข้อตกลงและเงื่อนไขฉบับนี้ หรือใช้งานระบบในลักษณะที่ส่งผลกระทบต่อความเสถียรของเว็บไซต์' },
    ],
  },
  privacy: {
    title: 'นโยบายความเป็นส่วนตัว', emoji: '🔒',
    updated: 'วันที่มีผลบังคับใช้: 18 มิถุนายน 2569',
    intro: 'Piggy Plan (ซึ่งต่อไปนี้จะเรียกว่า "เรา") ตระหนักถึงความสำคัญของการคุ้มครองข้อมูลส่วนบุคคลของคุณ นโยบายความเป็นส่วนตัวฉบับนี้จัดทำขึ้นตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) เพื่อแจ้งให้คุณทราบถึงรายละเอียดการเก็บรวบรวม การใช้ และการปกป้องข้อมูลส่วนบุคคลของคุณอย่างชัดเจนและโปร่งใส',
    secs: [
      { h: '1. ข้อมูลส่วนบุคคลที่เราจัดเก็บ', p: 'เราจะจัดเก็บข้อมูลส่วนบุคคลเท่าที่จำเป็นตามวัตถุประสงค์การใช้งาน ดังนี้:\n\nข้อมูลระบุตัวตนและบัญชีผู้ใช้: ชื่อ-นามสกุล (ถ้ามี), ที่อยู่อีเมล และรหัสผ่าน ซึ่งจะถูกเข้ารหัสความปลอดภัย (Hash & Salt) ระบบไม่สามารถมองเห็นรหัสผ่านจริงของคุณได้\n\nข้อมูลทางการเงินและการทำงาน (ที่คุณเลือกกรอกเพื่อคำนวณ):\n• ฐานเงินเดือน และรายได้ประเภทอื่น ๆ\n• อัตราค่าจ้างรายชั่วโมง และจำนวนชั่วโมงการทำงานล่วงเวลา (OT)\n• ข้อมูลรายการลดหย่อนภาษี (เช่น ประกันชีวิต, ดอกเบี้ยบ้าน, ข้อมูลครอบครัว)\n• อัตราการหักเงินสะสมและการสมทบของกองทุนสำรองเลี้ยงชีพ (Provident Fund)\n\nข้อมูลทางเทคนิคและการใช้งาน: หมายเลขไอพี (IP Address), ประเภทของเบราว์เซอร์ และประวัติการเข้าใช้งานหน้าเว็บ (Log Data)' },
      { h: '2. ฐานกฎหมายและวัตถุประสงค์ในการประมวลผลข้อมูล', p: 'เราประมวลผลข้อมูลส่วนบุคคลของคุณภายใต้ "ฐานสัญญา" (Contractual Basis) และ "ฐานความยินยอม" (Consent) เพื่อวัตถุประสงค์ดังต่อไปนี้เท่านั้น:\n• เพื่อประมวลผล คำนวณ และแสดงผลลัพธ์ในฟังก์ชันวางแผนการเงิน ภาษี โอที และกองทุนสำรองเลี้ยงชีพตามที่คุณต้องการ\n• เพื่อจัดเก็บและบันทึกข้อมูลของคุณ ทำให้คุณเข้าสู่ระบบมาตรวจสอบ แก้ไข หรืออัปเดตแผนการเงินเดิมได้\n• เพื่อปรับปรุงประสิทธิภาพการทำงานและรักษาความปลอดภัยของระบบเว็บไซต์' },
      { h: '3. การไม่เปิดเผยข้อมูลแก่บุคคลที่สาม', p: 'นโยบายความเป็นส่วนตัวสูงสุด: เราไม่มีนโยบายและจะไม่มีวันนำข้อมูลส่วนบุคคล ข้อมูลรายได้ หรือข้อมูลทางการเงินของคุณไปขาย แลกเปลี่ยน เผยแพร่ หรือส่งต่อให้แก่สถาบันการเงิน บริษัทประกันภัย บริษัทจัดการกองทุน หรือบุคคลที่สามใด ๆ เพื่อวัตถุประสงค์ทางการตลาด\n\nข้อยกเว้น: เราจะเปิดเผยข้อมูลก็ต่อเมื่อได้รับคำสั่งอย่างเป็นทางการตามกฎหมายจากหน่วยงานรัฐที่มีอำนาจ หรือพนักงานเจ้าหน้าที่ตามกระบวนการทางกฎหมายเท่านั้น' },
      { h: '4. ระยะเวลาในการจัดเก็บข้อมูล', p: 'เราจะเก็บรักษาข้อมูลส่วนบุคคลและข้อมูลทางการเงินของคุณไว้ตลอดระยะเวลาที่บัญชีผู้ใช้ของคุณยังคงเปิดใช้งานอยู่\n\nหากคุณทำการ "ยกเลิกบัญชีผู้ใช้" (Delete Account) ระบบจะลบข้อมูลทางการเงินและข้อมูลส่วนบุคคลของคุณออกจากฐานข้อมูลหลัก (Production Database) โดยถาวรทันที และข้อมูลในระบบสำรอง (Backup) จะถูกลบทำลายอย่างถาวรภายในระยะเวลาไม่เกิน 30 วันนับจากวันที่ยกเลิกบัญชี' },
      { h: '5. การรักษาความปลอดภัยของข้อมูล', p: 'เราใช้มาตรการทางเทคนิคและการบริหารจัดการที่ได้มาตรฐานเพื่อปกป้องข้อมูลของคุณ:\n• ใช้โปรโตคอล HTTPS เข้ารหัสข้อมูลทุกครั้งที่มีการรับส่งระหว่างเครื่องของคุณกับเซิร์ฟเวอร์\n• รหัสผ่านถูกเข้ารหัสด้วยอัลกอริทึมที่ปลอดภัย ไม่มีการเก็บในรูปแบบข้อความธรรมดา (Plain Text)\n• จำกัดสิทธิ์การเข้าถึงฐานข้อมูลหลังบ้าน เฉพาะผู้ดูแลระบบที่จำเป็นต้องบำรุงรักษาระบบเท่านั้น' },
      { h: '6. นโยบายการใช้คุกกี้ (Cookie Policy)', p: 'เว็บไซต์ของเราใช้คุกกี้ประเภท "คุกกี้ที่มีความจำเป็นต่องาน (Strictly Necessary Cookies)" เพื่อจดจำสถานะการเข้าสู่ระบบ (Session) ของคุณ ทำให้คุณไม่ต้องเข้าสู่ระบบใหม่ทุกครั้งที่เปลี่ยนหน้าเว็บ คุกกี้ประเภทนี้ไม่มีการเก็บข้อมูลพฤติกรรมเพื่อการโฆษณา และจะถูกลบเมื่อคุณปิดเบราว์เซอร์หรือกดออกจากระบบ' },
      { h: '7. สิทธิ์ของเจ้าของข้อมูลส่วนบุคคล (Your Rights)', p: 'ตามกฎหมาย PDPA คุณมีสิทธิ์ในฐานะเจ้าของข้อมูลส่วนบุคคลดังต่อไปนี้ ซึ่งสามารถดำเนินการได้ด้วยตนเองผ่านระบบ หรือติดต่อเรา:\n• สิทธิ์ในการเข้าถึงและขอรับสำเนาข้อมูล: เข้าดูข้อมูลทั้งหมดที่เคยกรอกไว้ในระบบได้ตลอดเวลา\n• สิทธิ์ในการแก้ไขข้อมูลให้ถูกต้อง: แก้ไข อัปเดตข้อมูลส่วนตัวและข้อมูลทางการเงินผ่านหน้าโปรไฟล์และหน้าคำนวณ\n• สิทธิ์ในการขอให้ลบข้อมูล (Right to be Forgotten): ลบบัญชีและข้อมูลทั้งหมดออกจากระบบได้ทุกเมื่อ\n• สิทธิ์ในการเพิกถอนความยินยอม: ยกเลิกความยินยอมในการเก็บข้อมูลได้ โดยการปิดบัญชีผู้ใช้' },
      { h: '8. ข้อมูลติดต่อผู้ควบคุมข้อมูลส่วนบุคคล', p: 'หากคุณมีข้อสงสัย คำถาม หรือต้องการใช้สิทธิ์เกี่ยวกับนโยบายความเป็นส่วนตัวฉบับนี้ สามารถติดต่อเราได้ที่:\nผู้ควบคุมข้อมูลส่วนบุคคล: ทีมพัฒนา Piggy Plan\nอีเมล: support@piggyplan.app' },
    ],
  },
};

function LegalModal({ which, onClose, onAccept }) {
  const [tab, setTab] = useState(which);
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const d = LEGAL[tab];
  return (
    <div className="legal-overlay" onClick={onClose}>
      <div className="legal-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="legal-close" onClick={onClose} aria-label="ปิด">✕</button>
        <div className="legal-tabs">
          {['terms', 'privacy'].map((k) => (
            <button key={k} type="button" className={'legal-tab' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>
              {LEGAL[k].emoji} {LEGAL[k].title}
            </button>
          ))}
        </div>
        <div className="legal-body">
          <p className="legal-updated">{d.updated}</p>
          <p className="legal-intro">{d.intro}</p>
          {d.secs.map((s, i) => (
            <div className="legal-sec" key={i}><h4>{s.h}</h4><p style={{ whiteSpace: 'pre-line' }}>{s.p}</p></div>
          ))}
        </div>
        <div className="legal-foot">
          <button type="button" className="btn-ghost-legal" onClick={onClose}>ปิด</button>
          <button type="button" className="btn-accept-legal" onClick={onAccept}>ยอมรับเงื่อนไข</button>
        </div>
      </div>
    </div>
  );
}

export function BrandPanel() {
  return (
    <div className="auth-brand">
      <div className="auth-brand-top">
        <BrandMark />
        <div>
          <div className="auth-brand-name">Piggy Plan</div>
          <div className="auth-brand-sub">วางแผนการเงินส่วนตัว</div>
        </div>
      </div>
      <div className="auth-brand-mid">
        <Piggy />
        <h1 className="auth-hero-title">วางแผนการเงิน<br/>ให้เป็นเรื่องสนุก</h1>
        <p className="auth-hero-sub">จัดการรายรับ–รายจ่าย วางแผนภาษี คำนวณ OT และติดตามเงินออม ครบในที่เดียว</p>
        <div className="auth-feats">
          <div className="auth-feat"><span className="auth-feat-ic">🗓️</span><span>วางแผนงบรายเดือนล่วงหน้า</span></div>
          <div className="auth-feat"><span className="auth-feat-ic">🧾</span><span>คำนวณภาษีและค่าล่วงเวลา</span></div>
          <div className="auth-feat"><span className="auth-feat-ic">🐖</span><span>ติดตามเงินออมสะสมรายปี</span></div>
        </div>
      </div>
      <div className="auth-brand-foot">🔒 ข้อมูลของคุณถูกเก็บเป็นความลับและปลอดภัย</div>
      <div className="auth-brand-compact">
        <h1 className="auth-hero-title">วางแผนการเงินให้เป็นเรื่องสนุก 🐷</h1>
        <p className="auth-hero-sub">จัดการเงิน ภาษี และเงินออม ครบในที่เดียว</p>
      </div>
    </div>
  );
}

export default function AuthScreen() {
  const [view, setView] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [vals, setVals] = useState({ name: '', email: '', pw: '', pw2: '' });
  const [errs, setErrs] = useState({});
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState(null);
  const [legal, setLegal] = useState(null);

  const isSignup = view === 'signup';
  const isForgot = view === 'forgot';
  const set = (k, v) => { setVals(p => ({ ...p, [k]: v })); if (errs[k]) setErrs(p => ({ ...p, [k]: null })); };
  const swap = (v) => { setView(v); setErrs({}); setSentTo(null); };

  const sendReset = async (ev) => {
    ev.preventDefault();
    const e = {};
    if (!vals.email.trim()) e.email = 'กรุณากรอกอีเมล';
    else if (!EMAIL_RE.test(vals.email.trim())) e.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    setErrs(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try { await resetPassword(vals.email.trim()); setSentTo(vals.email.trim()); }
    catch (err) { setErrs({ form: authMessage(err) }); }
    finally { setBusy(false); }
  };

  const validate = () => {
    const e = {};
    if (isSignup && !vals.name.trim()) e.name = 'กรุณากรอกชื่อของคุณ';
    if (!vals.email.trim()) e.email = 'กรุณากรอกอีเมล';
    else if (!EMAIL_RE.test(vals.email.trim())) e.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    if (!vals.pw) e.pw = 'กรุณากรอกรหัสผ่าน';
    else if (isSignup && vals.pw.length < 6) e.pw = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    if (isSignup && vals.pw2 !== vals.pw) e.pw2 = 'รหัสผ่านไม่ตรงกัน';
    if (isSignup && !agree) e.agree = 'กรุณายอมรับเงื่อนไขการใช้งาน';
    return e;
  };

  // On success Firebase fires onAuthStateChanged → App.jsx swaps to the app.
  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrs(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      if (isSignup) await signUpEmail(vals.name.trim(), vals.email.trim(), vals.pw);
      else await signInEmail(vals.email.trim(), vals.pw);
    } catch (err) { setErrs({ form: authMessage(err) }); setBusy(false); }
  };

  const google = async () => {
    setBusy(true);
    try { await signInGoogle(); }
    catch (err) { setErrs({ form: authMessage(err) }); setBusy(false); }
  };

  const st = pwStrength(vals.pw);

  /* ---------- forgot password ---------- */
  if (isForgot) {
    return (
      <div className="auth">
        <BrandPanel />
        <div className="auth-form-side">
          <div className="auth-card">
            {sentTo ? (
              <div className="auth-view auth-success" key="sent">
                <div className="auth-success-ic" style={{ background: 'linear-gradient(140deg, #FF8E84, #F8A78F)' }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3.5 7l8.5 6 8.5-6"/></svg>
                </div>
                <h1 className="auth-title">ตรวจสอบอีเมลของคุณ</h1>
                <p className="auth-desc" style={{ marginBottom: 8 }}>เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปที่</p>
                <p className="auth-desc" style={{ marginBottom: 26, fontWeight: 600, color: 'var(--ink)' }}>{sentTo}</p>
                <button className="auth-submit" type="button" onClick={() => swap('login')} style={{ background: 'linear-gradient(120deg, var(--coral-deep), #FF8E84)' }}>กลับไปหน้าเข้าสู่ระบบ</button>
              </div>
            ) : (
              <div className="auth-view" key="forgot">
                <div className="auth-head">
                  <div className="auth-eyebrow">กู้คืนบัญชี</div>
                  <h1 className="auth-title">ลืมรหัสผ่าน?</h1>
                  <p className="auth-desc">กรอกอีเมลที่ใช้สมัคร แล้วเราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้</p>
                </div>
                <form onSubmit={sendReset} noValidate>
                  <div className="auth-fields">
                    <div className="field">
                      <label htmlFor="f-fmail">อีเมล</label>
                      <input id="f-fmail" className={'input' + (errs.email ? ' err' : '')} type="email" placeholder="you@email.com"
                        value={vals.email} onChange={e => set('email', e.target.value)} autoComplete="email" autoFocus />
                      {errs.email && <div className="auth-err">{errs.email}</div>}
                    </div>
                  </div>
                  {errs.form && <div className="auth-err" style={{ marginTop: 10 }}>{errs.form}</div>}
                  <button className="auth-submit" type="submit" disabled={busy}>
                    {busy ? <span className="auth-spinner" /> : 'ส่งลิงก์ตั้งรหัสผ่านใหม่'}
                  </button>
                </form>
                <div className="auth-foot">จำรหัสผ่านได้แล้ว? <button className="auth-link" onClick={() => swap('login')}>เข้าสู่ระบบ</button></div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth">
      <BrandPanel />
      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-view" key={view}>
            <div className="auth-head">
              <div className="auth-eyebrow">{isSignup ? 'สมัครใช้งาน' : 'เข้าสู่ระบบ'}</div>
              <h1 className="auth-title">{isSignup ? 'สร้างบัญชีใหม่' : 'ยินดีต้อนรับกลับมา'}</h1>
              <p className="auth-desc">{isSignup ? 'กรอกข้อมูลด้านล่างเพื่อเริ่มต้นใช้งาน Piggy Plan ฟรี' : 'เข้าสู่ระบบเพื่อจัดการแผนการเงินของคุณ'}</p>
            </div>

            <button className="gbtn" type="button" onClick={google} disabled={busy}>
              <GoogleG /> {isSignup ? 'สมัครด้วย Google' : 'เข้าสู่ระบบด้วย Google'}
            </button>
            <div className="auth-divider">หรือใช้อีเมล</div>

            <form onSubmit={submit} noValidate>
              <div className="auth-fields">
                {isSignup && (
                  <div className="field">
                    <label htmlFor="f-name">ชื่อที่ใช้แสดง</label>
                    <input id="f-name" className={'input' + (errs.name ? ' err' : '')} type="text" placeholder="เช่น สมหญิง ใจดี"
                      value={vals.name} onChange={e => set('name', e.target.value)} autoComplete="name" />
                    {errs.name && <div className="auth-err">{errs.name}</div>}
                  </div>
                )}
                <div className="field">
                  <label htmlFor="f-email">อีเมล</label>
                  <input id="f-email" className={'input' + (errs.email ? ' err' : '')} type="email" placeholder="you@email.com"
                    value={vals.email} onChange={e => set('email', e.target.value)} autoComplete="email" />
                  {errs.email && <div className="auth-err">{errs.email}</div>}
                </div>
                <div className="field">
                  <label htmlFor="f-pw">รหัสผ่าน</label>
                  <div className="auth-pw-wrap">
                    <input id="f-pw" className={'input has-suffix' + (errs.pw ? ' err' : '')} type={showPw ? 'text' : 'password'}
                      placeholder={isSignup ? 'อย่างน้อย 6 ตัวอักษร' : 'รหัสผ่านของคุณ'}
                      value={vals.pw} onChange={e => set('pw', e.target.value)} autoComplete={isSignup ? 'new-password' : 'current-password'} />
                    <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(s => !s)} aria-label={showPw ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}><Eye off={showPw} /></button>
                  </div>
                  {errs.pw && <div className="auth-err">{errs.pw}</div>}
                  {isSignup && vals.pw && (
                    <div className="auth-strength">
                      <div className="auth-strength-bars">
                        {[1,2,3].map(i => <span key={i} style={{ background: i <= st ? STRENGTH[st].color : 'var(--line)' }} />)}
                      </div>
                      <span className="auth-strength-label" style={{ color: STRENGTH[st].color }}>{STRENGTH[st].label}</span>
                    </div>
                  )}
                </div>
                {isSignup && (
                  <div className="field">
                    <label htmlFor="f-pw2">ยืนยันรหัสผ่าน</label>
                    <div className="auth-pw-wrap">
                      <input id="f-pw2" className={'input has-suffix' + (errs.pw2 ? ' err' : '')} type={showPw2 ? 'text' : 'password'} placeholder="กรอกรหัสผ่านอีกครั้ง"
                        value={vals.pw2} onChange={e => set('pw2', e.target.value)} autoComplete="new-password" />
                      <button type="button" className="auth-pw-toggle" onClick={() => setShowPw2(s => !s)} aria-label={showPw2 ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}><Eye off={showPw2} /></button>
                    </div>
                    {errs.pw2 && <div className="auth-err">{errs.pw2}</div>}
                  </div>
                )}
              </div>

              {!isSignup ? (
                <div className="auth-options">
                  <span />
                  <button type="button" className="auth-link" onClick={() => swap('forgot')}>ลืมรหัสผ่าน?</button>
                </div>
              ) : (
                <div className="auth-options" style={{ alignItems: 'flex-start' }}>
                  <label className="auth-check"><input type="checkbox" checked={agree} onChange={e => { setAgree(e.target.checked); if (errs.agree) setErrs(p => ({ ...p, agree: null })); }} />
                    <span>ยอมรับ<button type="button" className="auth-link" onClick={(ev)=>{ev.preventDefault();setLegal('terms');}}>เงื่อนไขการใช้งาน</button>และ<button type="button" className="auth-link" onClick={(ev)=>{ev.preventDefault();setLegal('privacy');}}>นโยบายความเป็นส่วนตัว</button></span>
                  </label>
                </div>
              )}
              {errs.agree && <div className="auth-err" style={{ marginTop: 6 }}>{errs.agree}</div>}
              {errs.form && <div className="auth-err" style={{ marginTop: 10 }}>{errs.form}</div>}

              <button className="auth-submit" type="submit" disabled={busy}>
                {busy ? <span className="auth-spinner" /> : (isSignup ? 'สร้างบัญชี' : 'เข้าสู่ระบบ')}
              </button>
            </form>

            <div className="auth-foot">
              {isSignup
                ? <span>มีบัญชีอยู่แล้ว? <button className="auth-link" onClick={() => swap('login')}>เข้าสู่ระบบ</button></span>
                : <span>ยังไม่มีบัญชี? <button className="auth-link" onClick={() => swap('signup')}>สมัครใช้งานฟรี</button></span>}
            </div>
          </div>
        </div>
      </div>
      {legal && <LegalModal which={legal} onClose={() => setLegal(null)} onAccept={() => { setAgree(true); setErrs(p => ({ ...p, agree: null })); setLegal(null); }} />}
    </div>
  );
}
