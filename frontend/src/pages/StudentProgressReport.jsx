import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem('access_token');
  return fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers } });
};

const LD_META = {
  dyslexia:    { color: '#6366F1', bg: '#EEF2FF', emoji: '📖' },
  dyscalculia: { color: '#F59E0B', bg: '#FFFBEB', emoji: '🔢' },
  dysgraphia:  { color: '#10B981', bg: '#ECFDF5', emoji: '✏️' },
  nvld:        { color: '#8B5CF6', bg: '#F5F3FF', emoji: '🧩' },
  apd:         { color: '#EF4444', bg: '#FEF2F2', emoji: '👂' },
};

const fmt = (iso) => iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const StudentProgressReport = () => {
  const { id: studentId } = useParams();
  const navigate = useNavigate();
  const role = localStorage.getItem('role') || 'teacher';

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [expanded, setExpanded] = useState({}); // activity key → bool

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { navigate('/login'); return; }
    authFetch(`/api/students/${studentId}/progress`)
      .then(r => r.json())
      .then(d => {
        if (d.detail) { setError(d.detail); return; }
        setData(d);
      })
      .catch(() => setError('Failed to load progress data.'))
      .finally(() => setLoading(false));
  }, [studentId, navigate]);

  if (loading) return (
    <div className="dashboard-layout">
      <Sidebar role={role} />
      <div className="dashboard-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', animation: 'spin 2s linear infinite', display: 'inline-block' }}>📊</div>
          <p style={{ color: '#64748B', marginTop: '1rem', fontWeight: '700' }}>Loading progress report…</p>
        </div>
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );

  if (error || !data) return (
    <div className="dashboard-layout">
      <Sidebar role={role} />
      <div className="dashboard-main">
        <div style={{ background: '#FFF1F2', border: '2px solid #FECDD3', borderRadius: '16px', padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#E11D48', fontWeight: '800' }}>{error || 'No data found.'}</p>
          <button onClick={() => navigate('/students')} className="btn btn-primary" style={{ marginTop: '1rem' }}>← Back to Students</button>
        </div>
      </div>
    </div>
  );

  const { student, account, activities, total_xp, assigned_count } = data;
  const completedCount = activities.filter(a => a.best_score > 0).length;
  const avgScore = activities.length > 0
    ? Math.round(activities.reduce((s, a) => s + a.best_score, 0) / activities.length)
    : 0;
  const totalAttempts = activities.reduce((s, a) => s + a.total_attempts, 0);

  return (
    <div className="dashboard-layout">
      <Sidebar role={role} />
      <div className="dashboard-main">

        {/* Header */}
        <header style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <button onClick={() => navigate('/students')} style={{ background: '#F1F5F9', border: 'none', borderRadius: '10px', padding: '0.45rem 0.9rem', cursor: 'pointer', fontWeight: '700', color: '#64748B', marginBottom: '0.75rem', fontSize: '0.85rem' }}>← Students</button>
              <h1 style={{ fontSize: '2rem', color: '#1E293B', margin: '0 0 0.25rem' }}>
                📊 {student.full_name}'s Progress
              </h1>
              <p style={{ color: '#64748B', margin: 0 }}>{student.grade} · {assigned_count} activities assigned</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {account && (
                <div style={{ background: '#EEF2FF', border: '2px solid #C7D2FE', borderRadius: '12px', padding: '0.6rem 1rem', fontSize: '0.85rem' }}>
                  <span style={{ color: '#64748B', fontWeight: '600' }}>Login: </span>
                  <code style={{ color: '#4F46E5', fontWeight: '800' }}>{account.username}</code>
                  {!account.is_active && <span style={{ marginLeft: '0.4rem', color: '#E11D48', fontSize: '0.75rem', fontWeight: '800' }}>INACTIVE</span>}
                </div>
              )}
              <Link to={`/students/${studentId}/intervention`} className="btn btn-primary" style={{ fontSize: '0.88rem' }}>
                + Assign More
              </Link>
            </div>
          </div>
        </header>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          {[
            { label: 'Total XP', value: total_xp, icon: '⚡', color: '#6366F1', bg: '#EEF2FF' },
            { label: 'Completed', value: completedCount, icon: '✅', color: '#10B981', bg: '#ECFDF5' },
            { label: 'Total Attempts', value: totalAttempts, icon: '🔁', color: '#F59E0B', bg: '#FFFBEB' },
            { label: 'Avg Score', value: `${avgScore}%`, icon: '🎯', color: '#8B5CF6', bg: '#F5F3FF' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, border: `2px solid ${s.color}33`, borderRadius: '16px', padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{s.icon}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: s.color }}>{s.value}</div>
              <div style={{ color: '#94A3B8', fontWeight: '700', fontSize: '0.78rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* No activities yet */}
        {activities.length === 0 && (
          <div style={{ background: 'white', borderRadius: '20px', border: '2px dashed #E2E8F0', padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎮</div>
            <h3 style={{ color: '#1E293B', margin: '0 0 0.5rem' }}>No attempts yet</h3>
            <p style={{ color: '#94A3B8', margin: 0 }}>The student hasn't played any activities yet. Assign activities and share their login credentials.</p>
          </div>
        )}

        {/* Activity breakdown */}
        {activities.length > 0 && (
          <div style={{ background: 'white', borderRadius: '20px', border: '2px solid #E2E8F0', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '2px solid #F1F5F9' }}>
              <h2 style={{ color: '#1E293B', margin: 0, fontSize: '1.15rem', fontWeight: '800' }}>Activity Breakdown</h2>
            </div>

            {activities.map((act, idx) => {
              const meta = LD_META[act.ld_type] || { color: '#6366F1', bg: '#EEF2FF', emoji: '📚' };
              const isExpanded = expanded[act.activity_key];
              // Trend: compare last two attempts
              const attempts = act.attempts || [];
              const trend = attempts.length >= 2
                ? attempts[0].score - attempts[1].score
                : null;

              return (
                <div key={act.activity_key} style={{ borderBottom: idx < activities.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                  {/* Summary row */}
                  <div
                    style={{ padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'background 0.15s' }}
                    onClick={() => setExpanded(prev => ({ ...prev, [act.activity_key]: !prev[act.activity_key] }))}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: '40px', height: '40px', background: meta.bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>{act.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: '800', color: '#1E293B', fontSize: '0.95rem' }}>{act.title}</p>
                      <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.8rem', fontWeight: '600' }}>{meta.emoji} {act.ld_type} · {act.total_attempts} attempt{act.total_attempts !== 1 ? 's' : ''}</p>
                    </div>

                    {/* Best score bar */}
                    <div style={{ width: '100px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ flex: 1, background: '#F1F5F9', borderRadius: '3px', height: '6px' }}>
                        <div style={{ width: `${act.best_score}%`, height: '100%', background: meta.color, borderRadius: '3px' }} />
                      </div>
                      <span style={{ fontWeight: '900', color: meta.color, fontSize: '0.85rem', minWidth: '38px' }}>{Math.round(act.best_score)}%</span>
                    </div>

                    {trend !== null && (
                      <span style={{ fontWeight: '800', fontSize: '0.85rem', color: trend > 0 ? '#10B981' : trend < 0 ? '#EF4444' : '#94A3B8', minWidth: '35px', textAlign: 'right' }}>
                        {trend > 0 ? `↑ +${Math.round(trend)}` : trend < 0 ? `↓ ${Math.round(trend)}` : '→'}
                      </span>
                    )}

                    <span style={{ color: '#94A3B8', fontSize: '0.75rem', flexShrink: 0 }}>{isExpanded ? '▲' : '▼'}</span>
                  </div>

                  {/* Expanded attempt history */}
                  {isExpanded && attempts.length > 0 && (
                    <div style={{ padding: '0 2rem 1.25rem', borderTop: '1px solid #F8FAFC' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            {['Attempt', 'Score', 'Time (s)', 'Date'].map(h => (
                              <th key={h} style={{ textAlign: 'left', padding: '0.6rem 0.75rem', color: '#94A3B8', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {attempts.map((a, i) => (
                            <tr key={i} style={{ borderTop: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '0.6rem 0.75rem', fontWeight: '700', color: '#64748B', fontSize: '0.88rem' }}>#{a.attempt_number}</td>
                              <td style={{ padding: '0.6rem 0.75rem' }}>
                                <span style={{ background: a.score >= 80 ? '#ECFDF5' : a.score >= 60 ? '#FFFBEB' : '#FFF1F2', color: a.score >= 80 ? '#10B981' : a.score >= 60 ? '#D97706' : '#E11D48', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: '800', fontSize: '0.85rem' }}>
                                  {Math.round(a.score)}%
                                </span>
                              </td>
                              <td style={{ padding: '0.6rem 0.75rem', color: '#64748B', fontSize: '0.88rem' }}>{a.time_taken_seconds}s</td>
                              <td style={{ padding: '0.6rem 0.75rem', color: '#94A3B8', fontSize: '0.82rem' }}>{fmt(a.completed_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProgressReport;
