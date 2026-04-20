import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { AlertTriangleIcon, CheckCircleIcon, InfoIcon, BrainIcon, SendIcon } from '../components/icons';

const LD_KEYWORDS = {
  dyslexia:    ['struggles', 'read', 'reverse', 'letter', 'spell', 'slow', 'alphabet', 'confuse', 'decode', 'phonics'],
  dysgraphia:  ['handwriting', 'write', 'pencil', 'messy', 'grip', 'spacing', 'letter formation', 'trace', 'illegible'],
  dyscalculia: ['math', 'number', 'count', 'calculate', 'arithmetic', 'sequence', 'digit', 'subtract', 'add', 'multiply'],
  apd:         ['listen', 'hear', 'repeat', 'instruction', 'focus', 'noise', 'distract', 'follow', 'verbal'],
  nvld:        ['social', 'map', 'puzzle', 'spatial', 'body language', 'transition', 'visual', 'routine'],
};

const LD_META = {
  dyslexia:    { label: 'Dyslexia',    color: '#6366F1', bg: '#EEF2FF' },
  dyscalculia: { label: 'Dyscalculia', color: '#F59E0B', bg: '#FFFBEB' },
  dysgraphia:  { label: 'Dysgraphia',  color: '#10B981', bg: '#ECFDF5' },
  nvld:        { label: 'NVLD',        color: '#8B5CF6', bg: '#F5F3FF' },
  apd:         { label: 'APD',         color: '#EF4444', bg: '#FEF2F2' },
};

const authFetch = (url, opts = {}) => {
  const token = sessionStorage.getItem('access_token');
  return fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers },
  });
};

const NLPObservation = () => {
  const [text, setText] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState('');
  const navigate = useNavigate();
  const role = sessionStorage.getItem('role') || 'teacher';

  const maxChars = 1000;
  const charCount = text.length;

  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    if (!token) { navigate('/login'); return; }
    authFetch('/api/students/rich')
      .then(r => r.json())
      .then(d => setStudents(Array.isArray(d) ? d : []))
      .catch(() => setStudents([]))
      .finally(() => setLoadingStudents(false));
  }, [navigate]);

  // Live keyword detection
  const detectedFlags = Object.entries(LD_KEYWORDS).reduce((acc, [ld, words]) => {
    const matches = words.filter(w => text.toLowerCase().includes(w));
    if (matches.length > 0) acc.push({ ld, count: matches.length, words: matches });
    return acc;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) { setApiError('Please select a student first.'); return; }
    setLoading(true);
    setApiError('');
    try {
      const res = await authFetch('/api/screenings/nlp', {
        method: 'POST',
        body: JSON.stringify({ student_id: parseInt(selectedStudent), notes: text }),
      });
      if (!res.ok) {
        const err = await res.json();
        setApiError(err.detail || 'Submission failed.');
        return;
      }
      setSubmitted(true);
      setTimeout(() => navigate(`/results/${selectedStudent}`), 1200);
    } catch {
      setApiError('Network error — is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar role={role} />
      <div className="dashboard-main">
        {/* Header */}
          <h1 style={{ fontSize: '1.5rem', color: 'var(--text)', margin: '0 0 0.25rem', fontWeight: '800', letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <BrainIcon size={20} style={{ color: 'var(--primary)' }} />Observation Notes
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>Write your observations. Our AI will analyse the text for LD indicators in real-time.</p>

        {apiError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FEE2E2', border: '1.5px solid #FECACA', color: '#B91C1C', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontWeight: '600', fontSize: '0.875rem' }}>
            <AlertTriangleIcon size={14} /> {apiError}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '2rem', alignItems: 'start' }}>
          {/* Form */}
          <form onSubmit={handleSubmit}>

            {/* Student selector */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label>Select Student <span style={{ color: '#E11D48' }}>*</span></label>
              {loadingStudents ? (
                <div style={{ height: '48px', background: '#F1F5F9', borderRadius: '12px', animation: 'pulse 1.5s ease-in-out infinite' }} />
              ) : (
                <select value={selectedStudent} onChange={e => { setSelectedStudent(e.target.value); setApiError(''); }}
                  style={{ color: selectedStudent ? '#1E293B' : '#94A3B8' }}>
                  <option value="">— Choose a student —</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name} · {s.grade}</option>
                  ))}
                </select>
              )}
              {!loadingStudents && students.length === 0 && (
                <p style={{ color: '#94A3B8', margin: '0.5rem 0 0', fontSize: '0.88rem' }}>
                  No students found. <a href="/students" style={{ color: '#6366F1' }}>Add a student first →</a>
                </p>
              )}
            </div>

            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '0.5rem', color: '#1E293B', fontSize: '0.95rem' }}>
                Teacher Observations <span style={{ color: '#E11D48' }}>*</span>
              </label>
              <textarea
                value={text}
                onChange={e => e.target.value.length <= maxChars && setText(e.target.value)}
                placeholder="Describe what you observe in the student's behavior, reading, writing, math, and social interactions. Be specific (e.g. 'The student frequently reverses the letters b and d, and struggles to read aloud without losing their place.')..."
                rows={12}
                style={{ width: '100%', borderRadius: '16px', border: `2px solid ${charCount > maxChars * 0.9 ? '#FECDD3' : '#E2E8F0'}`, padding: '1.25rem', fontSize: '1rem', fontFamily: 'var(--font-body)', lineHeight: '1.7', resize: 'vertical', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#A5B4FC'}
                onBlur={e => e.target.style.borderColor = charCount > maxChars * 0.9 ? '#FECDD3' : '#E2E8F0'}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Minimum 50 characters recommended for accurate analysis</span>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: charCount > maxChars * 0.9 ? '#E11D48' : '#94A3B8' }}>
                  {charCount}/{maxChars}
                </span>
              </div>
            </div>

            {/* Keyword hints */}
            <div style={{ background: '#F8FAFC', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.5rem', border: '2px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Suggested LD keywords to include</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {['struggles', 'reverse', 'letter', 'handwriting', 'math', 'repeat', 'listen', 'read', 'pencil grip', 'spatial'].map(k => (
                  <button key={k} type="button"
                    onClick={() => setText(prev => prev + (prev ? ' ' : '') + k)}
                    style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.3rem 0.75rem', fontSize: '0.82rem', fontFamily: 'var(--font-body)', cursor: 'pointer', color: '#475569', fontWeight: '600', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#EEF2FF'; e.currentTarget.style.color = '#6366F1'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#475569'; }}>
                    + {k}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary"
              style={{ width: '100%', fontSize: '0.9375rem', padding: '0.75rem', gap: '0.5rem' }}
              disabled={loading || !selectedStudent || text.length < 20}>
              {submitted ? <><CheckCircleIcon size={14} />Submitted — redirecting…</> : loading ? <><BrainIcon size={14} />Analysing…</> : <><SendIcon size={14} />Analyse with AI</>}
            </button>
          </form>

          {/* Live Analysis Panel */}
          <div style={{ position: 'sticky', top: '2rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700' }}>
              Live Detection
            </h3>

            {text.length < 10 ? (
              <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '2rem', textAlign: 'center', border: '2px dashed #E2E8F0' }}>
                <p style={{ color: 'var(--text-muted)', fontWeight: '600', margin: 0, fontSize: '0.875rem' }}>Start typing your observations to see live LD keyword detection.</p>
              </div>
            ) : detectedFlags.length === 0 ? (
              <div style={{ background: '#ECFDF5', borderRadius: '10px', padding: '1.5rem', textAlign: 'center', border: '1.5px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
                <CheckCircleIcon size={18} style={{ color: '#059669' }} />
                <p style={{ color: '#059669', fontWeight: '700', margin: 0, fontSize: '0.875rem' }}>No LD indicators detected yet. Try adding more specific observations.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {detectedFlags.map(({ ld, count, words }) => {
                  const cfg = ldColors[ld];
                  return (
                    <div key={ld} style={{ background: cfg.bg, border: `2px solid ${cfg.color}33`, borderRadius: '14px', padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontWeight: '800', color: cfg.color, fontSize: '1rem' }}>{cfg.label}</span>
                        <span style={{ background: cfg.color, color: 'white', padding: '0.2rem 0.65rem', borderRadius: '99px', fontWeight: '700', fontSize: '0.8rem' }}>{count} match{count > 1 ? 'es' : ''}</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {words.map(w => (
                          <span key={w} style={{ background: 'white', color: cfg.color, padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: '700', border: `1px solid ${cfg.color}44` }}>"{w}"</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ background: '#EEF2FF', borderRadius: '10px', padding: '1rem', marginTop: '1rem', display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
              <InfoIcon size={14} style={{ color: '#4338CA', flexShrink: 0, marginTop: '0.1rem' }} />
              <p style={{ color: '#4338CA', fontSize: '0.8125rem', margin: 0, lineHeight: '1.6' }}>
                The AI analyses your notes using NLP keyword extraction. More detailed observations provide higher accuracy predictions.
              </p>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
};

export default NLPObservation;
