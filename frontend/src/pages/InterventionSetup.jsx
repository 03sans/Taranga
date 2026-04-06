import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem('access_token');
  return fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers },
  });
};

const LD_META = {
  dyslexia:    { label: 'Dyslexia',    color: '#6366F1', bg: '#EEF2FF', emoji: '📖' },
  dyscalculia: { label: 'Dyscalculia', color: '#F59E0B', bg: '#FFFBEB', emoji: '🔢' },
  dysgraphia:  { label: 'Dysgraphia',  color: '#10B981', bg: '#ECFDF5', emoji: '✏️' },
  nvld:        { label: 'NVLD',        color: '#8B5CF6', bg: '#F5F3FF', emoji: '🧩' },
  apd:         { label: 'APD',         color: '#EF4444', bg: '#FEF2F2', emoji: '👂' },
};

const GRADES = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8'];

/* ── password strength meter ─────────────────────────────────────────────── */
const PasswordStrength = ({ password }) => {
  const len = password.length;
  const strength = len === 0 ? 0 : len < 6 ? 1 : len < 10 ? 2 : 3;
  const colors = ['#E2E8F0', '#EF4444', '#F59E0B', '#10B981'];
  const labels = ['', 'Too short', 'Good', 'Strong!'];
  return len === 0 ? null : (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '0.3rem' }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i <= strength ? colors[strength] : '#E2E8F0', transition: 'all 0.3s' }} />
        ))}
      </div>
      <span style={{ fontSize: '0.78rem', fontWeight: '700', color: colors[strength] }}>{labels[strength]}</span>
    </div>
  );
};

/* ── step indicator ──────────────────────────────────────────────────────── */
const StepDot = ({ step, current, label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
    <div style={{
      width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: '900', fontSize: '0.9rem', transition: 'all 0.3s',
      background: step < current ? '#10B981' : step === current ? '#6366F1' : '#E2E8F0',
      color: step <= current ? 'white' : '#94A3B8',
    }}>
      {step < current ? '✓' : step}
    </div>
    <span style={{ fontSize: '0.72rem', fontWeight: '700', color: step === current ? '#6366F1' : '#94A3B8', whiteSpace: 'nowrap' }}>{label}</span>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
const InterventionSetup = () => {
  const { id: studentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const ldScores = location.state?.scores || {};

  const [step, setStep]             = useState(1);
  const [student, setStudent]       = useState(null);
  const [accountInfo, setAccount]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [catalog, setCatalog]       = useState([]);
  const [selectedKeys, setSelected] = useState(new Set());
  const [error, setError]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState(null);  // after account creation

  // credentials form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [credErrors, setCredErrors] = useState({});

  /* fetch student + account + catalog */
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { navigate('/login'); return; }
    Promise.all([
      authFetch(`/api/students/${studentId}`).then(r => r.json()),
      authFetch(`/api/students/${studentId}/account`).then(r => r.json()),
      authFetch('/api/activities/catalog').then(r => r.json()),
    ]).then(([studentData, accountData, catalogData]) => {
      setStudent(studentData);
      setAccountInfo(accountData);
      setCatalog(Array.isArray(catalogData) ? catalogData : []);
      // Auto-suggest username from student name
      if (!accountData.has_account && studentData.full_name) {
        const suggested = studentData.full_name.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 15);
        setUsername(suggested);
      } else if (accountData.has_account) {
        setUsername(accountData.username || '');
      }
      // Pre-select activities for high-risk LDs (≥40%)
      const flagged = Object.entries(ldScores).filter(([, v]) => v >= 40).map(([k]) => k);
      if (flagged.length > 0 && Array.isArray(catalogData)) {
        const preSelected = new Set(catalogData.filter(a => flagged.includes(a.ld_type)).map(a => a.key));
        setSelected(preSelected);
      }
    }).catch(() => setError('Failed to load student data.'))
      .finally(() => setLoading(false));
  }, [studentId, navigate]); // eslint-disable-line

  /* ── step 1: validate credentials ── */
  const validateCreds = () => {
    const errs = {};
    if (!username.trim()) errs.username = 'Username is required.';
    else if (!/^[a-z0-9_]{3,20}$/.test(username.trim())) errs.username = '3–20 chars, lowercase letters, numbers, underscores only.';
    if (!password) errs.password = 'Password is required.';
    else if (password.length < 6) errs.password = 'Minimum 6 characters.';
    setCredErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateAccount = async () => {
    if (!validateCreds()) return;
    setSubmitting(true);
    setError('');
    try {
      const res  = await authFetch(`/api/students/${studentId}/create-account`, {
        method: 'POST',
        body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || 'Failed to create account.'); return; }
      setResult({ username: username.trim().toLowerCase(), password });
      setStep(2);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── step 2: assign activities ── */
  const toggleActivity = (key) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleAssign = async () => {
    if (selectedKeys.size === 0) { setError('Select at least one activity.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res  = await authFetch('/api/activities/assign', {
        method: 'POST',
        body: JSON.stringify({ student_id: parseInt(studentId), activity_keys: [...selectedKeys] }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.detail || 'Assignment failed.'); return; }
      setStep(3);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── loading ── */
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F8FAFC' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', animation: 'spin 2s linear infinite', display: 'inline-block' }}>⚙️</div>
        <p style={{ color: '#64748B', marginTop: '1rem', fontWeight: '700' }}>Loading student data…</p>
      </div>
    </div>
  );

  const catalogByLD = catalog.reduce((acc, a) => { (acc[a.ld_type] ??= []).push(a); return acc; }, {});

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '2rem' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'white', border: '2px solid #E2E8F0', borderRadius: '12px', padding: '0.6rem 1rem', cursor: 'pointer', fontWeight: '700', color: '#64748B' }}>← Back</button>
          <div>
            <h1 style={{ fontSize: '1.8rem', color: '#1E293B', margin: 0 }}>
              Intervention Setup
              {student && <span style={{ color: '#6366F1' }}> — {student.full_name}</span>}
            </h1>
            <p style={{ color: '#64748B', margin: '0.2rem 0 0', fontSize: '0.9rem' }}>Create student credentials and assign LD activities</p>
          </div>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', marginBottom: '2.5rem' }}>
          <StepDot step={1} current={step} label="Credentials" />
          <div style={{ width: '60px', height: '2px', background: step > 1 ? '#10B981' : '#E2E8F0', transition: 'all 0.3s', margin: '0 0.5rem 1rem' }} />
          <StepDot step={2} current={step} label="Assign Activities" />
          <div style={{ width: '60px', height: '2px', background: step > 2 ? '#10B981' : '#E2E8F0', transition: 'all 0.3s', margin: '0 0.5rem 1rem' }} />
          <StepDot step={3} current={step} label="Done!" />
        </div>

        {error && (
          <div style={{ background: '#FFF1F2', border: '2px solid #FECDD3', color: '#E11D48', borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '1.5rem', fontWeight: '700' }}>
            ⚠ {error}
          </div>
        )}

        {/* ── STEP 1: Credentials ──────────────────────────────────────────── */}
        {step === 1 && (
          <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', border: '2px solid #E2E8F0' }}>
            <h2 style={{ fontSize: '1.3rem', color: '#1E293B', margin: '0 0 0.5rem' }}>🔑 Student Login Credentials</h2>
            <p style={{ color: '#64748B', margin: '0 0 1.75rem', fontSize: '0.9rem' }}>
              {accountInfo?.has_account
                ? `This student already has an account (@${accountInfo.username}). You can update their credentials below.`
                : 'Create a username and password for the student. They will use these to log in at the student portal.'}
            </p>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label>Username <span style={{ color: '#E11D48' }}>*</span>
                <span style={{ color: '#94A3B8', fontWeight: '600', fontSize: '0.8rem', marginLeft: '0.5rem' }}>3–20 chars, lowercase + numbers + _</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')); setCredErrors({}); }}
                placeholder="e.g. aarav_p"
                style={credErrors.username ? { borderColor: '#E11D48' } : {}}
                maxLength={20}
              />
              {credErrors.username && <p style={{ color: '#E11D48', fontSize: '0.82rem', margin: '0.3rem 0 0', fontWeight: '700' }}>{credErrors.username}</p>}
            </div>

            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <label>Password <span style={{ color: '#E11D48' }}>*</span>
                <span style={{ color: '#94A3B8', fontWeight: '600', fontSize: '0.8rem', marginLeft: '0.5rem' }}>Min 6 characters</span>
              </label>
              <input
                type="text"
                value={password}
                onChange={e => { setPassword(e.target.value); setCredErrors({}); }}
                placeholder="e.g. learn42"
                style={credErrors.password ? { borderColor: '#E11D48' } : {}}
              />
              <PasswordStrength password={password} />
              {credErrors.password && <p style={{ color: '#E11D48', fontSize: '0.82rem', margin: '0.3rem 0 0', fontWeight: '700' }}>{credErrors.password}</p>}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => navigate(-1)} className="btn" style={{ background: '#F1F5F9', color: '#64748B', border: 'none' }}>Cancel</button>
              <button onClick={handleCreateAccount} disabled={submitting} className="btn btn-primary" style={{ flex: 1 }}>
                {submitting ? '⏳ Creating…' : accountInfo?.has_account ? '🔄 Update Credentials & Continue' : '✅ Create Account & Continue'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Assign Activities ─────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <div style={{ background: '#ECFDF5', border: '2px solid #A7F3D0', borderRadius: '16px', padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.3rem' }}>✅</span>
              <div>
                <p style={{ color: '#065F46', fontWeight: '800', margin: 0 }}>
                  Account ready! Username: <code style={{ background: '#D1FAE5', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{result?.username}</code>
                </p>
                <p style={{ color: '#047857', margin: 0, fontSize: '0.85rem' }}>Now select the activities to assign to {student?.full_name}.</p>
              </div>
            </div>

            <p style={{ color: '#64748B', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              {selectedKeys.size} activit{selectedKeys.size !== 1 ? 'ies' : 'y'} selected.
              Activities pre-ticked match the student's flagged LD domains.
            </p>

            {Object.entries(catalogByLD).map(([ld, acts]) => {
              const meta = LD_META[ld] || { label: ld, color: '#6366F1', bg: '#EEF2FF', emoji: '📚' };
              return (
                <div key={ld} style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>{meta.emoji}</span>
                    <span style={{ fontWeight: '800', color: meta.color, fontSize: '1rem' }}>{meta.label}</span>
                    {ldScores[ld] >= 70 && <span style={{ background: '#FEF2F2', color: '#E11D48', padding: '0.15rem 0.6rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '800' }}>High Risk</span>}
                    {ldScores[ld] >= 40 && ldScores[ld] < 70 && <span style={{ background: '#FFFBEB', color: '#D97706', padding: '0.15rem 0.6rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '800' }}>Moderate</span>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '0.75rem' }}>
                    {acts.map(act => {
                      const checked = selectedKeys.has(act.key);
                      return (
                        <div key={act.key}
                          onClick={() => toggleActivity(act.key)}
                          style={{
                            background: checked ? meta.bg : 'white',
                            border: `2px solid ${checked ? meta.color : '#E2E8F0'}`,
                            borderRadius: '14px', padding: '1rem 1.25rem',
                            cursor: 'pointer', transition: 'all 0.15s',
                            display: 'flex', alignItems: 'flex-start', gap: '0.85rem',
                          }}>
                          <div style={{ width: '22px', height: '22px', borderRadius: '6px', border: `2px solid ${checked ? meta.color : '#CBD5E1'}`, background: checked ? meta.color : 'white', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                            {checked && <span style={{ color: 'white', fontSize: '0.8rem', fontWeight: '900' }}>✓</span>}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontWeight: '800', color: '#1E293B', fontSize: '0.95rem' }}>{act.icon} {act.title}</p>
                            <p style={{ margin: '0.2rem 0 0', color: '#64748B', fontSize: '0.82rem', lineHeight: '1.5' }}>{act.description}</p>
                            <span style={{ background: meta.bg, color: meta.color, padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', marginTop: '0.4rem', display: 'inline-block' }}>
                              {act.engine} · +{act.xp} XP
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div style={{ position: 'sticky', bottom: '1rem', background: 'white', border: '2px solid #E2E8F0', borderRadius: '16px', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
              <span style={{ color: '#64748B', fontWeight: '700' }}>{selectedKeys.size} activities selected</span>
              <button onClick={handleAssign} disabled={submitting || selectedKeys.size === 0} className="btn btn-primary">
                {submitting ? '⏳ Assigning…' : `✅ Assign ${selectedKeys.size} Activities`}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Done! ────────────────────────────────────────────────── */}
        {step === 3 && (
          <div style={{ textAlign: 'center', background: 'white', borderRadius: '24px', padding: '3rem 2rem', border: '2px solid #E2E8F0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{ color: '#1E293B', marginBottom: '0.5rem' }}>All Set!</h2>
            <p style={{ color: '#64748B', marginBottom: '2rem' }}>{student?.full_name} is ready to start their learning journey.</p>

            {/* Credential card */}
            <div style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', borderRadius: '20px', padding: '2rem', marginBottom: '2rem', textAlign: 'left', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: '-5%', top: '-20%', fontSize: '8rem', opacity: 0.1 }}>🎓</div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 0.75rem' }}>Student Login Credentials</p>
              <p style={{ color: 'white', margin: '0 0 0.5rem', fontSize: '1.1rem' }}>
                <span style={{ opacity: 0.7 }}>Username:</span>{' '}
                <strong style={{ fontFamily: 'monospace', fontSize: '1.3rem' }}>{result?.username}</strong>
              </p>
              <p style={{ color: 'white', margin: '0 0 1.25rem', fontSize: '1.1rem' }}>
                <span style={{ opacity: 0.7 }}>Password:</span>{' '}
                <strong style={{ fontFamily: 'monospace', fontSize: '1.3rem' }}>{result?.password}</strong>
              </p>
              <button
                onClick={() => navigator.clipboard.writeText(`Username: ${result?.username}\nPassword: ${result?.password}`)}
                style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)', color: 'white', borderRadius: '10px', padding: '0.6rem 1.2rem', cursor: 'pointer', fontWeight: '700', fontSize: '0.88rem' }}>
                📋 Copy Credentials
              </button>
            </div>

            <p style={{ color: '#64748B', fontSize: '0.88rem', margin: '0 0 2rem' }}>
              The student logs in at: <strong>/student-login</strong> · {selectedKeys.size} activities assigned
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => navigate('/students')} className="btn" style={{ background: '#F1F5F9', color: '#64748B', border: 'none' }}>
                Back to Students
              </button>
              <button onClick={() => navigate(`/students/${studentId}/progress`)} className="btn btn-primary">
                📊 View Progress Report
              </button>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
};

export default InterventionSetup;
