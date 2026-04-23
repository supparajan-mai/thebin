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
    this.color = opts.colors ? opts.colors[Math.floor(Math.random() * opts.colors.length)] : '#dc2626';
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
function saveMeta(m) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(m)); } catch {} }
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
  const [errMsg, setErrMsg] = useState('');

  const reset = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = 'th-TH'; r.continuous = true; r.interimResults = true;
    r.onresult = e => onResult(Array.from(e.results).map(x => x[0].transcript).join(''));
    r.onend = () => setListening(false);
    r.onerror = (e) => {
      setListening(false);
      if (e.error === 'not-allowed' || e.error === 'permission-denied') setErrMsg('กรุณาอนุญาต Microphone ใน browser ก่อนนะ');
      else if (e.error === 'no-speech') setErrMsg('ไม่ได้ยินเสียง ลองพูดใหม่อีกครั้ง');
      else setErrMsg(`เกิดข้อผิดพลาด: ${e.error}`);
      setTimeout(() => setErrMsg(''), 3000);
    };
    recRef.current = r;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    setSupported(true);
    reset();
    return () => recRef.current?.abort();
  }, [reset]);

  const start = useCallback(() => {
    setErrMsg(''); reset();
    try { recRef.current?.start(); setListening(true); }
    catch { setListening(false); setErrMsg('ไม่สามารถเริ่มฟังได้ ลองอีกครั้ง'); }
  }, [reset]);

  const stop = useCallback(() => {
    try { recRef.current?.stop(); } catch {}
    setListening(false);
  }, []);

  return { listening, supported, start, stop, errMsg };
}

// ─────────────────────────────────────────────
// EFFECTS CONFIG
// ─────────────────────────────────────────────
const EFFECTS = [
  { id: 'bin',   label: '🗑 BIN',   free: true,  desc: 'กระดาษบิน → ตกถัง → ปุ้ง!!' },
  { id: 'boom',  label: '💥 BOOM',  free: true,  desc: 'กระดาษ + TNT → BOOOOOM!!!' },
  { id: 'fade',  label: '🌫 FADE',  free: true,  desc: 'ตัวอักษรเลือนหายทีละตัว' },
  { id: 'shh',   label: '🔇 SHHHH', free: true,  desc: 'เสียงค่อยๆ เงียบ' },
  { id: 'fire',  label: '🔥 FIRE',  free: false, desc: 'เผาเป็นเถ้า — Phase 2' },
  { id: 'flush', label: '🚽 FLUSH', free: false, desc: 'ชักโครก — Phase 2' },
];

// ─────────────────────────────────────────────
// BIN SVG — ถังขยะพร้อมฝา
// ─────────────────────────────────────────────
function BinSVG({ lidRot, lidY, scaleX, scaleY, style }) {
  return (
    <svg viewBox="0 0 90 110" xmlns="http://www.w3.org/2000/svg"
      style={{ transform: `scaleX(${scaleX??1}) scaleY(${scaleY??1})`, transformOrigin: '50% 100%', transition: 'transform 0.12s ease-out', ...style }}>
      <g style={{ transform: `rotate(${lidRot??0}deg) translateY(${lidY??0}px)`, transformOrigin: '45px 32px', transition: 'transform 0.18s ease-out' }}>
        <rect x="32" y="2" width="26" height="13" rx="5" fill="#e2e8f0" stroke="#1a1a2e" strokeWidth="3"/>
        <rect x="38" y="5" width="14" height="5" rx="2.5" fill="#1a1a2e"/>
        <rect x="8" y="14" width="74" height="18" rx="5" fill="#e2e8f0" stroke="#1a1a2e" strokeWidth="3"/>
      </g>
      <rect x="14" y="30" width="62" height="76" rx="7" fill="#e2e8f0" stroke="#1a1a2e" strokeWidth="3"/>
      <line x1="32" y1="38" x2="29" y2="98" stroke="#1a1a2e" strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="45" y1="38" x2="45" y2="98" stroke="#1a1a2e" strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="58" y1="38" x2="61" y2="98" stroke="#1a1a2e" strokeWidth="3.5" strokeLinecap="round"/>
    </svg>
  );
}

// ─────────────────────────────────────────────
// ONOMATOPOEIA
// ─────────────────────────────────────────────
function Onomat({ word, color, show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 1, rotate: -6 }}
          animate={{ scale: 1, opacity: 1, rotate: -4 }}
          exit={{ scale: 1.15, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          style={{
            position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
            fontFamily: "'Bangers', cursive", fontSize: 'clamp(34px, 9vw, 56px)',
            color: color || '#dc2626', textShadow: '4px 4px 0 #1a1a2e, -2px -2px 0 #fef3c7',
            letterSpacing: '3px', whiteSpace: 'nowrap', zIndex: 50, pointerEvents: 'none',
          }}
        >{word}</motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function App() {
  const [meta, setMeta]         = useState(loadMeta);
  const [tab, setTab]           = useState('type');
  const [fx, setFx]             = useState('bin');
  const [text, setText]         = useState('');
  const [voiceText, setVoiceText] = useState('');
  const [phase, setPhase]       = useState('idle');
  const [onomat, setOnomat]     = useState({ word: '', color: '', show: false });
  const [placeholder, setPlaceholder] = useState('ระบายมันออกมาเลย เพื่อนเอ๋ย…');
  const [fadeChars, setFadeChars] = useState([]);
  const [binState, setBinState] = useState({
    visible: false,
    paperX: 0, paperY: 0, paperScale: 1, paperRot: 0, paperShow: false,
    tntX: 0, tntY: 0, tntRot: 0, tntShow: false,
    lidRot: 0, lidY: 0,
    binScaleX: 1, binScaleY: 1,
    smokeList: [],
  });

  const particleCanvasRef = useRef(null);
  const drawCanvasRef     = useRef(null);
  const particlesRef      = useRef([]);
  const animFrameRef      = useRef(null);
  const isDrawing         = useRef(false);
  const hasDrawn          = useRef(false);

  const voice = useVoice({ onResult: setVoiceText });

  useEffect(() => { saveMeta(meta); }, [meta]);

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

  useEffect(() => {
    if (tab !== 'draw' || !drawCanvasRef.current) return;
    const el = drawCanvasRef.current;
    const resize = () => { el.width = el.parentElement.clientWidth; el.height = el.parentElement.clientHeight; };
    const ro = new ResizeObserver(resize);
    ro.observe(el.parentElement);
    resize();
    return () => ro.disconnect();
  }, [tab]);

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

  const clearContent = () => {
    setText(''); setVoiceText('');
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
      setFadeChars([]);
      setBinState(s => ({ ...s, visible: false }));
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      particlesRef.current = [];
      const pctx = particleCanvasRef.current?.getContext('2d');
      if (pctx) pctx.clearRect(0, 0, particleCanvasRef.current.width, particleCanvasRef.current.height);
      setPhase('done');
      setPlaceholder('✓ ทิ้งไปแล้ว! หายใจลึกๆ นะ…');
      setTimeout(() => { setPhase('idle'); setPlaceholder('ระบายมันออกมาเลย เพื่อนเอ๋ย…'); }, 2000);
    }, delay);
  };

  // quadratic bezier animation
  const animBezier = (sx, sy, cpx, cpy, tx, ty, dur, onP, onD) => {
    const t0 = performance.now();
    const tick = (now) => {
      const t = Math.min((now - t0) / dur, 1);
      const e = t < .5 ? 2*t*t : -1+(4-2*t)*t;
      onP(
        (1-e)*(1-e)*sx + 2*(1-e)*e*cpx + e*e*tx,
        (1-e)*(1-e)*sy + 2*(1-e)*e*cpy + e*e*ty,
        e
      );
      if (t < 1) requestAnimationFrame(tick); else onD();
    };
    requestAnimationFrame(tick);
  };

  // ── EFFECT: BIN ──
  const runBin = () => {
    const W = window.innerWidth, H = window.innerHeight;
    const sx = -30, sy = H * 0.38;
    const binCX = W * 0.72, binCY = H * 0.58;
    const tx = binCX - 24, ty = binCY - 24;

    setBinState(s => ({
      ...s, visible: true,
      paperX: sx, paperY: sy, paperScale: 1, paperRot: 0, paperShow: true,
      tntShow: false, lidRot: 0, lidY: 0, binScaleX: 1, binScaleY: 1,
    }));

    setTimeout(() => setBinState(s => ({ ...s, lidRot: -28, lidY: -6 })), 300);

    animBezier(sx, sy, W * 0.3, sy - H * 0.2, tx, ty, 700,
      (x, y, e) => setBinState(s => ({
        ...s, paperX: x, paperY: y,
        paperScale: 1 - e * 0.5, paperRot: e * 400,
      })),
      () => {
        setBinState(s => ({ ...s, paperShow: false }));
        setTimeout(() => {
          setBinState(s => ({ ...s, lidRot: 0, lidY: 0, binScaleX: 1.07, binScaleY: 0.88 }));
          setTimeout(() => setBinState(s => ({ ...s, binScaleX: 0.96, binScaleY: 1.05 })), 120);
          setTimeout(() => setBinState(s => ({ ...s, binScaleX: 1, binScaleY: 1 })), 240);
        }, 60);
        setTimeout(() => showOnomat('ปุ้ง!!', '#1d4ed8'), 110);
        afterEffect(1350);
      }
    );
  };

  // ── EFFECT: BOOM ──
  const runBoom = () => {
    const W = window.innerWidth, H = window.innerHeight;
    const sx = -30, sy = H * 0.38;
    const binCX = W * 0.72, binCY = H * 0.58;
    const tx = binCX - 24, ty = binCY - 24;

    setBinState(s => ({
      ...s, visible: true,
      paperX: sx, paperY: sy, paperScale: 1, paperRot: 0, paperShow: true,
      tntShow: false, lidRot: 0, lidY: 0, binScaleX: 1, binScaleY: 1, smokeList: [],
    }));

    setTimeout(() => setBinState(s => ({ ...s, lidRot: -28, lidY: -6 })), 300);

    animBezier(sx, sy, W * 0.3, sy - H * 0.2, tx, ty, 700,
      (x, y, e) => setBinState(s => ({
        ...s, paperX: x, paperY: y,
        paperScale: 1 - e * 0.5, paperRot: e * 400,
      })),
      () => {
        setBinState(s => ({ ...s, paperShow: false }));
        setTimeout(() => setBinState(s => ({ ...s, lidRot: 0, lidY: 0 })), 60);

        // TNT follows
        setTimeout(() => {
          const tsx = -30, tsy = H * 0.40;
          setBinState(s => ({ ...s, tntX: tsx, tntY: tsy, tntRot: 0, tntShow: true }));
          setTimeout(() => setBinState(s => ({ ...s, lidRot: -32, lidY: -6 })), 140);

          animBezier(tsx, tsy, W * 0.22, tsy - H * 0.14, binCX - 22, binCY - 20, 520,
            (x, y, e) => setBinState(s => ({ ...s, tntX: x, tntY: y, tntRot: e * 180 })),
            () => {
              setBinState(s => ({ ...s, tntShow: false }));
              setTimeout(() => {
                // lid flings up
                setBinState(s => ({ ...s, lidRot: -65, lidY: -24, binScaleX: 1.09, binScaleY: 0.85 }));
                setTimeout(() => setBinState(s => ({ ...s, binScaleX: 0.94, binScaleY: 1.07 })), 130);
                setTimeout(() => setBinState(s => ({ ...s, binScaleX: 1, binScaleY: 1 })), 260);
                // smoke
                setBinState(s => ({
                  ...s,
                  smokeList: Array.from({ length: 8 }, (_, i) => ({
                    id: i,
                    angle: -110 + i * 28 + Math.random() * 16,
                    dist: 45 + Math.random() * 55,
                    size: 22 + Math.random() * 26,
                    cx: binCX, cy: binCY,
                  })),
                }));
                showOnomat('BOOOOOM!!!', '#dc2626');
                // lid settles
                setTimeout(() => setBinState(s => ({ ...s, lidRot: -8, lidY: -3 })), 900);
                setTimeout(() => setBinState(s => ({ ...s, lidRot: 0, lidY: 0, smokeList: [] })), 1450);
              }, 60);
              afterEffect(2300);
            }
          );
        }, 220);
      }
    );
  };

  // ── EFFECT: FADE ──
  const runFade = () => {
    const content = tab === 'type' ? text : tab === 'voice' ? voiceText : null;
    if (!content) { afterEffect(100); return; }

    const chars = [...content].map((ch, i) => ({
      id: i, char: ch, vanish: false,
      dx: (Math.random() - 0.5) * 10,
      dy: (Math.random() - 0.5) * 10,
    }));
    setFadeChars(chars);

    const shuffled = [...chars].sort(() => Math.random() - 0.5);
    const totalDur = 1800;
    shuffled.forEach((c, i) => {
      const delay = 400 + (i / shuffled.length) * totalDur + Math.random() * 150;
      setTimeout(() => {
        setFadeChars(prev => prev.map(p => p.id === c.id ? { ...p, vanish: true } : p));
      }, delay);
    });

    afterEffect(400 + totalDur + 600);
  };

  // ── EFFECT: SHHHH ──
  const runShh = () => {
    showOnomat('shhhh…', '#6b7280');
    afterEffect(1500);
  };

  // ── DISPOSE ──
  const dispose = () => {
    if (!hasContent() || phase !== 'idle') return;
    setPhase('animating');
    if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
    const today = todayStr();
    if (meta.lastDaily !== today) {
      const newStreak = calcStreak(meta.lastDaily, meta.streak);
      const bonus = 50 + (newStreak >= 7 ? 20 : 0) + (newStreak >= 30 ? 50 : 0);
      setMeta({ points: meta.points + bonus, streak: newStreak, lastDaily: today });
    }
    ({ bin: runBin, boom: runBoom, fade: runFade, shh: runShh }[fx] || runBin)();
  };

  const dailyDone  = meta.lastDaily === todayStr();
  const canDispose = hasContent() && phase === 'idle';

  return (
    <div style={{ width: '100%', maxWidth: 480, position: 'relative' }}>
      <canvas ref={particleCanvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100 }} />

      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 110 }}>
        <Onomat word={onomat.word} color={onomat.color} show={onomat.show} />
      </div>

      {/* ── BIN / BOOM OVERLAY ── */}
      <AnimatePresence>
        {binState.visible && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 90 }}>

            {/* Paper ball */}
            {binState.paperShow && (
              <div style={{
                position: 'absolute', left: binState.paperX, top: binState.paperY,
                width: 48, height: 48,
                transform: `scale(${binState.paperScale}) rotate(${binState.paperRot}deg)`,
                transformOrigin: 'center',
              }}>
                <svg viewBox="0 0 52 52" style={{ width: '100%', height: '100%' }}>
                  <polygon points="26,2 50,14 50,38 26,50 2,38 2,14" fill="#fff" stroke="#1a1a2e" strokeWidth="3"/>
                  <line x1="12" y1="18" x2="40" y2="18" stroke="#94a3b8" strokeWidth="2"/>
                  <line x1="10" y1="26" x2="42" y2="26" stroke="#94a3b8" strokeWidth="2"/>
                  <line x1="14" y1="34" x2="38" y2="34" stroke="#94a3b8" strokeWidth="2"/>
                </svg>
              </div>
            )}

            {/* TNT */}
            {binState.tntShow && (
              <div style={{
                position: 'absolute', left: binState.tntX, top: binState.tntY,
                width: 44, height: 44,
                transform: `rotate(${binState.tntRot}deg)`, transformOrigin: 'center',
              }}>
                <svg viewBox="0 0 44 44" style={{ width: '100%', height: '100%' }}>
                  <rect x="6" y="10" width="32" height="28" rx="4" fill="#dc2626" stroke="#1a1a2e" strokeWidth="3"/>
                  <rect x="9" y="16" width="26" height="14" rx="2" fill="#fef3c7" stroke="#1a1a2e" strokeWidth="1.5"/>
                  <text x="22" y="27" textAnchor="middle" fontFamily="'Bangers',cursive" fontSize="9" fill="#1a1a2e" letterSpacing="1">TNT</text>
                  <path d="M22 10 Q28 4 24 0" fill="none" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round"/>
                  <circle cx="24" cy="0" r="3" fill="#fbbf24"/>
                </svg>
              </div>
            )}

            {/* Bin — right side of screen */}
            <div style={{ position: 'absolute', right: '10%', bottom: '16%', width: 90, height: 110 }}>
              <BinSVG
                lidRot={binState.lidRot} lidY={binState.lidY}
                scaleX={binState.binScaleX} scaleY={binState.binScaleY}
                style={{ width: '100%', height: '100%' }}
              />
            </div>

            {/* Smoke puffs (BOOM only) */}
            {binState.smokeList.map(s => {
              const rad = s.angle * Math.PI / 180;
              return (
                <motion.div key={s.id}
                  initial={{ left: s.cx - s.size/2, top: s.cy - s.size/2, width: s.size, height: s.size, opacity: 0.85 }}
                  animate={{ left: s.cx + Math.cos(rad)*s.dist - s.size, top: s.cy + Math.sin(rad)*s.dist - s.size, width: s.size*2.2, height: s.size*2.2, opacity: 0 }}
                  transition={{ duration: 0.85, ease: 'easeOut' }}
                  style={{ position: 'absolute', borderRadius: '50%', background: 'radial-gradient(circle, rgba(170,170,170,0.85) 0%, transparent 70%)', pointerEvents: 'none' }}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FADE CHARS OVERLAY ── */}
      <AnimatePresence>
        {fadeChars.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              background: '#fffef5', border: '3px solid #1a1a2e', borderRadius: 8,
              boxShadow: '5px 5px 0 #1a1a2e', padding: '24px 20px',
              width: '72%', maxWidth: 300, position: 'relative',
              backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #e2e8f0 27px, #e2e8f0 28px)',
              backgroundSize: '100% 28px', backgroundPosition: '0 20px',
            }}>
              <div style={{ position: 'absolute', left: 32, top: 0, bottom: 0, borderLeft: '2px solid #fca5a5' }} />
              <div style={{
                fontFamily: "'Comic Neue',cursive", fontSize: 16, fontWeight: 700,
                color: '#1a1a2e', textAlign: 'center', lineHeight: 1.8,
                position: 'relative', zIndex: 1, wordBreak: 'break-word',
                display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
              }}>
                {fadeChars.map(c => (
                  <span key={c.id} style={{
                    display: 'inline-block',
                    whiteSpace: c.char === ' ' ? 'pre' : 'normal',
                    opacity: c.vanish ? 0 : 1,
                    filter: c.vanish ? 'blur(4px)' : 'blur(0)',
                    transform: c.vanish ? `translate(${c.dx}px,${c.dy}px)` : 'translate(0,0)',
                    transition: 'opacity 0.4s ease-out, filter 0.4s ease-out, transform 0.4s ease-out',
                  }}>
                    {c.char === '\n' ? <br /> : c.char}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ background: '#fef3c7', border: '5px solid #1a1a2e', borderRadius: 14, overflow: 'hidden', boxShadow: '8px 8px 0 #1a1a2e' }}>

        {/* HEADER */}
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

        {/* DAILY BANNER */}
        <div style={{ background: dailyDone ? '#065f46' : '#15803d', borderBottom: '3px solid #1a1a2e', padding: '5px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#bbf7d0', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            {dailyDone ? '✓ Daily Boom เสร็จแล้ว!' : 'Daily Boom พร้อมแล้ว!'}
          </span>
          <span style={{ fontFamily: "'Bangers',cursive", fontSize: 13, color: '#fef3c7', background: '#16a34a', border: '2px solid #1a1a2e', padding: '2px 10px', borderRadius: 3, boxShadow: '2px 2px 0 #1a1a2e', letterSpacing: 1 }}>
            {dailyDone ? 'DONE' : '+50 PTS'}
          </span>
        </div>

        {/* TABS */}
        <div style={{ background: '#1d4ed8', borderBottom: '4px solid #1a1a2e', padding: '8px 14px', display: 'flex', gap: 7, alignItems: 'center' }}>
          {['type','draw','voice'].map(t => (
            <TabBtn key={t} label={t.toUpperCase()} active={tab===t} onClick={() => { setTab(t); hasDrawn.current=false; }} />
          ))}
        </div>

        {/* SURFACE */}
        <div style={{ margin: '14px 14px 8px', background: '#fff', border: '4px solid #1a1a2e', borderRadius: 8, position: 'relative', overflow: 'hidden', minHeight: 200, boxShadow: '5px 5px 0 #1a1a2e', display: 'flex', flexDirection: 'column' }}>
          <span style={{ position: 'absolute', top: 5, left: 8, fontSize: 8, fontWeight: 700, color: '#dc2626', letterSpacing: 1, opacity: .3, textTransform: 'uppercase' }}>SECRET FEELINGS PANEL</span>
          <span style={{ position: 'absolute', bottom: 5, right: 8, fontSize: 8, fontWeight: 700, color: '#dc2626', letterSpacing: 1, opacity: .3, textTransform: 'uppercase' }}>NO.1 IN DISPOSAL</span>

          <AnimatePresence mode="wait">
            {phase !== 'done' ? (
              <motion.div key={`surface-${tab}-${phase}`} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.96 }}>
                {tab === 'type' && (
                  <textarea value={text} onChange={e => setText(e.target.value)} placeholder={placeholder} autoFocus
                    style={{ flex: 1, width: '100%', border: 'none', outline: 'none', resize: 'none', fontFamily: "'Comic Neue',cursive", fontSize: 18, fontWeight: 700, color: '#1a1a2e', padding: '28px 20px 20px', background: 'transparent', textAlign: 'center', lineHeight: 1.7, minHeight: 200 }} />
                )}
                {tab === 'draw' && (
                  <canvas ref={drawCanvasRef}
                    onMouseDown={onDrawStart} onMouseMove={onDrawMove} onMouseUp={onDrawEnd} onMouseLeave={onDrawEnd}
                    onTouchStart={onDrawStart} onTouchMove={onDrawMove} onTouchEnd={onDrawEnd}
                    style={{ flex: 1, width: '100%', minHeight: 200, cursor: 'crosshair', touchAction: 'none', display: 'block' }} />
                )}
                {tab === 'voice' && (
                  <VoiceTab voice={voice} voiceText={voiceText} onClear={() => setVoiceText('')} />
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

          {/* SHHHH waveform */}
          <AnimatePresence>
            {phase === 'animating' && fx === 'shh' && (
              <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: '#fff', zIndex: 10 }}>
                {Array.from({ length: 14 }).map((_, i) => (
                  <motion.div key={i}
                    style={{ width: 7, background: ['#dc2626','#1d4ed8','#16a34a','#f59e0b','#7c3aed','#0891b2'][i%6], border: '2px solid #1a1a2e', borderRadius: 4 }}
                    animate={{ height: [20+Math.random()*60, 3], opacity: [1, 0.15] }}
                    transition={{ duration: 0.6 + Math.random() * 0.4, delay: i * 0.05, ease: 'easeInOut' }} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* EFFECT SELECTOR */}
        <div style={{ padding: '0 14px 8px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {EFFECTS.map(e => (
            <button key={e.id} title={e.desc} onClick={() => e.free && setFx(e.id)} style={{
              fontFamily: "'Bangers',cursive", fontSize: 13, letterSpacing: 1,
              padding: '5px 12px', border: '3px solid #1a1a2e', borderRadius: 4,
              cursor: e.free ? 'pointer' : 'not-allowed',
              background: !e.free ? '#e5e7eb' : fx === e.id ? '#dc2626' : '#fef3c7',
              color: !e.free ? '#9ca3af' : fx === e.id ? '#fef3c7' : '#1a1a2e',
              boxShadow: fx === e.id ? '3px 4px 0 #7f1d1d' : e.free ? '2px 2px 0 #1a1a2e' : '1px 1px 0 #1a1a2e',
              transform: fx === e.id ? 'translateY(-2px)' : 'none',
              opacity: e.free ? 1 : 0.45, transition: 'all .1s',
            }}>{e.label}{!e.free && ' 🔒'}</button>
          ))}
        </div>

        {/* DISPOSE BUTTON */}
        <div style={{ padding: '8px 14px 16px', display: 'flex', justifyContent: 'center' }}>
          <motion.button
            whileHover={canDispose ? { x: -2, y: -2 } : {}}
            whileTap={canDispose ? { x: 2, y: 2 } : {}}
            onClick={dispose} disabled={!canDispose}
            style={{
              fontFamily: "'Bangers',cursive", fontSize: 32, letterSpacing: 4,
              color: '#fef3c7', background: '#dc2626', border: '4px solid #1a1a2e',
              borderRadius: 8, padding: '12px 48px', cursor: canDispose ? 'pointer' : 'default',
              boxShadow: '5px 5px 0 #1a1a2e', textShadow: '2px 2px 0 #7f1d1d',
              opacity: canDispose ? 1 : 0.35, transition: 'opacity .2s',
            }}
          >ทิ้ง!</motion.button>
        </div>

        {/* FOOTER */}
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
      transform: active ? 'translateY(-1px)' : 'none', transition: 'all .1s',
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
            style={{ width: 80, height: 80, borderRadius: '50%', fontSize: 30, background: voice.listening ? '#16a34a' : '#dc2626', border: '4px solid #1a1a2e', boxShadow: '4px 4px 0 #1a1a2e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >{voice.listening ? '⏹' : '🎙'}</motion.button>

          <AnimatePresence>
            {voice.errMsg && (
              <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ fontSize: 11, color: '#dc2626', fontWeight: 700, textAlign: 'center', background: '#fef2f2', border: '2px solid #dc2626', borderRadius: 6, padding: '4px 12px' }}
              >{voice.errMsg}</motion.p>
            )}
          </AnimatePresence>

          {voiceText
            ? <p style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', textAlign: 'center', lineHeight: 1.6, maxHeight: 80, overflowY: 'auto' }}>{voiceText}</p>
            : !voice.errMsg && <p style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic' }}>{voice.listening ? 'กำลังฟัง…' : 'แตะไมค์เพื่อเริ่ม'}</p>
          }
          {voiceText && !voice.listening && (
            <button onClick={onClear} style={{ fontSize: 10, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 2 }}>Clear</button>
          )}
        </>
      )}
    </div>
  );
}
