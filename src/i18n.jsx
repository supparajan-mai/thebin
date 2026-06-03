import { createContext, useContext, useState } from 'react';

// ─────────────────────────────────────────────
// TRANSLATIONS
// ─────────────────────────────────────────────
export const TRANSLATIONS = {
  th: {
    // Header
    tagline1: 'ปล่อยความกังวลของคุณ',
    tagline2: 'ให้เป็นหน้าที่เรา',
    streak: '🔥 streak',
    pts: '⭐ pts',

    // Nav
    nav_bin: '🗑 BIN',
    nav_chat: '💬 CHAT',
    nav_email: '📧 EMAIL',
    nav_dart: '🎯 DART',
    nav_shop: '🛍 SHOP',

    // Daily banner
    daily_done: '✓ Daily Boom เสร็จแล้ว!',
    daily_ready: 'Daily Boom พร้อมแล้ว!',
    daily_done_btn: 'DONE',
    daily_pts: '+50 PTS',

    // Tabs
    tab_type: 'TYPE',
    tab_draw: 'DRAW',
    tab_voice: 'VOICE',

    // Surface
    placeholder: 'ระบายมันออกมาเลย เพื่อนเอ๋ย…',
    placeholder_done: '✓ ทิ้งไปแล้ว! หายใจลึกๆ นะ…',

    // Dispose button
    dispose_btn: 'ทิ้ง!',

    // Footer
    footer_left: 'THE BIN · ISSUE #1 · 2026',
    footer_right: 'AMAZING DISPOSAL COMICS',
    footer_book: '📖 Paperback บน Amazon',
    footer_terms: 'Terms',
    footer_privacy: 'Privacy',

    // Error
    crashed_title: 'เกิดข้อผิดพลาด',
    crashed_btn: 'ลองใหม่',

    // Voice
    voice_unsupported: 'ใช้ Chrome หรือ Safari นะ!',
    voice_listening: 'กำลังฟัง…',
    voice_tap: 'แตะไมค์เพื่อเริ่ม',
    voice_clear: 'Clear',

    // Shop
    shop_title: '🛍 BIN SHOP',
    shop_subtitle: 'สกินและเอฟเฟคพิเศษ',
    shop_login_btn: '🔑 Login',
    shop_login_banner: 'Login ด้วยเบอร์โทรเพื่อซื้อสกิน และซิงค์ข้ามเครื่องได้ทุกที่',
    shop_payment_note: 'ชำระผ่าน Omise — รองรับบัตรเครดิต / PromptPay — สกินซิงค์อัตโนมัติทุกเครื่อง',
    buy_btn: 'ซื้อเลย!',
    owned_btn: 'ใช้งานแล้ว',
    login_first: '🔑 Login ก่อน',
    success_msg: 'ปลดล็อกสำเร็จ! ซิงค์ข้ามเครื่องได้แล้ว 🎉',
    success_btn: 'ไปใช้งาน!',
    already_owned: 'ซื้อแล้ว',

    // Auth
    auth_title: 'เข้าสู่ระบบ',
    auth_otp_title: 'กรอก OTP',
    auth_subtitle: 'เพื่อซิงค์สกินข้ามเครื่อง ไม่ต้องจำ password',
    auth_send_btn: 'ส่ง OTP 📨',
    auth_sending: '⏳ กำลังส่ง…',
    auth_confirm_btn: '✓ ยืนยัน OTP',
    auth_change_phone: 'เปลี่ยนเบอร์',
    auth_resend: 'ส่ง OTP ใหม่',
    auth_resend_wait: 'ส่งใหม่ได้ใน',
    auth_privacy: 'เบอร์โทรใช้เพื่อยืนยันตัวตนเท่านั้น\nไม่เก็บข้อความ ไม่ส่งโฆษณา ไม่แชร์ข้อมูล',
    auth_phone_placeholder: '0812345678',

    // Locked overlay
    locked_shop_btn: '🛍 ซื้อ',
    locked_back: '← กลับ',
  },

  en: {
    // Header
    tagline1: 'Release what weighs you down.',
    tagline2: "We'll take it from here.",
    streak: '🔥 streak',
    pts: '⭐ pts',

    // Nav
    nav_bin: '🗑 BIN',
    nav_chat: '💬 CHAT',
    nav_email: '📧 EMAIL',
    nav_dart: '🎯 DART',
    nav_shop: '🛍 SHOP',

    // Daily banner
    daily_done: "✓ Today's release done!",
    daily_ready: 'Daily release ready!',
    daily_done_btn: 'DONE',
    daily_pts: '+50 PTS',

    // Tabs
    tab_type: 'TYPE',
    tab_draw: 'DRAW',
    tab_voice: 'VOICE',

    // Surface
    placeholder: 'Let it all out, friend…',
    placeholder_done: '✓ Released! Take a deep breath…',

    // Dispose button
    dispose_btn: 'TOSS IT!',

    // Footer
    footer_left: 'THE BIN · ISSUE #1 · 2026',
    footer_right: 'AMAZING DISPOSAL COMICS',
    footer_book: '📖 Paperback on Amazon',
    footer_terms: 'Terms',
    footer_privacy: 'Privacy',

    // Error
    crashed_title: 'Something went wrong',
    crashed_btn: 'Try again',

    // Voice
    voice_unsupported: 'Use Chrome or Safari!',
    voice_listening: 'Listening…',
    voice_tap: 'Tap mic to start',
    voice_clear: 'Clear',

    // Shop
    shop_title: '🛍 BIN SHOP',
    shop_subtitle: 'Skins & Special Effects',
    shop_login_btn: '🔑 Login',
    shop_login_banner: 'Login with your phone to buy skins and sync across all your devices.',
    shop_payment_note: 'Pay via Omise — Credit card / PromptPay — Skins sync automatically.',
    buy_btn: 'Buy now!',
    owned_btn: 'Owned',
    login_first: '🔑 Login first',
    success_msg: 'Unlocked! Now synced across all your devices 🎉',
    success_btn: "Let's go!",
    already_owned: 'Owned',

    // Auth
    auth_title: 'Sign In',
    auth_otp_title: 'Enter OTP',
    auth_subtitle: 'Sync skins across devices. No password needed.',
    auth_send_btn: 'Send OTP 📨',
    auth_sending: '⏳ Sending…',
    auth_confirm_btn: '✓ Verify OTP',
    auth_change_phone: 'Change number',
    auth_resend: 'Resend OTP',
    auth_resend_wait: 'Resend in',
    auth_privacy: 'Your number is used for verification only.\nNo messages, no ads, no data sharing.',
    auth_phone_placeholder: '+66812345678',

    // Locked overlay
    locked_shop_btn: '🛍 Buy',
    locked_back: '← Back',
  },
};

// ─────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────
const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('thebin_lang') || 'th';
  });

  const switchLang = (l) => {
    setLang(l);
    localStorage.setItem('thebin_lang', l);
  };

  const t = TRANSLATIONS[lang];

  return (
    <LangContext.Provider value={{ lang, switchLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

// ─────────────────────────────────────────────
// LANG TOGGLE BUTTON
// ─────────────────────────────────────────────
export function LangToggle() {
  const { lang, switchLang } = useLang();
  return (
    <button
      onClick={() => switchLang(lang === 'th' ? 'en' : 'th')}
      style={{
        background: 'rgba(255,255,255,0.15)',
        border: '2px solid rgba(255,255,255,0.4)',
        borderRadius: 4, padding: '2px 8px',
        cursor: 'pointer', fontSize: 11, fontWeight: 700,
        color: '#fef3c7', letterSpacing: 1,
        transition: 'all .15s',
      }}
    >
      {lang === 'th' ? 'EN' : 'TH'}
    </button>
  );
}
