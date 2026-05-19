import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Calculator, X, Play, Pause, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';



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
  const [reactionsEnabled, setReactionsEnabled] = useState(false);
  const [flyingEmotes, setFlyingEmotes] = useState<{id: number, emoji: string, x: number}[]>([]);

  // Listen to channel broadcasts
  useEffect(() => {
    if (!channelRef.current) return;
    const ch = channelRef.current;

    const handleMsg = ({ event, payload }: any) => {
      if (event === 'student_reaction') {
        if (isTeacher) setReactions(prev => ({ ...prev, [payload.group]: payload.reaction }));
        
        // Everyone sees flying emotes!
        const emoji = REACTIONS.find(r => r.key === payload.reaction)?.emoji;
        if (emoji) {
          const id = Date.now() + Math.random();
          setFlyingEmotes(prev => [...prev, { id, emoji, x: Math.random() * 80 + 10 }]);
          setTimeout(() => {
            setFlyingEmotes(prev => prev.filter(e => e.id !== id));
          }, 4000);
        }
      }
      if (event === 'toggle_reactions') {
        setReactionsEnabled(payload.enabled);
        if (!payload.enabled && isTeacher) {
          setReactions({}); // Clear teacher's reaction summary when disabled
        }
      }
      if (event === 'teacher_sync_state' && !isTeacher) {
        // Teacher can broadcast their current state to late joiners
        setReactionsEnabled(payload.reactionsEnabled);
      }
      if (event === 'timer_sync' && !isTeacher) {
        if (payload.action === 'start') {
          setTimerStartedAt(payload.startedAt);
          setTimerDuration(payload.duration);
          setTimerRunning(true);
          setShowTimer(true);
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

  // Share state periodically if teacher
  useEffect(() => {
    if (isTeacher && channelRef.current) {
      const iv = setInterval(() => {
        channelRef.current?.send({
          type: 'broadcast',
          event: 'teacher_sync_state',
          payload: { reactionsEnabled }
        });
      }, 10000);
      return () => clearInterval(iv);
    }
  }, [isTeacher, channelRef.current, reactionsEnabled]);

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

  const toggleReactions = () => {
    const newState = !reactionsEnabled;
    setReactionsEnabled(newState);
    if (!newState) setReactions({}); // reset
    channelRef.current?.send({ type: 'broadcast', event: 'toggle_reactions', payload: { enabled: newState } });
  };

  const reactionCounts = REACTIONS.map(r => ({ ...r, count: Object.values(reactions).filter(v => v === r.key).length }));
  const totalReacted = Object.keys(reactions).length;
  const timerColor = timeLeft <= 10 ? 'text-rose-500' : timeLeft <= 30 ? 'text-amber-500' : 'text-slate-800';

  return (
    <>
      {/* ── FLYING EMOTES LAYER ────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
        <AnimatePresence>
          {flyingEmotes.map(emote => (
            <motion.div
              key={emote.id}
              initial={{ y: '100vh', x: `${emote.x}vw`, opacity: 1, scale: 0.5 }}
              animate={{ 
                y: '-20vh', 
                x: [`${emote.x}vw`, `${emote.x - 5}vw`, `${emote.x + 5}vw`, `${emote.x}vw`],
                opacity: [1, 1, 0.8, 0],
                scale: [0.5, 2, 2.5, 3]
              }}
              transition={{ duration: 3.5, ease: 'easeOut' }}
              className="absolute bottom-0 text-6xl drop-shadow-lg"
              style={{ left: 0 }}
            >
              {emote.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── STUDENT: Reaction bar ──────────────────────────────── */}
      {!isTeacher && reactionsEnabled && (
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-24 right-4 z-[70] flex flex-col gap-2">
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
        </motion.div>
      )}

      {/* ── TEACHER: Reaction summary & Toggle ─────────────────────────── */}
      {isTeacher && (
        <div className="fixed bottom-24 right-4 z-[70] flex flex-col items-end gap-3">
          {reactionsEnabled && totalReacted > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 min-w-[160px]"
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
          
          <button
            onClick={toggleReactions}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg text-xs font-black transition-all ${reactionsEnabled ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-white border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'}`}
          >
            {reactionsEnabled ? 'Tutup Sesi Reaksi' : 'Buka Sesi Reaksi'}
          </button>
        </div>
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


    </>
  );
}
