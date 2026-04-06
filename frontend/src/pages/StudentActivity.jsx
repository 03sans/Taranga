import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem('access_token');
  return fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers } });
};

const LD_META = {
  dyslexia:    { color: '#6366F1', bg: '#EEF2FF' },
  dyscalculia: { color: '#F59E0B', bg: '#FFFBEB' },
  dysgraphia:  { color: '#10B981', bg: '#ECFDF5' },
  nvld:        { color: '#8B5CF6', bg: '#F5F3FF' },
  apd:         { color: '#EF4444', bg: '#FEF2F2' },
};

/* ════════════════════════════════════════════════════════════════
   ENGINE 1 — MATCH PAIRS
   Click left item, then matching right item.
════════════════════════════════════════════════════════════════ */
const MatchPairsEngine = ({ config, color, bg, onComplete }) => {
  const { pairs, time_limit } = config;
  const half = Math.min(pairs.length, 6);
  const sliced = pairs.slice(0, half);

  const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
  const [lefts]  = useState(() => shuffle(sliced.map((p, i) => ({ id: i, text: p.left  }))));
  const [rights] = useState(() => shuffle(sliced.map((p, i) => ({ id: i, text: p.right }))));
  const [selLeft,   setSelLeft]   = useState(null);
  const [matched,   setMatched]   = useState(new Set());
  const [flash,     setFlash]     = useState(null); // { id, success }
  const [timeLeft,  setTimeLeft]  = useState(time_limit);
  const [startTime]               = useState(Date.now());

  useEffect(() => {
    if (timeLeft <= 0) { onComplete(Math.round((matched.size / half) * 100), Math.round((Date.now() - startTime) / 1000)); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]); // eslint-disable-line

  useEffect(() => {
    if (matched.size === half) {
      setTimeout(() => onComplete(100, Math.round((Date.now() - startTime) / 1000)), 600);
    }
  }, [matched]); // eslint-disable-line

  const handleRight = (id) => {
    if (!selLeft || matched.has(id)) return;
    if (selLeft === id) {
      setMatched(prev => new Set([...prev, id]));
      setFlash({ id, success: true });
      setSelLeft(null);
      setTimeout(() => setFlash(null), 600);
    } else {
      setFlash({ id: selLeft, success: false });
      setSelLeft(null);
      setTimeout(() => setFlash(null), 500);
    }
  };

  const progress = (matched.size / half) * 100;

  return (
    <div>
      {/* Timer + progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ fontWeight: '800', color: timeLeft <= 10 ? '#E11D48' : '#64748B', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          ⏱ {timeLeft}s
        </div>
        <div style={{ fontWeight: '800', color, fontSize: '0.95rem' }}>{matched.size} / {half} matched</div>
      </div>
      <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', marginBottom: '2rem', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: color, borderRadius: '3px', transition: 'width 0.3s' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ color: '#94A3B8', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', margin: 0 }}>Click to select</p>
          {lefts.map(item => {
            const done = matched.has(item.id);
            const sel  = selLeft === item.id;
            const fail = flash?.id === item.id && !flash?.success;
            return (
              <button key={item.id} onClick={() => !done && setSelLeft(sel ? null : item.id)}
                disabled={done}
                style={{
                  padding: '0.9rem 1.1rem', borderRadius: '12px', border: `2px solid ${done ? '#A7F3D0' : sel ? color : fail ? '#FECDD3' : '#E2E8F0'}`,
                  background: done ? '#ECFDF5' : sel ? bg : fail ? '#FFF1F2' : 'white',
                  cursor: done ? 'default' : 'pointer', fontWeight: '700', color: done ? '#10B981' : '#1E293B',
                  textAlign: 'left', fontSize: '0.92rem', transition: 'all 0.2s',
                  transform: sel ? 'scale(1.02)' : 'scale(1)',
                }}>
                {done ? '✓ ' : ''}{item.text}
              </button>
            );
          })}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={{ color: '#94A3B8', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', margin: 0 }}>Click to match</p>
          {rights.map(item => {
            const done = matched.has(item.id);
            const grn  = flash?.id === item.id && flash?.success;
            const red  = flash?.id === item.id && !flash?.success;
            return (
              <button key={item.id} onClick={() => handleRight(item.id)}
                disabled={done || !selLeft}
                style={{
                  padding: '0.9rem 1.1rem', borderRadius: '12px', border: `2px solid ${done ? '#A7F3D0' : grn ? '#10B981' : red ? '#FECDD3' : selLeft ? `${color}66` : '#E2E8F0'}`,
                  background: done ? '#ECFDF5' : grn ? '#ECFDF5' : red ? '#FFF1F2' : 'white',
                  cursor: done || !selLeft ? 'default' : 'pointer', fontWeight: '700', color: done ? '#10B981' : '#1E293B',
                  textAlign: 'left', fontSize: '0.92rem', transition: 'all 0.2s',
                }}>
                {done ? '✓ ' : ''}{item.text}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   ENGINE 2 — FALLING CATCHER
   Items fall; click the correct ones.
════════════════════════════════════════════════════════════════ */
const FallingCatcherEngine = ({ config, color, bg, onComplete }) => {
  const { items, lives: initLives, target_label } = config;
  const SPEED = 1.8; // % per frame
  const INTERVAL = 60; // ms
  const [fallers, setFallers] = useState([]);
  const [lives, setLives]     = useState(initLives || 3);
  const [score, setScore]     = useState(0);
  const [total, setTotal]     = useState(0);
  const [done,  setDone]      = useState(false);
  const [startTime] = useState(Date.now());
  const queueRef = useRef([...items].sort(() => Math.random() - 0.5));
  const idRef    = useRef(0);
  const spawnRef = useRef(null);
  const moveRef  = useRef(null);

  const spawn = useCallback(() => {
    if (queueRef.current.length === 0) {
      clearInterval(spawnRef.current);
      return;
    }
    const item = queueRef.current.shift();
    const faller = { id: idRef.current++, label: item.label, correct: item.correct, top: -5, left: Math.random() * 75 + 5, clicked: false };
    setFallers(prev => [...prev, faller]);
  }, []);

  useEffect(() => {
    spawnRef.current = setInterval(spawn, 1800);
    return () => clearInterval(spawnRef.current);
  }, [spawn]);

  useEffect(() => {
    if (done) return;
    moveRef.current = setInterval(() => {
      setFallers(prev => {
        const next = [];
        let liveLost = 0;
        for (const f of prev) {
          if (f.clicked) { next.push(f); continue; }
          const newTop = f.top + SPEED;
          if (newTop > 105) {
            if (f.correct) liveLost++;
            // don't keep it
          } else {
            next.push({ ...f, top: newTop });
          }
        }
        if (liveLost > 0) {
          setLives(l => {
            const newLives = l - liveLost;
            if (newLives <= 0) setDone(true);
            return Math.max(0, newLives);
          });
        }
        return next;
      });

      // Check if all spawned and all fallen
      setFallers(prev => {
        if (queueRef.current.length === 0 && prev.filter(f => !f.clicked && f.top <= 105).length === 0 && prev.length > 0) {
          setDone(true);
        }
        return prev;
      });
    }, INTERVAL);
    return () => clearInterval(moveRef.current);
  }, [done]);

  useEffect(() => {
    if (done) {
      const pct = total > 0 ? Math.round((score / total) * 100) : 0;
      setTimeout(() => onComplete(pct, Math.round((Date.now() - startTime) / 1000)), 500);
    }
  }, [done]); // eslint-disable-line

  const handleClick = (id) => {
    setFallers(prev => prev.map(f => {
      if (f.id !== id || f.clicked) return f;
      if (f.correct) { setScore(s => s + 1); setTotal(t => t + 1); }
      else { setLives(l => { if (l - 1 <= 0) setDone(true); return Math.max(0, l - 1); }); setTotal(t => t + 1); }
      return { ...f, clicked: true };
    }));
  };

  const hearts = Array.from({ length: initLives || 3 }, (_, i) => i < lives ? '❤️' : '🖤');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '1.1rem', letterSpacing: '2px' }}>{hearts.join(' ')}</div>
        <div style={{ fontWeight: '800', color, fontSize: '0.95rem' }}>{score} caught</div>
      </div>
      <div style={{ background: bg, borderRadius: '12px', padding: '0.6rem 1rem', marginBottom: '1rem', fontSize: '0.88rem', fontWeight: '700', color }}>
        🎯 {target_label}
      </div>

      {/* Game arena */}
      <div style={{ position: 'relative', height: '420px', background: 'linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 100%)', borderRadius: '20px', border: `2px solid ${color}33`, overflow: 'hidden' }}>
        {fallers.filter(f => !f.clicked).map(f => (
          <button key={f.id}
            onClick={() => handleClick(f.id)}
            style={{
              position: 'absolute', top: `${f.top}%`, left: `${f.left}%`,
              background: 'white', border: `3px solid ${color}`, borderRadius: '12px',
              padding: '0.6rem 1.1rem', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer',
              color, boxShadow: `0 4px 12px ${color}30`, transition: 'transform 0.1s',
              fontFamily: 'var(--font-body)',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {f.label}
          </button>
        ))}
        {fallers.filter(f => f.clicked && f.correct).map(f => (
          <div key={`c${f.id}`} style={{ position: 'absolute', top: `${f.top}%`, left: `${f.left}%`, fontSize: '1.5rem', animation: 'fadeUp 0.5s ease forwards', pointerEvents: 'none' }}>✅</div>
        ))}
        {fallers.filter(f => f.clicked && !f.correct).map(f => (
          <div key={`x${f.id}`} style={{ position: 'absolute', top: `${f.top}%`, left: `${f.left}%`, fontSize: '1.5rem', animation: 'fadeUp 0.5s ease forwards', pointerEvents: 'none' }}>❌</div>
        ))}

        {fallers.length === 0 && queueRef.current.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '2rem', animation: 'spin 2s linear infinite' }}>⏳</div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   ENGINE 3 — MULTIPLE CHOICE
   Questions one by one with feedback.
════════════════════════════════════════════════════════════════ */
const MultipleChoiceEngine = ({ config, color, bg, onComplete }) => {
  const { questions, time_limit, flash_duration_ms } = config;
  const qs = questions.slice(0, 8);
  const [qIndex, setQIndex]     = useState(0);
  const [selected, setSelected] = useState(null);
  const [correct, setCorrect]   = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [timeLeft, setTimeLeft] = useState(time_limit);
  const [startTime] = useState(Date.now());
  const [hidden, setHidden]     = useState(flash_duration_ms ? true : false);

  // Flash mechanic for APD activities
  useEffect(() => {
    if (flash_duration_ms) {
      setHidden(true);
      const t = setTimeout(() => setHidden(false), flash_duration_ms);
      return () => clearTimeout(t);
    }
  }, [qIndex, flash_duration_ms]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete(Math.round((correct / qs.length) * 100), Math.round((Date.now() - startTime) / 1000));
      return;
    }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]); // eslint-disable-line

  const handleAnswer = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    const isRight = idx === qs[qIndex].answer_index;
    if (isRight) setCorrect(p => p + 1);
    setFeedback({ correct: isRight, text: qs[qIndex].feedback });

    setTimeout(() => {
      const next = qIndex + 1;
      if (next >= qs.length) {
        onComplete(Math.round(((correct + (isRight ? 1 : 0)) / qs.length) * 100), Math.round((Date.now() - startTime) / 1000));
      } else {
        setQIndex(next);
        setSelected(null);
        setFeedback(null);
      }
    }, 1600);
  };

  const q = qs[qIndex];
  const progress = (qIndex / qs.length) * 100;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <span style={{ fontWeight: '700', color: '#94A3B8', fontSize: '0.9rem' }}>Question {qIndex + 1} of {qs.length}</span>
        <span style={{ fontWeight: '800', color: timeLeft <= 15 ? '#E11D48' : '#64748B' }}>⏱ {timeLeft}s</span>
      </div>
      <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px', marginBottom: '2rem', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: color, borderRadius: '3px', transition: 'width 0.4s' }} />
      </div>

      {/* Question */}
      <div style={{ background: bg, borderRadius: '18px', padding: '1.75rem', marginBottom: '1.75rem', border: `2px solid ${color}33`, minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        {flash_duration_ms && hidden ? (
          <p style={{ color, fontWeight: '900', fontSize: '1.4rem', letterSpacing: '2px' }}>{q.stem.replace(/\[.*?\]/g, m => m.replace('[','').replace(']',''))}</p>
        ) : (
          <p style={{ color: '#1E293B', fontWeight: '800', fontSize: '1.1rem', lineHeight: '1.6', margin: 0 }}>{q.stem}</p>
        )}
      </div>

      {/* Options */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
        {q.options.map((opt, i) => {
          const isAnswer  = i === q.answer_index;
          const isChoosen = selected === i;
          const bg2 =
            selected === null ? 'white'
              : isAnswer ? '#ECFDF5'
                : isChoosen ? '#FFF1F2'
                  : 'white';
          const bdr =
            selected === null ? '#E2E8F0'
              : isAnswer ? '#10B981'
                : isChoosen ? '#FECDD3'
                  : '#E2E8F0';

          return (
            <button key={i} onClick={() => handleAnswer(i)} disabled={selected !== null}
              style={{
                padding: '1rem 1.25rem', borderRadius: '14px', border: `2px solid ${bdr}`,
                background: bg2, cursor: selected !== null ? 'default' : 'pointer',
                fontWeight: '700', color: '#1E293B', textAlign: 'left', fontSize: '0.95rem',
                transition: 'all 0.2s', lineHeight: '1.4',
              }}
              onMouseEnter={e => selected === null && (e.currentTarget.style.borderColor = color, e.currentTarget.style.background = bg)}
              onMouseLeave={e => selected === null && (e.currentTarget.style.borderColor = '#E2E8F0', e.currentTarget.style.background = 'white')}
            >
              <span style={{ background: '#F1F5F9', borderRadius: '6px', padding: '0.1rem 0.45rem', fontSize: '0.78rem', fontWeight: '900', marginRight: '0.5rem', color: '#64748B' }}>
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {feedback && (
        <div style={{ background: feedback.correct ? '#ECFDF5' : '#FFF1F2', border: `2px solid ${feedback.correct ? '#A7F3D0' : '#FECDD3'}`, borderRadius: '14px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', animation: 'slideIn 0.3s ease' }}>
          <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{feedback.correct ? '✅' : '❌'}</span>
          <div>
            <p style={{ margin: 0, fontWeight: '800', color: feedback.correct ? '#065F46' : '#991B1B', fontSize: '0.9rem' }}>
              {feedback.correct ? 'Correct!' : 'Not quite!'}
            </p>
            <p style={{ margin: '0.2rem 0 0', color: feedback.correct ? '#047857' : '#B91C1C', fontSize: '0.85rem' }}>{feedback.text}</p>
          </div>
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   SCORE SCREEN
════════════════════════════════════════════════════════════════ */
const ScoreScreen = ({ score, time, xpEarned, activity, color, bg, onPlayAgain, onBack }) => {
  const grade = score >= 80 ? { label: 'Excellent! 🌟', emoji: '🏆' } : score >= 60 ? { label: 'Great Job! 👍', emoji: '⭐' } : { label: 'Keep Trying! 💪', emoji: '🎯' };
  return (
    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
      <div style={{ fontSize: '5rem', marginBottom: '0.5rem', animation: 'bounceIn 0.5s ease' }}>{grade.emoji}</div>
      <h2 style={{ color, fontSize: '1.8rem', marginBottom: '0.25rem' }}>{grade.label}</h2>
      <p style={{ color: '#64748B', marginBottom: '2rem' }}>You completed: <strong>{activity.title}</strong></p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Score', value: `${Math.round(score)}%`, icon: '🎯' },
          { label: 'Time', value: `${time}s`, icon: '⏱' },
          { label: 'XP Earned', value: `+${xpEarned}`, icon: '⚡' },
        ].map(stat => (
          <div key={stat.label} style={{ background: bg, border: `2px solid ${color}44`, borderRadius: '16px', padding: '1.25rem 2rem', minWidth: '120px' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{stat.icon}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: '900', color }}>{stat.value}</div>
            <div style={{ color: '#94A3B8', fontWeight: '700', fontSize: '0.8rem' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button onClick={onBack} style={{ background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '14px', padding: '0.9rem 1.75rem', fontWeight: '800', cursor: 'pointer', fontSize: '1rem' }}>
          ← Back to Dashboard
        </button>
        <button onClick={onPlayAgain} style={{ background: `linear-gradient(135deg,${color},${color}CC)`, color: 'white', border: 'none', borderRadius: '14px', padding: '0.9rem 1.75rem', fontWeight: '900', cursor: 'pointer', fontSize: '1rem', boxShadow: `0 6px 20px ${color}40` }}>
          🔁 Play Again
        </button>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════ */
const StudentActivity = () => {
  const { key } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [phase, setPhase]       = useState('loading'); // loading | playing | submitting | score
  const [result, setResult]     = useState(null);
  const [gameKey, setGameKey]   = useState(0); // increment to reset game
  const [error, setError]       = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { navigate('/student-login'); return; }

    authFetch('/api/activities/my')
      .then(r => r.json())
      .then(data => {
        const found = Array.isArray(data) ? data.find(a => a.key === key) : null;
        if (!found) { setError('Activity not found or not assigned.'); setPhase('error'); return; }
        if (found.status === 'locked') { setError('This activity hasn\'t been assigned to you yet.'); setPhase('error'); return; }
        setActivity(found);
        setPhase('playing');
      })
      .catch(() => { setError('Failed to load activity.'); setPhase('error'); });
  }, [key, navigate]);

  const handleComplete = async (score, time) => {
    setPhase('submitting');
    try {
      const res  = await authFetch(`/api/activities/${key}/attempt`, {
        method: 'POST',
        body: JSON.stringify({ score, time_taken_seconds: time }),
      });
      const data = await res.json();
      setResult({ score, time, xpEarned: data.xp_earned || 0 });
    } catch {
      setResult({ score, time, xpEarned: 0 });
    }
    setPhase('score');
  };

  const handlePlayAgain = () => {
    setPhase('playing');
    setResult(null);
    setGameKey(k => k + 1);
  };

  if (phase === 'loading') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAFC', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite' }}>🎮</div>
      <p style={{ color: '#64748B', fontWeight: '700' }}>Loading activity…</p>
    </div>
  );

  if (phase === 'error') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAFC', flexDirection: 'column', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem' }}>🔒</div>
      <h2 style={{ color: '#1E293B' }}>{error}</h2>
      <button onClick={() => navigate('/student-dashboard')} style={{ background: '#6366F1', color: 'white', border: 'none', borderRadius: '14px', padding: '0.9rem 2rem', fontWeight: '800', cursor: 'pointer', fontSize: '1rem' }}>
        ← Back to Dashboard
      </button>
    </div>
  );

  if (phase === 'submitting') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAFC', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ fontSize: '3rem', animation: 'spin 1s linear infinite' }}>⚡</div>
      <p style={{ color: '#64748B', fontWeight: '700' }}>Saving your score…</p>
    </div>
  );

  const meta    = LD_META[activity?.ld_type] || { color: '#6366F1', bg: '#EEF2FF' };
  const { color, bg } = meta;
  const config  = activity?.game_config || {};
  const engine  = activity?.engine;

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      {/* Top bar */}
      <div style={{ background: 'white', borderBottom: '2px solid #E2E8F0', padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate('/student-dashboard')} style={{ background: bg, border: 'none', borderRadius: '10px', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: '700', color, fontSize: '0.88rem' }}>
          ← Dashboard
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.2rem', color: '#1E293B', fontWeight: '900' }}>
            {activity?.icon} {activity?.title}
          </h1>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94A3B8', fontWeight: '600' }}>
            {engine} · {activity?.difficulty} · +{activity?.xp} XP
          </p>
        </div>
      </div>

      {/* Game area */}
      <div style={{ maxWidth: '760px', margin: '2.5rem auto', padding: '0 1.5rem' }}>
        <div style={{ background: 'white', borderRadius: '24px', border: `2px solid ${color}33`, padding: '2rem', boxShadow: `0 12px 40px ${color}15` }}>

          {phase === 'playing' && (
            <>
              {engine === 'MatchPairs'     && <MatchPairsEngine    key={gameKey} config={config} color={color} bg={bg} onComplete={handleComplete} />}
              {engine === 'FallingCatcher' && <FallingCatcherEngine key={gameKey} config={config} color={color} bg={bg} onComplete={handleComplete} />}
              {engine === 'MultipleChoice' && <MultipleChoiceEngine key={gameKey} config={config} color={color} bg={bg} onComplete={handleComplete} />}
            </>
          )}

          {phase === 'score' && result && (
            <ScoreScreen
              score={result.score} time={result.time} xpEarned={result.xpEarned}
              activity={activity} color={color} bg={bg}
              onPlayAgain={handlePlayAgain}
              onBack={() => navigate('/student-dashboard')}
            />
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:1;transform:translateY(0)} to{opacity:0;transform:translateY(-30px)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bounceIn { 0%{transform:scale(0)} 60%{transform:scale(1.1)} 100%{transform:scale(1)} }
      `}</style>
    </div>
  );
};

export default StudentActivity;
