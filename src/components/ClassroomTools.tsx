import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Calculator, X, Play, Pause, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

// ── Calculator formulas per kategori ──────────────────────────────
const CALCS: Record<string, Array<{
  name: string; formula: string;
  inputs: { key: string; label: string; unit: string }[];
  output: { key: string; label: string; unit: string };
  fn: (v: Record<string, number>) => number;
}>> = {
  'Kinematika': [
    { name: 'Kecepatan (GLB)', formula: 'v = s / t', inputs: [{ key: 's', label: 'Jarak', unit: 'm' }, { key: 't', label: 'Waktu', unit: 's' }], output: { key: 'v', label: 'Kecepatan', unit: 'm/s' }, fn: ({ s, t }) => s / t },
    { name: 'GLBB – Jarak', formula: 's = v₀t + ½at²', inputs: [{ key: 'v0', label: 'v₀', unit: 'm/s' }, { key: 'a', label: 'a', unit: 'm/s²' }, { key: 't', label: 't', unit: 's' }], output: { key: 's', label: 'Jarak', unit: 'm' }, fn: ({ v0, a, t }) => v0 * t + 0.5 * a * t * t },
  ],
  'Dinamika': [
    { name: 'Hukum Newton II', formula: 'F = m × a', inputs: [{ key: 'm', label: 'Massa', unit: 'kg' }, { key: 'a', label: 'Percepatan', unit: 'm/s²' }], output: { key: 'F', label: 'Gaya', unit: 'N' }, fn: ({ m, a }) => m * a },
    { name: 'Usaha', formula: 'W = F × s × cos θ', inputs: [{ key: 'F', label: 'Gaya', unit: 'N' }, { key: 's', label: 'Jarak', unit: 'm' }, { key: 'theta', label: 'Sudut θ', unit: '°' }], output: { key: 'W', label: 'Usaha', unit: 'J' }, fn: ({ F, s, theta }) => F * s * Math.cos(theta * Math.PI / 180) },
  ],
  'Fluida': [
    { name: 'Tekanan Hidrostatis', formula: 'P = ρgh', inputs: [{ key: 'rho', label: 'ρ', unit: 'kg/m³' }, { key: 'g', label: 'g', unit: 'm/s²' }, { key: 'h', label: 'h', unit: 'm' }], output: { key: 'P', label: 'Tekanan', unit: 'Pa' }, fn: ({ rho, g, h }) => rho * g * h },
  ],
  'Termodinamika': [
    { name: 'Kalor', formula: 'Q = mcΔT', inputs: [{ key: 'm', label: 'Massa', unit: 'kg' }, { key: 'c', label: 'Kalor Jenis', unit: 'J/kg°C' }, { key: 'dt', label: 'ΔT', unit: '°C' }], output: { key: 'Q', label: 'Kalor', unit: 'J' }, fn: ({ m, c, dt }) => m * c * dt },
  ],
  'Getaran & Gelombang': [
    { name: 'Cepat Rambat', formula: 'v = λf', inputs: [{ key: 'lam', label: 'λ', unit: 'm' }, { key: 'f', label: 'f', unit: 'Hz' }], output: { key: 'v', label: 'v', unit: 'm/s' }, fn: ({ lam, f }) => lam * f },
    { name: 'Periode', formula: 'T = 1/f', inputs: [{ key: 'f', label: 'f', unit: 'Hz' }], output: { key: 'T', label: 'Periode', unit: 's' }, fn: ({ f }) => 1 / f },
  ],
  'Listrik Statis': [
    { name: 'Hukum Coulomb', formula: 'F = kq₁q₂/r²', inputs: [{ key: 'q1', label: 'q₁', unit: 'C' }, { key: 'q2', label: 'q₂', unit: 'C' }, { key: 'r', label: 'r', unit: 'm' }], output: { key: 'F', label: 'Gaya', unit: 'N' }, fn: ({ q1, q2, r }) => 9e9 * Math.abs(q1) * Math.abs(q2) / (r * r) },
  ],
  'Listrik Dinamis': [
    { name: 'Hukum Ohm', formula: 'I = V / R', inputs: [{ key: 'V', label: 'V', unit: 'Volt' }, { key: 'R', label: 'R', unit: 'Ω' }], output: { key: 'I', label: 'Arus', unit: 'A' }, fn: ({ V, R }) => V / R },
    { name: 'Daya Listrik', formula: 'P = VI', inputs: [{ key: 'V', label: 'V', unit: 'Volt' }, { key: 'I', label: 'I', unit: 'A' }], output: { key: 'P', label: 'Daya', unit: 'W' }, fn: ({ V, I }) => V * I },
    { name: 'Energi Listrik', formula: 'W = Pt', inputs: [{ key: 'P', label: 'P', unit: 'W' }, { key: 't', label: 't', unit: 's' }], output: { key: 'W', label: 'Energi', unit: 'J' }, fn: ({ P, t }) => P * t },
  ],
  'Kemagnetan': [
    { name: 'Gaya Lorentz', formula: 'F = qvB', inputs: [{ key: 'q', label: 'q', unit: 'C' }, { key: 'v', label: 'v', unit: 'm/s' }, { key: 'B', label: 'B', unit: 'T' }], output: { key: 'F', label: 'Gaya', unit: 'N' }, fn: ({ q, v, B }) => q * v * B },
  ],
  'Fisika Modern': [
    { name: 'Energi Foton', formula: 'E = hf', inputs: [{ key: 'f', label: 'f', unit: 'Hz' }], output: { key: 'E', label: 'Energi', unit: 'J' }, fn: ({ f }) => 6.626e-34 * f },
    { name: 'E = mc²', formula: 'E = mc²', inputs: [{ key: 'm', label: 'm', unit: 'kg' }], output: { key: 'E', label: 'Energi', unit: 'J' }, fn: ({ m }) => m * 9e16 },
  ],
};

interface Props {
  isTeacher: boolean;
  isSyncing: boolean;
  inWaitingRoom: boolean;
  groupName: string;
  moduleKategori?: string;
  channelRef: React.MutableRefObject<any>;
}

const REACTIONS = [
  { key: 'paham', emoji: '👍', label: 'Paham', color: 'bg-emerald-500' },
  { key: 'belum', emoji: '✋', label: 'Belum', color: 'bg-amber-500' },
  { key: 'bingung', emoji: '🤔', label: 'Bingung', color: 'bg-rose-500' },
];

function fmt(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export default function ClassroomTools({ isTeacher, isSyncing, inWaitingRoom, groupName, moduleKategori, channelRef }: Props) {
  const visible = isSyncing && !inWaitingRoom;

  // ── Reactions ──────────────────────────────────────────────────
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Record<string, string>>({});
  const [showReactionSummary, setShowReactionSummary] = useState(false);

  // ── Timer ───────────────────────────────────────────────────────
  const [showTimer, setShowTimer] = useState(false);
  const [timerDuration, setTimerDuration] = useState(120);
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerExpanded, setTimerExpanded] = useState(true);

  // ── Calculator ──────────────────────────────────────────────────
  const [showCalc, setShowCalc] = useState(false);
  const [calcIdx, setCalcIdx] = useState(0);
  const [calcInputs, setCalcInputs] = useState<Record<string, string>>({});
  const [calcResult, setCalcResult] = useState<number | null>(null);

  const calcList = CALCS[moduleKategori || ''] || CALCS['Listrik Dinamis'];
  const currentCalc = calcList[calcIdx];

  // Listen to channel broadcasts
  useEffect(() => {
    if (!channelRef.current) return;
    const ch = channelRef.current;

    const handleMsg = ({ event, payload }: any) => {
      if (event === 'student_reaction' && isTeacher) {
        setReactions(prev => ({ ...prev, [payload.group]: payload.reaction }));
      }
      if (event === 'timer_sync' && !isTeacher) {
        if (payload.action === 'start') {
          setTimerStartedAt(payload.startedAt);
          setTimerDuration(payload.duration);
          setTimerRunning(true);
          setShowTimer(true);
          setTimerExpanded(true);
        } else if (payload.action === 'stop') {
          setTimerRunning(false);
          setShowTimer(false);
        } else if (payload.action === 'reset') {
          setTimerRunning(false);
          setTimerStartedAt(null);
          setTimeLeft(0);
          setShowTimer(false);
        }
      }
    };

    ch._broadcastHandlers = ch._broadcastHandlers || [];
    ch._broadcastHandlers.push(handleMsg);
    ch.on('broadcast', { event: '*' }, handleMsg);
    return () => { try { ch.off?.('broadcast', handleMsg); } catch (_) {} };
  }, [channelRef.current, isTeacher]);

  // Timer countdown
  useEffect(() => {
    if (!timerRunning || timerStartedAt === null) return;
    const iv = setInterval(() => {
      const left = Math.max(0, timerDuration - Math.floor((Date.now() - timerStartedAt) / 1000));
      setTimeLeft(left);
      if (left === 0) setTimerRunning(false);
    }, 500);
    return () => clearInterval(iv);
  }, [timerRunning, timerStartedAt, timerDuration]);

  // Reset calc inputs when formula changes
  useEffect(() => { setCalcInputs({}); setCalcResult(null); }, [calcIdx, moduleKategori]);

  if (!visible) return null;

  // ── Helpers ─────────────────────────────────────────────────────
  const sendReaction = (key: string) => {
    setMyReaction(key);
    channelRef.current?.send({ type: 'broadcast', event: 'student_reaction', payload: { group: groupName || 'Anonim', reaction: key } });
  };

  const startTimer = () => {
    const startedAt = Date.now();
    setTimerStartedAt(startedAt); setTimerRunning(true); setTimeLeft(timerDuration); setShowTimer(true);
    channelRef.current?.send({ type: 'broadcast', event: 'timer_sync', payload: { action: 'start', duration: timerDuration, startedAt } });
  };
  const stopTimer = () => {
    setTimerRunning(false); setShowTimer(false);
    channelRef.current?.send({ type: 'broadcast', event: 'timer_sync', payload: { action: 'stop' } });
  };
  const resetTimer = () => {
    setTimerRunning(false); setTimerStartedAt(null); setTimeLeft(0); setShowTimer(false);
    channelRef.current?.send({ type: 'broadcast', event: 'timer_sync', payload: { action: 'reset' } });
  };

  const doCalc = () => {
    try {
      const nums: Record<string, number> = {};
      for (const inp of currentCalc.inputs) {
        const v = parseFloat(calcInputs[inp.key]);
        if (isNaN(v)) { setCalcResult(null); return; }
        nums[inp.key] = v;
      }
      setCalcResult(currentCalc.fn(nums));
    } catch { setCalcResult(null); }
  };

  const reactionCounts = REACTIONS.map(r => ({ ...r, count: Object.values(reactions).filter(v => v === r.key).length }));
  const totalReacted = Object.keys(reactions).length;
  const timerColor = timeLeft <= 10 ? 'text-rose-500' : timeLeft <= 30 ? 'text-amber-500' : 'text-slate-800';

  return (
    <>
      {/* ── STUDENT: Reaction bar ──────────────────────────────── */}
      {!isTeacher && (
        <div className="fixed bottom-24 right-4 z-[70] flex flex-col gap-2">
          {REACTIONS.map(r => (
            <motion.button
              key={r.key}
              whileTap={{ scale: 0.85 }}
              onClick={() => sendReaction(r.key)}
              title={r.label}
              className={`w-12 h-12 rounded-2xl text-xl flex items-center justify-center shadow-lg transition-all ${myReaction === r.key ? r.color + ' shadow-xl scale-110' : 'bg-white border border-slate-200 hover:border-slate-300'}`}
            >
              {r.emoji}
            </motion.button>
          ))}
        </div>
      )}

      {/* ── TEACHER: Reaction summary ─────────────────────────── */}
      {isTeacher && totalReacted > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-24 right-4 z-[70] bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 min-w-[160px]"
        >
          <button onClick={() => setShowReactionSummary(!showReactionSummary)} className="flex items-center justify-between w-full mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reaksi Kelas</span>
            {showReactionSummary ? <ChevronDown size={12} className="text-slate-400" /> : <ChevronUp size={12} className="text-slate-400" />}
          </button>
          <AnimatePresence>
            {showReactionSummary && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-2 overflow-hidden">
                {reactionCounts.map(r => (
                  <div key={r.key} className="flex items-center gap-2">
                    <span className="text-base">{r.emoji}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${r.color} rounded-full transition-all`} style={{ width: totalReacted ? `${r.count / totalReacted * 100}%` : '0%' }} />
                    </div>
                    <span className="text-xs font-black text-slate-500 w-4 text-right">{r.count}</span>
                  </div>
                ))}
                <p className="text-[9px] text-slate-300 font-bold text-center pt-1">{totalReacted} siswa merespons</p>
              </motion.div>
            )}
          </AnimatePresence>
          {!showReactionSummary && (
            <div className="flex gap-2">
              {reactionCounts.map(r => <span key={r.key} className="text-sm">{r.emoji} <span className="text-xs font-black text-slate-500">{r.count}</span></span>)}
            </div>
          )}
        </motion.div>
      )}

      {/* ── TEACHER: Timer controls ────────────────────────────── */}
      {isTeacher && (
        <div className="fixed bottom-24 left-4 z-[70]">
          {!showTimer ? (
            <button
              onClick={() => setShowTimer(true)}
              className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-lg text-xs font-black text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-all"
            >
              <Timer size={14} /> Timer
            </button>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 w-56">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-slate-500">
                  <Timer size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Timer</span>
                </div>
                <button onClick={() => { setShowTimer(false); if (timerRunning) stopTimer(); }} className="text-slate-300 hover:text-slate-500">
                  <X size={14} />
                </button>
              </div>
              {!timerRunning && timerStartedAt === null ? (
                <>
                  <div className="flex gap-1 mb-3 flex-wrap">
                    {[30, 60, 120, 300].map(s => (
                      <button key={s} onClick={() => setTimerDuration(s)} className={`px-2 py-1 rounded-xl text-[10px] font-black transition-all ${timerDuration === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {s < 60 ? `${s}d` : `${s / 60}m`}
                      </button>
                    ))}
                  </div>
                  <p className="text-3xl font-black text-slate-800 text-center mb-3">{fmt(timerDuration)}</p>
                  <button onClick={startTimer} className="w-full py-2.5 bg-blue-600 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                    <Play size={14} /> Mulai
                  </button>
                </>
              ) : (
                <>
                  <p className={`text-4xl font-black text-center tabular-nums mb-3 ${timerColor} ${timeLeft === 0 ? 'animate-pulse' : ''}`}>{fmt(timeLeft)}</p>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(timeLeft / timerDuration) * 100}%` }} />
                  </div>
                  <div className="flex gap-2">
                    {timerRunning ? (
                      <button onClick={() => { setTimerRunning(false); channelRef.current?.send({ type: 'broadcast', event: 'timer_sync', payload: { action: 'stop' } }); }} className="flex-1 py-2 bg-amber-100 text-amber-600 rounded-xl text-xs font-black flex items-center justify-center gap-1">
                        <Pause size={12} /> Jeda
                      </button>
                    ) : timeLeft > 0 ? (
                      <button onClick={startTimer} className="flex-1 py-2 bg-blue-100 text-blue-600 rounded-xl text-xs font-black flex items-center justify-center gap-1">
                        <Play size={12} /> Lanjut
                      </button>
                    ) : null}
                    <button onClick={resetTimer} className="flex-1 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-black flex items-center justify-center gap-1">
                      <RotateCcw size={12} /> Reset
                    </button>
                  </div>
                  {timeLeft === 0 && <p className="text-center text-[10px] font-black text-rose-500 uppercase tracking-widest mt-2 animate-pulse">Waktu Habis!</p>}
                </>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* ── STUDENT: Timer display ────────────────────────────── */}
      {!isTeacher && showTimer && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-24 left-4 z-[70] bg-white rounded-3xl shadow-2xl border border-slate-100 px-6 py-4 text-center"
        >
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1 justify-center"><Timer size={10} /> Timer Guru</p>
          <p className={`text-3xl font-black tabular-nums ${timerColor} ${timeLeft === 0 ? 'animate-pulse' : ''}`}>{fmt(timeLeft)}</p>
          {timeLeft === 0 && <p className="text-[9px] text-rose-500 font-black uppercase tracking-widest mt-1">Waktu Habis!</p>}
        </motion.div>
      )}

      {/* ── Calculator FAB & Panel ────────────────────────────── */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70]">
        <button
          onClick={() => setShowCalc(!showCalc)}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl shadow-lg text-xs font-black transition-all ${showCalc ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'}`}
        >
          <Calculator size={14} /> Kalkulator Fisika
        </button>
      </div>

      <AnimatePresence>
        {showCalc && (
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-36 left-1/2 -translate-x-1/2 z-[70] bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-6 w-[320px]"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kalkulator — {moduleKategori || 'Fisika'}</p>
              <button onClick={() => setShowCalc(false)}><X size={14} className="text-slate-300 hover:text-slate-500" /></button>
            </div>

            {/* Formula selector */}
            <div className="flex gap-1 flex-wrap mb-4">
              {calcList.map((c, i) => (
                <button key={i} onClick={() => setCalcIdx(i)} className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${calcIdx === i ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                  {c.name}
                </button>
              ))}
            </div>

            {/* Formula display */}
            <div className="bg-indigo-50 rounded-2xl px-4 py-3 mb-4 text-center">
              <p className="text-sm font-black text-indigo-700">{currentCalc.formula}</p>
            </div>

            {/* Inputs */}
            <div className="space-y-3 mb-4">
              {currentCalc.inputs.map(inp => (
                <div key={inp.key} className="flex items-center gap-2">
                  <label className="text-xs font-black text-slate-400 w-24 shrink-0">{inp.label} <span className="text-[9px] text-slate-300">({inp.unit})</span></label>
                  <input
                    type="number"
                    step="any"
                    value={calcInputs[inp.key] || ''}
                    onChange={e => setCalcInputs(prev => ({ ...prev, [inp.key]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && doCalc()}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>

            <button onClick={doCalc} className="w-full py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 mb-3">
              Hitung
            </button>

            {calcResult !== null && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 text-center">
                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{currentCalc.output.label}</p>
                <p className="text-2xl font-black text-emerald-700">
                  {Math.abs(calcResult) < 0.001 || Math.abs(calcResult) > 1e6
                    ? calcResult.toExponential(3)
                    : parseFloat(calcResult.toFixed(4))}
                  <span className="text-sm font-bold ml-1 text-emerald-400">{currentCalc.output.unit}</span>
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
