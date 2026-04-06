import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';

const SVGLineChart = ({ data, color = '#6366F1' }) => {
  const w = 600, h = 200, padX = 40, padY = 20;
  const maxV = Math.max(...data.map(d => d.value), 1);
  const pts = data.map((d, i) => ({
    x: padX + (i / (data.length - 1)) * (w - padX * 2),
    y: h - padY - (d.value / maxV) * (h - padY * 2),
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${pts[pts.length-1].x},${h-padY} L${pts[0].x},${h-padY} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map(t => (
        <line key={t} x1={padX} y1={h - padY - t * (h - padY * 2)} x2={w - padX} y2={h - padY - t * (h - padY * 2)}
          stroke="#F1F5F9" strokeWidth="1.5" />
      ))}
      {/* Area fill */}
      <path d={areaPath} fill="url(#areaGrad)" />
      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="6" fill="white" stroke={color} strokeWidth="3" />
          <text x={p.x} y={h - 5} textAnchor="middle" fontSize="11" fill="#94A3B8" fontFamily="sans-serif">{data[i].label}</text>
          <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="12" fill={color} fontWeight="bold" fontFamily="sans-serif">{data[i].value}%</text>
        </g>
      ))}
    </svg>
  );
};

const weekData = [
  { label: 'Mon', value: 62 }, { label: 'Tue', value: 75 }, { label: 'Wed', value: 68 },
  { label: 'Thu', value: 85 }, { label: 'Fri', value: 91 }
];

const ProgressTracking = () => {
  const [activities, setActivities] = useState([
    { name: 'Aarav Patel',  activity: 'Letter Catch',   score: 95, status: 'completed', color: '#059669', bg: '#ECFDF5', time: '5 min ago' },
    { name: 'Sita Sharma', activity: 'Tracing Magic',   score: 80, status: 'completed', color: '#059669', bg: '#ECFDF5', time: '2 hr ago' },
    { name: 'John Doe',    activity: 'Number Sequence', score: null,status: 'in-progress',color:'#D97706', bg: '#FFFBEB', time: '3 hr ago' },
    { name: 'Priya Nair',  activity: 'Rhyme Match',     score: 72, status: 'completed', color: '#6366F1', bg: '#EEF2FF', time: '1 day ago' },
    { name: 'Rohan Mehta', activity: 'Letter Catch',    score: 55, status: 'completed', color: '#D97706', bg: '#FFFBEB', time: '2 days ago' },
  ]);
  const role = localStorage.getItem('role') || 'teacher';

  return (
    <div className="dashboard-layout">
      <Sidebar role={role} />
      <div className="dashboard-main">
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2.25rem', color: '#1E293B', margin: '0 0 0.25rem 0' }}>Analytics & Progress</h1>
            <p style={{ color: '#64748B', margin: 0 }}>Track student engagement and intervention effectiveness.</p>
          </div>
          <button onClick={() => window.print()} className="btn btn-primary">📄 Export PDF</button>
        </header>

        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          {[
            { label: 'Avg Score', value: '78%', icon: '⭐', color: '#F59E0B', bg: '#FFFBEB' },
            { label: 'Activities Done', value: '24', icon: '🎮', color: '#6366F1', bg: '#EEF2FF' },
            { label: 'Students Active', value: '5', icon: '🎓', color: '#10B981', bg: '#ECFDF5' },
            { label: 'Improvement', value: '+29%', icon: '📈', color: '#0EA5E9', bg: '#EFF6FF' },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, borderRadius: '16px', padding: '1.5rem', border: `2px solid ${s.color}22` }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{s.icon}</div>
              <div style={{ fontSize: '2.25rem', fontWeight: '800', color: s.color, lineHeight: '1' }}>{s.value}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748B', marginTop: '0.25rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          {/* Line Chart */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', border: '2px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.3rem', margin: 0, color: '#1E293B' }}>Activity Score Trend</h2>
              <span style={{ background: '#ECFDF5', color: '#059669', padding: '0.3rem 0.75rem', borderRadius: '99px', fontWeight: '700', fontSize: '0.82rem' }}>📈 This Week</span>
            </div>
            <SVGLineChart data={weekData} color="#6366F1" />
          </div>

          {/* LD Breakdown */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', border: '2px solid #E2E8F0' }}>
            <h2 style={{ fontSize: '1.3rem', margin: '0 0 1.5rem 0', color: '#1E293B' }}>LD Intervention Reach</h2>
            {[
              { ld: 'Dyslexia', pct: 68, color: '#E11D48' },
              { ld: 'Dysgraphia', pct: 45, color: '#7C3AED' },
              { ld: 'Dyscalculia', pct: 30, color: '#D97706' },
              { ld: 'APD', pct: 22, color: '#1D4ED8' },
              { ld: 'NVLD', pct: 15, color: '#059669' },
            ].map((item) => (
              <div key={item.ld} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#475569' }}>{item.ld}</span>
                  <span style={{ fontWeight: '800', color: item.color, fontSize: '0.9rem' }}>{item.pct}%</span>
                </div>
                <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${item.pct}%`, background: item.color, borderRadius: '4px', animation: 'growBar 1s ease forwards' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div style={{ background: 'white', borderRadius: '20px', border: '2px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem 2rem', borderBottom: '2px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#1E293B' }}>Recent Activity Log</h2>
            <span style={{ color: '#94A3B8', fontSize: '0.85rem', fontWeight: '600' }}>{activities.length} entries</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {['Student', 'Activity', 'Score', 'Status', 'When'].map(h => (
                  <th key={h} style={{ padding: '0.875rem 1.5rem', textAlign: 'left', color: '#94A3B8', fontWeight: '700', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activities.map((a, i) => (
                <tr key={i} style={{ borderTop: '1px solid #F1F5F9', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FAFBFF'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '1.1rem 1.5rem', fontWeight: '700', color: '#1E293B', fontSize: '0.95rem' }}>{a.name}</td>
                  <td style={{ padding: '1.1rem 1.5rem', color: '#64748B', fontSize: '0.9rem' }}>{a.activity}</td>
                  <td style={{ padding: '1.1rem 1.5rem', fontWeight: '800', color: a.score !== null ? a.color : '#94A3B8', fontSize: '1rem' }}>
                    {a.score !== null ? `${a.score}%` : '—'}
                  </td>
                  <td style={{ padding: '1.1rem 1.5rem' }}>
                    <span style={{ background: a.bg, color: a.color, padding: '0.3rem 0.75rem', borderRadius: '99px', fontWeight: '700', fontSize: '0.8rem' }}>
                      {a.status === 'completed' ? '✅ Completed' : '⏳ In Progress'}
                    </span>
                  </td>
                  <td style={{ padding: '1.1rem 1.5rem', color: '#94A3B8', fontSize: '0.85rem' }}>{a.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <style>{`@keyframes growBar { from { width: 0; } }`}</style>
      </div>
    </div>
  );
};

export default ProgressTracking;
