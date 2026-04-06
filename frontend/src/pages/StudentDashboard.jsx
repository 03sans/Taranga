import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem('access_token');
  return fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers } });
};

const LD_META = {
  dyslexia:    { label: 'Dyslexia',    color: '#6366F1', bg: '#EEF2FF', emoji: '📖' },
  dyscalculia: { label: 'Dyscalculia', color: '#F59E0B', bg: '#FFFBEB', emoji: '🔢' },
  dysgraphia:  { label: 'Dysgraphia',  color: '#10B981', bg: '#ECFDF5', emoji: '✏️' },
  nvld:        { label: 'NVLD',        color: '#8B5CF6', bg: '#F5F3FF', emoji: '🧩' },
  apd:         { label: 'APD',         color: '#EF4444', bg: '#FEF2F2', emoji: '👂' },
};

const BADGES = [
  { icon: '🌟', label: 'First Try',    xpMin: 1 },
  { icon: '🔥', label: 'On a Roll',    xpMin: 100 },
  { icon: '🧠', label: 'Brain Power',  xpMin: 250 },
  { icon: '🎯', label: 'Sharp Mind',   xpMin: 500 },
  { icon: '🏆', label: 'Champion',     xpMin: 1000 },
];

const Skeleton = ({ h = 120 }) => (
  <div style={{ height: h, background: '#F1F5F9', borderRadius: '16px', animation: 'pulse 1.5s ease-in-out infinite', marginBottom: '1rem' }} />
);

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [profile,    setProfile]    = useState(null);
  const [summary,    setSummary]    = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const role  = localStorage.getItem('role');
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
    localStorage.removeItem('access_token');
    localStorage.removeItem('role');
    localStorage.removeItem('student_name');
    navigate('/student-login');
  };

  const name    = profile?.full_name || localStorage.getItem('student_name') || 'Explorer';
  const xpTotal = summary?.total_xp || 0;
  const level   = summary?.level    || 1;
  const xpNext  = summary?.xp_to_next_level || 200;
  const streak  = summary?.streak_days || 0;
  const completed = summary?.completed_count || 0;

  const earnedBadges = BADGES.filter(b => xpTotal >= b.xpMin);
  const lockedBadges = BADGES.filter(b => xpTotal < b.xpMin).slice(0, 2);

  // Group activities by LD
  const byLD = activities.reduce((acc, a) => { (acc[a.ld_type] ??= []).push(a); return acc; }, {});
  const assignedCount = activities.filter(a => a.status === 'assigned').length;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #EEF2FF 0%, #F8FAFC 50%)' }}>
      {/* Header */}
      <header style={{ padding: '1.25rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.8)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ fontSize: '2.5rem', background: 'linear-gradient(135deg, #6366F1, #A855F7)', borderRadius: '50%', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 6px 20px rgba(99,102,241,0.3)' }}>
            🦸
          </div>
          <div>
            <h1 style={{ color: '#4F46E5', fontSize: '1.4rem', margin: '0 0 0.1rem', fontWeight: '900' }}>
              Hi, {name.split(' ')[0]}! 👋
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: 'white', padding: '0.18rem 0.7rem', borderRadius: '99px', fontWeight: '800', fontSize: '0.8rem' }}>
                ⭐ Level {level} Explorer
              </span>
              {streak > 0 && <span style={{ color: '#F43F5E', fontWeight: '700', fontSize: '0.8rem' }}>🔥 {streak} day streak!</span>}
            </div>
          </div>
        </div>
        <button onClick={handleLogout} style={{ background: '#FFE4E6', color: '#E11D48', border: 'none', borderRadius: '12px', padding: '0.65rem 1.25rem', fontWeight: '800', cursor: 'pointer', fontSize: '0.9rem' }}>
          Log Out 👋
        </button>
      </header>

      <main style={{ padding: '2rem 2.5rem 4rem', maxWidth: '1300px', margin: '0 auto' }}>

        {loading ? (
          <><Skeleton h={100} /><Skeleton h={80} /><Skeleton h={200} /></>
        ) : (
          <>
            {/* XP Progress Bar */}
            <div style={{ background: 'white', borderRadius: '20px', padding: '1.5rem 2rem', marginBottom: '1.5rem', border: '2px solid #E2E8F0', boxShadow: '0 4px 20px rgba(99,102,241,0.07)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <div style={{ fontWeight: '800', fontSize: '1rem', color: '#4F46E5' }}>⚡ XP Progress — Level {level}</div>
                <div style={{ color: '#94A3B8', fontWeight: '700', fontSize: '0.9rem' }}>{xpTotal} XP · {xpNext} to next level</div>
              </div>
              <div style={{ height: '14px', background: '#EEF2FF', borderRadius: '7px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ height: '100%', width: `${Math.min(100, ((200 - xpNext) / 200) * 100)}%`, background: 'linear-gradient(90deg, #6366F1, #A855F7)', borderRadius: '7px', boxShadow: '0 2px 10px rgba(99,102,241,0.4)', transition: 'width 1.5s ease' }} />
              </div>
              <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900', color: '#6366F1' }}>{completed}</p>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8', fontWeight: '700' }}>Completed</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900', color: '#10B981' }}>{assignedCount}</p>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8', fontWeight: '700' }}>Assigned</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900', color: '#F59E0B' }}>{xpTotal}</p>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8', fontWeight: '700' }}>Total XP</p>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: '0.85rem', marginBottom: '1.75rem', overflowX: 'auto', padding: '0.25rem 0' }}>
              {earnedBadges.map((b, i) => (
                <div key={i} style={{ background: 'white', borderRadius: '16px', padding: '0.85rem 1.1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', border: '2px solid #E2E8F0', flexShrink: 0, minWidth: '85px', boxShadow: '0 4px 12px rgba(99,102,241,0.1)' }}>
                  <span style={{ fontSize: '1.8rem' }}>{b.icon}</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#4F46E5', whiteSpace: 'nowrap', textAlign: 'center' }}>{b.label}</span>
                </div>
              ))}
              {lockedBadges.map((b, i) => (
                <div key={i} style={{ background: '#F8FAFC', borderRadius: '16px', padding: '0.85rem 1.1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', border: '2px dashed #E2E8F0', flexShrink: 0, minWidth: '85px', opacity: 0.5 }}>
                  <span style={{ fontSize: '1.8rem' }}>🔒</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#94A3B8' }}>Locked</span>
                </div>
              ))}
            </div>

            {/* Welcome banner */}
            {assignedCount === 0 ? (
              <div style={{ background: 'linear-gradient(135deg,#6366F1,#A855F7)', borderRadius: '24px', padding: '2.5rem', color: 'white', textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>⏳</div>
                <h2 style={{ color: 'white', margin: '0 0 0.5rem' }}>No activities assigned yet!</h2>
                <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0 }}>Your teacher will assign activities for you soon. Check back later!</p>
              </div>
            ) : (
              <div style={{ background: 'linear-gradient(135deg,#10B981,#059669)', borderRadius: '24px', padding: '2.5rem', color: 'white', textAlign: 'center', position: 'relative', overflow: 'hidden', marginBottom: '2rem', boxShadow: '0 20px 50px rgba(16,185,129,0.25)' }}>
                <div style={{ position: 'absolute', right: '-5%', top: '-20%', fontSize: '14rem', opacity: 0.07, lineHeight: 1 }}>🏆</div>
                <h2 style={{ color: 'white', fontSize: '2.2rem', marginBottom: '0.5rem' }}>Ready for today's adventure? 🚀</h2>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem' }}>
                  You have {assignedCount} activit{assignedCount !== 1 ? 'ies' : 'y'} unlocked. Let's go!
                </p>
              </div>
            )}

            {/* Activities by LD */}
            {Object.entries(byLD).map(([ld, acts]) => {
              const meta = LD_META[ld] || { label: ld, color: '#6366F1', bg: '#EEF2FF', emoji: '📚' };
              return (
                <div key={ld} style={{ marginBottom: '2.5rem' }}>
                  <h2 style={{ fontSize: '1.4rem', color: '#1E293B', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {meta.emoji} {meta.label} Activities
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.25rem' }}>
                    {acts.map(a => {
                      const locked = a.status === 'locked';
                      const done   = a.completed;
                      return (
                        <div key={a.key} style={{
                          background: 'white', borderRadius: '22px', padding: '2rem', textAlign: 'center',
                          borderTop: `6px solid ${locked ? '#E2E8F0' : meta.color}`,
                          boxShadow: '0 4px 20px rgba(0,0,0,0.05)', opacity: locked ? 0.6 : 1,
                          transition: 'all 0.3s', position: 'relative',
                        }}
                          onMouseEnter={e => !locked && (e.currentTarget.style.transform = 'translateY(-5px)', e.currentTarget.style.boxShadow = `0 16px 40px ${meta.color}22`)}
                          onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)')}
                        >
                          {locked && (
                            <div style={{ position: 'absolute', top: '0.85rem', right: '0.85rem', background: '#F1F5F9', borderRadius: '99px', padding: '0.2rem 0.65rem', fontSize: '0.75rem', fontWeight: '700', color: '#94A3B8' }}>🔒 Locked</div>
                          )}
                          {done && !locked && (
                            <div style={{ position: 'absolute', top: '0.85rem', right: '0.85rem', background: '#ECFDF5', borderRadius: '99px', padding: '0.2rem 0.65rem', fontSize: '0.75rem', fontWeight: '700', color: '#10B981' }}>✅ Done</div>
                          )}
                          <div style={{ fontSize: '3.5rem', marginBottom: '1rem', background: locked ? '#F1F5F9' : meta.bg, width: '70px', height: '70px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>{a.icon}</div>
                          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#1E293B' }}>{a.title}</h3>
                          <p style={{ color: '#64748B', marginBottom: '1rem', fontSize: '0.88rem', lineHeight: '1.55' }}>{a.description}</p>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                            <span style={{ background: meta.bg, color: meta.color, padding: '0.2rem 0.7rem', borderRadius: '99px', fontSize: '0.78rem', fontWeight: '800' }}>+{a.xp} XP</span>
                            {a.best_score != null && (
                              <span style={{ background: '#ECFDF5', color: '#10B981', padding: '0.2rem 0.7rem', borderRadius: '99px', fontSize: '0.78rem', fontWeight: '800' }}>
                                Best: {Math.round(a.best_score)}%
                              </span>
                            )}
                            {a.attempts > 0 && (
                              <span style={{ background: '#F1F5F9', color: '#64748B', padding: '0.2rem 0.7rem', borderRadius: '99px', fontSize: '0.78rem', fontWeight: '700' }}>
                                {a.attempts} play{a.attempts !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          {locked ? (
                            <button disabled style={{ width: '100%', background: '#F1F5F9', color: '#94A3B8', border: 'none', borderRadius: '14px', padding: '0.9rem', fontWeight: '700', cursor: 'not-allowed', fontSize: '0.95rem' }}>
                              Ask your teacher to unlock
                            </button>
                          ) : (
                            <Link to={`/activity/${a.key}`}
                              style={{ display: 'block', width: '100%', background: `linear-gradient(135deg,${meta.color},${meta.color}CC)`, border: 'none', borderRadius: '14px', padding: '0.9rem', fontWeight: '900', cursor: 'pointer', fontSize: '1rem', color: 'white', textDecoration: 'none', boxShadow: `0 6px 18px ${meta.color}40`, transition: 'all 0.2s' }}>
                              {done ? '🔁 Play Again' : '▶ PLAY NOW'}
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
              <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '24px', border: '2px dashed #E2E8F0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎮</div>
                <h3 style={{ color: '#1E293B', marginBottom: '0.5rem' }}>No activities yet</h3>
                <p style={{ color: '#94A3B8' }}>Your teacher will assign activities soon!</p>
              </div>
            )}
          </>
        )}
      </main>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
};

export default StudentDashboard;
