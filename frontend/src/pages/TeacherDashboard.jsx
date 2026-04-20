import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
  GraduationCapIcon, ClipboardListIcon, TargetIcon, AlertTriangleIcon,
  UserIcon, ClockIcon, ChevronRightIcon, BrainIcon, ActivityIcon,
} from '../components/icons';

const authFetch = (url, opts = {}) => {
  const token = sessionStorage.getItem('access_token');
  return fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers },
  });
};

const statusMap = {
  action: { bg: '#FEF3C7', color: '#D97706', label: 'Action Needed' },
  ok:     { bg: '#D1FAE5', color: '#059669', label: 'Typical' },
  review: { bg: '#DBEAFE', color: '#1D4ED8', label: 'Under Review' },
};

/* ── Stat card ── */
const StatCard = ({ label, value, icon: Icon, color, sub, loading }) => (
  <div style={{ background: '#FFFFFF', borderRadius: '10px', padding: '1.25rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.75rem', transition: 'box-shadow 0.15s' }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <div style={{ background: `${color}18`, borderRadius: '7px', padding: '0.375rem', display: 'flex' }}>
        <Icon size={14} style={{ color }} />
      </div>
    </div>
    {loading
      ? <div style={{ height: '28px', width: '60px', background: '#F1F5F9', borderRadius: '6px', animation: 'pulse 1.5s ease-in-out infinite' }} />
      : <span style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text)', letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</span>}
    {sub && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub}</span>}
  </div>
);

const SkeletonRow = () => (
  <tr>
    {[180, 70, 120, 100, 80].map((w, i) => (
      <td key={i} style={{ padding: '0.875rem 1.25rem' }}>
        <div style={{ height: '13px', width: `${w}px`, background: '#F1F5F9', borderRadius: '5px', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </td>
    ))}
  </tr>
);

/* ── Main ── */
const TeacherDashboard = () => {
  const [user,        setUser]        = useState(null);
  const [stats,       setStats]       = useState(null);
  const [screenings,  setScreenings]  = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingStats,setLoadingStats]= useState(true);
  const [loadingRows, setLoadingRows] = useState(true);
  const [greeting,    setGreeting]    = useState('');
  const navigate = useNavigate();
  const role = sessionStorage.getItem('role') || 'teacher';

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    if (!token) { navigate('/login'); return; }
    authFetch('/api/me')
      .then(r => r.json())
      .then(data => { if (data.detail) { navigate('/login'); return; } setUser(data); })
      .catch(() => navigate('/login'))
      .finally(() => setLoadingUser(false));
  }, [navigate]);

  useEffect(() => {
    authFetch('/api/dashboard/stats')
      .then(r => r.json()).then(setStats).catch(() => setStats(null))
      .finally(() => setLoadingStats(false));
  }, []);

  useEffect(() => {
    authFetch('/api/dashboard/recent-screenings?limit=8')
      .then(r => r.json()).then(d => setScreenings(Array.isArray(d) ? d : []))
      .catch(() => setScreenings([])).finally(() => setLoadingRows(false));
  }, []);

  const firstName   = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || '…';
  const actionCount = stats?.flagged_students ?? screenings.filter(s => s.flag === 'action').length;

  return (
    <div className="dashboard-layout">
      <Sidebar role={role} />
      <div className="dashboard-main">

        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
          <div>
            {loadingUser
              ? <div style={{ height: '28px', width: '240px', background: '#F1F5F9', borderRadius: '7px', animation: 'pulse 1.5s ease-in-out infinite', marginBottom: '0.25rem' }} />
              : <h1 style={{ fontSize: '1.5rem', color: 'var(--text)', margin: '0 0 0.125rem', fontWeight: '800', letterSpacing: '-0.03em' }}>
                  {greeting}, {firstName}
                </h1>}
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>Here's your classroom overview for today.</p>
          </div>
          <Link to="/profile" className="btn" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text)', gap: '0.4rem' }}>
            <UserIcon size={13} />
            Profile
          </Link>
        </header>

        {/* Alert */}
        {!loadingStats && actionCount > 0 && (
          <div style={{ background: '#FFFBEB', border: '1.5px solid #FCD34D', borderRadius: '10px', padding: '0.875rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <AlertTriangleIcon size={16} style={{ color: '#D97706', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <span style={{ color: '#92400E', fontWeight: '700', fontSize: '0.875rem' }}>
                {actionCount} student{actionCount > 1 ? 's' : ''} require{actionCount === 1 ? 's' : ''} attention
              </span>
              <p style={{ color: '#B45309', margin: '0.125rem 0 0', fontSize: '0.8125rem' }}>
                Review diagnostic reports and deploy recommended interventions.
              </p>
            </div>
            <Link to="/students" className="btn" style={{ background: '#F59E0B', color: 'white', border: 'none', fontSize: '0.8rem' }}>
              View all <ChevronRightIcon size={12} />
            </Link>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
          <StatCard label="My Students"           value={stats?.total_students        ?? '—'} icon={GraduationCapIcon}  color="#7C3AED" loading={loadingStats} />
          <StatCard label="Screenings This Month" value={stats?.screenings_this_month ?? '—'} icon={ClipboardListIcon}  color="#10B981" loading={loadingStats} />
          <StatCard label="Active Interventions"  value={stats?.active_interventions  ?? '—'} icon={TargetIcon}         color="#F59E0B" loading={loadingStats} />
          <StatCard label="Flagged Students"      value={stats?.flagged_students      ?? '—'} icon={AlertTriangleIcon}  color="#EF4444" loading={loadingStats} />
        </div>

        {/* CTA Banner */}
        <section style={{ marginBottom: '1.75rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #4338CA 100%)', borderRadius: '12px', padding: '1.75rem 2rem', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '8px', padding: '0.625rem', display: 'flex', flexShrink: 0 }}>
                <BrainIcon size={20} style={{ color: 'white' }} />
              </div>
              <div>
                <h2 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '0.25rem', fontWeight: '700', letterSpacing: '-0.02em' }}>Assess a student</h2>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8125rem', margin: 0, lineHeight: '1.5' }}>
                  Run an adaptive questionnaire or use AI-powered NLP to analyze observation notes.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.625rem', flexShrink: 0 }}>
              <Link to="/screening/adaptive" className="btn" style={{ background: '#F59E0B', color: 'white', border: 'none', fontSize: '0.8125rem' }}>
                <ClipboardListIcon size={13} />
                New screening
              </Link>
              <Link to="/screening/nlp" className="btn" style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1.5px solid rgba(255,255,255,0.25)', fontSize: '0.8125rem', backdropFilter: 'blur(8px)' }}>
                <BrainIcon size={13} />
                NLP observation
              </Link>
            </div>
          </div>
        </section>

        {/* Recent Screenings */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', color: 'var(--text)', margin: 0, fontWeight: '700' }}>Recent screenings</h2>
            <Link to="/students" style={{ fontSize: '0.8125rem', color: 'var(--primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              View all <ChevronRightIcon size={12} />
            </Link>
          </div>

          <div style={{ background: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                  {['Student', 'Grade', 'Last assessed', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1.25rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingRows
                  ? [1, 2, 3].map(i => <SkeletonRow key={i} />)
                  : screenings.length === 0
                    ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '3rem', textAlign: 'center' }}>
                          <ActivityIcon size={28} style={{ color: 'var(--text-placeholder)', margin: '0 auto 0.75rem', display: 'block' }} />
                          <p style={{ fontWeight: '700', color: 'var(--text-muted)', margin: '0 0 0.25rem', fontSize: '0.9rem' }}>No screenings yet</p>
                          <Link to="/screening/adaptive" style={{ color: 'var(--primary)', fontSize: '0.8125rem', fontWeight: '600' }}>
                            Run your first assessment
                          </Link>
                        </td>
                      </tr>
                    )
                    : screenings.map((s, i) => {
                        const st = statusMap[s.flag] ?? statusMap.ok;
                        return (
                          <tr key={s.screening_id}
                            style={{ borderBottom: i < screenings.length - 1 ? '1px solid #F8FAFC' : 'none', transition: 'background 0.1s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#FAFBFF'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '0.875rem 1.25rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '0.75rem', flexShrink: 0 }}>
                                  {s.student_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                </div>
                                <span style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--text)' }}>{s.student_name}</span>
                              </div>
                            </td>
                            <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{s.grade || '—'}</td>
                            <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <ClockIcon size={12} />
                                {s.date}
                              </div>
                            </td>
                            <td style={{ padding: '0.875rem 1.25rem' }}>
                              <span style={{ background: st.bg, color: st.color, padding: '0.2rem 0.6rem', borderRadius: '99px', fontWeight: '600', fontSize: '0.75rem' }}>{st.label}</span>
                            </td>
                            <td style={{ padding: '0.875rem 1.25rem' }}>
                              <Link to={`/results/${s.student_id}`} style={{ color: 'var(--primary)', fontWeight: '600', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                Report <ChevronRightIcon size={12} />
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

        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </div>
    </div>
  );
};

export default TeacherDashboard;
