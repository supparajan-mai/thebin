import { getAnalytics, logEvent } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';

// ─────────────────────────────────────────────
// CONFIG — เปลี่ยนค่าเหล่านี้หลังสร้าง Firebase project
// วิธีหา: Firebase Console → Project Settings → Your apps → SDK setup
// ─────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyD8SrIkMayRqnur4p9-2Suwl5zHekxH2bo",
  authDomain:        "the-bin-8fa05.firebaseapp.com",
  projectId:         "the-bin-8fa05",
  storageBucket:     "the-bin-8fa05.firebasestorage.app",
  messagingSenderId: "593712631037",
  appId:             "1:593712631037:web:c1a67a96cd50a4ff1b0294",
  measurementId:     "G-KG8NE78YFP",
};

const app  = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// ─────────────────────────────────────────────
// RECAPTCHA — ต้องสร้างก่อน signInWithPhoneNumber
// containerId คือ id ของ div ที่จะวาง invisible recaptcha
// ─────────────────────────────────────────────
export function setupRecaptcha(containerId) {
  if (window.recaptchaVerifier) {
    window.recaptchaVerifier.clear();
  }
  window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'normal',
    theme: 'light',
    callback: () => {},
    'expired-callback': () => {
      window.recaptchaVerifier = null;
    },
  });
  return window.recaptchaVerifier;
}

// ─────────────────────────────────────────────
// AUTH — ส่ง OTP
// phone format: "+66812345678"
// ─────────────────────────────────────────────
export async function sendOTP(phoneE164) {
  const verifier = setupRecaptcha('recaptcha-container');
  const confirmation = await signInWithPhoneNumber(auth, phoneE164, verifier);
  return confirmation; // เก็บไว้ใช้ confirm OTP
}

// ─────────────────────────────────────────────
// FIRESTORE — ดึง purchases ของ user
// ─────────────────────────────────────────────
export async function fetchUserPurchases(uid) {
  const ref  = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return [];
  return snap.data().purchases || [];
}

// ─────────────────────────────────────────────
// FIRESTORE — สร้าง pending order ก่อนจ่ายเงิน
// webhook จะ update status → 'paid' และ unlock สกิน
// ─────────────────────────────────────────────
export async function createPendingOrder({ uid, itemId, price, omiseChargeId }) {
  const ref = doc(db, 'orders', omiseChargeId);
  await setDoc(ref, {
    uid,
    itemId,
    price,
    omiseChargeId,
    status:    'pending',
    createdAt: serverTimestamp(),
  });
}

// ─────────────────────────────────────────────
// FIRESTORE — unlock สกิน ให้ user (เรียกจาก Cloud Function)
// ─────────────────────────────────────────────
export async function unlockSkinForUser(uid, itemId) {
  const ref = doc(db, 'users', uid);
  await setDoc(ref, {
    purchases:  arrayUnion(itemId),
    updatedAt:  serverTimestamp(),
  }, { merge: true });
}

// ─────────────────────────────────────────────
// ANALYTICS EVENTS — เรียกใช้ในแอปเพื่อ track พฤติกรรม
// ─────────────────────────────────────────────
export function trackEvent(name, params = {}) {
  try { logEvent(analytics, name, params); } catch {}
}

// Events สำเร็จรูปที่ใช้บ่อย
export const track = {
  // User มาถึงหน้า Shop
  viewShop: ()             => trackEvent('view_shop'),

  // User คลิกปุ่มซื้อ
  beginCheckout: (itemId, price) => trackEvent('begin_checkout', { item_id: itemId, value: price, currency: 'THB' }),

  // ซื้อสำเร็จ — Firebase จะแสดงใน Revenue dashboard
  purchase: (itemId, price) => trackEvent('purchase', { item_id: itemId, value: price, currency: 'THB', transaction_id: Date.now().toString() }),

  // User login ด้วยเบอร์โทร
  login: ()                => trackEvent('login', { method: 'phone' }),

  // User กด "ทิ้ง!" — core action ของแอป
  dispose: (fx)            => trackEvent('dispose', { effect: fx }),

  // User เปิด skin
  openSkin: (skinId)       => trackEvent('open_skin', { skin_id: skinId }),
};
