import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

/* ─── helpers ─────────────────────────────────────────────────────────── */
const statusMap = {
  action: { bg: '#FEF3C7', color: '#D97706', label: 'Action Needed' },
  ok:     { bg: '#D1FAE5', color: '#059669', label: 'Typical Progress' },
  review: { bg: '#DBEAFE', color: '#1D4ED8', label: 'Under Review' },
};

const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem('access_token');
  return fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });
};

/* ─── stat card ──────────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon, color, loading }) => (
  <div style={{
    background: 'white', borderRadius: '16px', padding: '1.5rem',
    borderLeft: `5px solid ${color}`, boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 10px 25px ${color}22`; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)'; }}
  >
    <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</div>
    {loading
      ? <div style={{ height: '32px', width: '60px', background: '#F1F5F9', borderRadius: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} />
      : <div style={{ fontSize: '2rem', fontWeight: '800', color, lineHeight: '1' }}>{value}</div>
    }
    <div style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '0.35rem', fontWeight: '600' }}>{label}</div>
  </div>
);

/* ─── skeleton row ───────────────────────────────────────────────────── */
const SkeletonRow = () => (
  <tr>
    {[140, 80, 100, 110, 80].map((w, i) => (
      <td key={i} style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ height: '16px', width: `${w}px`, background: '#F1F5F9', borderRadius: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </td>
    ))}
  </tr>
);

/* ─── main component ─────────────────────────────────────────────────── */
const TeacherDashboard = () => {
  const [user,        setUser]        = useState(null);
  const [stats,       setStats]       = useState(null);
  const [screenings,  setScreenings]  = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingStats,setLoadingStats]= useState(true);
  const [loadingRows, setLoadingRows] = useState(true);
  const [greeting,    setGreeting]    = useState('');
  const [error,       setError]       = useState('');
  const navigate = useNavigate();
  const role = localStorage.getItem('role') || 'teacher';

  /* time-based greeting */
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
  }, []);

  /* fetch current user — provides full_name */
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { navigate('/login'); return; }
    authFetch('/api/me')
      .then(r => r.json())
      .then(data => {
        if (data.detail) { navigate('/login'); return; }
        setUser(data);
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoadingUser(false));
  }, [navigate]);

  /* fetch dashboard stats */
  useEffect(() => {
    authFetch('/api/dashboard/stats')
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => setStats(null))           // falls back to "—" in cards
      .finally(() => setLoadingStats(false));
  }, []);

  /* fetch recent screenings */
  useEffect(() => {
    authFetch('/api/dashboard/recent-screenings?limit=8')
      .then(r => r.json())
      .then(data => setScreenings(Array.isArray(data) ? data : []))
      .catch(() => setScreenings([]))
      .finally(() => setLoadingRows(false));
  }, []);

  /* derived */
  const firstName   = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || '…';
  const actionCount = stats?.flagged_students ?? screenings.filter(s => s.flag === 'action').length;

  return (
    <div className="dashboard-layout">
      <Sidebar role={role} />
      <div className="dashboard-main">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            {loadingUser
              ? <div style={{ height: '36px', width: '280px', background: '#F1F5F9', borderRadius: '10px', animation: 'pulse 1.5s ease-in-out infinite', marginBottom: '0.5rem' }} />
              : <h1 style={{ fontSize: '2.25rem', color: '#1E293B', margin: '0 0 0.25rem 0' }}>
                  {greeting}, {firstName} ☀️
                </h1>
            }
            <p style={{ color: '#64748B', margin: 0 }}>Here's your classroom overview for today.</p>
          </div>
          <Link to="/profile" className="btn" style={{ background: 'white', border: '2px solid #E2E8F0', color: '#1E293B' }}>
            👤 My Profile
          </Link>
        </header>

        {/* ── Alert Banner ─────────────────────────────────────────────── */}
        {!loadingStats && actionCount > 0 && (
          <div style={{ background: 'linear-gradient(135deg, #FFF7ED, #FFFBEB)', border: '2px solid #FDE68A', borderRadius: '16px', padding: '1.25rem 1.75rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '1.75rem' }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <strong style={{ color: '#92400E' }}>
                {actionCount} student{actionCount > 1 ? 's' : ''} require{actionCount === 1 ? 's' : ''} your attention
              </strong>
              <p style={{ color: '#B45309', margin: '0.2rem 0 0 0', fontSize: '0.9rem' }}>
                Review their diagnostic reports and deploy recommended interventions.
              </p>
            </div>
            <Link to="/students" className="btn" style={{ background: '#F59E0B', color: 'white', border: 'none', flexShrink: 0, padding: '0.65rem 1.25rem', fontSize: '0.9rem' }}>
              View All →
            </Link>
          </div>
        )}

        {/* ── Stat Cards ───────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          <StatCard label="My Students"           value={stats?.total_students        ?? '—'} icon="🎓" color="#6366F1" loading={loadingStats} />
          <StatCard label="Screenings This Month" value={stats?.screenings_this_month ?? '—'} icon="📝" color="#10B981" loading={loadingStats} />
          <StatCard label="Interventions Active"  value={stats?.active_interventions  ?? '—'} icon="🎯" color="#F59E0B" loading={loadingStats} />
          <StatCard label="Flagged Students"      value={stats?.flagged_students      ?? '—'} icon="⚠️" color="#F43F5E" loading={loadingStats} />
        </div>

        {/* ── CTA Hero ──────────────────────────────────────────────────── */}
        <section style={{ marginBottom: '2rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)', borderRadius: '24px', padding: '2.5rem', color: 'white', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '-5%', top: '-30%', fontSize: '15rem', opacity: 0.07, lineHeight: '1' }}>🧠</div>
            <h2 style={{ color: 'white', fontSize: '1.75rem', marginBottom: '0.5rem' }}>Assess a Student</h2>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.05rem', maxWidth: '600px', marginBottom: '1.5rem' }}>
              Start a new adaptive questionnaire or use our AI-powered NLP tool to analyze teacher observation notes.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/screening/adaptive" className="btn btn-accent">📋 Start Questionnaire</Link>
              <Link to="/screening/nlp" className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '2px solid rgba(255,255,255,0.4)', backdropFilter: 'blur(10px)' }}>
                🗒️ Upload Teacher Notes
              </Link>
            </div>
          </div>
        </section>

        {/* ── Recent Screenings Table ───────────────────────────────────── */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.4rem', color: '#1E293B', margin: 0 }}>Recent Screenings</h2>
            <Link to="/students" style={{ fontSize: '0.95rem', color: '#6366F1', fontWeight: '700' }}>View All →</Link>
          </div>

          <div style={{ background: 'white', borderRadius: '20px', border: '2px solid #E2E8F0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                  {['Student Name', 'Grade', 'Last Assessed', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ padding: '1rem 1.5rem', textAlign: 'left', color: '#94A3B8', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingRows
                  ? [1, 2, 3].map(i => <SkeletonRow key={i} />)
                  : screenings.length === 0
                    ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '3.5rem', textAlign: 'center', color: '#94A3B8' }}>
                          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📋</div>
                          <p style={{ fontWeight: '700', margin: 0 }}>No screenings yet.</p>
                          <p style={{ margin: '0.35rem 0 0', fontSize: '0.9rem' }}>
                            <Link to="/screening/adaptive" style={{ color: '#6366F1' }}>Start your first assessment →</Link>
                          </p>
                        </td>
                      </tr>
                    )
                    : screenings.map((s, i) => {
                        const st = statusMap[s.flag] ?? statusMap.ok;
                        return (
                          <tr key={s.screening_id}
                            style={{ borderBottom: i < screenings.length - 1 ? '1px solid #F1F5F9' : 'none', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#FAFBFF'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding: '1.25rem 1.5rem', fontWeight: '700', fontSize: '1rem', color: '#1E293B' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '0.85rem', flexShrink: 0 }}>
                                  {s.student_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                </div>
                                {s.student_name}
                              </div>
                            </td>
                            <td style={{ padding: '1.25rem 1.5rem', color: '#64748B' }}>{s.grade || '—'}</td>
                            <td style={{ padding: '1.25rem 1.5rem', color: '#94A3B8', fontSize: '0.9rem' }}>{s.date}</td>
                            <td style={{ padding: '1.25rem 1.5rem' }}>
                              <span style={{ background: st.bg, color: st.color, padding: '0.35rem 0.85rem', borderRadius: '99px', fontWeight: '700', fontSize: '0.82rem' }}>{st.label}</span>
                            </td>
                            <td style={{ padding: '1.25rem 1.5rem' }}>
                              <Link to={`/results/${s.student_id}`} style={{ color: '#6366F1', fontWeight: '700', fontSize: '0.9rem', borderBottom: '2px solid #A5B4FC' }}>
                                View Report
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                }
              </tbody>
            </table>
          </div>
        </section>

      </div>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
};

export default TeacherDashboard;
