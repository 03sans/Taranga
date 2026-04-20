import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { UsersIcon, ShieldIcon, CheckCircleIcon, AlertTriangleIcon, Trash2Icon, PlusIcon, SearchIcon } from '../components/icons';

const authFetch = (url, opts = {}) => {
  const token = sessionStorage.getItem('access_token');
  return fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers },
  });
};

const roleConfig = {
  admin:   { bg: '#EEF2FF', color: '#7C3AED', label: 'Admin' },
  teacher: { bg: '#ECFDF5', color: '#059669', label: 'Teacher' },
  parent:  { bg: '#FFF7ED', color: '#D97706', label: 'Parent' },
  student: { bg: '#F5F3FF', color: '#8B5CF6', label: 'Student' },
};

const Skeleton = ({ h = 48 }) => (
  <div style={{ background: '#E2E8F0', borderRadius: '12px', height: h, marginBottom: '0.75rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
);

const UserManagement = () => {
  const navigate = useNavigate();
  const role = sessionStorage.getItem('role') || 'admin';

  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('all');
  const [confirm, setConfirm]     = useState(null);
  const [busy, setBusy]           = useState(false);
  const [toast, setToast]         = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm]     = useState({ full_name: '', email: '', password: '', role: 'teacher' });
  const [addError, setAddError]   = useState('');
  const [adding, setAdding]       = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadUsers = useCallback(async () => {
    const token = sessionStorage.getItem('access_token');
    if (!token) { navigate('/login'); return; }
    setLoading(true);
    const data = await authFetch('/api/users').then(r => r.json()).catch(() => []);
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [navigate]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  /* ── actions ── */
  const doAction = async () => {
    if (!confirm) return;
    setBusy(true);
    const { type, user } = confirm;
    try {
      const url = type === 'delete' ? `/api/users/${user.id}` :
                  type === 'deactivate' ? `/api/users/${user.id}/deactivate` :
                  `/api/users/${user.id}/activate`;
      const method = type === 'delete' ? 'DELETE' : 'POST';
      await authFetch(url, { method });
      showToast(type === 'delete' ? `${user.full_name} removed.` :
                type === 'deactivate' ? `${user.full_name} deactivated.` :
                `${user.full_name} re-activated.`);
      setConfirm(null);
      loadUsers();
    } finally { setBusy(false); }
  };

  /* ── add user ── */
  const handleAdd = async (e) => {
    e.preventDefault();
    setAddError('');
    if (!addForm.full_name.trim()) return setAddError('Name required.');
    if (!addForm.email.trim())     return setAddError('Email required.');
    if (addForm.password.length < 8) return setAddError('Password must be at least 8 characters.');
    setAdding(true);
    try {
      const res = await authFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ ...addForm, full_name: addForm.full_name.trim(), email: addForm.email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.detail || 'Registration failed.'); return; }
      showToast(`${addForm.full_name} added!`);
      setShowAddModal(false);
      setAddForm({ full_name: '', email: '', password: '', role: 'teacher' });
      loadUsers();
    } finally { setAdding(false); }
  };

  const filtered = users.filter(u => {
    const name  = (u.full_name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const q     = search.toLowerCase();
    const matchSearch = name.includes(q) || email.includes(q);
    const matchFilter = filter === 'all' || u.role === filter;
    return matchSearch && matchFilter;
  });

  /* ── count badges ── */
  const counts = users.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {});

  return (
    <div className="dashboard-layout">
      <Sidebar role={role} />
      <div className="dashboard-main">

        {/* Toast */}
        {toast && (
          <div style={{ position: 'fixed', top: '1.25rem', right: '1.25rem', background: '#1E293B', color: 'white', borderRadius: '8px', padding: '0.75rem 1.25rem', fontWeight: '600', fontSize: '0.875rem', zIndex: 999, boxShadow: '0 8px 32px rgba(0,0,0,0.25)', animation: 'fadeIn 0.3s ease', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircleIcon size={14} style={{ color: '#4ADE80' }} />{toast}
          </div>
        )}

        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', color: 'var(--text)', margin: '0 0 0.125rem', fontWeight: '800', letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <UsersIcon size={20} style={{ color: 'var(--primary)' }} />User management
            </h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>{filtered.length} of {users.length} users shown</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ gap: '0.375rem' }}><PlusIcon size={13} />Add user</button>
        </header>

        {/* Role summary chips */}
        {!loading && (
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {Object.entries(counts).map(([r, n]) => {
              const rc = roleConfig[r] || roleConfig.teacher;
              return (
                <div key={r} style={{ background: rc.bg, borderRadius: '12px', padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: '900', fontSize: '1.3rem', color: rc.color }}>{n}</span>
                  <span style={{ fontWeight: '700', fontSize: '0.82rem', color: rc.color }}>{rc.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <SearchIcon size={13} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-placeholder)', pointerEvents: 'none' }} />
            <input type="text" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '2rem' }} />
          </div>
          {['all', 'teacher', 'student', 'parent', 'admin'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '0.5rem 0.875rem', borderRadius: '7px', border: `1.5px solid ${filter === f ? 'var(--primary)' : 'var(--border)'}`, background: filter === f ? 'var(--primary-light)' : 'white', color: filter === f ? 'var(--primary)' : 'var(--text-muted)', fontWeight: '600', cursor: 'pointer', fontSize: '0.8125rem', textTransform: 'capitalize', fontFamily: 'Inter, sans-serif' }}>
              {f === 'all' ? 'All' : roleConfig[f]?.label || f}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: 'white', borderRadius: '20px', border: '2px solid #E2E8F0', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '1.5rem' }}><Skeleton /><Skeleton /><Skeleton /><Skeleton /></div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <UsersIcon size={28} style={{ color: 'var(--text-placeholder)', margin: '0 auto 0.75rem', display: 'block' }} />
              <p style={{ fontWeight: '600', margin: 0, fontSize: '0.9rem' }}>No users match your search.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    {['User', 'Role', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '1rem 1.5rem', textAlign: 'left', color: '#94A3B8', fontWeight: '700', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => {
                    const rc = roleConfig[u.role] || roleConfig.teacher;
                    const isSelf = u.email === sessionStorage.getItem('email');
                    return (
                      <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F1F5F9' : 'none', transition: 'background 0.15s', opacity: u.is_active ? 1 : 0.6 }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FAFBFF'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}>
                        <td style={{ padding: '1.25rem 1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: rc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0, border: `2px solid ${rc.color}33` }}>
                              {u.full_name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <div style={{ fontWeight: '700', color: '#1E293B', fontSize: '0.95rem' }}>
                                {u.full_name} {isSelf && <span style={{ fontSize: '0.72rem', background: '#EEF2FF', color: '#6366F1', padding: '0.1rem 0.4rem', borderRadius: '6px', fontWeight: '800', marginLeft: '0.4rem' }}>You</span>}
                              </div>
                              <div style={{ color: '#94A3B8', fontSize: '0.82rem' }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1.1rem 1.5rem' }}>
                          <span style={{ background: rc.bg, color: rc.color, padding: '0.3rem 0.75rem', borderRadius: '99px', fontWeight: '700', fontSize: '0.8rem' }}>{rc.label}</span>
                        </td>
                        <td style={{ padding: '1.1rem 1.5rem' }}>
                          <span style={{ background: u.is_active ? '#ECFDF5' : '#F1F5F9', color: u.is_active ? '#059669' : '#94A3B8', padding: '0.3rem 0.75rem', borderRadius: '99px', fontWeight: '700', fontSize: '0.8rem' }}>
                            {u.is_active ? '● Active' : '○ Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '1.1rem 1.5rem' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {u.role !== 'student' && (
                              u.is_active ? (
                                <button onClick={() => setConfirm({ type: 'deactivate', user: u })}
                                  style={{ background: '#FFFBEB', color: '#D97706', border: '2px solid #FDE68A', borderRadius: '8px', padding: '0.35rem 0.75rem', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer' }}>
                                  Deactivate
                                </button>
                              ) : (
                                <button onClick={() => setConfirm({ type: 'activate', user: u })}
                                  style={{ background: '#ECFDF5', color: '#059669', border: '2px solid #A7F3D0', borderRadius: '8px', padding: '0.35rem 0.75rem', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer' }}>
                                  Activate
                                </button>
                              )
                            )}
                            {u.role !== 'admin' && (
                              <button onClick={() => setConfirm({ type: 'delete', user: u })}
                                style={{ background: '#FFF1F2', color: '#E11D48', border: '2px solid #FECDD3', borderRadius: '8px', padding: '0.35rem 0.75rem', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer' }}>
                                Remove
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Confirm dialog */}
      {confirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '1rem' }}
          onClick={e => e.target === e.currentTarget && !busy && setConfirm(null)}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', maxWidth: '400px', width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}>
            <h3 style={{ color: 'var(--text)', margin: '0 0 0.375rem', fontSize: '1rem', fontWeight: '700' }}>
              {confirm.type === 'delete' ? 'Remove user' : confirm.type === 'deactivate' ? 'Deactivate user' : 'Activate user'}
            </h3>
            <p style={{ textAlign: 'center', color: '#64748B', fontSize: '0.9rem', margin: '0 0 1.75rem' }}>
              {confirm.type === 'delete'
                ? <><strong>{confirm.user.full_name}</strong> will be permanently removed.</>
                : confirm.type === 'deactivate'
                ? <><strong>{confirm.user.full_name}</strong> will no longer be able to log in.</>
                : <>Re-enable access for <strong>{confirm.user.full_name}</strong>.</>}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setConfirm(null)} disabled={busy}
                style={{ flex: 1, background: '#F1F5F9', border: 'none', borderRadius: '12px', padding: '0.85rem', fontWeight: '700', cursor: 'pointer', color: '#64748B' }}>Cancel</button>
              <button onClick={doAction} disabled={busy}
                style={{ flex: 1, background: confirm.type === 'activate' ? '#10B981' : confirm.type === 'deactivate' ? '#F59E0B' : '#E11D48', border: 'none', borderRadius: '12px', padding: '0.85rem', fontWeight: '800', cursor: 'pointer', color: 'white' }}>
            {busy ? 'Working…' : confirm.type === 'activate' ? 'Activate' : confirm.type === 'deactivate' ? 'Deactivate' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add user modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '1rem' }}
          onClick={e => e.target === e.currentTarget && !adding && setShowAddModal(false)}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '2.5rem', maxWidth: '460px', width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontSize: '1.6rem', color: '#1E293B', margin: '0 0 0.4rem' }}>Add User</h2>
            <p style={{ color: '#64748B', margin: '0 0 1.75rem', fontSize: '0.9rem' }}>Create a new account for an educator or parent.</p>

            {addError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#FEE2E2', border: '1.5px solid #FECACA', color: '#B91C1C', borderRadius: '8px', padding: '0.625rem 0.875rem', marginBottom: '1rem', fontWeight: '600', fontSize: '0.8125rem' }}>
                <AlertTriangleIcon size={13} />{addError}
              </div>
            )}
            <form onSubmit={handleAdd} noValidate>
              {[
                { label: 'Full Name', key: 'full_name', type: 'text', placeholder: 'e.g. Ms. Priya Sharma' },
                { label: 'Email',     key: 'email',     type: 'email', placeholder: 'priya@school.edu' },
                { label: 'Password',  key: 'password',  type: 'password', placeholder: 'Min 8 chars, 1 uppercase, 1 number' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: '1.1rem' }}>
                  <label style={{ display: 'block', fontWeight: '700', color: '#475569', marginBottom: '0.4rem', fontSize: '0.85rem' }}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={addForm[f.key]}
                    onChange={e => { setAddForm(p => ({ ...p, [f.key]: e.target.value })); setAddError(''); }}
                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '2px solid #E2E8F0', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: '700', color: '#475569', marginBottom: '0.4rem', fontSize: '0.85rem' }}>Role</label>
                <select value={addForm.role} onChange={e => setAddForm(p => ({ ...p, role: e.target.value }))}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '2px solid #E2E8F0', fontSize: '0.9rem', outline: 'none', background: 'white' }}>
                  <option value="teacher">Teacher</option>
                  <option value="parent">Parent</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} disabled={adding}
                  style={{ flex: 1, background: '#F1F5F9', border: 'none', borderRadius: '14px', padding: '0.9rem', fontWeight: '700', cursor: 'pointer', color: '#64748B' }}>
                  Cancel
                </button>
                <button type="submit" disabled={adding}
                  style={{ flex: 2, background: 'var(--primary)', border: 'none', borderRadius: '8px', padding: '0.625rem', fontWeight: '700', cursor: 'pointer', color: 'white', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', fontFamily: 'Inter, sans-serif' }}>
                  {adding ? 'Adding…' : <><PlusIcon size={13} />Add user</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        input:focus, select:focus { border-color: #6366F1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
      `}</style>
    </div>
  );
};

export default UserManagement;
