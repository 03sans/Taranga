import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

// Animated counter hook
const useCountUp = (target, duration = 1500) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const steps = 50;
    const increment = target / steps;
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
};

const StatCard = ({ label, value, color, icon, subtext }) => {
  const count = useCountUp(value);
  return (
    <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', borderTop: `6px solid ${color}`, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', transition: 'all 0.3s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)'; }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <span style={{ fontSize: '1.75rem', background: '#F8FAFC', borderRadius: '10px', padding: '0.3rem 0.4rem' }}>{icon}</span>
      </div>
      <p style={{ fontSize: '3.5rem', fontWeight: '800', color: color, lineHeight: '1', margin: '0 0 0.5rem 0' }}>{count}</p>
      {subtext && <p style={{ fontSize: '0.9rem', color: '#64748B', margin: 0 }}>{subtext}</p>}
    </div>
  );
};

const AdminDashboard = () => {
  const [users, setUsers] = useState(null);
  const [activity, setActivity] = useState([
    { icon: '✅', text: 'Screening completed for Aarav Patel', time: '2 min ago', color: '#ECFDF5', textColor: '#059669' },
    { icon: '👤', text: 'New educator registered: Ms. Priya Iyer', time: '1 hr ago', color: '#EEF2FF', textColor: '#6366F1' },
    { icon: '⚠️', text: 'High-risk flag on Rohan Mehta\'s report', time: '3 hr ago', color: '#FFF1F2', textColor: '#E11D48' },
    { icon: '📊', text: 'Monthly report export (Oct 2026)', time: '1 day ago', color: '#FFFBEB', textColor: '#D97706' },
    { icon: '🎮', text: 'Sita Sharma completed "Tracing Magic"', time: '1 day ago', color: '#ECFDF5', textColor: '#059669' },
  ]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    fetch('/api/users', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json())
      .then(data => setUsers(data))
      .catch(() => setUsers(null));
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar role="admin" />
      <div className="dashboard-main">
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2.25rem', color: '#1E293B', margin: '0 0 0.25rem 0' }}>Platform Overview</h1>
            <p style={{ color: '#64748B', margin: 0 }}>Real-time metrics for the Taranga screening system.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn" style={{ background: '#EEF2FF', color: '#6366F1', border: 'none' }}>📄 Export Report</button>
            <Link to="/users" className="btn btn-primary">+ Add Educator</Link>
          </div>
        </header>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <StatCard label="Total Users" value={users?.length || 142} color="#6366F1" icon="👥" subtext="Educators & Parents" />
          <StatCard label="Active Screenings" value={89} color="#10B981" icon="📝" subtext="This month" />
          <StatCard label="Interventions Assigned" value={34} color="#F59E0B" icon="🎯" subtext="Across 5 LD types" />
          <StatCard label="High-Risk Students" value={12} color="#F43F5E" icon="⚠️" subtext="Requiring immediate action" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
          {/* Quick Operations */}
          <div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '1.25rem', color: '#1E293B' }}>Quick Operations</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                { to: '/users', icon: '👥', label: 'Manage Educators', desc: 'Approve & modify accounts', bg: 'linear-gradient(135deg, #EEF2FF 0%, white 100%)', color: '#6366F1' },
                { to: '/students', icon: '🎓', label: 'Manage Students', desc: 'Audit student profiles', bg: 'linear-gradient(135deg, #ECFDF5 0%, white 100%)', color: '#10B981' },
                { to: '/screening/adaptive', icon: '📝', label: 'New Screening', desc: 'Start a fresh assessment', bg: 'linear-gradient(135deg, #FFF7ED 0%, white 100%)', color: '#F59E0B' },
                { to: '/analytics', icon: '📈', label: 'View Analytics', desc: 'Progress & engagement data', bg: 'linear-gradient(135deg, #EFF6FF 0%, white 100%)', color: '#0EA5E9' },
              ].map(item => (
                <Link key={item.to} to={item.to} style={{ background: item.bg, borderRadius: '16px', padding: '1.5rem', border: '2px solid #F1F5F9', textDecoration: 'none', display: 'block', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{item.icon}</div>
                  <div style={{ fontWeight: '800', fontSize: '1rem', color: item.color, marginBottom: '0.25rem' }}>{item.label}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748B' }}>{item.desc}</div>
                </Link>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '1.25rem', color: '#1E293B' }}>Recent Activity</h2>
            <div style={{ background: 'white', borderRadius: '20px', padding: '1.5rem', border: '2px solid #E2E8F0' }}>
              {activity.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', paddingBottom: i < activity.length - 1 ? '1rem' : 0, marginBottom: i < activity.length - 1 ? '1rem' : 0, borderBottom: i < activity.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                  <span style={{ fontSize: '1.25rem', background: item.color, width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#1E293B', fontWeight: '600' }}>{item.text}</p>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* LD Distribution Bar */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', border: '2px solid #E2E8F0' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: '#1E293B' }}>LD Detection Distribution</h2>
          <p style={{ color: '#64748B', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Percentage of screened students flagged for each learning difficulty type.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { label: 'Dyslexia', pct: 68, color: '#E11D48' },
              { label: 'Dysgraphia', pct: 45, color: '#7C3AED' },
              { label: 'Dyscalculia', pct: 30, color: '#D97706' },
              { label: 'APD', pct: 22, color: '#1D4ED8' },
              { label: 'NVLD', pct: 15, color: '#059669' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '120px', textAlign: 'right', fontWeight: '700', fontSize: '0.9rem', color: '#475569', flexShrink: 0 }}>{item.label}</div>
                <div style={{ flex: 1, height: '10px', background: '#F1F5F9', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${item.pct}%`, background: item.color, borderRadius: '5px', animation: 'growBar 1s ease forwards' }} />
                </div>
                <div style={{ width: '40px', fontWeight: '800', fontSize: '0.9rem', color: item.color }}>{item.pct}%</div>
              </div>
            ))}
          </div>
        </div>
        <style>{`@keyframes growBar { from { width: 0 } }`}</style>
      </div>
    </div>
  );
};

export default AdminDashboard;
