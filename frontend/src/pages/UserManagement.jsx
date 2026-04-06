import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const mockUsers = [
  { id: 1, name: 'Ms. Priya Sharma', email: 'priya@school.edu',  role: 'teacher', students: 8, date: 'Jan 12, 2026', active: true },
  { id: 2, name: 'Mr. Rajiv Iyer',   email: 'rajiv@school.edu',  role: 'parent',  students: 1, date: 'Feb 3, 2026',  active: true },
  { id: 3, name: 'Ms. Anjali Desai', email: 'anjali@school.edu', role: 'teacher', students: 6, date: 'Mar 1, 2026',  active: false },
  { id: 4, name: 'Dr. Suresh Rao',   email: 'suresh@school.edu', role: 'admin',   students: 0, date: 'Jan 1, 2026',  active: true },
];

const roleConfig = {
  admin:   { bg: '#EEF2FF', color: '#6366F1', label: '🛡️ Admin' },
  teacher: { bg: '#ECFDF5', color: '#059669', label: '🍎 Teacher' },
  parent:  { bg: '#FFF7ED', color: '#D97706', label: '👨‍👩‍👧 Parent' },
};

const UserManagement = () => {
  const [users, setUsers] = useState(mockUsers);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const role = localStorage.getItem('role') || 'admin';

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    fetch('/api/users', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data) && data.length > 0) setUsers(data); })
      .catch(() => {});
  }, []);

  const filtered = users.filter(u => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || u.role === filter;
    return matchSearch && matchFilter;
  });

  const toggleActive = (id) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u));
  };

  return (
    <div className="dashboard-layout">
      <Sidebar role={role} />
      <div className="dashboard-main">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2.25rem', color: '#1E293B', margin: '0 0 0.25rem 0' }}>User Management</h1>
            <p style={{ color: '#64748B', margin: 0 }}>{filtered.length} users matching your filter</p>
          </div>
          <button className="btn btn-primary">+ Invite Educator</button>
        </header>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input type="text" placeholder="🔍  Search by name or email..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: '1', minWidth: '200px', padding: '0.85rem 1.25rem', borderRadius: '12px', border: '2px solid #E2E8F0', fontFamily: 'var(--font-body)', fontWeight: '600', fontSize: '1rem' }} />
          {['all', 'teacher', 'parent', 'admin'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '0.75rem 1.25rem', borderRadius: '10px', border: `2px solid ${filter === f ? '#6366F1' : '#E2E8F0'}`, background: filter === f ? '#EEF2FF' : 'white', color: filter === f ? '#6366F1' : '#64748B', fontWeight: '700', fontFamily: 'var(--font-body)', cursor: 'pointer', fontSize: '0.9rem', textTransform: 'capitalize' }}>
              {f === 'all' ? '👥 All' : roleConfig[f]?.label || f}
            </button>
          ))}
        </div>

        <div style={{ background: 'white', borderRadius: '20px', border: '2px solid #E2E8F0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                {['User', 'Role', 'Students', 'Joined', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '1rem 1.5rem', textAlign: 'left', color: '#94A3B8', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => {
                const rc = roleConfig[u.role] || roleConfig.teacher;
                return (
                  <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F1F5F9' : 'none', transition: 'background 0.15s', opacity: u.active ? 1 : 0.6 }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FAFBFF'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: rc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0, border: `2px solid ${rc.color}33` }}>
                          {u.name?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', color: '#1E293B', fontSize: '0.95rem' }}>{u.name}</div>
                          <div style={{ color: '#94A3B8', fontSize: '0.82rem' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <span style={{ background: rc.bg, color: rc.color, padding: '0.3rem 0.75rem', borderRadius: '99px', fontWeight: '700', fontSize: '0.82rem' }}>{rc.label}</span>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', color: '#64748B', fontWeight: '700' }}>{u.students}</td>
                    <td style={{ padding: '1.25rem 1.5rem', color: '#94A3B8', fontSize: '0.88rem' }}>{u.date}</td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <span style={{ background: u.active ? '#ECFDF5' : '#F1F5F9', color: u.active ? '#059669' : '#94A3B8', padding: '0.3rem 0.75rem', borderRadius: '99px', fontWeight: '700', fontSize: '0.82rem' }}>
                        {u.active ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <button onClick={() => toggleActive(u.id)}
                        style={{ background: u.active ? '#FFF1F2' : '#ECFDF5', color: u.active ? '#E11D48' : '#059669', border: 'none', borderRadius: '8px', padding: '0.4rem 0.85rem', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                        {u.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#94A3B8' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
              <p style={{ fontWeight: '700', margin: 0 }}>No users match your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
