import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ZapIcon, StarIcon, AwardIcon, LockIcon, PlayIcon, RefreshCwIcon, LogOutIcon } from '../components/icons';

const authFetch = (url, opts = {}) => {
  const token = sessionStorage.getItem('access_token');
  return fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers } })
    .then(r => {
      if (r.status === 401) {
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('role');
        window.location.href = '/student-login';
        throw new Error('Unauthorized');
      }
      return r;
    });
};

const LD_META = {
  dyslexia:    { label: 'Dyslexia',    color: '#6366F1', bg: '#EEF2FF' },
  dyscalculia: { label: 'Dyscalculia', color: '#F59E0B', bg: '#FFFBEB' },
  dysgraphia:  { label: 'Dysgraphia',  color: '#10B981', bg: '#ECFDF5' },
  nvld:        { label: 'NVLD',        color: '#8B5CF6', bg: '#F5F3FF' },
  apd:         { label: 'APD',         color: '#EF4444', bg: '#FEF2F2' },
};

const BADGES = [
  { label: 'First Try',   xpMin: 1,    color: '#6366F1' },
  { label: 'On a Roll',   xpMin: 100,  color: '#F59E0B' },
  { label: 'Brain Power', xpMin: 250,  color: '#8B5CF6' },
  { label: 'Sharp Mind',  xpMin: 500,  color: '#10B981' },
  { label: 'Champion',    xpMin: 1000, color: '#EF4444' },
];

const Skeleton = ({ h = 120 }) => (
  <div style={{ height: h, background: '#F1F5F9', borderRadius: '10px', animation: 'pulse 1.5s ease-in-out infinite', marginBottom: '1rem' }} />
);

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [profile,    setProfile]    = useState(null);
  const [summary,    setSummary]    = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    const role  = sessionStorage.getItem('role');
    if (!token || role !== 'student') { navigate('/student-login'); return; }

    Promise.all([
      authFetch('/api/me').then(r => r.json()),
      authFetch('/api/activities/progress/summary').then(r => r.json()),
      authFetch('/api/activities/my').then(r => r.json()),
    ]).then(([me, sum, acts]) => {
      setProfile(me);
      setSummary(sum);
      setActivities(Array.isArray(acts) ? acts : []);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('student_name');
    navigate('/student-login');
  };

  const name      = profile?.full_name || sessionStorage.getItem('student_name') || 'Explorer';
  const xpTotal   = summary?.total_xp || 0;
  const level     = summary?.level    || 1;
  const xpNext    = summary?.xp_to_next_level || 200;
  const streak    = summary?.streak_days || 0;
  const completed = summary?.completed_count || 0;

  const earnedBadges = BADGES.filter(b => xpTotal >= b.xpMin);
  const lockedBadges = BADGES.filter(b => xpTotal < b.xpMin).slice(0, 2);
  const byLD         = activities.reduce((acc, a) => { (acc[a.ld_type] ??= []).push(a); return acc; }, {});
  const assignedCount = activities.filter(a => a.status === 'assigned').length;

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9' }}>
      {/* Header */}
      <header style={{ padding: '0.875rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ background: 'var(--primary)', borderRadius: '10px', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <StarIcon size={18} style={{ color: 'white' }} />
          </div>
          <div>
            <h1 style={{ color: 'var(--text)', fontSize: '1rem', margin: '0 0 0.1rem', fontWeight: '700', letterSpacing: '-0.02em' }}>
              Hi, {name.split(' ')[0]}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ background: '#FEF3C7', color: '#92400E', padding: '0.1rem 0.5rem', borderRadius: '99px', fontWeight: '700', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ZapIcon size={10} />Level {level}
              </span>
              {streak > 0 && <span style={{ color: '#EF4444', fontWeight: '600', fontSize: '0.72rem' }}>{streak}-day streak</span>}
            </div>
          </div>
        </div>
        <button onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: '1.5px solid var(--border)', borderRadius: '8px', padding: '0.4rem 0.75rem', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: '600', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
          <LogOutIcon size={13} />Sign out
        </button>
      </header>

      <main style={{ padding: '1.5rem 2rem', maxWidth: '1100px', margin: '0 auto' }}>
        {loading ? (
          <><Skeleton h={90} /><Skeleton h={70} /><Skeleton h={200} /></>
        ) : (
          <>
            {/* XP Bar */}
            <div style={{ background: 'white', borderRadius: '10px', padding: '1.25rem 1.5rem', marginBottom: '1.25rem', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
                <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <ZapIcon size={14} />XP Progress — Level {level}
                </div>
                <div style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.8rem' }}>{xpTotal} XP · {xpNext} to next level</div>
              </div>
              <div style={{ height: '8px', background: '#EEF2FF', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, ((200 - xpNext) / 200) * 100)}%`, background: 'var(--primary)', borderRadius: '4px', transition: 'width 1.5s ease' }} />
              </div>
              <div style={{ display: 'flex', gap: '2rem', marginTop: '0.875rem' }}>
                {[
                  { val: completed,    label: 'Completed' },
                  { val: assignedCount, label: 'Assigned' },
                  { val: xpTotal,      label: 'Total XP' },
                ].map(({ val, label }) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary)', letterSpacing: '-0.03em' }}>{val}</p>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '1.5rem', overflowX: 'auto', padding: '0.25rem 0' }}>
              {earnedBadges.map((b, i) => (
                <div key={i} style={{ background: 'white', borderRadius: '8px', padding: '0.625rem 0.875rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', border: `1.5px solid ${b.color}33`, flexShrink: 0, minWidth: '80px' }}>
                  <AwardIcon size={16} style={{ color: b.color }} />
                  <span style={{ fontSize: '0.65rem', fontWeight: '700', color: b.color, whiteSpace: 'nowrap', textAlign: 'center' }}>{b.label}</span>
                </div>
              ))}
              {lockedBadges.map((b, i) => (
                <div key={i} style={{ background: '#F8FAFC', borderRadius: '8px', padding: '0.625rem 0.875rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', border: '1.5px dashed var(--border)', flexShrink: 0, minWidth: '80px', opacity: 0.5 }}>
                  <LockIcon size={14} style={{ color: 'var(--text-placeholder)' }} />
                  <span style={{ fontSize: '0.65rem', fontWeight: '600', color: 'var(--text-placeholder)' }}>Locked</span>
                </div>
              ))}
            </div>

            {/* Welcome banner */}
            {assignedCount === 0 ? (
              <div style={{ background: 'white', borderRadius: '10px', padding: '2rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
                <h2 style={{ color: 'var(--text)', margin: '0 0 0.375rem', fontSize: '1.1rem' }}>No activities assigned yet</h2>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>Your teacher will assign activities soon. Check back later!</p>
              </div>
            ) : (
              <div style={{ background: 'var(--primary)', borderRadius: '10px', padding: '1.25rem 1.5rem', color: 'white', textAlign: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '0.25rem', fontWeight: '700' }}>Ready for today's challenge?</h2>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '0.875rem' }}>
                  You have {assignedCount} activit{assignedCount !== 1 ? 'ies' : 'y'} unlocked.
                </p>
              </div>
            )}

            {/* Activities by LD */}
            {Object.entries(byLD).map(([ld, acts]) => {
              const meta = LD_META[ld] || { label: ld, color: '#6366F1', bg: '#EEF2FF' };
              return (
                <div key={ld} style={{ marginBottom: '2rem' }}>
                  <h2 style={{ fontSize: '0.9375rem', color: 'var(--text)', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: meta.color, display: 'inline-block', flexShrink: 0 }} />
                    {meta.label} Activities
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                    {acts.map(a => {
                      const locked = a.status === 'locked';
                      const done   = a.completed;
                      return (
                        <div key={a.key} style={{
                          background: 'white', borderRadius: '10px', padding: '1.25rem', textAlign: 'center',
                          borderTop: `3px solid ${locked ? '#E2E8F0' : meta.color}`,
                          border: '1px solid var(--border)', borderTopWidth: '3px',
                          opacity: locked ? 0.6 : 1, transition: 'all 0.15s', position: 'relative',
                        }}
                          onMouseEnter={e => !locked && (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
                          onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                          {locked && (
                            <div style={{ position: 'absolute', top: '0.625rem', right: '0.625rem', background: '#F8FAFC', borderRadius: '99px', padding: '0.125rem 0.5rem', fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <LockIcon size={10} />Locked
                            </div>
                          )}
                          {done && !locked && (
                            <div style={{ position: 'absolute', top: '0.625rem', right: '0.625rem', background: '#ECFDF5', borderRadius: '99px', padding: '0.125rem 0.5rem', fontSize: '0.7rem', fontWeight: '600', color: '#059669' }}>
                              Done
                            </div>
                          )}
                          <div style={{ borderRadius: '10px', background: locked ? '#F1F5F9' : meta.bg, width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.875rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>{a.icon || '▶'}</span>
                          </div>
                          <h3 style={{ fontSize: '0.9375rem', marginBottom: '0.375rem', color: 'var(--text)', fontWeight: '700' }}>{a.title}</h3>
                          <p style={{ color: 'var(--text-muted)', marginBottom: '0.875rem', fontSize: '0.8125rem', lineHeight: '1.5' }}>{a.description}</p>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.375rem', marginBottom: '0.875rem', flexWrap: 'wrap' }}>
                            <span style={{ background: meta.bg, color: meta.color, padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.72rem', fontWeight: '700' }}>+{a.xp} XP</span>
                            {a.best_score != null && (
                              <span style={{ background: '#ECFDF5', color: '#059669', padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.72rem', fontWeight: '700' }}>
                                Best: {Math.round(a.best_score)}%
                              </span>
                            )}
                            {a.attempts > 0 && (
                              <span style={{ background: '#F1F5F9', color: 'var(--text-muted)', padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.72rem', fontWeight: '600' }}>
                                {a.attempts} play{a.attempts !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          {locked ? (
                            <button disabled style={{ width: '100%', background: '#F1F5F9', color: 'var(--text-placeholder)', border: 'none', borderRadius: '8px', padding: '0.625rem', fontWeight: '600', cursor: 'not-allowed', fontSize: '0.8125rem', fontFamily: 'Inter, sans-serif' }}>
                              Ask your teacher to unlock
                            </button>
                          ) : (
                            <Link to={`/activity/${a.key}`}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', width: '100%', background: meta.color, border: 'none', borderRadius: '8px', padding: '0.625rem', fontWeight: '700', cursor: 'pointer', fontSize: '0.875rem', color: 'white', textDecoration: 'none', transition: 'all 0.15s' }}>
                              {done ? <><RefreshCwIcon size={13} />Play again</> : <><PlayIcon size={13} />Play now</>}
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {activities.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <h3 style={{ color: 'var(--text)', marginBottom: '0.5rem', fontSize: '1rem' }}>No activities yet</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Your teacher will assign activities soon!</p>
              </div>
            )}
          </>
        )}
      </main>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
};

export default StudentDashboard;
