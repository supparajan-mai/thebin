import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, sendOTP, fetchUserPurchases } from './firebase.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useEffect } from 'react';

// ─────────────────────────────────────────────
// FORMAT เบอร์ไทย → E.164
// 0812345678 → +66812345678
// ─────────────────────────────────────────────
function toE164(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('66')) return '+' + digits;
  if (digits.startsWith('0'))  return '+66' + digits.slice(1);
  return '+66' + digits;
}

function isValidThai(phone) {
  const digits = phone.replace(/\D/g, '');
  // เบอร์ไทย 10 หลัก หรือ 66+9 หลัก
  return /^(0[6-9]\d{8}|66[6-9]\d{8})$/.test(digits);
}

// ─────────────────────────────────────────────
// OTP INPUT — 6 ช่อง
// ─────────────────────────────────────────────
function OTPInput({ value, onChange }) {
  const inputs = useRef([]);

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !e.target.value && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handleChange = (i, e) => {
    const ch = e.target.value.replace(/\D/g, '').slice(-1);
    const arr = value.split('');
    arr[i] = ch;
    const next = arr.join('').padEnd(6, '');
    onChange(next.slice(0, 6));
    if (ch && i < 5) {
      inputs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, ''));
    inputs.current[Math.min(pasted.length, 5)]?.focus();
    e.preventDefault();
  };

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={el => inputs.current[i] = el}
          type="text" inputMode="numeric" maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          style={{
            width: 40, height: 48, textAlign: 'center',
            fontFamily: "'Bangers',cursive", fontSize: 24,
            border: `3px solid ${value[i] ? '#1d4ed8' : '#1a1a2e'}`,
            borderRadius: 6, outline: 'none',
            background: value[i] ? '#eff6ff' : '#fff',
            color: '#1a1a2e',
            boxShadow: value[i] ? '2px 2px 0 #1d4ed8' : '2px 2px 0 #1a1a2e',
            transition: 'all .15s',
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// AUTH MODAL
// ─────────────────────────────────────────────
export function AuthModal({ onClose, onLogin }) {
  const [step, setStep]             = useState('phone'); // phone | otp | loading
  const [phone, setPhone]           = useState('');
  const [otp, setOtp]               = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [errMsg, setErrMsg]         = useState('');
  const [countdown, setCountdown]   = useState(0);
  const timerRef = useRef(null);

  const startCountdown = () => {
    setCountdown(60);
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timerRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async () => {
    if (!isValidThai(phone)) {
      setErrMsg('กรุณากรอกเบอร์โทรไทยให้ถูกต้อง (0X-XXXX-XXXX)');
      return;
    }
    setErrMsg('');
    setStep('loading');
    try {
      const confirm = await sendOTP(toE164(phone));
      setConfirmation(confirm);
      setStep('otp');
      startCountdown();
    } catch (err) {
      setErrMsg(getErrMsg(err));
      setStep('phone');
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 6) { setErrMsg('กรอก OTP ให้ครบ 6 หลัก'); return; }
    setErrMsg('');
    setStep('loading');
    try {
      const result   = await confirmation.confirm(otp);
      const uid      = result.user.uid;
      const purchases = await fetchUserPurchases(uid);
      onLogin({ user: result.user, purchases });
      onClose();
    } catch (err) {
      setErrMsg(getErrMsg(err));
      setStep('otp');
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setOtp('');
    setErrMsg('');
    setStep('loading');
    try {
      const confirm = await sendOTP(toE164(phone));
      setConfirmation(confirm);
      setStep('otp');
      startCountdown();
    } catch (err) {
      setErrMsg(getErrMsg(err));
      setStep('phone');
    }
  };

  function getErrMsg(err) {
    const code = err?.code || '';
    if (code === 'auth/invalid-phone-number')    return 'เบอร์โทรไม่ถูกต้อง';
    if (code === 'auth/too-many-requests')       return 'ส่ง OTP บ่อยเกินไป รอสักครู่แล้วลองใหม่';
    if (code === 'auth/invalid-verification-code') return 'OTP ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
    if (code === 'auth/code-expired')            return 'OTP หมดอายุแล้ว กด "ส่งใหม่"';
    return `เกิดข้อผิดพลาด: ${err?.message || 'unknown'}`;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      {/* reCAPTCHA — ต้องแสดงผลเพื่อให้ Safari ทำงานได้ */}
      <div id="recaptcha-container" style={{ display: "flex", justifyContent: "center", marginBottom: 8 }} />

      <motion.div
        initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fef3c7', border: '5px solid #1a1a2e',
          borderRadius: 14, padding: 24, width: '100%', maxWidth: 320,
          boxShadow: '8px 8px 0 #1a1a2e',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 36, marginBottom: 4 }}>📱</div>
          <div style={{ fontFamily: "'Bangers',cursive", fontSize: 24, color: '#1a1a2e', letterSpacing: 3 }}>
            {step === 'otp' ? 'กรอก OTP' : 'เข้าสู่ระบบ'}
          </div>
          <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4, lineHeight: 1.5 }}>
            {step === 'otp'
              ? `ส่ง SMS ไปที่ ${phone} แล้ว`
              : 'เพื่อซิงค์สกินข้ามเครื่อง ไม่ต้องจำ password'}
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {errMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                background: '#fef2f2', border: '2px solid #dc2626',
                borderRadius: 6, padding: '6px 10px', marginBottom: 12,
                fontSize: 11, color: '#dc2626', fontWeight: 700,
              }}
            >⚠️ {errMsg}</motion.div>
          )}
        </AnimatePresence>

        {/* Step: Phone */}
        {(step === 'phone' || step === 'loading') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                fontSize: 13, fontWeight: 700, color: '#6b7280',
              }}>🇹🇭 +66</span>
              <input
                type="tel" inputMode="numeric"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                placeholder="0812345678"
                disabled={step === 'loading'}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  border: '3px solid #1a1a2e', borderRadius: 8,
                  padding: '12px 12px 12px 64px',
                  fontFamily: "'Comic Neue',cursive", fontSize: 18, fontWeight: 700,
                  outline: 'none', background: '#fff', letterSpacing: 2,
                }}
              />
            </div>

            <motion.button
              whileHover={step !== 'loading' ? { x: -2, y: -2 } : {}}
              whileTap={step !== 'loading' ? { x: 1, y: 1 } : {}}
              onClick={handleSendOTP}
              disabled={step === 'loading'}
              style={{
                fontFamily: "'Bangers',cursive", fontSize: 20, letterSpacing: 2,
                padding: '12px', border: '3px solid #1a1a2e', borderRadius: 8,
                background: step === 'loading' ? '#e5e7eb' : '#1d4ed8',
                color: step === 'loading' ? '#9ca3af' : '#fef3c7',
                cursor: step === 'loading' ? 'default' : 'pointer',
                boxShadow: step !== 'loading' ? '4px 4px 0 #1a1a2e' : 'none',
              }}
            >
              {step === 'loading' ? '⏳ กำลังส่ง…' : 'ส่ง OTP 📨'}
            </motion.button>
          </div>
        )}

        {/* Step: OTP */}
        {step === 'otp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <OTPInput value={otp} onChange={setOtp} />

            <motion.button
              whileHover={{ x: -2, y: -2 }} whileTap={{ x: 1, y: 1 }}
              onClick={handleVerifyOTP}
              disabled={otp.length < 6}
              style={{
                fontFamily: "'Bangers',cursive", fontSize: 20, letterSpacing: 2,
                padding: '12px', border: '3px solid #1a1a2e', borderRadius: 8,
                background: otp.length >= 6 ? '#16a34a' : '#e5e7eb',
                color: otp.length >= 6 ? '#fef3c7' : '#9ca3af',
                cursor: otp.length >= 6 ? 'pointer' : 'default',
                boxShadow: otp.length >= 6 ? '4px 4px 0 #1a1a2e' : 'none',
              }}
            >✓ ยืนยัน OTP</motion.button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => { setStep('phone'); setOtp(''); setErrMsg(''); }}
                style={{ fontSize: 11, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >เปลี่ยนเบอร์</button>
              <button
                onClick={handleResend}
                disabled={countdown > 0}
                style={{
                  fontSize: 11, fontWeight: 700, background: 'none', border: 'none',
                  color: countdown > 0 ? '#9ca3af' : '#dc2626',
                  cursor: countdown > 0 ? 'default' : 'pointer',
                }}
              >
                {countdown > 0 ? `ส่งใหม่ได้ใน ${countdown}s` : 'ส่ง OTP ใหม่'}
              </button>
            </div>
          </div>
        )}

        {/* Privacy note */}
        <div style={{
          marginTop: 16, paddingTop: 12, borderTop: '2px dashed #e5e7eb',
          fontSize: 9, color: '#9ca3af', textAlign: 'center', lineHeight: 1.6,
        }}>
          🔒 เบอร์โทรใช้เพื่อยืนยันตัวตนเท่านั้น<br/>
          ไม่เก็บข้อความ ไม่ส่งโฆษณา ไม่แชร์ข้อมูล
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// useAuth HOOK — จัดการ auth state ทั้งแอป
// ─────────────────────────────────────────────
export function useAuth() {
  const [user, setUser]         = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const p = await fetchUserPurchases(firebaseUser.uid);
          setPurchases(p);
        } catch {
          setPurchases([]);
        }
      } else {
        setUser(null);
        setPurchases([]);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setPurchases([]);
  };

  const refreshPurchases = async () => {
    if (!user) return;
    const p = await fetchUserPurchases(user.uid);
    setPurchases(p);
  };

  return { user, purchases, authLoading, logout, refreshPurchases };
}
