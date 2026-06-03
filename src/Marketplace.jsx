import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────
// OMISE CONFIG
// ─────────────────────────────────────────────
const OMISE_PUBLIC_KEY = 'pkey_test_67vpfb3dkcivf7440ns';

// Cloud Function URL — เปลี่ยนหลัง deploy
const CLOUD_FN_URL = 'https://createcharge-yi76acbafa-uc.a.run.app';

// ─────────────────────────────────────────────
// SHOP ITEMS
// ─────────────────────────────────────────────
export const SHOP_ITEMS = [
  {
    id: 'skin_chat', type: 'skin',
    preview: '/skins/chat-preview.png',
    name: 'Vent & Release', subtitle: 'Chat Edition', emoji: '💬',
    price: 89, amountSatang: 8900,
    badge: 'PRO PACK', badgeColor: '#7c3aed',
    desc: 'เปลี่ยน The Bin เป็นหน้าต่างแชท LINE Style ระบายใส่คู่กรณีได้สูงสุด 5 คน ข้อความหายไปทันที',
    features: ['หน้าตาแชทเหมือน LINE', 'ตั้งชื่อ + รูปคู่กรณีได้', 'บันทึกได้สูงสุด 5 คน', 'ข้อความไม่มีวันถูกเก็บ'],
    color: '#7c3aed', darkColor: '#4c1d95',
  },
  {
    id: 'skin_email', type: 'skin',
    preview: '/skins/email-preview.png',
    name: 'The Professional', subtitle: 'Email Edition', emoji: '📧',
    price: 89, amountSatang: 8900,
    badge: 'OFFICE PACK', badgeColor: '#0891b2',
    desc: 'จำลองการเขียนอีเมลหาหัวหน้าหรือลูกค้า แล้วส่งลง "ถังขยะ" แทน พร้อม animation เครื่องทำลายเอกสาร',
    features: ['หน้า Compose Email เต็มรูปแบบ', 'กำหนดลายเซ็นกวนๆ ได้', 'Animation "Shredder"', 'ไม่มี Sent Items — ไม่มีหลักฐาน'],
    color: '#0891b2', darkColor: '#164e63',
  },
  {
    id: 'skin_dart', type: 'skin',
    preview: '/skins/dart-preview.png',
    name: 'The Dart', subtitle: 'One Hit Release', emoji: '🎯',
    price: 109, amountSatang: 10900,
    badge: 'INTERACTIVE', badgeColor: '#dc2626',
    desc: 'ปาลูกดอกใส่รูปคู่กรณี 3 ครั้ง แล้วรูปจะค่อยๆ เลือนหายพร้อมเสียง "ฉึก!" สะใจที่สุดในปฐพี',
    features: ['เป้าขนาดใหญ่ใส่รูปคู่กรณีได้', 'เสียงปาสมจริง 2 แบบ', 'Animation Fade Out ครั้งที่ 3', 'รีเซ็ตได้ไม่จำกัด'],
    color: '#dc2626', darkColor: '#7f1d1d',
  },
  {
    id: 'bundle_all', type: 'bundle',
    name: 'The Whole Bin', subtitle: 'All Skins Bundle', emoji: '🗑️',
    price: 249, amountSatang: 24900,
    originalPrice: 287,
    badge: '🔥 BEST VALUE', badgeColor: '#16a34a',
    desc: 'ซื้อทั้ง 3 สกินในราคาพิเศษ ประหยัดกว่าซื้อแยก 38 บาท',
    features: ['Chat Skin (ปกติ 89฿)', 'Email Skin (ปกติ 89฿)', 'Dart Skin (ปกติ 109฿)', 'รับสกินใหม่ก่อนใคร (Early Access)'],
    color: '#16a34a', darkColor: '#14532d',
    includes: ['skin_chat', 'skin_email', 'skin_dart'],
  },
];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
export function isOwned(itemId, purchases) {
  if (purchases.includes(itemId)) return true;
  if (purchases.includes('bundle_all')) {
    const bundle = SHOP_ITEMS.find(i => i.id === 'bundle_all');
    if (bundle?.includes?.includes(itemId)) return true;
  }
  // bundle_all เป็นเจ้าของถ้ามีทุก skin ครบ
  const allSkins = ['skin_chat', 'skin_email', 'skin_dart'];
  if (itemId === 'bundle_all' && allSkins.every(s => purchases.includes(s))) return true;
  return false;
}

// ─────────────────────────────────────────────
// OMISE HOOK
// ─────────────────────────────────────────────
function useOmise() {
  const [loaded, setLoaded] = useState(!!window.OmiseCard);

  if (!loaded && !window._omiseLoading) {
    window._omiseLoading = true;
    const s = document.createElement('script');
    s.src = 'https://cdn.omise.co/omise.js';
    s.onload = () => setLoaded(true);
    document.head.appendChild(s);
  }

  const openCheckout = ({ item, uid, onSuccess, onError }) => {
    if (!window.OmiseCard) { onError('ยังโหลด payment gateway ไม่เสร็จ'); return; }

    window.OmiseCard.configure({
      publicKey: OMISE_PUBLIC_KEY,
      currency: 'thb',
      frameLabel: 'THE BIN!',
      frameDescription: item.name,
      defaultPaymentMethod: 'promptpay',
      otherPaymentMethods: ['credit_card'],
    });

    window.OmiseCard.open({
      amount: item.amountSatang,
      onCreateTokenSuccess: async (nonce) => {
        try {
          // nonce อาจเป็น token (บัตร) หรือ source (PromptPay)
          const isSource = nonce && nonce.startsWith('src_');
          const res = await fetch(CLOUD_FN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token:  isSource ? undefined : nonce,
              source: isSource ? nonce : undefined,
              itemId: item.id,
              uid,
              amount: item.amountSatang,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Payment failed');
          onSuccess(data);
        } catch (err) {
          onError(err.message);
        }
      },
      onFormClosed: () => {},
    });
  };

  return { loaded, openCheckout };
}

// ─────────────────────────────────────────────
// SHOP CARD
// ─────────────────────────────────────────────
function ShopCard({ item, purchases, uid, onBuySuccess, onNeedLogin }) {
  const [buying, setBuying] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const omise = useOmise();
  const owned = isOwned(item.id, purchases);

  const handleBuy = () => {
    if (!uid) { onNeedLogin(); return; }
    setBuying(true);
    setErrMsg('');
    omise.openCheckout({
      item, uid,
      onSuccess: () => {
        setBuying(false);
        onBuySuccess(item);
      },
      onError: (msg) => {
        setBuying(false);
        setErrMsg(msg);
      },
    });
    setTimeout(() => setBuying(false), 8000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: '#fff', border: '4px solid #1a1a2e',
        borderRadius: 10, overflow: 'hidden',
        boxShadow: '5px 5px 0 #1a1a2e', position: 'relative',
      }}
    >
      {/* Badges */}
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, background: item.badgeColor, color: '#fff', fontFamily: "'Bangers',cursive", fontSize: 10, letterSpacing: 1.5, padding: '2px 8px', borderRadius: 3, border: '2px solid #1a1a2e', boxShadow: '2px 2px 0 #1a1a2e' }}>
        {item.badge}
      </div>
      {owned && (
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 2, background: '#16a34a', color: '#fff', fontFamily: "'Bangers',cursive", fontSize: 10, letterSpacing: 1.5, padding: '2px 8px', borderRadius: 3, border: '2px solid #1a1a2e', boxShadow: '2px 2px 0 #1a1a2e' }}>
          ✓ ซื้อแล้ว
        </div>
      )}

      {/* Header */}
      <div style={{ background: item.color, padding: '18px 16px 14px', borderBottom: '4px solid #1a1a2e', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 36, background: '#fff', border: '3px solid #1a1a2e', borderRadius: 8, width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '3px 3px 0 #1a1a2e', flexShrink: 0 }}>{item.emoji}</div>
        <div>
          <div style={{ fontFamily: "'Bangers',cursive", fontSize: 22, color: '#fef3c7', letterSpacing: 2, lineHeight: 1, textShadow: '2px 2px 0 rgba(0,0,0,0.3)' }}>{item.name}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 }}>{item.subtitle}</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '12px 14px' }}>
        <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.6, margin: '0 0 10px' }}>{item.desc}</p>

        {/* Preview Image */}
{item.preview && (
  <img src={item.preview} alt={item.name}
    style={{
      width: '100%', borderRadius: 8,
      border: `2px solid ${item.color}`,
      display: 'block',
      objectFit: 'contain',
      maxHeight: 280,
      background: '#f9fafb',
      marginBottom: 10,
    }}
    onError={e => { e.target.style.display = 'none'; }}
  />
)}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
          {item.features.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
              <span style={{ color: item.color, fontWeight: 700 }}>✓</span>
              <span style={{ color: '#374151' }}>{f}</span>
            </div>
          ))}
        </div>

        {errMsg && (
          <div style={{ fontSize: 10, color: '#dc2626', fontWeight: 700, marginBottom: 8, background: '#fef2f2', border: '1px solid #dc2626', borderRadius: 4, padding: '4px 8px' }}>
            ⚠️ {errMsg}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderTop: '2px dashed #e5e7eb', paddingTop: 10 }}>
          <div style={{ flex: 1 }}>
            {item.originalPrice && (
              <div style={{ fontSize: 10, color: '#9ca3af', textDecoration: 'line-through', fontWeight: 700 }}>฿{item.originalPrice}</div>
            )}
            <div style={{ fontFamily: "'Bangers',cursive", fontSize: 26, color: '#1a1a2e', letterSpacing: 1, lineHeight: 1 }}>฿{item.price}</div>
          </div>
          <motion.button
            whileHover={!owned ? { x: -2, y: -2 } : {}}
            whileTap={!owned ? { x: 1, y: 1 } : {}}
            onClick={handleBuy}
            disabled={owned || buying}
            style={{
              fontFamily: "'Bangers',cursive", fontSize: 15, letterSpacing: 2,
              padding: '8px 18px',
              background: owned ? '#e5e7eb' : item.color,
              color: owned ? '#9ca3af' : '#fef3c7',
              border: '3px solid #1a1a2e', borderRadius: 6,
              cursor: owned ? 'default' : 'pointer',
              boxShadow: owned ? 'none' : '3px 3px 0 #1a1a2e',
              transition: 'all .1s',
            }}
          >
            {buying ? '⏳…' : owned ? 'ใช้งานแล้ว' : !uid ? '🔑 Login ก่อน' : 'ซื้อเลย!'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// SUCCESS MODAL
// ─────────────────────────────────────────────
function SuccessModal({ item, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.7, rotate: -8 }} animate={{ scale: 1, rotate: -2 }}
        onClick={e => e.stopPropagation()}
        style={{ background: '#fef3c7', border: '5px solid #1a1a2e', borderRadius: 14, padding: 28, maxWidth: 300, width: '100%', boxShadow: '8px 8px 0 #1a1a2e', textAlign: 'center' }}
      >
        <div style={{ fontSize: 56, marginBottom: 8 }}>{item.emoji}</div>
        <div style={{ fontFamily: "'Bangers',cursive", fontSize: 28, color: '#dc2626', letterSpacing: 3, textShadow: '3px 3px 0 #7f1d1d' }}>สำเร็จ!!</div>
        <div style={{ fontFamily: "'Bangers',cursive", fontSize: 20, color: '#1a1a2e', letterSpacing: 2, margin: '6px 0 4px' }}>{item.name}</div>
        <p style={{ fontSize: 12, color: '#374151', marginBottom: 20 }}>ปลดล็อกสำเร็จ! ซิงค์ข้ามเครื่องได้แล้ว 🎉</p>
        <motion.button
          whileHover={{ x: -2, y: -2 }} whileTap={{ x: 1, y: 1 }}
          onClick={onClose}
          style={{ fontFamily: "'Bangers',cursive", fontSize: 18, letterSpacing: 2, padding: '10px 28px', background: '#dc2626', color: '#fef3c7', border: '3px solid #1a1a2e', borderRadius: 8, cursor: 'pointer', boxShadow: '4px 4px 0 #1a1a2e' }}
        >ไปใช้งาน!</motion.button>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// MARKETPLACE MAIN
// ─────────────────────────────────────────────
export default function Marketplace({ user, purchases, onRefreshPurchases, onNeedLogin }) {
  const [successItem, setSuccessItem] = useState(null);

  const handleBuySuccess = async (item) => {
    await onRefreshPurchases(); // ดึง purchases ใหม่จาก Firestore
    setSuccessItem(item);
  };

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Header */}
      <div style={{ background: '#1d4ed8', borderBottom: '4px solid #1a1a2e', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: "'Bangers',cursive", fontSize: 22, color: '#fef3c7', letterSpacing: 2, textShadow: '2px 2px 0 #1e3a8a' }}>🛍 BIN SHOP</div>
          <div style={{ fontSize: 9, color: '#93c5fd', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>สกินและเอฟเฟคพิเศษ</div>
        </div>
        {user ? (
          <div style={{ background: '#fef3c7', border: '2px solid #1a1a2e', borderRadius: 4, padding: '3px 10px', fontFamily: "'Bangers',cursive", fontSize: 10, color: '#1a1a2e', letterSpacing: 1, boxShadow: '2px 2px 0 #1a1a2e', textAlign: 'right' }}>
            <div>📱 {user.phoneNumber}</div>
            <div style={{ fontSize: 8, color: '#6b7280' }}>{purchases.length} สกิน</div>
          </div>
        ) : (
          <button onClick={onNeedLogin}
            style={{ background: '#fef3c7', border: '2px solid #1a1a2e', borderRadius: 4, padding: '5px 10px', cursor: 'pointer', fontFamily: "'Bangers',cursive", fontSize: 11, color: '#dc2626', letterSpacing: 1, boxShadow: '2px 2px 0 #1a1a2e' }}
          >🔑 Login</button>
        )}
      </div>

      {/* Login prompt banner */}
      {!user && (
        <div style={{ margin: '10px 12px 0', padding: '8px 12px', background: '#fffbeb', border: '2px dashed #f59e0b', borderRadius: 6, fontSize: 11, color: '#92400e', fontWeight: 700, display: 'flex', gap: 6, alignItems: 'center' }}>
          <span>💡</span>
          <span>Login ด้วยเบอร์โทรเพื่อซื้อสกิน และซิงค์ข้ามเครื่องได้ทุกที่</span>
        </div>
      )}

      {/* Cards */}
      <div style={{ padding: '12px 12px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {SHOP_ITEMS.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <ShopCard
              item={item}
              purchases={purchases}
              uid={user?.uid}
              onBuySuccess={handleBuySuccess}
              onNeedLogin={onNeedLogin}
            />
          </motion.div>
        ))}
      </div>

      {/* Payment note */}
      <div style={{ margin: '14px 12px 0', padding: '8px 12px', background: '#f0fdf4', border: '2px dashed #16a34a', borderRadius: 6, fontSize: 10, color: '#15803d', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>🔒</span>
        <span>ชำระผ่าน Omise — รองรับบัตรเครดิต / PromptPay — สกินซิงค์อัตโนมัติทุกเครื่อง</span>
      </div>

      {/* ─── ABOUT SECTION ─── */}
      <div style={{
        margin: '16px 12px 0',
        border: '3px solid #1a1a2e',
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: '4px 4px 0 #1a1a2e',
      }}>
        {/* Header */}
        <div style={{
          background: '#fce7f3', borderBottom: '3px solid #1a1a2e',
          padding: '12px 14px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <img src="/skins/logo.png" alt="ตั้งใจคราฟท์"
            style={{ width: 52, height: 52, borderRadius: '50%', border: '2px solid #1a1a2e', objectFit: 'cover' }}
          />
          <div>
            <div style={{ fontFamily: "'Bangers',cursive", fontSize: 18, color: '#be185d', letterSpacing: 2, lineHeight: 1 }}>
              ตั้งใจคราฟท์ Collection
            </div>
            <div style={{ fontSize: 10, color: '#9d174d', fontWeight: 700, letterSpacing: 1, marginTop: 2 }}>
              ผู้พัฒนา The Bin
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ background: '#fff', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.7, margin: 0 }}>
            The Bin สร้างขึ้นด้วยความตั้งใจให้เป็นพื้นที่ปลอดภัยสำหรับการระบายอารมณ์
            ทุก pixel ทำด้วยใจ 🩷
          </p>

          {/* Line */}
          <a href="https://line.me/R/ti/p/@tangjaicraft" target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#dcfce7', border: '2px solid #16a34a',
              borderRadius: 8, padding: '8px 12px', textDecoration: 'none',
            }}>
            <span style={{ fontSize: 20 }}>💬</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#15803d' }}>ติดต่อ / ส่ง feedback</div>
              <div style={{ fontSize: 10, color: '#16a34a' }}>LINE Official @tangjaicraft</div>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#16a34a', fontWeight: 700 }}>→</span>
          </a>

          {/* Ko-fi */}
          <a href="https://ko-fi.com/tangjaicraftcollection" target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#fff7ed', border: '2px solid #f59e0b',
              borderRadius: 8, padding: '8px 12px', textDecoration: 'none',
            }}>
            <span style={{ fontSize: 20 }}>☕</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#92400e' }}>ซื้อกาแฟให้ทีมงาน</div>
              <div style={{ fontSize: 10, color: '#b45309' }}>ko-fi.com/tangjaicraftcollection</div>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#b45309', fontWeight: 700 }}>→</span>
          </a>

          <div style={{ fontSize: 9, color: '#9ca3af', textAlign: 'center', paddingTop: 4 }}>
            ผู้ donate จะได้รับสิทธิพิเศษในอนาคต 🎁
          </div>
        </div>
      </div>

      <div style={{ height: 20 }} />

      <AnimatePresence>
        {successItem && <SuccessModal item={successItem} onClose={() => setSuccessItem(null)} />}
      </AnimatePresence>
    </div>
  );
}
