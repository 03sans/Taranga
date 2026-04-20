import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { UsersIcon, GraduationCapIcon, ClipboardListIcon, TargetIcon, CheckCircleIcon, AlertTriangleIcon, SearchIcon, PlusIcon, Trash2Icon, BarChartIcon, ChevronRightIcon } from '../components/icons';

const authFetch = (url, opts = {}) => {
  const token = sessionStorage.getItem('access_token');
  return fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers },
  });
};

/* ── animated counter ──────────────────────────────────────────────────── */
const useCountUp = (target, duration = 1200) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) return;
    let frame = 0;
    const steps = 40;
    const inc = target / steps;
    const id = setInterval(() => {
      frame++;
      setCount(frame >= steps ? target : Math.floor(inc * frame));
      if (frame >= steps) clearInterval(id);
    }, duration / steps);
    return () => clearInterval(id);
  }, [target, duration]);
  return count;
};

/* ── sub-components ────────────────────────────────────────────────────── */
const StatCard = ({ label, value, color, icon: Icon, sub }) => {
  const n = useCountUp(value);
  return (
    <div style={{ background: 'white', borderRadius: '10px', padding: '1.25rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.625rem', transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
        <div style={{ background: `${color}18`, borderRadius: '7px', padding: '0.375rem', display: 'flex' }}>
          <Icon size={14} style={{ color }} />
        </div>
      </div>
      <p style={{ fontSize: '2rem', fontWeight: '800', color, lineHeight: 1, margin: '0', letterSpacing: '-0.04em' }}>{n}</p>
      {sub && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{sub}</p>}
    </div>
  );
};

const StatusBadge = ({ active }) => (
  <span style={{ background: active ? '#ECFDF5' : '#FFF1F2', color: active ? '#059669' : '#E11D48', padding: '0.25rem 0.7rem', borderRadius: '99px', fontWeight: '800', fontSize: '0.75rem' }}>
    {active ? '● Active' : '○ Inactive'}
  </span>
);

const Skeleton = ({ h = 48 }) => (
  <div style={{ background: '#E2E8F0', borderRadius: '12px', height: h, marginBottom: '0.75rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
);

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */
const AdminDashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats]       = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [confirm, setConfirm]   = useState(null);   // { type: 'delete'|'deactivate'|'activate', teacher }
  const [busy, setBusy]         = useState(false);
  const [toast, setToast]       = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm]   = useState({ full_name: '', email: '', password: '' });
  const [addError, setAddError] = useState('');
  const [adding, setAdding]     = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadData = useCallback(async () => {
    const token = sessionStorage.getItem('access_token');
    if (!token) { navigate('/login'); return; }
    setLoading(true);
    const [s, t] = await Promise.all([
      authFetch('/api/users/platform-stats').then(r => r.json()).catch(() => null),
      authFetch('/api/users/teachers').then(r => r.json()).catch(() => []),
    ]);
    setStats(s);
    setTeachers(Array.isArray(t) ? t : []);
    setLoading(false);
  }, [navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── teacher actions ── */
  const doAction = async () => {
    if (!confirm) return;
    setBusy(true);
    const { type, teacher } = confirm;
    try {
      if (type === 'delete') {
        await authFetch(`/api/users/${teacher.id}`, { method: 'DELETE' });
        showToast(`${teacher.full_name} removed.`);
      } else if (type === 'deactivate') {
        await authFetch(`/api/users/${teacher.id}/deactivate`, { method: 'POST' });
        showToast(`${teacher.full_name} deactivated.`);
      } else if (type === 'activate') {
        await authFetch(`/api/users/${teacher.id}/activate`, { method: 'POST' });
        showToast(`${teacher.full_name} re-activated.`);
      }
      setConfirm(null);
      loadData();
    } finally {
      setBusy(false);
    }
  };

  /* ── add teacher ── */
  const handleAdd = async (e) => {
    e.preventDefault();
    setAddError('');
    if (!addForm.full_name.trim()) return setAddError('Name is required.');
    if (!addForm.email.trim()) return setAddError('Email is required.');
    if (addForm.password.length < 8) return setAddError('Password must be at least 8 characters.');
    setAdding(true);
    try {
      const res = await authFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ full_name: addForm.full_name.trim(), email: addForm.email.trim(), password: addForm.password, role: 'teacher' }),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.detail || 'Failed to add teacher.'); return; }
      showToast(`Teacher ${addForm.full_name} added!`);
      setShowAddModal(false);
      setAddForm({ full_name: '', email: '', password: '' });
      loadData();
    } finally {
      setAdding(false);
    }
  };

  const filtered = teachers.filter(t =>
    t.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.email?.toLowerCase().includes(search.toLowerCase())
  );

  const LD_COLORS = {
    dyslexia: '#6366F1', dyscalculia: '#F59E0B', dysgraphia: '#10B981', nvld: '#8B5CF6', apd: '#EF4444',
  };

  return (
    <div className="dashboard-layout">
      <Sidebar role="admin" />
      <div className="dashboard-main">

        {/* ── Toast ────────────────────────────────────────────────── */}
        {toast && (
          <div style={{ position: 'fixed', top: '1.25rem', right: '1.25rem', background: '#1E293B', color: 'white', borderRadius: '8px', padding: '0.75rem 1.25rem', fontWeight: '600', fontSize: '0.875rem', zIndex: 999, boxShadow: '0 8px 32px rgba(0,0,0,0.25)', animation: 'fadeIn 0.3s ease', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircleIcon size={14} style={{ color: '#4ADE80' }} /> {toast}
          </div>
        )}

        {/* ── Header ───────────────────────────────────────────────── */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', color: 'var(--text)', margin: '0 0 0.125rem', fontWeight: '800', letterSpacing: '-0.03em' }}>Platform overview</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>Real-time metrics and educator management.</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ gap: '0.4rem' }}><PlusIcon size={13} />Add educator</button>
        </header>

        {/* ── Stat Cards ───────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
          {loading ? [1,2,3,4,5].map(i => <Skeleton key={i} h={120} />) : <>
            <StatCard label="Total Educators"   value={stats?.total_teachers || 0}              color="#7C3AED" icon={UsersIcon}          sub="Registered teachers" />
            <StatCard label="Active Educators"  value={stats?.active_teachers || 0}             color="#10B981" icon={CheckCircleIcon}    sub="Currently active" />
            <StatCard label="Total Students"    value={stats?.total_students || 0}              color="#6366F1" icon={GraduationCapIcon}  sub="Across all classes" />
            <StatCard label="Screenings Run"    value={stats?.total_screenings || 0}            color="#F59E0B" icon={ClipboardListIcon}  sub="All time" />
            <StatCard label="In Intervention"   value={stats?.students_with_interventions || 0} color="#EF4444" icon={TargetIcon}         sub="Students in games" />
          </>}
        </div>

        {/* ── Educator Management ───────────────────────────────────── */}
        <div style={{ background: 'white', borderRadius: '10px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h2 style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--text)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><UsersIcon size={15} style={{ color: 'var(--primary)' }} />Educator accounts</h2>
            <div style={{ position: 'relative' }}>
              <SearchIcon size={13} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-placeholder)', pointerEvents: 'none' }} />
              <input type="text" placeholder="Search educators…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: '2rem', width: '220px', fontSize: '0.8125rem' }} />
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '1.5rem 2rem' }}><Skeleton /><Skeleton /><Skeleton /></div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <UsersIcon size={28} style={{ color: 'var(--text-placeholder)', margin: '0 auto 0.75rem', display: 'block' }} />
              <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>No educators found.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #F1F5F9' }}>
                    {['Educator', 'Email', 'Students', 'Screenings', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '0.85rem 1.25rem', textAlign: 'left', color: '#94A3B8', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t, i) => (
                    <tr key={t.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F8FAFC' : 'none', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '900', fontSize: '0.95rem', flexShrink: 0 }}>
                            {t.full_name?.charAt(0) || '?'}
                          </div>
                          <span style={{ fontWeight: '700', color: '#1E293B', fontSize: '0.92rem' }}>{t.full_name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', color: '#64748B', fontSize: '0.85rem' }}>{t.email}</td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{ fontWeight: '800', color: '#6366F1', fontSize: '1.05rem' }}>{t.student_count}</span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{ fontWeight: '800', color: '#10B981', fontSize: '1.05rem' }}>{t.screening_count}</span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <StatusBadge active={t.is_active} />
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {t.is_active ? (
                            <button onClick={() => setConfirm({ type: 'deactivate', teacher: t })}
                              style={{ background: '#FFFBEB', color: '#D97706', border: '2px solid #FDE68A', borderRadius: '8px', padding: '0.35rem 0.75rem', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer' }}>
                              Deactivate
                            </button>
                          ) : (
                            <button onClick={() => setConfirm({ type: 'activate', teacher: t })}
                              style={{ background: '#ECFDF5', color: '#059669', border: '2px solid #A7F3D0', borderRadius: '8px', padding: '0.35rem 0.75rem', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer' }}>
                              Activate
                            </button>
                          )}
                          <button onClick={() => setConfirm({ type: 'delete', teacher: t })}
                            style={{ background: '#FFF1F2', color: '#E11D48', border: '2px solid #FECDD3', borderRadius: '8px', padding: '0.35rem 0.75rem', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer' }}>
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Quick Links ──────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem', marginTop: '1.5rem' }}>
          {[
            { to: '/analytics', icon: BarChartIcon,  label: 'Analytics', desc: 'Platform-wide data', color: '#7C3AED' },
            { to: '/users',     icon: UsersIcon,     label: 'All Users',  desc: 'Every registered account', color: '#10B981' },
          ].map(item => (
            <Link key={item.to} to={item.to}
              style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', textDecoration: 'none', display: 'flex', gap: '0.75rem', alignItems: 'center', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = item.color; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <div style={{ background: `${item.color}15`, borderRadius: '8px', padding: '0.5rem', display: 'flex' }}>
                <item.icon size={16} style={{ color: item.color }} />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: '700', color: 'var(--text)', fontSize: '0.875rem' }}>{item.label}</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>

      </div>

      {/* ── Confirm Dialog ───────────────────────────────────────────── */}
      {confirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '1rem' }}
          onClick={e => e.target === e.currentTarget && !busy && setConfirm(null)}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', maxWidth: '400px', width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.25)' }}>
            <h3 style={{ color: 'var(--text)', margin: '0 0 0.375rem', fontSize: '1rem', fontWeight: '700' }}>
              {confirm.type === 'delete' ? 'Remove educator' : confirm.type === 'deactivate' ? 'Deactivate educator' : 'Activate educator'}
            </h3>
            <p style={{ textAlign: 'center', color: '#64748B', fontSize: '0.9rem', margin: '0 0 1.75rem' }}>
              {confirm.type === 'delete'
                ? <>Are you sure you want to permanently remove <strong>{confirm.teacher.full_name}</strong>? Their students will remain in the system.</>
                : confirm.type === 'deactivate'
                ? <>This will prevent <strong>{confirm.teacher.full_name}</strong> from logging in.</>
                : <>This will re-enable <strong>{confirm.teacher.full_name}</strong>'s access.</>}
            </p>
            <div style={{ display: 'flex', gap: '0.625rem' }}>
              <button onClick={() => setConfirm(null)} disabled={busy}
                style={{ flex: 1, background: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '0.625rem', fontWeight: '600', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Cancel
              </button>
              <button onClick={doAction} disabled={busy}
                style={{ flex: 1, background: confirm.type === 'activate' ? '#10B981' : confirm.type === 'deactivate' ? '#F59E0B' : '#EF4444', border: 'none', borderRadius: '8px', padding: '0.625rem', fontWeight: '700', cursor: 'pointer', color: 'white', fontSize: '0.875rem' }}>
                {busy ? 'Working…' : confirm.type === 'activate' ? 'Activate' : confirm.type === 'deactivate' ? 'Deactivate' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Educator Modal ────────────────────────────────────────── */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '1rem' }}
          onClick={e => e.target === e.currentTarget && !adding && setShowAddModal(false)}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '2.5rem', maxWidth: '460px', width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontSize: '1.6rem', color: '#1E293B', margin: '0 0 0.4rem' }}>Add Educator</h2>
            <p style={{ color: '#64748B', margin: '0 0 1.75rem', fontSize: '0.9rem' }}>Create a teacher account for a new educator.</p>

            {addError && (
              <div style={{ background: '#FFF1F2', border: '2px solid #FECDD3', color: '#E11D48', borderRadius: '12px', padding: '0.75rem 1rem', marginBottom: '1rem', fontWeight: '700', fontSize: '0.88rem' }}>
                {addError}
              </div>
            )}

            <form onSubmit={handleAdd} noValidate>
              {[
                { label: 'Full Name', key: 'full_name', type: 'text', placeholder: 'e.g. Ms. Priya Sharma' },
                { label: 'Email',     key: 'email',     type: 'email', placeholder: 'priya@school.edu' },
                { label: 'Password',  key: 'password',  type: 'password', placeholder: 'Min 8 chars' },
              ].map(f => (
                <div key={f.key} className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontWeight: '700', color: '#475569', marginBottom: '0.4rem', fontSize: '0.88rem' }}>{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={addForm[f.key]}
                    onChange={e => { setAddForm(p => ({ ...p, [f.key]: e.target.value })); setAddError(''); }}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '2px solid #E2E8F0', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} disabled={adding}
                  style={{ flex: 1, background: '#F1F5F9', border: 'none', borderRadius: '14px', padding: '0.9rem', fontWeight: '700', cursor: 'pointer', color: '#64748B' }}>
                  Cancel
                </button>
                <button type="submit" disabled={adding}
                  style={{ flex: 2, background: 'var(--primary)', border: 'none', borderRadius: '8px', padding: '0.625rem', fontWeight: '700', cursor: 'pointer', color: 'white', fontSize: '0.875rem' }}>
                  {adding ? 'Adding…' : 'Add educator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        input:focus { border-color: #6366F1 !important; outline: none; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
