import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

/* ─── constants ─────────────────────────────────────────────────── */
const DOMAIN_COLORS = {
  dyslexia:    { bg: '#EEF2FF', border: '#6366F1', text: '#4338CA', dot: '#6366F1', dot: '#6366F1' },
  dyscalculia: { bg: '#FFFBEB', border: '#F59E0B', text: '#92400E', dot: '#F59E0B', dot: '#F59E0B' },
  dysgraphia:  { bg: '#ECFDF5', border: '#10B981', text: '#065F46', dot: '#10B981', dot: '#10B981' },
  nvld:        { bg: '#F5F3FF', border: '#8B5CF6', text: '#5B21B6', dot: '#8B5CF6', dot: '#8B5CF6' },
  apd:         { bg: '#FEF2F2', border: '#EF4444', text: '#991B1B', dot: '#EF4444', dot: '#EF4444' },
};

const ANSWER_LABELS = ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'];

const authFetch = (url, opts = {}) => {
  const token = sessionStorage.getItem('access_token');
  return fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });
};

/* ─── progress dots ──────────────────────────────────────────────── */
const ProgressDots = ({ answered, total, domainHistory }) => (
  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
    {Array.from({ length: total }, (_, i) => {
      const domain = domainHistory[i];
      const color = domain ? DOMAIN_COLORS[domain]?.dot : '#E2E8F0';
      const isActive = i === answered - 1;
      return (
        <div key={i} style={{
          width: isActive ? '14px' : '10px',
          height: isActive ? '14px' : '10px',
          borderRadius: '50%',
          background: color,
          transition: 'all 0.3s',
          boxShadow: isActive ? `0 0 0 3px ${color}44` : 'none',
        }} />
      );
    })}
  </div>
);

/* ─── main component ─────────────────────────────────────────────── */
const AdaptiveScreening = () => {
  const navigate  = useNavigate();
  const role      = sessionStorage.getItem('role') || 'teacher';

  // Student selection
  const [students,        setStudents]        = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(true);

  // Session state
  const [sessionId,       setSessionId]       = useState(null);
  const [currentQ,        setCurrentQ]        = useState(null);
  const [progress,        setProgress]        = useState({ answered: 0, total: 20, percent: 0 });
  const [domainHistory,   setDomainHistory]   = useState([]); // domain per answered slot

  // UI state
  const [selectedScore,   setSelectedScore]   = useState(null);
  const [phase,           setPhase]           = useState('select'); // select | screening | completing | done
  const [submitting,      setSubmitting]       = useState(false);
  const [apiError,        setApiError]        = useState('');
  const [showAbandon,     setShowAbandon]     = useState(false);

  // Quick-add student state
  const [showAddStudent,  setShowAddStudent]  = useState(false);
  const [addForm,         setAddForm]         = useState({ full_name: '', grade: 'Grade 1', date_of_birth: '' });
  const [addError,        setAddError]        = useState('');
  const [addingStudent,   setAddingStudent]   = useState(false);

  /* fetch students */
  const fetchStudents = useCallback(() => {
    authFetch('/api/students/rich')
      .then(r => r.json())
      .then(data => setStudents(Array.isArray(data) ? data : []))
      .catch(() => setStudents([]))
      .finally(() => setLoadingStudents(false));
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    if (!token) { navigate('/login'); return; }
    fetchStudents();
  }, [fetchStudents, navigate]);

  /* quick-add student */
  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!addForm.full_name.trim()) { setAddError('Name is required.'); return; }
    setAddError('');
    setAddingStudent(true);
    try {
      const res = await authFetch('/api/students/', {
        method: 'POST',
        body: JSON.stringify({
          full_name:     addForm.full_name.trim(),
          grade:         addForm.grade,
          date_of_birth: addForm.date_of_birth || null,
          user_id:       null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setAddError(err.detail || 'Failed to add student.');
        return;
      }
      const newStudent = await res.json();
      setAddForm({ full_name: '', grade: 'Grade 1', date_of_birth: '' });
      setShowAddStudent(false);
      setLoadingStudents(true);
      fetchStudents();                           // refresh list
      setSelectedStudent(String(newStudent.id)); // auto-select newly added
    } catch {
      setAddError('Network error — please try again.');
    } finally {
      setAddingStudent(false);
    }
  };

  /* ── start session ─────────────────────────────────────────────── */
  const handleStart = async () => {
    if (!selectedStudent) return;
    setApiError('');
    setSubmitting(true);
    try {
      const res = await authFetch('/api/screenings/session/start', {
        method: 'POST',
        body: JSON.stringify({ student_id: parseInt(selectedStudent) }),
      });
      if (!res.ok) {
        const err = await res.json();
        setApiError(err.detail || 'Failed to start session.');
        return;
      }
      const data = await res.json();
      setSessionId(data.session_id);
      setCurrentQ(data.question);
      setProgress(data.progress);
      setDomainHistory([data.question?.domain]);
      setPhase('screening');
    } catch {
      setApiError('Network error — is the backend running?');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── submit answer ─────────────────────────────────────────────── */
  const handleAnswer = async () => {
    if (selectedScore === null || !sessionId || !currentQ) return;
    setSubmitting(true);
    setApiError('');
    try {
      const res = await authFetch('/api/screenings/session/answer', {
        method: 'POST',
        body: JSON.stringify({
          session_id:  sessionId,
          question_id: currentQ.id,
          score:       selectedScore,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setApiError(err.detail || 'Failed to submit answer.');
        return;
      }
      const data = await res.json();
      setProgress(data.progress);
      setSelectedScore(null);

      if (data.complete) {
        // All 20 answered — call complete endpoint
        await handleComplete(data.progress);
      } else {
        setCurrentQ(data.question);
        setDomainHistory(prev => [...prev, data.question?.domain]);
      }
    } catch {
      setApiError('Network error — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── complete + get report ─────────────────────────────────────── */
  const handleComplete = async (finalProgress) => {
    setPhase('completing');
    try {
      const res = await authFetch('/api/screenings/session/complete', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId,
          student_id: parseInt(selectedStudent),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setApiError(err.detail || 'Failed to generate report.');
        setPhase('screening');
        return;
      }
      const report = await res.json();
      // Navigate to results page, passing report as state
      navigate(`/results/${selectedStudent}`, { state: { report } });
    } catch {
      setApiError('Network error while generating report.');
      setPhase('screening');
    }
  };

  /* ─── derived ─────────────────────────────────────────────────── */
  const domainStyle = currentQ ? DOMAIN_COLORS[currentQ.domain] : DOMAIN_COLORS.dyslexia;
  const selectedStudentObj = students.find(s => s.id === parseInt(selectedStudent));

  /* ══════════════════════════════════════════════════════════════════
     PHASE: select student
  ══════════════════════════════════════════════════════════════════ */
  if (phase === 'select') return (
    <div className="dashboard-layout">
      <Sidebar role={role} />
      <div className="dashboard-main" style={{ maxWidth: '720px' }}>
        <header style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2.25rem', color: '#1E293B', margin: '0 0 0.35rem 0' }}>Adaptive Screening</h1>
          <p style={{ color: '#64748B', margin: 0 }}>
            20 adaptive questions, routed by your responses. Takes ~5–8 minutes.
          </p>
        </header>

        {/* How it works */}
        <div style={{ background: 'linear-gradient(135deg, #6366F1, #A855F7)', borderRadius: '20px', padding: '2rem', color: 'white', marginBottom: '2rem' }}>
          <h2 style={{ color: 'white', margin: '0 0 1rem 0', fontSize: '1.3rem' }}>How the adaptive screening works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[
              ['Phase 1 — Gateway', '5 broad questions, one per LD domain'],
              ['Phase 2 — Deep-Dive', 'Follow-up questions for suspected domains'],
              ['Phase 3 — Confirmatory', '3 cross-domain fill questions'],
              ['Final Report', 'AI analysis with SHAP explainability'],
            ].map(([title, desc]) => (
              <div key={title} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '0.85rem 1rem' }}>
                <p style={{ color: 'white', fontWeight: '800', margin: '0 0 0.2rem', fontSize: '0.9rem' }}>{title}</p>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '0.82rem' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Domain legend */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {Object.entries(DOMAIN_COLORS).map(([domain, c]) => (
            <span key={domain} style={{ background: c.bg, border: `2px solid ${c.border}`, color: c.text, padding: '0.3rem 0.8rem', borderRadius: '99px', fontWeight: '700', fontSize: '0.8rem' }}>
              {c.emoji} {domain.charAt(0).toUpperCase() + domain.slice(1)}
            </span>
          ))}
        </div>

        {/* Student selector */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', border: '2px solid #E2E8F0' }}>
          <h3 style={{ color: '#1E293B', margin: '0 0 1.25rem 0', fontSize: '1.2rem' }}>Select a Student</h3>

          {apiError && (
            <div style={{ background: '#FFF1F2', border: '2px solid #FECDD3', color: '#E11D48', borderRadius: '10px', padding: '0.85rem 1.1rem', marginBottom: '1rem', fontWeight: '700', fontSize: '0.9rem' }}>
              {apiError}
            </div>
          )}

          {loadingStudents ? (
            <div style={{ height: '48px', background: '#F1F5F9', borderRadius: '12px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ) : students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <p style={{ color: '#94A3B8', margin: '0 0 1rem' }}>No students yet. Add your first student to get started.</p>
              <button className="btn btn-primary" onClick={() => setShowAddStudent(true)}>+ Add First Student</button>
            </div>
          ) : (
            <>
              <select
                value={selectedStudent}
                onChange={e => setSelectedStudent(e.target.value)}
                style={{ width: '100%', padding: '0.9rem 1.1rem', borderRadius: '12px', border: '2px solid #E2E8F0', fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: selectedStudent ? '#1E293B' : '#94A3B8' }}
              >
                <option value="">— Choose a student —</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name} · {s.grade}</option>
                ))}
              </select>

              <button type="button" onClick={() => setShowAddStudent(true)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '2px dashed #A5B4FC', background: '#F8FAFF', color: '#6366F1', fontWeight: '700', fontFamily: 'var(--font-body)', cursor: 'pointer', fontSize: '0.88rem', marginBottom: '1.25rem', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#EEF2FF'; e.currentTarget.style.borderColor = '#6366F1'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFF'; e.currentTarget.style.borderColor = '#A5B4FC'; }}
              >
                + Add a New Student
              </button>

              {selectedStudentObj && (
                <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '0.85rem 1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366F1,#A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '0.9rem' }}>
                    {selectedStudentObj.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: '800', color: '#1E293B' }}>{selectedStudentObj.full_name}</p>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>{selectedStudentObj.grade} · Last screened: {selectedStudentObj.last_screening || 'Never'}</p>
                  </div>
                </div>
              )}

              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '1rem', fontSize: '1rem', opacity: !selectedStudent || submitting ? 0.6 : 1 }}
                disabled={!selectedStudent || submitting}
                onClick={handleStart}
              >
                {submitting ? 'Starting…' : 'Start adaptive screening'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Quick-add student modal ──────────────────────────────── */}
      {showAddStudent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '1rem' }}
          onClick={e => e.target === e.currentTarget && !addingStudent && setShowAddStudent(false)}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '2.25rem', width: '100%', maxWidth: '440px', boxShadow: '0 25px 60px rgba(0,0,0,0.25)' }}>
            <h2 style={{ fontSize: '1.6rem', color: '#1E293B', margin: '0 0 0.3rem' }}>Add New Student</h2>
            <p style={{ color: '#64748B', margin: '0 0 1.5rem', fontSize: '0.9rem' }}>Student will be assigned to your account and auto-selected.</p>

            {addError && (
              <div style={{ background: '#FFF1F2', border: '2px solid #FECDD3', color: '#E11D48', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', fontWeight: '700', fontSize: '0.88rem' }}>⚠ {addError}</div>
            )}

            <form onSubmit={handleAddStudent} noValidate>
              <div className="form-group">
                <label>Full Name <span style={{ color: '#E11D48' }}>*</span></label>
                <input type="text" placeholder="e.g. Arjun Singh" value={addForm.full_name}
                  onChange={e => { setAddForm(p => ({ ...p, full_name: e.target.value })); setAddError(''); }}
                  autoFocus style={addError ? { borderColor: '#E11D48' } : {}} />
              </div>
              <div className="form-group">
                <label>Grade Level <span style={{ color: '#E11D48' }}>*</span></label>
                <select value={addForm.grade} onChange={e => setAddForm(p => ({ ...p, grade: e.target.value }))}>
                  {['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8'].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Date of Birth <span style={{ color: '#94A3B8', fontWeight: '600', fontSize: '0.82rem' }}>(optional)</span></label>
                <input type="date" value={addForm.date_of_birth} max={new Date().toISOString().split('T')[0]}
                  onChange={e => setAddForm(p => ({ ...p, date_of_birth: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => { setShowAddStudent(false); setAddError(''); }}
                  className="btn" style={{ flex: 1, background: '#F1F5F9', color: '#64748B', border: 'none' }} disabled={addingStudent}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={addingStudent}>
                  {addingStudent ? '⏳ Adding…' : '+ Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════
     PHASE: completing (processing)
  ══════════════════════════════════════════════════════════════════ */
  if (phase === 'completing') return (
    <div className="dashboard-layout">
      <Sidebar role={role} />
      <div className="dashboard-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '440px' }}>
          <div style={{ fontSize: '4rem', animation: 'spin 2s linear infinite', display: 'inline-block' }}>🧠</div>
          <h2 style={{ color: '#1E293B', margin: '1.5rem 0 0.75rem' }}>Analysing responses…</h2>
          <p style={{ color: '#64748B', lineHeight: '1.7' }}>
            Running the ML model and generating your AI-explainable report. This takes just a moment.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            {Object.entries(DOMAIN_COLORS).map(([d, c]) => (
              <div key={d} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c.dot, animation: `pulse 1.5s ease-in-out ${Object.keys(DOMAIN_COLORS).indexOf(d) * 0.2}s infinite` }} />
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════
     PHASE: screening (main question loop)
  ══════════════════════════════════════════════════════════════════ */
  return (
    <div className="dashboard-layout">
      <Sidebar role={role} />
      <div className="dashboard-main" style={{ maxWidth: '760px' }}>

        {/* Abandon modal */}
        {showAbandon && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
            <div style={{ background: 'white', borderRadius: '20px', padding: '2.5rem', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}></div>
              <h2 style={{ color: '#1E293B', margin: '0 0 0.75rem' }}>Abandon screening?</h2>
              <p style={{ color: '#64748B', margin: '0 0 1.75rem', lineHeight: '1.6' }}>
                Progress will be lost — in-memory sessions are not persisted. If you leave now, you'll need to start over.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn" style={{ flex: 1, background: '#F1F5F9', border: 'none', color: '#64748B' }} onClick={() => setShowAbandon(false)}>Keep going</button>
                <button className="btn" style={{ flex: 1, background: '#E11D48', border: 'none', color: 'white' }} onClick={() => navigate('/dashboard')}>Leave</button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', color: '#1E293B', margin: '0 0 0.2rem 0' }}>Adaptive Screening</h1>
            <p style={{ color: '#64748B', margin: 0, fontSize: '0.9rem' }}>
              {selectedStudentObj?.full_name || 'Student'} · Question {progress.answered} of {progress.total}
            </p>
          </div>
          <button onClick={() => setShowAbandon(true)}
            style={{ background: '#F1F5F9', border: 'none', borderRadius: '10px', padding: '0.6rem 1rem', color: '#64748B', fontWeight: '700', cursor: 'pointer', fontSize: '0.88rem' }}>
            Abandon
          </button>
        </div>

        {/* Progress bar + dots */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ background: '#F1F5F9', borderRadius: '99px', height: '8px', overflow: 'hidden', marginBottom: '1rem' }}>
            <div style={{ height: '100%', width: `${progress.percent}%`, background: `linear-gradient(90deg, #6366F1, #A855F7)`, borderRadius: '99px', transition: 'width 0.4s ease' }} />
          </div>
          <ProgressDots answered={progress.answered} total={progress.total} domainHistory={domainHistory} />
        </div>

        {/* Domain legend (compact) */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {Object.entries(DOMAIN_COLORS).map(([domain, c]) => (
            <span key={domain} style={{ background: c.bg, border: `1.5px solid ${c.border}`, color: c.text, padding: '0.2rem 0.7rem', borderRadius: '99px', fontWeight: '700', fontSize: '0.75rem', opacity: currentQ?.domain === domain ? 1 : 0.45, transition: 'opacity 0.3s' }}>
              {c.emoji} {domain.charAt(0).toUpperCase() + domain.slice(1)}
            </span>
          ))}
        </div>

        {/* Question card */}
        {currentQ && (
          <div key={currentQ.id} style={{ background: domainStyle.bg, borderRadius: '24px', border: `2px solid ${domainStyle.border}`, padding: '2.5rem', marginBottom: '1.75rem', transition: 'all 0.3s' }}>
            {/* Domain badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <span style={{ background: domainStyle.border, color: 'white', padding: '0.28rem 0.85rem', borderRadius: '99px', fontWeight: '800', fontSize: '0.8rem' }}>
                {domainStyle.emoji} {currentQ.domain_label}
              </span>
              {currentQ.tier === 1 && <span style={{ color: domainStyle.text, fontSize: '0.78rem', fontWeight: '700' }}>Gateway Question</span>}
              {currentQ.tier === 2 && <span style={{ color: domainStyle.text, fontSize: '0.78rem', fontWeight: '700' }}>Deep-Dive</span>}
              {currentQ.tier === 3 && <span style={{ color: domainStyle.text, fontSize: '0.78rem', fontWeight: '700' }}>Confirmatory</span>}
            </div>

            <p style={{ color: domainStyle.text, fontSize: '1.15rem', fontWeight: '700', lineHeight: '1.65', margin: '0 0 0.75rem 0' }}>
              {currentQ.text}
            </p>
            <p style={{ color: domainStyle.text, opacity: 0.65, fontSize: '0.82rem', margin: 0, fontWeight: '600' }}>
              Based on your classroom observations over the past few weeks.
            </p>
          </div>
        )}

        {/* Answer options */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.6rem', marginBottom: '1.75rem' }}>
          {ANSWER_LABELS.map((label, i) => {
            const score = i + 1;
            const isSelected = selectedScore === score;
            return (
              <button key={score} onClick={() => setSelectedScore(score)}
                style={{
                  padding: '0.85rem 0.5rem',
                  borderRadius: '14px',
                  border: `2px solid ${isSelected ? domainStyle.border : '#E2E8F0'}`,
                  background: isSelected ? domainStyle.bg : 'white',
                  color: isSelected ? domainStyle.text : '#64748B',
                  fontWeight: '800',
                  fontFamily: 'var(--font-body)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s',
                  transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                  boxShadow: isSelected ? `0 0 0 3px ${domainStyle.border}33` : 'none',
                }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '0.3rem' }}>{score}</div>
                <div style={{ fontSize: '0.72rem', lineHeight: '1.2' }}>{label}</div>
              </button>
            );
          })}
        </div>

        {/* Error */}
        {apiError && (
          <div style={{ background: '#FFF1F2', border: '2px solid #FECDD3', color: '#E11D48', borderRadius: '10px', padding: '0.85rem 1.1rem', marginBottom: '1rem', fontWeight: '700', fontSize: '0.9rem' }}>
            {apiError}
          </div>
        )}

        {/* Next button */}
        <button
          className="btn btn-primary"
          style={{ width: '100%', padding: '1.1rem', fontSize: '1.05rem', opacity: selectedScore === null || submitting ? 0.5 : 1, transition: 'opacity 0.2s' }}
          disabled={selectedScore === null || submitting}
          onClick={handleAnswer}
        >
          {submitting
            ? '⏳ Saving…'
            : progress.answered >= progress.total - 1
              ? 'Submit & generate report'
              : `Next Question →  (${progress.answered + 1} / ${progress.total})`}
        </button>

      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
};

export default AdaptiveScreening;
