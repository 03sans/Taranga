import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { BarChartIcon, ActivityIcon, ClipboardListIcon, GraduationCapIcon, AlertTriangleIcon, PrinterIcon } from '../components/icons';

const authFetch = (url, opts = {}) => {
  const token = sessionStorage.getItem('access_token');
  return fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers },
  });
};

const LD_META = {
  Dyslexia:    { color: '#6366F1' },
  Dyscalculia: { color: '#F59E0B' },
  Dysgraphia:  { color: '#10B981' },
  NVLD:        { color: '#8B5CF6' },
  APD:         { color: '#EF4444' },
};

const ACTIVITY_TITLES = {
  dys_letter_flip: 'Letter Flip', dys_rhyme_rocket: 'Rhyme Rocket', dys_word_builder: 'Word Builder', dys_spot_error: 'Spot the Error',
  dc_number_jump: 'Number Jump', dc_math_match: 'Math Match', dc_clock_hero: 'Clock Hero', dc_pattern_find: 'Pattern Detective',
  dg_space_squad: 'Space Squad', dg_letter_sort: 'Letter Sort', dg_copy_dash: 'Copy Challenge', dg_trace_race: 'Trace Race',
  nv_emotion_read: 'Emotion Match', nv_map_nav: 'Map Navigator', nv_shape_fit: 'Shape Puzzle', nv_social_cue: 'Social Decoder',
  apd_word_echo: 'Word Echo', apd_step_follow: 'Step Follower', apd_rhyme_id: 'Rhyme Radar', apd_sound_sort: 'Sound Sort',
};

/* ── mini bar chart ────────────────────────────────────────────────────── */
const LDBar = ({ ld, pct, flagged }) => {
  const meta = LD_META[ld] || { color: '#6366F1' };
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem', alignItems: 'center' }}>
        <span style={{ fontWeight: '600', fontSize: '0.8125rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: meta.color, display: 'inline-block', flexShrink: 0 }} />{ld}
        </span>
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>{flagged} flagged</span>
          <span style={{ fontWeight: '700', color: meta.color, fontSize: '0.875rem', minWidth: '36px', textAlign: 'right' }}>{pct}%</span>
        </div>
      </div>
      <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: meta.color, borderRadius: '3px', transition: 'width 1.2s cubic-bezier(0.25,0.46,0.45,0.94)' }} />
      </div>
    </div>
  );
};

/* ── score chip ─────────────────────────────────────────────────────────── */
const ScoreChip = ({ score }) => {
  const color = score >= 80 ? '#059669' : score >= 60 ? '#D97706' : '#E11D48';
  const bg    = score >= 80 ? '#ECFDF5' : score >= 60 ? '#FFFBEB' : '#FFF1F2';
  return <span style={{ background: bg, color, padding: '0.2rem 0.6rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.85rem' }}>{score}%</span>;
};

const Skeleton = ({ h = 60 }) => (
  <div style={{ background: '#E2E8F0', borderRadius: '12px', height: h, marginBottom: '0.75rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
);

/* ── relative time ──────────────────────────────────────────────────────── */
const relTime = (iso) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)} hr ago`;
  return `${Math.round(diff / 86400)} day${Math.round(diff / 86400) > 1 ? 's' : ''} ago`;
};

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */
const ProgressTracking = () => {
  const role = sessionStorage.getItem('role') || 'teacher';
  const navigate = useNavigate();

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    if (!token) { navigate('/login'); return; }

    authFetch('/api/users/analytics')
      .then(r => {
        if (r.status === 401) {
          sessionStorage.removeItem('access_token');
          sessionStorage.removeItem('role');
          navigate('/login');
          throw new Error('Unauthorized');
        }
        return r.json();
      })
      .then(d => {
        if (d.detail) { setError('Could not load analytics data.'); return; }
        setData(d);
      })
      .catch((err) => {
        if (err.message !== 'Unauthorized') setError('Network error loading analytics.');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const summary = data?.summary || {};
  const ldDist  = data?.ld_distribution || [];
  const recent  = data?.recent_activity || [];

  return (
    <div className="dashboard-layout">
      <Sidebar role={role} />
      <div className="dashboard-main">

        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', color: 'var(--text)', margin: '0 0 0.125rem', fontWeight: '800', letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <BarChartIcon size={20} style={{ color: 'var(--primary)' }} />Analytics &amp; Progress
            </h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>
              {role === 'admin' ? 'Platform-wide data across all educators and students.' : "Track your students' engagement and intervention effectiveness."}
            </p>
          </div>
          <button onClick={() => window.print()} className="btn" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text)', gap: '0.4rem' }}>
            <PrinterIcon size={13} />Print
          </button>
        </header>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FEE2E2', border: '1.5px solid #FECACA', color: '#B91C1C', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontWeight: '600', fontSize: '0.875rem' }}>
            <AlertTriangleIcon size={14} />{error}
          </div>
        )}

        {/* Summary stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
          {loading ? [1,2,3,4].map(i => <Skeleton key={i} h={100} />) : [
            { label: 'Avg Score',        value: summary.avg_score ? `${summary.avg_score}%` : '—', icon: BarChartIcon,      color: '#F59E0B' },
            { label: 'Activity Attempts',value: summary.total_attempts ?? 0,                       icon: ActivityIcon,     color: '#6366F1' },
            { label: 'Students Active',  value: summary.students_active ?? 0,                      icon: GraduationCapIcon,color: '#10B981' },
            { label: 'Screenings Run',   value: summary.total_screenings ?? 0,                     icon: ClipboardListIcon,color: '#8B5CF6' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'white', borderRadius: '10px', padding: '1.1rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ background: `${s.color}18`, borderRadius: '7px', padding: '0.375rem', display: 'flex', width: 'fit-content' }}>
                <s.icon size={14} style={{ color: s.color }} />
              </div>
              <div style={{ fontSize: '1.625rem', fontWeight: '800', color: s.color, lineHeight: 1, letterSpacing: '-0.04em' }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

          {/* Recent Activity Log */}
          <div style={{ background: 'white', borderRadius: '20px', border: '2px solid #E2E8F0', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.75rem', borderBottom: '2px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--text)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ActivityIcon size={15} style={{ color: 'var(--primary)' }} />Recent Activity</h2>
              <span style={{ background: '#EEF2FF', color: '#6366F1', padding: '0.2rem 0.7rem', borderRadius: '99px', fontWeight: '800', fontSize: '0.78rem' }}>{recent.length} entries</span>
            </div>

            {loading ? (
              <div style={{ padding: '1.25rem' }}><Skeleton /><Skeleton /><Skeleton /></div>
            ) : recent.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <ActivityIcon size={28} style={{ color: 'var(--text-placeholder)', margin: '0 auto 0.75rem', display: 'block' }} />
                <p style={{ fontWeight: '600', margin: '0 0 0.25rem', fontSize: '0.9rem' }}>No activity attempts yet.</p>
                <p style={{ fontSize: '0.8125rem', margin: 0 }}>Students need to log in and complete activities.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC' }}>
                      {['Student', 'Activity', 'Score', 'Attempt', 'When'].map(h => (
                        <th key={h} style={{ padding: '0.75rem 1.25rem', textAlign: 'left', color: '#94A3B8', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((a, i) => (
                      <tr key={i} style={{ borderTop: '1px solid #F1F5F9', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FAFBFF'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                        <td style={{ padding: '0.9rem 1.25rem', fontWeight: '700', color: '#1E293B', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>{a.student_name}</td>
                        <td style={{ padding: '0.9rem 1.25rem', color: '#64748B', fontSize: '0.85rem' }}>{ACTIVITY_TITLES[a.activity_key] || a.activity_key}</td>
                        <td style={{ padding: '0.9rem 1.25rem' }}><ScoreChip score={a.score} /></td>
                        <td style={{ padding: '0.9rem 1.25rem', color: '#94A3B8', fontSize: '0.82rem', fontWeight: '700' }}>#{a.attempt}</td>
                        <td style={{ padding: '0.9rem 1.25rem', color: '#94A3B8', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{relTime(a.completed_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* LD Distribution */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '1.75rem', border: '2px solid #E2E8F0' }}>
            <h2 style={{ fontSize: '0.9375rem', margin: '0 0 0.25rem', color: 'var(--text)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ClipboardListIcon size={15} style={{ color: 'var(--primary)' }} />LD Detection Distribution</h2>
            <p style={{ color: '#64748B', fontSize: '0.82rem', margin: '0 0 1.5rem' }}>
              % of screenings that flagged each LD (≥60% score).
            </p>

            {loading ? (
              <><Skeleton h={28} /><Skeleton h={28} /><Skeleton h={28} /><Skeleton h={28} /><Skeleton h={28} /></>
            ) : ldDist.length === 0 || ldDist.every(l => l.pct === 0) ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                <ClipboardListIcon size={24} style={{ color: 'var(--text-placeholder)', margin: '0 auto 0.5rem', display: 'block' }} />
                <p style={{ fontWeight: '600', margin: 0, fontSize: '0.875rem' }}>No screening results yet.</p>
                <p style={{ fontSize: '0.8rem', margin: '0.25rem 0 0' }}>Run screenings to see LD distribution.</p>
              </div>
            ) : (
              ldDist.map(item => (
                <LDBar key={item.ld} ld={item.ld} pct={item.pct} flagged={item.flagged} />
              ))
            )}

            {!loading && ldDist.length > 0 && (
              <div style={{ marginTop: '1.25rem', padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: '12px' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B', fontWeight: '700' }}>
                  Based on <strong style={{ color: '#1E293B' }}>{data?.summary?.total_screenings || 0}</strong> total screening{data?.summary?.total_screenings !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Empty state when no data at all */}
        {!loading && !error && summary.total_attempts === 0 && summary.total_screenings === 0 && (
          <div style={{ background: 'white', borderRadius: '10px', border: '1px solid var(--border)', padding: '3rem', textAlign: 'center' }}>
            <BarChartIcon size={28} style={{ color: 'var(--text-placeholder)', margin: '0 auto 0.75rem', display: 'block' }} />
            <h2 style={{ color: 'var(--text)', margin: '0 0 0.375rem', fontSize: '1rem' }}>No data yet</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>Run screenings and assign activities to students — data will appear here automatically.</p>
          </div>
        )}

        <style>{`
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        `}</style>
      </div>
    </div>
  );
};

export default ProgressTracking;
