import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────
// DART SKIN
// ─────────────────────────────────────────────
export default function DartSkin({ onBack }) {
  const [hitCount, setHitCount] = useState(0);
  const [maxHits, setMaxHits] = useState(10);           // เลือกได้
  const [phase, setPhase] = useState('setup');         // setup | ready | done
  const [targetName, setTargetName] = useState('');
  const [targetEmoji, setTargetEmoji] = useState('😤');
  const [dartPos, setDartPos] = useState(null);        // { x, y } บนเป้า
  const [shaking, setShaking] = useState(false);
  const [finalFade, setFinalFade] = useState(false);
  const [dartFlying, setDartFlying] = useState(false);
  const boardRef = useRef(null);

  const EMOJIS = ['😤', '🙄', '😠', '🤬', '😡', '👿', '💀', '🐍', '🐷', '🤡', '😈', '🦠', '🐀', '🦷'];
  

  const dartPositions = [
    { x: '35%', y: '30%' }, { x: '58%', y: '48%' }, { x: '42%', y: '60%' },
    { x: '62%', y: '32%' }, { x: '28%', y: '55%' }, { x: '50%', y: '25%' },
    { x: '68%', y: '60%' }, { x: '32%', y: '38%' }, { x: '55%', y: '65%' },
    { x: '45%', y: '40%' }, { x: '38%', y: '68%' }, { x: '60%', y: '42%' },
    { x: '30%', y: '45%' }, { x: '65%', y: '38%' }, { x: '48%', y: '55%' },
  ];
  // วนซ้ำถ้าปาเกินจำนวน position
  const getDartPos = (i) => dartPositions[i % dartPositions.length];

  const handleStart = () => {
    if (!targetName.trim()) return;
    setPhase('ready');
    setHitCount(0);
    setDartPos(null);
    setFinalFade(false);
  };

  const handleThrow = () => {
    if (dartFlying || phase === 'done' || phase === 'setup') return;

    setDartFlying(true);
    const nextHit = hitCount + 1;

    setTimeout(() => {
      setDartPos(getDartPos(hitCount));
      setHitCount(nextHit);
      setShaking(true);
      setDartFlying(false);

      setTimeout(() => setShaking(false), 400);

      if (nextHit >= maxHits) {
        setPhase('final');
        setTimeout(() => {
          setFinalFade(true);
          setTimeout(() => {
            setPhase('done');
          }, 1500);
        }, 600);
      } else {
        setPhase(`hit${nextHit}`);
      }
    }, 400);
  };

  const handleReset = () => {
    setPhase('setup');
    setHitCount(0);
    setDartPos(null);
    setFinalFade(false);
    setTargetName('');
    setShaking(false);
    setDartFlying(false);
  };

  // เสียง (Web Audio API)
  const playHitSound = (isFinal = false) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isFinal) {
        // เสียงดังก้อง
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.6, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(); osc.stop(ctx.currentTime + 0.5);
      } else {
        // เสียงฉึก!
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start(); osc.stop(ctx.currentTime + 0.2);
      }
    } catch {}
  };

  const handleThrowWithSound = () => {
    const nextHit = hitCount + 1;
    playHitSound(nextHit >= maxHits);
    handleThrow();
  };

  const hitLabel = ['', 'ฉึก!', 'ฉึก!!', '💥 BOOM!!!'];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#1a1a2e', position: 'relative', overflow: 'hidden',
    }}>

      {/* ── TOP BAR ── */}
      <div style={{
        background: '#dc2626', borderBottom: '4px solid #1a1a2e',
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 20, color: '#fef3c7', padding: 0,
        }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Bangers',cursive", fontSize: 16, color: '#fef3c7', letterSpacing: 2 }}>
            🎯 THE DART
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: 700, letterSpacing: 1 }}>
            ปาให้สะใจ ให้ความโกรธจางหายไป
          </div>
        </div>
        {phase !== 'setup' && (
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: maxHits }).map((_, i) => (
              <div key={i} style={{
                width: 12, height: 12, borderRadius: '50%',
                background: i < hitCount ? '#fbbf24' : 'rgba(255,255,255,0.2)',
                border: '1.5px solid #fef3c7',
              }} />
            ))}
          </div>
        )}
      </div>

      {/* ── SETUP PHASE ── */}
      <AnimatePresence mode="wait">
        {phase === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: 24, gap: 16,
            }}
          >
            <div style={{ fontFamily: "'Bangers',cursive", fontSize: 24, color: '#fef3c7', letterSpacing: 3, textAlign: 'center' }}>
              ใครทำให้คุณโกรธ?
            </div>

            {/* Emoji picker */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 260 }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setTargetEmoji(e)}
                  style={{
                    fontSize: 24, width: 42, height: 42,
                    border: `2px solid ${targetEmoji === e ? '#fbbf24' : '#374151'}`,
                    borderRadius: 8, cursor: 'pointer',
                    background: targetEmoji === e ? '#374151' : 'transparent',
                  }}
                >{e}</button>
              ))}
            </div>

            <div style={{ fontSize: 48 }}>{targetEmoji}</div>

            <input
              value={targetName}
              onChange={e => setTargetName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
              placeholder="ชื่อคู่กรณี..."
              maxLength={20}
  autoFocus
              style={{
                border: '3px solid #374151', borderRadius: 8,
                padding: '10px 14px', background: '#111827',
                color: '#fef3c7', fontFamily: "'Comic Neue',cursive",
                fontSize: 16, fontWeight: 700, textAlign: 'center',
                outline: 'none', width: '100%', maxWidth: 240,
                boxSizing: 'border-box',
              }}
            />

            {/* เลือกจำนวนครั้ง */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%', maxWidth: 240 }}>
              <div style={{ fontSize: 12, color: '#fbbf24', fontWeight: 700, letterSpacing: 1 }}>
                จะปากี่ครั้ง? 🎯
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                {[3, 5, 10, 20, 50, 99].map(n => (
                  <button key={n} onClick={() => setMaxHits(n)}
                    style={{
                      fontFamily: "'Bangers',cursive", fontSize: 16, letterSpacing: 1,
                      padding: '6px 14px',
                      background: maxHits === n ? '#dc2626' : '#1f2937',
                      color: maxHits === n ? '#fef3c7' : '#9ca3af',
                      border: `2px solid ${maxHits === n ? '#fef3c7' : '#374151'}`,
                      borderRadius: 6, cursor: 'pointer',
                    }}
                  >{n}</button>
                ))}
              </div>
              <div style={{ fontSize: 10, color: '#6b7280' }}>เลือกได้ตั้งแต่ 3 ถึง 99 ครั้ง</div>
            </div>

            <motion.button
              whileHover={targetName.trim() ? { scale: 1.04 } : {}}
              whileTap={targetName.trim() ? { scale: 0.96 } : {}}
              onClick={handleStart}
              disabled={!targetName.trim()}
              style={{
                fontFamily: "'Bangers',cursive", fontSize: 22, letterSpacing: 3,
                padding: '12px 36px',
                background: targetName.trim() ? '#dc2626' : '#374151',
                color: '#fef3c7', border: '3px solid #fef3c7',
                borderRadius: 8, cursor: targetName.trim() ? 'pointer' : 'default',
                boxShadow: targetName.trim() ? '4px 4px 0 #7f1d1d' : 'none',
              }}
            >
              🎯 ตั้งเป้า!
            </motion.button>
          </motion.div>
        )}

        {/* ── GAME PHASE ── */}
        {phase !== 'setup' && (
          <motion.div
            key="game"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '16px 20px', gap: 12,
            }}
          >
            {/* Hit label */}
            <AnimatePresence>
              {hitCount > 0 && (
                <motion.div
                  key={hitCount}
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.3, opacity: 0 }}
                  style={{
                    fontFamily: "'Bangers',cursive", fontSize: 28,
                    color: hitCount >= maxHits ? '#fbbf24' : '#fca5a5',
                    letterSpacing: 3, textShadow: '3px 3px 0 #7f1d1d',
                  }}
                >
                  {hitLabel[hitCount]}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dartboard */}
            <motion.div
              ref={boardRef}
              animate={shaking ? { x: [-6, 6, -4, 4, -2, 2, 0] } : {}}
              transition={{ duration: 0.3 }}
              style={{
                position: 'relative', width: 220, height: 220,
                flexShrink: 0,
              }}
            >
              {/* Rings */}
              {[110, 90, 70, 50, 30, 14].map((r, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  width: r * 2, height: r * 2,
                  left: 110 - r, top: 110 - r,
                  borderRadius: '50%',
                  background: i % 2 === 0
                    ? (i === 0 ? '#1a1a2e' : i === 2 ? '#dc2626' : '#15803d')
                    : (i === 1 ? '#fef3c7' : i === 3 ? '#fef3c7' : '#fef3c7'),
                  border: '2px solid rgba(0,0,0,0.3)',
                }}/>
              ))}

              {/* Target emoji */}
              <motion.div
                animate={finalFade ? { opacity: 0, scale: 0.3, filter: 'blur(8px)' } : { opacity: 1 }}
                transition={finalFade ? { duration: 1.2, ease: 'easeIn' } : {}}
                style={{
                  position: 'absolute',
                  left: '50%', top: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: 36, zIndex: 5,
                  userSelect: 'none',
                  textAlign: 'center', lineHeight: 1,
                }}
              >
                <div>{targetEmoji}</div>
                <div style={{
                  fontFamily: "'Comic Neue',cursive", fontSize: 9,
                  color: '#1a1a2e', fontWeight: 700,
                  whiteSpace: 'nowrap', maxWidth: 60,
                  overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {targetName}
                </div>
              </motion.div>

              {/* Darts stuck in board */}
              {Array.from({ length: hitCount }).map((_, i) => {
              const pos = getDartPos(i);
              return (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{
                    position: 'absolute',
                    left: pos.x, top: pos.y,
                    fontSize: 16, zIndex: 10,
                    transform: 'rotate(-45deg)',
                    filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.5))',
                  }}
                >🎯</motion.div>
              );
              })}

              {/* Flying dart animation */}
              <AnimatePresence>
                {dartFlying && (
                  <motion.div
                    initial={{ left: '-30%', top: '50%', scale: 0.5 }}
                    animate={{ left: '40%', top: '40%', scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    style={{
                      position: 'absolute', fontSize: 22, zIndex: 20,
                      transform: 'rotate(90deg)',
                    }}
                  >🎯</motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Throw Button or Done */}
            {phase === 'done' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
              >
                <div style={{ fontSize: 40 }}>✨</div>
                <div style={{
                  fontFamily: "'Bangers',cursive", fontSize: 20,
                  color: '#fbbf24', letterSpacing: 3, textShadow: '2px 2px 0 #7f1d1d',
                }}>
                  ความโกรธจางหายแล้ว
                </div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>หายใจลึกๆ นะ…</div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReset}
                  style={{
                    fontFamily: "'Bangers',cursive", fontSize: 16, letterSpacing: 2,
                    padding: '10px 24px',
                    background: '#dc2626', color: '#fef3c7',
                    border: '3px solid #fef3c7', borderRadius: 8,
                    cursor: 'pointer', boxShadow: '4px 4px 0 #7f1d1d',
                    marginTop: 4,
                  }}
                >
                  🔄 ปาอีกรอบ
                </motion.button>
              </motion.div>
            ) : (
              <motion.button
                whileHover={!dartFlying ? { scale: 1.05 } : {}}
                whileTap={!dartFlying ? { scale: 0.95 } : {}}
                onClick={handleThrowWithSound}
                disabled={dartFlying}
                style={{
                  fontFamily: "'Bangers',cursive", fontSize: 22, letterSpacing: 3,
                  padding: '14px 40px',
                  background: '#dc2626', color: '#fef3c7',
                  border: '4px solid #fef3c7', borderRadius: 10,
                  cursor: dartFlying ? 'default' : 'pointer',
                  boxShadow: '5px 5px 0 #7f1d1d',
                  opacity: dartFlying ? 0.6 : 1,
                }}
              >
                {dartFlying ? '…' : `🎯 ปา! (${hitCount}/${maxHits})`}
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}