/* ============================================================
   firebase.js — Auth (email + Google) + per-user Firestore sync.

   The whole app state lives in localStorage under the "finplan:" prefix.
   On login we hydrate it from the user's Firestore doc; on change we push a
   snapshot back. Local data is cleared on every auth change so two accounts
   on the same device never see each other's data.
   ============================================================ */
import { initializeApp } from 'firebase/app';
import {
  getAuth, setPersistence, browserLocalPersistence, GoogleAuthProvider,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup,
  sendPasswordResetEmail, signOut, onAuthStateChanged, updateProfile,
  updatePassword, EmailAuthProvider, reauthenticateWithCredential, deleteUser,
  sendEmailVerification, applyActionCode, verifyPasswordResetCode, confirmPasswordReset,
  connectAuthEmulator,
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, serverTimestamp, connectFirestoreEmulator } from 'firebase/firestore';
import { saveToSQLite, hydrateFromSQLite } from './sqlite';

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// True once a real config is present (lets the app show a friendly setup notice
// instead of crashing when .env is empty).
export const firebaseReady = !!cfg.apiKey && !!cfg.projectId;
const IS_DEV = import.meta.env.DEV;

let auth = null, db = null;
export const googleProvider = new GoogleAuthProvider();

if (firebaseReady) {
  const app = initializeApp(cfg);
  auth = getAuth(app);
  db = getFirestore(app);
  setPersistence(auth, browserLocalPersistence).catch(() => {});
  // In DEV, route auth to the local Firebase Auth Emulator so test sign-ups
  // never touch the production user pool. (Data already goes to local SQLite.)
  // Start it with `npm run emu`. Production builds never reach this branch.
  if (IS_DEV) {
    try { connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true }); } catch (e) {}
    try { connectFirestoreEmulator(db, '127.0.0.1', 8080); } catch (e) {}
    console.log('🔧 DEV: Firebase Auth/Firestore emulators (local test — not production)');
  }
}
export { auth, db };

/* ---------- local <-> cloud state ---------- */
const PREFIX = 'finplan:';

export function clearLocalState() {
  Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).forEach(k => localStorage.removeItem(k));
}
function snapshotLocal() {
  const out = {};
  Object.keys(localStorage).filter(k => k.startsWith(PREFIX)).forEach(k => { out[k] = localStorage.getItem(k); });
  return out;
}
function applyIdentity(user) {
  // Keep finplan:profile in step with the signed-in account.
  const key = PREFIX + 'profile';
  let prof = {};
  try { prof = JSON.parse(localStorage.getItem(key) || '{}'); } catch (e) {}
  prof.email = user.email || prof.email || '';
  if (!prof.name) prof.name = user.displayName || prof.name || (user.email ? user.email.split('@')[0] : 'ผู้ใช้งาน');
  prof.provider = (user.providerData[0]?.providerId || '').includes('google') ? 'google' : 'email';
  localStorage.setItem(key, JSON.stringify(prof));
}

// Pull this user's saved state into localStorage (clearing whatever was there).
export async function hydrateFromCloud(user) {
  clearLocalState();

  if (IS_DEV) {
    console.log('SQLite: Hydrating from local DB...');
    const map = await hydrateFromSQLite(user.uid);
    Object.entries(map).forEach(([k, v]) => { if (k.startsWith(PREFIX)) localStorage.setItem(k, v); });
    applyIdentity(user);
    return;
  }

  if (db) {
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists() && snap.data().stateJson) {
        const map = JSON.parse(snap.data().stateJson);
        Object.entries(map).forEach(([k, v]) => { if (k.startsWith(PREFIX)) localStorage.setItem(k, v); });
      }
    } catch (e) { /* offline / first run — start empty */ }
  }
  applyIdentity(user);
}

// Push the current localStorage snapshot to the user's Firestore doc.
export async function saveToCloud(uid) {
  const snapshot = snapshotLocal();

  if (IS_DEV) {
    console.log('SQLite: Saving to local DB...');
    await saveToSQLite(uid, snapshot);
    return;
  }

  if (!db) return;
  try {
    await setDoc(doc(db, 'users', uid), { stateJson: JSON.stringify(snapshot), updatedAt: serverTimestamp() }, { merge: true });
  } catch (e) { /* will retry on next change */ }
}

// Wipe both local and the user's cloud doc (the in-app "clear all data" action).
export async function resetCloudState() {
  clearLocalState();
  const user = auth && auth.currentUser;
  if (db && user) {
    try { await setDoc(doc(db, 'users', user.uid), { stateJson: JSON.stringify({}), updatedAt: serverTimestamp() }, { merge: true }); } catch (e) {}
  }
}

/* ---------- auth ---------- */
export const watchAuth = (cb) => (auth ? onAuthStateChanged(auth, cb) : (cb(null), () => {}));
export const signInEmail = (email, pw) => signInWithEmailAndPassword(auth, email, pw);
export async function signUpEmail(name, email, pw) {
  const cred = await createUserWithEmailAndPassword(auth, email, pw);
  if (name) { try { await updateProfile(cred.user, { displayName: name }); } catch (e) {} }
  try { await sendEmailVerification(cred.user); } catch (e) {}   // verification link to the user's email
  return cred;
}
// Resend the verification link, and re-check whether the user has clicked it yet.
export const resendVerification = () => sendEmailVerification(auth.currentUser);
export async function reloadUser() { if (auth && auth.currentUser) await auth.currentUser.reload(); return auth && auth.currentUser; }

/* ---------- email-link actions (verify / reset password) ----------
   Used by our own branded action page so the link in the email lands on a
   nice screen instead of Firebase's default handler. */
export const applyVerify = (oobCode) => applyActionCode(auth, oobCode);
export const verifyResetCode = (oobCode) => verifyPasswordResetCode(auth, oobCode); // resolves to the email
export const confirmReset = (oobCode, newPw) => confirmPasswordReset(auth, oobCode, newPw);
export const signInGoogle = () => signInWithPopup(auth, googleProvider);
export const resetPassword = (email) => sendPasswordResetEmail(auth, email);
export async function logout() { clearLocalState(); if (auth) await signOut(auth); }

export async function changePassword(currentPw, newPw) {
  const user = auth.currentUser;
  const cred = EmailAuthProvider.credential(user.email, currentPw);
  await reauthenticateWithCredential(user, cred);
  await updatePassword(user, newPw);
}
export async function deleteAccount() {
  const user = auth.currentUser;
  if (db) { try { await deleteDoc(doc(db, 'users', user.uid)); } catch (e) {} }
  clearLocalState();
  await deleteUser(user);
}

// Firebase error code → friendly Thai message.
export function authMessage(err) {
  const c = (err && err.code) || '';
  const map = {
    'auth/invalid-email': 'รูปแบบอีเมลไม่ถูกต้อง',
    'auth/user-not-found': 'ไม่พบบัญชีนี้',
    'auth/wrong-password': 'รหัสผ่านไม่ถูกต้อง',
    'auth/invalid-credential': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
    'auth/email-already-in-use': 'อีเมลนี้ถูกใช้สมัครแล้ว',
    'auth/weak-password': 'รหัสผ่านอ่อนเกินไป (อย่างน้อย 6 ตัวอักษร)',
    'auth/too-many-requests': 'พยายามหลายครั้งเกินไป ลองใหม่ภายหลัง',
    'auth/popup-closed-by-user': 'ปิดหน้าต่าง Google ก่อนเข้าสู่ระบบ',
    'auth/popup-blocked': 'เบราว์เซอร์บล็อกป๊อปอัป Google — อนุญาตป๊อปอัปแล้วลองใหม่',
    'auth/network-request-failed': 'เชื่อมต่อเครือข่ายไม่สำเร็จ',
    'auth/requires-recent-login': 'โปรดเข้าสู่ระบบใหม่อีกครั้งก่อนทำรายการนี้',
    'auth/operation-not-allowed': 'ยังไม่ได้เปิดวิธีล็อกอินนี้ใน Firebase (Authentication → Sign-in method)',
    'auth/unauthorized-domain': 'โดเมนนี้ยังไม่ได้รับอนุญาต (Firebase → Authentication → Settings → Authorized domains)',
    'auth/configuration-not-found': 'ยังไม่ได้ตั้งค่า Authentication ใน Firebase (เปิด Email/Password ก่อน)',
    'auth/api-key-not-valid': 'API key ไม่ถูกต้อง ตรวจค่าใน .env อีกครั้ง',
  };
  return map[c] || 'เกิดข้อผิดพลาด ลองใหม่อีกครั้ง';
}
