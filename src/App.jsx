import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────
// PARTICLE — outside component, stable ref
// ─────────────────────────────────────────────
class Particle {
  constructor(x, y, opts = {}) {
    this.x = x; this.y = y;
    this.vx = (Math.random() - 0.5) * (opts.spread || 14);
    this.vy = (Math.random() - 0.5) * (opts.spread || 14) - (opts.up || 0);
    this.size = Math.random() * (opts.max || 5) + (opts.min || 1);
    this.color = opts.colors
      ? opts.colors[Math.floor(Math.random() * opts.colors.length)]
      : '#dc2626';
    this.alpha = 1;
    this.decay = opts.decay || 0.015;
    this.gravity = opts.gravity || 0.18;
  }
  update() {
    this.x += this.vx; this.y += this.vy;
    this.vy += this.gravity; this.vx *= 0.97;
    this.alpha -= this.decay;
  }
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ─────────────────────────────────────────────
// LOCALSTORAGE — content NEVER stored
// ─────────────────────────────────────────────
const STORAGE_KEY = 'thebin_v1';

function loadMeta() {
  try {
    const d = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return d || { points: 0, streak: 0, lastDaily: null };
  } catch { return { points: 0, streak: 0, lastDaily: null }; }
}

function saveMeta(m) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(m)); } catch {}
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

function calcStreak(lastDate, current) {
  if (!lastDate) return 1;
  const diff = (new Date(todayStr()) - new Date(lastDate)) / 86400000;
  if (diff < 1) return current;
  if (diff === 1) return current + 1;
  return 1;
}

// ─────────────────────────────────────────────
// VOICE HOOK
// ─────────────────────────────────────────────
function useVoice({ onResult }) {
  const recRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    setSupported(true);
    const r = new SR();
    r.lang = 'th-TH'; r.continuous = true; r.interimResults = true;
    r.onresult = e => onResult(Array.from(e.results).map(x => x[0].transcript).join(''));
    r.onend = () => setListening(false);
    recRef.current = r;
    return () => r.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(() => { recRef.current?.start(); setListening(true); }, []);
  const stop  = useCallback(() => { recRef.current?.stop();  setListening(false); }, []);
  return { listening, supported, start, stop };
}

// ─────────────────────────────────────────────
// EFFECTS CONFIG
// ─────────────────────────────────────────────
const EFFECTS = [
  { id: 'bin',  label: '🗑 BIN',   free: true,  desc: 'ขยำ → ตกถัง → ปุ้ง!!' },
  { id: 'boom', label: '💥 BOOM',  free: true,  desc: 'TNT → KABOOM!!' },
  { id: 'fade', label: '🌫 FADE',  free: true,  desc: 'ค่อยๆ เลือนหาย' },
  { id: 'shh',  label: '🔇 SHHHH', free: true,  desc: 'เสียงค่อยๆ เงียบ' },
  { id: 'fire', label: '🔥 FIRE',  free: false, desc: 'เผาเป็นเถ้า — Phase 2' },
  { id: 'flush',label: '🚽 FLUSH', free: false, desc: 'ชักโครก — Phase 2' },
];

// ─────────────────────────────────────────────
// ONOMATOPOEIA OVERLAY
// ─────────────────────────────────────────────
function Onomat({ word, color, show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 1, rotate: -6 }}
          animate={{ scale: 1, opacity: 1, rotate: -4 }}
          exit={{ scale: 1.15, opacity: 0, rotate: -4 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18, exit: { duration: 0.3 } }}
          style={{
            position: 'absolute', left: '50%', top: '50%',
            transform: 'translate(-50%,-50%)',
            fontFamily: "'Bangers', cursive",
            fontSize: 'clamp(40px, 10vw, 64px)',
            color: color || '#dc2626',
            textShadow: '4px 4px 0 #1a1a2e, -2px -2px 0 #fef3c7',
            letterSpacing: '4px', whiteSpace: 'nowrap',
            zIndex: 50, pointerEvents: 'none',
          }}
        >
          {word}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function App() {
  const [meta, setMeta] = useState(loadMeta);
  const [tab, setTab]   = useState('type');
  const [fx, setFx]     = useState('bin');
  const [text, setText] = useState('');
  const [voiceText, setVoiceText] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | animating | done
  const [onomat, setOnomat] = useState({ word: '', color: '', show: false });
  const [placeholder, setPlaceholder] = useState('ระบายมันออกมาเลย เพื่อนเอ๋ย…');

  const particleCanvasRef = useRef(null);
  const drawCanvasRef = useRef(null);
  const particlesRef  = useRef([]);
  const animFrameRef  = useRef(null);
  const isDrawing     = useRef(false);
  const hasDrawn      = useRef(false);

  const voice = useVoice({ onResult: setVoiceText });

  useEffect(() => { saveMeta(meta); }, [meta]);

  // Resize particle canvas
  useEffect(() => {
    const resize = () => {
      if (!particleCanvasRef.current) return;
      particleCanvasRef.current.width  = window.innerWidth;
      particleCanvasRef.current.height = window.innerHeight;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(document.body);
    resize();
    return () => ro.disconnect();
  }, []);

  // Resize draw canvas on tab switch
  useEffect(() => {
    if (tab !== 'draw' || !drawCanvasRef.current) return;
    const el = drawCanvasRef.current;
    const resize = () => {
      el.width  = el.parentElement.clientWidth;
      el.height = el.parentElement.clientHeight;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el.parentElement);
    resize();
    return () => ro.disconnect();
  }, [tab]);

  // Drawing
  const getPos = (e) => {
    const r = drawCanvasRef.current.getBoundingClientRect();
    const s = e.touches ? e.touches[0] : e;
    return [s.clientX - r.left, s.clientY - r.top];
  };
  const onDrawStart = (e) => {
    if (tab !== 'draw') return;
    isDrawing.current = true;
    const ctx = drawCanvasRef.current.getContext('2d');
    const [x, y] = getPos(e);
    ctx.beginPath(); ctx.moveTo(x, y);
  };
  const onDrawMove = (e) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    const ctx = drawCanvasRef.current.getContext('2d');
    const [x, y] = getPos(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke();
    hasDrawn.current = true;
  };
  const onDrawEnd = () => { isDrawing.current = false; };

  const hasContent = () => {
    if (tab === 'type')  return text.trim().length > 0;
    if (tab === 'voice') return voiceText.trim().length > 0;
    if (tab === 'draw')  return hasDrawn.current;
    return false;
  };

  // Clear ALL content — zero retention
  const clearContent = () => {
    setText('');
    setVoiceText('');
    hasDrawn.current = false;
    if (drawCanvasRef.current) {
      const ctx = drawCanvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, drawCanvasRef.current.width, drawCanvasRef.current.height);
    }
  };

  const showOnomat = (word, color) => {
    setOnomat({ word, color, show: true });
    setTimeout(() => setOnomat(o => ({ ...o, show: false })), 900);
  };

  const afterEffect = (delay = 200) => {
    setTimeout(() => {
      clearContent();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      particlesRef.current = [];
      const pctx = particleCanvasRef.current?.getContext('2d');
      if (pctx) pctx.clearRect(0, 0, particleCanvasRef.current.width, particleCanvasRef.current.height);
      setPhase('done');
      setPlaceholder('✓ ทิ้งไปแล้ว! หายใจลึกๆ นะ…');
      setTimeout(() => {
        setPhase('idle');
        setPlaceholder('ระบายมันออกมาเลย เพื่อนเอ๋ย…');
      }, 2000);
    }, delay);
  };

  // Particle loop on canvas
  const runParticles = (spawnFn) => {
    spawnFn();
    const canvas = particleCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = particlesRef.current.filter(p => p.alpha > 0);
      particlesRef.current.forEach(p => { p.update(); p.draw(ctx); });
      if (particlesRef.current.length > 0) animFrameRef.current = requestAnimationFrame(tick);
    };
    tick();
  };

  // ── DISPOSE ──
  const dispose = () => {
    if (!hasContent() || phase !== 'idle') return;
    setPhase('animating');
    if (navigator.vibrate) navigator.vibrate([30, 20, 30]);

    // Daily bonus
    const today = todayStr();
    if (meta.lastDaily !== today) {
      const newStreak = calcStreak(meta.lastDaily, meta.streak);
      const bonus = 50 + (newStreak >= 7 ? 20 : 0) + (newStreak >= 30 ? 50 : 0);
      const newMeta = { points: meta.points + bonus, streak: newStreak, lastDaily: today };
      setMeta(newMeta);
    }

    const fxMap = { bin: runBin, boom: runBoom, fade: runFade, shh: runShh };
    (fxMap[fx] || runBin)();
  };

  // ── EFFECT: BIN ──
  // กระดาษถูกขยำ → ตกลงถัง → ปุ้ง!!
  const runBin = () => {
    const canvas = particleCanvasRef.current;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    // Crumple particles — small grey dots scatter inward
    setTimeout(() => {
      runParticles(() => {
        for (let i = 0; i < 60; i++) {
          particlesRef.current.push(new Particle(
            cx + (Math.random() - 0.5) * 140,
            cy + (Math.random() - 0.5) * 80,
            { spread: 5, up: 2, gravity: 0.4, max: 6, min: 2, decay: 0.022,
              colors: ['#94a3b8', '#cbd5e1', '#e2e8f0', '#f8fafc'] }
          ));
        }
      });
      showOnomat('ปุ้ง!!', '#1d4ed8');
    }, 500);
    afterEffect(1200);
  };

  // ── EFFECT: BOOM ──
  // TNT → KABOOM!! → particles explode
  const runBoom = () => {
    const canvas = particleCanvasRef.current;
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.65;

    setTimeout(() => {
      runParticles(() => {
        for (let i = 0; i < 180; i++) {
          const angle = (i / 180) * Math.PI * 2;
          const p = new Particle(cx, cy, {
            spread: 0, up: 0, gravity: 0.2, max: 7, min: 2, decay: 0.013,
            colors: ['#dc2626','#f59e0b','#fef3c7','#fbbf24','#ef4444','#fff'],
          });
          const speed = 4 + Math.random() * 12;
          p.vx = Math.cos(angle) * speed;
          p.vy = Math.sin(angle) * speed - 2;
          particlesRef.current.push(p);
        }
      });
      showOnomat('KABOOM!!', '#dc2626');
    }, 550);
    afterEffect(1350);
  };

  // ── EFFECT: FADE ──
  // ข้อความค่อยๆ เลือนหาย — handled in AnimatePresence
  const runFade = () => {
    showOnomat('しゅ～～', '#9ca3af');
    afterEffect(1600);
  };

  // ── EFFECT: SHHHH ──
  // Waveform bars collapse → silent
  const runShh = () => {
    showOnomat('shhhh…', '#6b7280');
    afterEffect(1500);
  };

  const dailyDone = meta.lastDaily === todayStr();
  const canDispose = hasContent() && phase === 'idle';

  return (
    <div style={{ width: '100%', maxWidth: 480, position: 'relative' }}>
      {/* Particle canvas — full viewport */}
      <canvas ref={particleCanvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100 }} />

      {/* Global onomatopoeia */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 110 }}>
        <Onomat word={onomat.word} color={onomat.color} show={onomat.show} />
      </div>

      <div style={{
        background: '#fef3c7', border: '5px solid #1a1a2e', borderRadius: 14,
        overflow: 'hidden', boxShadow: '8px 8px 0 #1a1a2e',
      }}>

        {/* ── HEADER ── */}
        <div style={{ background: '#dc2626', borderBottom: '5px solid #1a1a2e', padding: '14px 18px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 5px 0 #7f1d1d' }}>
          <div>
            <div style={{ fontFamily: "'Bangers',cursive", fontSize: 'clamp(32px,8vw,44px)', color: '#fef3c7', letterSpacing: 3, textShadow: '3px 3px 0 #7f1d1d,-1px -1px 0 #1a1a2e', lineHeight: 1 }}>THE BIN!</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#fca5a5', letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: 3, lineHeight: 1.4 }}>ปล่อยความกังวลของคุณ<br/>ให้เป็นหน้าที่เรา</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <StatBubble n={meta.streak} label="🔥 streak" bg="#991b1b" />
            <StatBubble n={meta.points} label="⭐ pts"    bg="#1d4ed8" />
          </div>
        </div>

        {/* ── DAILY BANNER ── */}
        <div style={{ background: dailyDone ? '#065f46' : '#15803d', borderBottom: '3px solid #1a1a2e', padding: '5px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#bbf7d0', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            {dailyDone ? '✓ Daily Boom เสร็จแล้ว!' : 'Daily Boom พร้อมแล้ว!'}
          </span>
          <span style={{ fontFamily: "'Bangers',cursive", fontSize: 13, color: '#fef3c7', background: '#16a34a', border: '2px solid #1a1a2e', padding: '2px 10px', borderRadius: 3, boxShadow: '2px 2px 0 #1a1a2e', letterSpacing: 1 }}>
            {dailyDone ? 'DONE' : '+50 PTS'}
          </span>
        </div>

        {/* ── TABS ── */}
        <div style={{ background: '#1d4ed8', borderBottom: '4px solid #1a1a2e', padding: '8px 14px', display: 'flex', gap: 7, alignItems: 'center' }}>
          {['type','draw','voice'].map(t => (
            <TabBtn key={t} label={t.toUpperCase()} active={tab===t} onClick={() => { setTab(t); hasDrawn.current=false; }} />
          ))}
        </div>

        {/* ── SURFACE ── */}
        <div style={{ margin: '14px 14px 8px', background: '#fff', border: '4px solid #1a1a2e', borderRadius: 8, position: 'relative', overflow: 'hidden', minHeight: 200, boxShadow: '5px 5px 0 #1a1a2e', display: 'flex', flexDirection: 'column' }}>
          <span style={{ position: 'absolute', top: 5, left: 8, fontSize: 8, fontWeight: 700, color: '#dc2626', letterSpacing: 1, opacity: .3, textTransform: 'uppercase' }}>SECRET FEELINGS PANEL</span>
          <span style={{ position: 'absolute', bottom: 5, right: 8, fontSize: 8, fontWeight: 700, color: '#dc2626', letterSpacing: 1, opacity: .3, textTransform: 'uppercase' }}>NO.1 IN DISPOSAL</span>

          <AnimatePresence mode="wait">
            {phase !== 'done' ? (
              <motion.div key={`surface-${tab}-${phase}`} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                exit={fx === 'fade' ? { opacity: 0, filter: 'blur(10px)', scale: 1.04, transition: { duration: 1.2 } } : { opacity: 0, scale: 0.96 }}
              >
                {tab === 'type' && (
                  <textarea value={text} onChange={e => setText(e.target.value)}
                    placeholder={placeholder} autoFocus
                    style={{ flex: 1, width: '100%', border: 'none', outline: 'none', resize: 'none', fontFamily: "'Comic Neue',cursive", fontSize: 18, fontWeight: 700, color: '#1a1a2e', padding: '28px 20px 20px', background: 'transparent', textAlign: 'center', lineHeight: 1.7, minHeight: 200 }}
                  />
                )}
                {tab === 'draw' && (
                  <canvas ref={drawCanvasRef}
                    onMouseDown={onDrawStart} onMouseMove={onDrawMove} onMouseUp={onDrawEnd} onMouseLeave={onDrawEnd}
                    onTouchStart={onDrawStart} onTouchMove={onDrawMove} onTouchEnd={onDrawEnd}
                    style={{ flex: 1, width: '100%', minHeight: 200, cursor: 'crosshair', touchAction: 'none', display: 'block' }}
                  />
                )}
                {tab === 'voice' && (
                  <VoiceTab voice={voice} voiceText={voiceText} onClear={() => setVoiceText('')} fx={fx} isShh={phase === 'animating' && fx === 'shh'} />
                )}
              </motion.div>
            ) : (
              <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 52 }}>🗑️</div>
                {dailyDone && <div style={{ fontFamily: "'Bangers',cursive", fontSize: 15, color: '#16a34a', letterSpacing: 2 }}>+POINTS · STREAK {meta.streak}!</div>}
              </motion.div>
            )}
          </AnimatePresence>

          {/* SHHHH waveform inside surface */}
          <AnimatePresence>
            {phase === 'animating' && fx === 'shh' && (
              <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: '#fff', zIndex: 10 }}>
                {Array.from({ length: 14 }).map((_, i) => (
                  <motion.div key={i} style={{ width: 7, background: ['#dc2626','#1d4ed8','#16a34a','#f59e0b','#7c3aed','#0891b2'][i%6], border: '2px solid #1a1a2e', borderRadius: 4 }}
                    animate={{ height: [20+Math.random()*60, 3], opacity: [1, 0.15] }}
                    transition={{ duration: 0.6 + Math.random() * 0.4, delay: i * 0.05, ease: 'easeInOut' }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── EFFECT SELECTOR ── */}
        <div style={{ padding: '0 14px 8px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {EFFECTS.map(e => (
            <button key={e.id} title={e.desc}
              onClick={() => e.free && setFx(e.id)}
              style={{
                fontFamily: "'Bangers',cursive", fontSize: 13, letterSpacing: 1,
                padding: '5px 12px', border: '3px solid #1a1a2e', borderRadius: 4,
                cursor: e.free ? 'pointer' : 'not-allowed',
                background: !e.free ? '#e5e7eb' : fx === e.id ? '#dc2626' : '#fef3c7',
                color: !e.free ? '#9ca3af' : fx === e.id ? '#fef3c7' : '#1a1a2e',
                boxShadow: fx === e.id ? '3px 4px 0 #7f1d1d' : e.free ? '2px 2px 0 #1a1a2e' : '1px 1px 0 #1a1a2e',
                transform: fx === e.id ? 'translateY(-2px)' : 'none',
                opacity: e.free ? 1 : 0.45,
                transition: 'all .1s',
              }}
            >{e.label}{!e.free && ' 🔒'}</button>
          ))}
        </div>

        {/* ── DISPOSE BUTTON ── */}
        <div style={{ padding: '8px 14px 16px', display: 'flex', justifyContent: 'center' }}>
          <motion.button
            whileHover={canDispose ? { x: -2, y: -2 } : {}}
            whileTap={canDispose ? { x: 2, y: 2 } : {}}
            onClick={dispose}
            disabled={!canDispose}
            style={{
              fontFamily: "'Bangers',cursive", fontSize: 32, letterSpacing: 4,
              color: '#fef3c7', background: '#dc2626', border: '4px solid #1a1a2e',
              borderRadius: 8, padding: '12px 48px', cursor: canDispose ? 'pointer' : 'default',
              boxShadow: canDispose ? '5px 5px 0 #1a1a2e' : '5px 5px 0 #1a1a2e',
              textShadow: '2px 2px 0 #7f1d1d',
              opacity: canDispose ? 1 : 0.35,
              transition: 'opacity .2s, box-shadow .1s',
            }}
          >ทิ้ง!</motion.button>
        </div>

        {/* ── FOOTER ── */}
        <div style={{ background: '#1a1a2e', padding: '7px 16px', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, color: '#93c5fd' }}>THE BIN · ISSUE #1 · 2026</span>
          <span style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, color: '#fbbf24' }}>AMAZING DISPOSAL COMICS</span>
        </div>
      </div>
    </div>
  );
}

// ── SUB-COMPONENTS ──

function StatBubble({ n, label, bg }) {
  return (
    <div style={{ background: bg, border: '3px solid #1a1a2e', borderRadius: '50%', width: 54, height: 54, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '3px 3px 0 #1a1a2e', flexShrink: 0 }}>
      <span style={{ fontFamily: "'Bangers',cursive", fontSize: 20, color: '#fef3c7', lineHeight: 1 }}>{n}</span>
      <span style={{ fontSize: 7, color: '#fef3c7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5 }}>{label}</span>
    </div>
  );
}

function TabBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: "'Bangers',cursive", fontSize: 16, letterSpacing: '1.5px',
      color: active ? '#1d4ed8' : '#93c5fd',
      background: active ? '#fef3c7' : 'transparent',
      border: active ? '2px solid #1a1a2e' : '2px solid transparent',
      padding: '4px 14px', borderRadius: 4, cursor: 'pointer',
      boxShadow: active ? '2px 2px 0 #1a1a2e' : 'none',
      transform: active ? 'translateY(-1px)' : 'none',
      transition: 'all .1s',
    }}>{label}</button>
  );
}

function VoiceTab({ voice, voiceText, onClear }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24, minHeight: 200 }}>
      {!voice.supported ? (
        <p style={{ color: '#6b7280', fontSize: 13, textAlign: 'center' }}>ใช้ Chrome หรือ Safari นะ!</p>
      ) : (
        <>
          <motion.button
            onClick={voice.listening ? voice.stop : voice.start}
            animate={voice.listening ? { scale: [1, 1.08, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
            style={{
              width: 80, height: 80, borderRadius: '50%', fontSize: 30,
              background: voice.listening ? '#16a34a' : '#dc2626',
              border: '4px solid #1a1a2e', boxShadow: '4px 4px 0 #1a1a2e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >{voice.listening ? '⏹' : '🎙'}</motion.button>

          {voiceText
            ? <p style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', textAlign: 'center', lineHeight: 1.6, maxHeight: 80, overflowY: 'auto' }}>{voiceText}</p>
            : <p style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic' }}>{voice.listening ? 'กำลังฟัง…' : 'แตะไมค์เพื่อเริ่ม'}</p>
          }
          {voiceText && !voice.listening && (
            <button onClick={onClear} style={{ fontSize: 10, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 2 }}>Clear</button>
          )}
        </>
      )}
    </div>
  );
}
