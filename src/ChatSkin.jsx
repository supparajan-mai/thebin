import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────
// DEFAULT TARGETS
// ─────────────────────────────────────────────
const DEFAULT_TARGETS = [
  { id: 1, name: 'เจ้านาย', avatar: '😤', active: true },
  { id: 2, name: 'เพื่อนร่วมงาน', avatar: '🙄', active: false },
  { id: 3, name: 'ลูกค้า', avatar: '😠', active: false },
  { id: 4, name: '+', avatar: null, active: false, isAdd: true },
  { id: 5, name: '+', avatar: null, active: false, isAdd: true },
];

const AVATARS = ['😤', '🙄', '😠', '🤬', '😡', '👿', '💀', '🐍', '🐷', '🤡', '😈', '🦠'];

// ─────────────────────────────────────────────
// CHAT SKIN
// ─────────────────────────────────────────────
export default function ChatSkin({ onBack }) {
  const [targets, setTargets] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('thebin_chat_targets'));
      return saved || DEFAULT_TARGETS;
    } catch { return DEFAULT_TARGETS; }
  });
  const [messages, setMessages] = useState([]); // ไม่เคยบันทึก
  const [input, setText_internal] = useState('');
  const setInput = setText_internal;
  const [editingTarget, setEditingTarget] = useState(null); // { id, name, avatar }
  const [showEditModal, setShowEditModal] = useState(false);
  const [sendAnim, setSendAnim] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const activeTarget = targets.find(t => t.active && !t.isAdd) || targets[0];

  useEffect(() => {
    try {
      localStorage.setItem('thebin_chat_targets', JSON.stringify(targets));
    } catch {}
  }, [targets]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectTarget = (id) => {
    setTargets(prev => prev.map(t => ({ ...t, active: t.id === id })));
    setMessages([]); // เคลียร์ข้อความเมื่อเปลี่ยน target
  };

  // เก็บ timer ของแต่ละข้อความ เพื่อ reset ได้
  const fadeTimers = useRef({});
  const readTimers = useRef({});

  const resetFadeTimer = (msgId) => {
    // ยกเลิก timer เก่า
    if (fadeTimers.current[msgId]) clearTimeout(fadeTimers.current[msgId]);
    if (readTimers.current[msgId]) clearTimeout(readTimers.current[msgId]);

    // reset Read → false ก่อน แล้วค่อยขึ้นใหม่
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, read: false } : m));

    // Read หลัง 1.5 วิ หลังหยุดพิมพ์
    readTimers.current[msgId] = setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, read: true } : m));
    }, 1500);

    // หายใน 8 วิ หลังหยุดพิมพ์
    fadeTimers.current[msgId] = setTimeout(() => {
      setMessages(prev => prev.filter(m => m.id !== msgId));
      delete fadeTimers.current[msgId];
      delete readTimers.current[msgId];
    }, 8000);
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    const msg = { id: Date.now(), text: input.trim(), ts: new Date(), read: false };
    setMessages(prev => [...prev, msg]);
    setInput('');
    setSendAnim(true);
    setTimeout(() => setSendAnim(false), 400);

    // เริ่มนับครั้งแรก
    resetFadeTimer(msg.id);
  };

  // ทุกครั้งที่พิมพ์ → reset timer ของข้อความล่าสุด
  const handleInputChange = (e) => {
    setText_internal(e.target.value);
    const lastMsg = messages[messages.length - 1];
    if (lastMsg) resetFadeTimer(lastMsg.id);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const openEdit = (target) => {
    setEditingTarget({ ...target });
    setShowEditModal(true);
  };

  const saveEdit = () => {
    if (!editingTarget.name.trim()) return;
    setTargets(prev => prev.map(t =>
      t.id === editingTarget.id
        ? { ...t, name: editingTarget.name, avatar: editingTarget.avatar, isAdd: false }
        : t
    ));
    setShowEditModal(false);
    setEditingTarget(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#dce9f5' }}>

      {/* ── TOP BAR ── */}
      <div style={{
        background: '#4f8ef7', borderBottom: 'none',
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 20, color: '#fef3c7', padding: 0, lineHeight: 1,
        }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: "'Bangers',cursive", fontSize: 16, color: '#fef3c7',
            letterSpacing: 2, lineHeight: 1,
          }}>
            {activeTarget?.avatar} {activeTarget?.name || 'เลือกคู่กรณี'}
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: 700, letterSpacing: 1 }}>
            ข้อความจะหายใน 8 วิ • ไม่มีบันทึก
          </div>
        </div>
        <button
          onClick={() => activeTarget && !activeTarget.isAdd && openEdit(activeTarget)}
          style={{
            background: '#fef3c7', border: '2px solid #1a1a2e',
            borderRadius: 4, padding: '3px 8px', cursor: 'pointer',
            fontFamily: "'Bangers',cursive", fontSize: 11, color: '#1a1a2e',
            letterSpacing: 1, boxShadow: '2px 2px 0 #1a1a2e',
          }}
        >✏️ แก้ไข</button>
      </div>

      {/* ── TARGET TABS ── */}
      <div style={{
        background: '#4f8ef7', borderBottom: 'none',
        padding: '6px 10px', display: 'flex', gap: 6, overflowX: 'auto',
      }}>
        {targets.map(t => (
          <button key={t.id}
            onClick={() => t.isAdd ? openEdit(t) : selectTarget(t.id)}
            style={{
              flexShrink: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 2,
              background: t.active ? '#fef3c7' : 'rgba(255,255,255,0.15)',
              border: `2px solid ${t.active ? '#1a1a2e' : 'transparent'}`,
              borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
              minWidth: 44,
              boxShadow: t.active ? '2px 2px 0 #1a1a2e' : 'none',
            }}
          >
            <span style={{ fontSize: 18 }}>{t.isAdd ? '➕' : t.avatar}</span>
            <span style={{
              fontSize: 8, fontWeight: 700,
              color: t.active ? '#1a1a2e' : 'rgba(255,255,255,0.8)',
              letterSpacing: 0.5, maxWidth: 44, overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {t.isAdd ? 'เพิ่ม' : t.name}
            </span>
          </button>
        ))}
      </div>

      {/* ── CHAT AREA ── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '12px 14px',
        display: 'flex', flexDirection: 'column', gap: 8,
        background: '#dce9f5',
      }}>
        {messages.length === 0 && (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 6, opacity: 0.5,
          }}>
            <div style={{ fontSize: 32 }}>{activeTarget?.avatar || '💬'}</div>
            <div style={{
              fontFamily: "'Comic Neue',cursive", fontSize: 12,
              color: '#374151', textAlign: 'center', fontWeight: 700,
            }}>
              ระบายอะไรก็ได้ใส่ {activeTarget?.name || 'คู่กรณี'}<br />
              <span style={{ fontSize: 10, fontWeight: 400, color: '#6b7280' }}>
                ข้อความจะหายไปอัตโนมัติ ไม่มีคนเห็น
              </span>
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: -30, scale: 0.85 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.8, filter: 'blur(4px)' }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              style={{ display: 'flex', justifyContent: 'flex-end' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, maxWidth: '82%' }}>
                {/* Read + time — ซ้ายของ bubble */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, flexShrink: 0 }}>
                  {msg.read && (
                    <span style={{ fontSize: 9, color: '#4f8ef7', fontWeight: 700 }}>Read</span>
                  )}
                  <span style={{ fontSize: 9, color: '#8a9bb5' }}>
                    {msg.ts.getHours().toString().padStart(2,'0')}:{msg.ts.getMinutes().toString().padStart(2,'0')}
                  </span>
                </div>
                {/* Bubble */}
                <div style={{
                  background: '#4cd964', color: '#1a1a2e',
                  borderRadius: '18px 18px 4px 18px',
                  padding: '9px 14px',
                  fontFamily: "'Comic Neue',cursive", fontSize: 14, fontWeight: 600,
                  lineHeight: 1.5, boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                  wordBreak: 'break-word',
                }}>
                  {msg.text}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* ── INPUT ── */}
      <div style={{
        borderTop: '1px solid #c8d8ea', background: '#fff',
        padding: '8px 10px', display: 'flex', gap: 8, alignItems: 'flex-end',
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={`พิมพ์ใส่ ${activeTarget?.name || 'คู่กรณี'}…`}
          rows={1}
          style={{
            flex: 1, border: '1.5px solid #c8d8ea', borderRadius: 20,
            padding: '8px 12px', resize: 'none', outline: 'none',
            fontFamily: "'Comic Neue',cursive", fontSize: 14, fontWeight: 700,
            color: '#1a1a2e', background: '#fef3c7', lineHeight: 1.4,
            maxHeight: 90, overflowY: 'auto',
          }}
        />
        <motion.button
          animate={sendAnim ? { scale: [1, 1.2, 0.9, 1] } : {}}
          onClick={sendMessage}
          disabled={!input.trim()}
          style={{
            background: input.trim() ? '#4f8ef7' : '#e5e7eb',
            border: '3px solid #1a1a2e', borderRadius: 8,
            width: 44, height: 44, flexShrink: 0,
            cursor: input.trim() ? 'pointer' : 'default',
            fontSize: 18, boxShadow: input.trim() ? '3px 3px 0 #1a1a2e' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >📨</motion.button>
      </div>

      {/* ── EDIT TARGET MODAL ── */}
      <AnimatePresence>
        {showEditModal && editingTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'absolute', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.65)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 20,
            }}
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: '#fef3c7', border: '4px solid #1a1a2e',
                borderRadius: 12, padding: 20, width: '100%', maxWidth: 280,
                boxShadow: '6px 6px 0 #1a1a2e',
              }}
            >
              <div style={{ fontFamily: "'Bangers',cursive", fontSize: 18, color: '#1a1a2e', letterSpacing: 2, marginBottom: 12 }}>
                ตั้งชื่อคู่กรณี
              </div>

              {/* Avatar picker */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>เลือก Emoji</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {AVATARS.map(av => (
                    <button key={av} onClick={() => setEditingTarget(t => ({ ...t, avatar: av }))}
                      style={{
                        fontSize: 22, width: 38, height: 38,
                        border: `2px solid ${editingTarget.avatar === av ? '#06b6d4' : '#e5e7eb'}`,
                        borderRadius: 6, cursor: 'pointer',
                        background: editingTarget.avatar === av ? '#e0f2fe' : '#fff',
                        boxShadow: editingTarget.avatar === av ? '2px 2px 0 #0891b2' : 'none',
                      }}
                    >{av}</button>
                  ))}
                </div>
              </div>

              {/* Name input */}
              <input
                value={editingTarget.name === '+' ? '' : editingTarget.name}
                onChange={e => setEditingTarget(t => ({ ...t, name: e.target.value }))}
                placeholder="ชื่อคู่กรณี..."
                maxLength={20}
                style={{
                  width: '100%', border: '3px solid #1a1a2e', borderRadius: 6,
                  padding: '8px 10px', fontFamily: "'Comic Neue',cursive",
                  fontSize: 14, fontWeight: 700, outline: 'none',
                  background: '#fff', boxSizing: 'border-box', marginBottom: 12,
                }}
              />

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowEditModal(false)}
                  style={{
                    flex: 1, fontFamily: "'Bangers',cursive", fontSize: 15, letterSpacing: 1,
                    padding: '8px', border: '2px solid #1a1a2e', borderRadius: 6,
                    background: '#e5e7eb', cursor: 'pointer',
                  }}
                >ยกเลิก</button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={saveEdit}
                  style={{
                    flex: 1, fontFamily: "'Bangers',cursive", fontSize: 15, letterSpacing: 1,
                    padding: '8px', border: '2px solid #1a1a2e', borderRadius: 6,
                    background: '#06b6d4', color: '#fef3c7', cursor: 'pointer',
                    boxShadow: '2px 2px 0 #1a1a2e',
                  }}
                >บันทึก</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}