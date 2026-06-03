import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────
// QUICK SUBJECTS
// ─────────────────────────────────────────────
const QUICK_SUBJECTS = [
  'งานด่วนตอน 5 โมงเย็นคืออะไร???',
  'ทำไมประชุมไม่มีวาระล่วงหน้า',
  'Feedback ที่คุณขอมา 2 อาทิตย์แล้วอยู่ไหน',
  'ขอโบนัสหน่อยได้มั้ย',
  'เลิก Micromanage ได้แล้ว',
];
const SIGNATURES = [
  'จากพนักงานที่ยังไม่ได้โบนัส',
  'ด้วยความเคารพ (แต่ไม่เท่าไหร่)',
  'Best regards แต่ไม่ best มากนัก',
  'Sincerely ไม่จริง',
  'จากคนที่ทำงานแทนทุกคน',
];

// ─────────────────────────────────────────────
// SHREDDER ANIMATION
// ─────────────────────────────────────────────
function ShredderAnim({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'absolute', inset: 0, zIndex: 100,
            background: '#1a1a2e',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 12,
          }}
        >
          {/* Paper strips flying down */}
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: -80, x: (i - 5) * 18, opacity: 1, scaleY: 1 }}
              animate={{ y: 180, x: (i - 5) * 22, opacity: 0, scaleY: 3 }}
              transition={{ duration: 0.6 + i * 0.04, delay: 0.1 + i * 0.03, ease: 'easeIn' }}
              style={{
                position: 'absolute', top: '40%',
                width: 14, height: 40,
                background: i % 2 === 0 ? '#fef3c7' : '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 1,
              }}
            />
          ))}

          {/* Shredder machine */}
          <motion.div
            initial={{ scale: 0.8 }} animate={{ scale: 1 }}
            style={{ textAlign: 'center', zIndex: 10 }}
          >
            <div style={{ fontSize: 52 }}>🗃️</div>
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: 3, duration: 0.4 }}
              style={{
                fontFamily: "'Bangers',cursive", fontSize: 22,
                color: '#fef3c7', letterSpacing: 3, marginTop: 8,
                textShadow: '2px 2px 0 #dc2626',
              }}
            >
              SHREDDING…
            </motion.div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
              ทำลายหลักฐานเรียบร้อย
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────
// EMAIL SKIN
// ─────────────────────────────────────────────
// ─── เสียงชักโครก ───
function playFlushSound() {
  try {
    const audio = new Audio('/sounds/flush.mp3');
    audio.volume = 0.8;
    audio.play();
  } catch {}
}

export default function EmailSkin({ onBack }) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sigIndex, setSigIndex] = useState(0);
  const [shredding, setShredding] = useState(false);
  const [sent, setSent] = useState(false);

  const canSend = to.trim() || subject.trim() || body.trim();

  const handleSend = () => {
    if (!canSend || shredding) return;
    playFlushSound();
    setShredding(true);
    setTimeout(() => {
      setShredding(false);
      setSent(true);
      // เคลียร์ทุกอย่าง
      setTo(''); setSubject(''); setBody('');
    }, 1800);
    setTimeout(() => setSent(false), 4000);
  };

  const sentStyle = {
    fontFamily: "'Bangers',cursive", fontSize: 14,
    color: '#16a34a', letterSpacing: 2,
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#f8fafc', position: 'relative', overflow: 'hidden',
    }}>
      <ShredderAnim show={shredding} />

      {/* ── TOP BAR ── */}
      <div style={{
        background: '#1e40af', borderBottom: '4px solid #1a1a2e',
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 20, color: '#fef3c7', padding: 0,
        }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Bangers',cursive", fontSize: 16, color: '#fef3c7', letterSpacing: 2 }}>
            📧 NEW MESSAGE
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: 700, letterSpacing: 1 }}>
            ไม่มี Sent Items • ไม่มีหลักฐาน
          </div>
        </div>
        {sent && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={sentStyle}>✓ SHREDDED!</motion.div>}
      </div>

      {/* ── QUICK SUBJECTS ── */}
      <div style={{
        background: '#dbeafe', borderBottom: '2px solid #1a1a2e',
        padding: '6px 10px',
      }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#1e40af', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
          💡 หัวข้อด่วน
        </div>
        <div style={{ display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 2 }}>
          {QUICK_SUBJECTS.map((s, i) => (
            <button key={i} onClick={() => setSubject(s)}
              style={{
                flexShrink: 0, fontSize: 9, fontWeight: 700, padding: '3px 8px',
                background: '#fff', border: '1.5px solid #1e40af',
                borderRadius: 3, cursor: 'pointer', color: '#1e40af', whiteSpace: 'nowrap',
              }}
            >{s}</button>
          ))}
        </div>
      </div>

      {/* ── EMAIL FORM ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

        {/* To */}
        <div style={{
          display: 'flex', alignItems: 'center',
          borderBottom: '2px solid #e5e7eb', padding: '8px 14px', gap: 8,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', width: 40, flexShrink: 0 }}>To:</span>
          <input
            value={to}
            onChange={e => setTo(e.target.value)}
            placeholder="หัวหน้า / ลูกค้า / เพื่อนร่วมงาน..."
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontFamily: "'Comic Neue',cursive", fontSize: 14, fontWeight: 700,
              color: '#1a1a2e', background: 'transparent',
            }}
          />
        </div>

        {/* Subject */}
        <div style={{
          display: 'flex', alignItems: 'center',
          borderBottom: '2px solid #e5e7eb', padding: '8px 14px', gap: 8,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', width: 40, flexShrink: 0 }}>Sub:</span>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="หัวข้อที่อยากตะโกนใส่..."
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontFamily: "'Comic Neue',cursive", fontSize: 14, fontWeight: 700,
              color: '#1a1a2e', background: 'transparent',
            }}
          />
        </div>

        {/* Body */}
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="เนื้อหา: ระบายได้เต็มที่ พิมพ์ยาวแค่ไหนก็ได้ ไม่มีใครเห็น..."
          style={{
            flex: 1, border: 'none', outline: 'none', resize: 'none',
            padding: '14px 14px 8px',
            fontFamily: "'Comic Neue',cursive", fontSize: 14, fontWeight: 700,
            color: '#1a1a2e', background: 'transparent', lineHeight: 1.7,
            minHeight: 160,
          }}
        />

        {/* Signature */}
        <div style={{
          borderTop: '2px dashed #e5e7eb', padding: '8px 14px',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', flexShrink: 0 }}>-- </span>
          <button
            onClick={() => setSigIndex(i => (i + 1) % SIGNATURES.length)}
            style={{
              flex: 1, textAlign: 'left', border: 'none', background: 'none',
              fontFamily: "'Comic Neue',cursive", fontSize: 12, color: '#6b7280',
              cursor: 'pointer', fontStyle: 'italic', padding: 0,
            }}
          >{SIGNATURES[sigIndex]}</button>
          <span style={{ fontSize: 9, color: '#9ca3af', flexShrink: 0 }}>แตะเพื่อเปลี่ยน</span>
        </div>
      </div>

      {/* ── SEND BUTTON ── */}
      <div style={{
        borderTop: '4px solid #1a1a2e', background: '#fff',
        padding: '10px 14px', display: 'flex', gap: 8,
      }}>
        <button onClick={onBack}
          style={{
            fontFamily: "'Bangers',cursive", fontSize: 14, letterSpacing: 1,
            padding: '10px 16px', border: '2px solid #1a1a2e', borderRadius: 6,
            background: '#e5e7eb', cursor: 'pointer',
          }}
        >ยกเลิก</button>
        <motion.button
          whileHover={canSend ? { x: -2, y: -2 } : {}}
          whileTap={canSend ? { x: 1, y: 1 } : {}}
          onClick={handleSend}
          disabled={!canSend || shredding}
          style={{
            flex: 1, fontFamily: "'Bangers',cursive", fontSize: 18, letterSpacing: 2,
            padding: '10px', border: '3px solid #1a1a2e', borderRadius: 6,
            background: canSend ? '#1e40af' : '#e5e7eb',
            color: canSend ? '#fef3c7' : '#9ca3af',
            cursor: canSend ? 'pointer' : 'default',
            boxShadow: canSend ? '4px 4px 0 #1a1a2e' : 'none',
          }}
        >
          {shredding ? '🚽 กำลังชักโครก…' : '🚽 ส่งลงถัง!'}
        </motion.button>
      </div>
    </div>
  );
}