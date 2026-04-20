import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { SearchIcon, PlusIcon, Trash2Icon, AlertTriangleIcon, CheckCircleIcon, GraduationCapIcon } from '../components/icons';

/* ─── constants ────────────────────────────────────────────────────── */
const LD_COLORS = {
  Dyslexia:    { bg: '#FFF1F2', color: '#E11D48' },
  Dysgraphia:  { bg: '#F5F3FF', color: '#7C3AED' },
  Dyscalculia: { bg: '#FFFBEB', color: '#D97706' },
  APD:         { bg: '#EFF6FF', color: '#1D4ED8' },
  NVLD:        { bg: '#ECFDF5', color: '#059669' },
};

const GRADES = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8'];

/* ─── auth helper ──────────────────────────────────────────────────── */
const authFetch = (url, opts = {}) => {
  const token = sessionStorage.getItem('access_token');
  return fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });
};

/* ─── skeleton row ─────────────────────────────────────────────────── */
const SkeletonRow = () => (
  <tr>
    {[200, 80, 140, 140, 100, 80].map((w, i) => (
      <td key={i} style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ height: '14px', width: `${w}px`, background: '#F1F5F9', borderRadius: '6px', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </td>
    ))}
  </tr>
);

/* ─── inline field error ───────────────────────────────────────────── */
const FieldError = ({ msg }) =>
  msg ? <p style={{ color: '#B91C1C', fontSize: '0.8rem', fontWeight: '600', margin: '0.25rem 0 0', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><AlertTriangleIcon size={12} />{msg}</p> : null;

/* ─── toast ────────────────────────────────────────────────────────── */
const Toast = ({ message, type }) => {
  if (!message) return null;
  const isErr = type === 'error';
  return (
    <div style={{ position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 1000, background: isErr ? '#FEE2E2' : '#1E293B', color: isErr ? '#B91C1C' : 'white', border: isErr ? '1.5px solid #FECACA' : 'none', padding: '0.75rem 1.25rem', borderRadius: '8px', fontWeight: '600', fontSize: '0.875rem', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', animation: 'slideIn 0.3s ease', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {isErr ? <AlertTriangleIcon size={14} /> : <CheckCircleIcon size={14} style={{ color: '#4ADE80' }} />}{message}
    </div>
  );
};

/* ─── main component ───────────────────────────────────────────────── */
const StudentManagement = () => {
  const navigate = useNavigate();
  const role = sessionStorage.getItem('role') || 'teacher';

  const [students,    setStudents]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [filter,      setFilter]      = useState('all');
  const [toast,       setToast]       = useState({ msg: '', type: 'success' });

  // Add student modal
  const [showAdd,     setShowAdd]     = useState(false);
  const [addForm,     setAddForm]     = useState({ full_name: '', grade: 'Grade 1', date_of_birth: '' });
  const [addErrors,   setAddErrors]   = useState({});
  const [adding,      setAdding]      = useState(false);

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState(null); // student object
  const [deleting,      setDeleting]      = useState(false);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 4000);
  }, []);

  /* ── fetch students ───────────────────────────────────────────────── */
  const fetchStudents = useCallback(() => {
    setLoading(true);
    authFetch('/api/students/rich')
      .then(r => {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then(data => setStudents(Array.isArray(data) ? data : []))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    if (!token) { navigate('/login'); return; }
    fetchStudents();
  }, [fetchStudents, navigate]);

  /* ── filter logic ─────────────────────────────────────────────────── */
  const filtered = students.filter(s => {
    const name = s.full_name?.toLowerCase() || '';
    const matchSearch = name.includes(search.toLowerCase())
      || (s.grade?.toLowerCase() || '').includes(search.toLowerCase());
    const isFlagged = (s.ld_flags?.length || 0) > 0;
    const matchFilter =
      filter === 'all'     ? true :
      filter === 'flagged' ? isFlagged :
      filter === 'typical' ? !isFlagged : true;
    return matchSearch && matchFilter;
  });

  /* ── add student ──────────────────────────────────────────────────── */
  const validateAdd = () => {
    const errs = {};
    if (!addForm.full_name.trim())       errs.full_name = 'Student name is required.';
    else if (addForm.full_name.trim().length < 2) errs.full_name = 'Name must be at least 2 characters.';
    if (!addForm.grade)                  errs.grade = 'Please select a grade.';
    if (addForm.date_of_birth) {
      const dob = new Date(addForm.date_of_birth);
      const now = new Date();
      if (dob >= now) errs.date_of_birth = 'Date of birth must be in the past.';
    }
    return errs;
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const errs = validateAdd();
    if (Object.keys(errs).length) { setAddErrors(errs); return; }
    setAddErrors({});
    setAdding(true);

    try {
      const res = await authFetch('/api/students', {
        method: 'POST',
        body: JSON.stringify({
          full_name:     addForm.full_name.trim(),
          grade:         addForm.grade,
          date_of_birth: addForm.date_of_birth || null,
          user_id:       null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        showToast(err.detail || 'Failed to add student.', 'error');
        return;
      }
      setAddForm({ full_name: '', grade: 'Grade 1', date_of_birth: '' });
      setShowAdd(false);
      showToast('Student added successfully!');
      fetchStudents(); // refresh from DB
    } catch {
      showToast('Network error — could not add student.', 'error');
    } finally {
      setAdding(false);
    }
  };

  /* ── delete student ───────────────────────────────────────────────── */
  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const res = await authFetch(`/api/students/${confirmDelete.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        showToast(err.detail || 'Failed to delete student.', 'error');
        return;
      }
      setStudents(prev => prev.filter(s => s.id !== confirmDelete.id));
      showToast(`${confirmDelete.full_name} removed from roster.`);
    } catch {
      showToast('Network error — could not delete student.', 'error');
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  /* ─── counts for filter badges ──────────────────────────────────── */
  const flaggedCount = students.filter(s => (s.ld_flags?.length || 0) > 0).length;

  return (
    <div className="dashboard-layout">
      <Sidebar role={role} />
      <div className="dashboard-main">

        <Toast message={toast.msg} type={toast.type} />

        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', color: 'var(--text)', margin: '0 0 0.125rem', fontWeight: '800', letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <GraduationCapIcon size={20} style={{ color: 'var(--primary)' }} />Student roster
            </h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.875rem' }}>
              {loading ? 'Loading…' : `${students.length} student${students.length !== 1 ? 's' : ''} · ${filtered.length} shown`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)} style={{ gap: '0.375rem' }}><PlusIcon size={13} />Add student</button>
          </div>
        </header>

        {/* Summary chips */}
        {!loading && students.length > 0 && (
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ background: '#EEF2FF', borderRadius: '12px', padding: '0.6rem 1.1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontWeight: '800', color: '#6366F1', fontSize: '1.25rem' }}>{students.length}</span>
              <span style={{ color: '#6366F1', fontWeight: '700', fontSize: '0.88rem' }}>Total</span>
            </div>
            <div style={{ background: '#FFF1F2', borderRadius: '12px', padding: '0.6rem 1.1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontWeight: '800', color: '#E11D48', fontSize: '1.25rem' }}>{flaggedCount}</span>
              <span style={{ color: '#E11D48', fontWeight: '700', fontSize: '0.88rem' }}>Flagged</span>
            </div>
            <div style={{ background: '#ECFDF5', borderRadius: '12px', padding: '0.6rem 1.1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontWeight: '800', color: '#059669', fontSize: '1.25rem' }}>{students.length - flaggedCount}</span>
              <span style={{ color: '#059669', fontWeight: '700', fontSize: '0.88rem' }}>Typical</span>
            </div>
          </div>
        )}

        {/* Search + Filter */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <SearchIcon size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-placeholder)', pointerEvents: 'none' }} />
            <input type="text" placeholder="Search by name or grade…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '2.25rem', width: '100%' }} />
          </div>
          {[
            { id: 'all',     label: 'All' },
            { id: 'flagged', label: `Flagged${flaggedCount > 0 ? ` (${flaggedCount})` : ''}` },
            { id: 'typical', label: 'Typical' },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              style={{ padding: '0.5rem 0.875rem', borderRadius: '7px', border: `1.5px solid ${filter === f.id ? 'var(--primary)' : 'var(--border)'}`, background: filter === f.id ? 'var(--primary-light)' : 'white', color: filter === f.id ? 'var(--primary)' : 'var(--text-muted)', fontWeight: '600', fontFamily: 'Inter, sans-serif', cursor: 'pointer', fontSize: '0.8125rem', transition: 'all 0.15s' }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: 'white', borderRadius: '20px', border: '2px solid #E2E8F0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                {['Student', 'Grade', 'Assigned Teacher', 'LD Flags', 'Last Screened', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '1rem 1.5rem', textAlign: 'left', color: '#94A3B8', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? [1, 2, 3, 4].map(i => <SkeletonRow key={i} />)
                : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <GraduationCapIcon size={28} style={{ color: 'var(--text-placeholder)', margin: '0 auto 0.75rem', display: 'block' }} />
                        <p style={{ fontWeight: '600', margin: '0 0 0.5rem', fontSize: '0.9rem' }}>
                          {students.length === 0 ? 'No students yet.' : 'No students match your search.'}
                        </p>
                        {students.length === 0 && (
                          <button className="btn btn-primary" style={{ marginTop: '0.625rem', gap: '0.375rem' }} onClick={() => setShowAdd(true)}>
                            <PlusIcon size={13} />Add your first student
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                  : filtered.map((s, i) => {
                      const isFlagged = (s.ld_flags?.length || 0) > 0;
                      return (
                        <tr key={s.id}
                          style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F1F5F9' : 'none', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#FAFBFF'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          {/* Name */}
                          <td style={{ padding: '1.25rem 1.5rem', fontWeight: '700', color: '#1E293B' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isFlagged ? 'linear-gradient(135deg, #F43F5E, #E11D48)' : 'linear-gradient(135deg, #6366F1, #A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '0.85rem', flexShrink: 0 }}>
                                {s.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </div>
                              <div>
                                <div>{s.full_name}</div>
                                <div style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: '600' }}>ID #{s.id}</div>
                              </div>
                            </div>
                          </td>

                          {/* Grade */}
                          <td style={{ padding: '1.25rem 1.5rem', color: '#64748B' }}>{s.grade}</td>

                          {/* Teacher */}
                          <td style={{ padding: '1.25rem 1.5rem', color: '#64748B', fontSize: '0.92rem' }}>{s.teacher_name}</td>

                          {/* LD Flags */}
                          <td style={{ padding: '1.25rem 1.5rem' }}>
                            {!isFlagged
                              ? <span style={{ background: '#ECFDF5', color: '#059669', padding: '0.28rem 0.75rem', borderRadius: '99px', fontWeight: '700', fontSize: '0.78rem' }}>No flags</span>
                              : (
                                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                  {s.ld_flags.map(f => (
                                    <span key={f} style={{ background: LD_COLORS[f]?.bg || '#F1F5F9', color: LD_COLORS[f]?.color || '#64748B', padding: '0.22rem 0.6rem', borderRadius: '99px', fontWeight: '700', fontSize: '0.75rem' }}>{f}</span>
                                  ))}
                                </div>
                              )
                            }
                          </td>

                          {/* Last Screened */}
                          <td style={{ padding: '1.25rem 1.5rem', color: s.last_screening ? '#64748B' : '#CBD5E1', fontSize: '0.88rem' }}>
                            {s.last_screening || 'Never'}
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '1.25rem 1.5rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                              <Link to={`/results/${s.id}`}
                                style={{ color: '#6366F1', fontWeight: '700', fontSize: '0.85rem', borderBottom: '2px solid #A5B4FC', whiteSpace: 'nowrap' }}>
                                Report
                              </Link>
                              <span style={{ color: '#E2E8F0' }}>|</span>
                              <Link to="/screening/adaptive"
                                style={{ color: '#10B981', fontWeight: '700', fontSize: '0.85rem', borderBottom: '2px solid #6EE7B7', whiteSpace: 'nowrap' }}>
                                Screen
                              </Link>
                              <span style={{ color: '#E2E8F0' }}>|</span>
                              <Link to={`/students/${s.id}/intervention`}
                                style={{ color: '#8B5CF6', fontWeight: '700', fontSize: '0.85rem', borderBottom: '2px solid #C4B5FD', whiteSpace: 'nowrap' }}>
                                Intervene
                              </Link>
                              <span style={{ color: '#E2E8F0' }}>|</span>
                              <Link to={`/students/${s.id}/progress`}
                                style={{ color: '#F59E0B', fontWeight: '700', fontSize: '0.85rem', borderBottom: '2px solid #FCD34D', whiteSpace: 'nowrap' }}>
                                Progress
                              </Link>
                              <span style={{ color: '#E2E8F0' }}>|</span>
                              <button onClick={() => setConfirmDelete(s)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-placeholder)', cursor: 'pointer', padding: '0.25rem', lineHeight: 1, display: 'flex', borderRadius: '4px', transition: 'color 0.15s' }}
                                title="Remove student"
                                onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-placeholder)'}>
                                <Trash2Icon size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
              }
            </tbody>
          </table>
        </div>

        {/* ── Add Student Modal ──────────────────────────────────────── */}
        {showAdd && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}
            onClick={e => e.target === e.currentTarget && !adding && setShowAdd(false)}>
            <div style={{ background: 'white', borderRadius: '24px', padding: '2.5rem', width: '100%', maxWidth: '480px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
              <h2 style={{ fontSize: '1.75rem', color: '#1E293B', margin: '0 0 0.4rem 0' }}>Add New Student</h2>
              <p style={{ color: '#64748B', margin: '0 0 1.75rem 0', fontSize: '0.95rem' }}>Student will be assigned to your account.</p>

              <form onSubmit={handleAdd} noValidate>
                <div className="form-group">
                  <label>Full Name <span style={{ color: '#E11D48' }}>*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Arjun Singh"
                    value={addForm.full_name}
                    onChange={e => { setAddForm({ ...addForm, full_name: e.target.value }); if (addErrors.full_name) setAddErrors(p => ({ ...p, full_name: '' })); }}
                    style={addErrors.full_name ? { borderColor: '#E11D48' } : {}}
                    autoFocus
                  />
                  <FieldError msg={addErrors.full_name} />
                </div>

                <div className="form-group">
                  <label>Grade Level <span style={{ color: '#E11D48' }}>*</span></label>
                  <select value={addForm.grade} onChange={e => setAddForm({ ...addForm, grade: e.target.value })}>
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <FieldError msg={addErrors.grade} />
                </div>

                <div className="form-group">
                  <label>Date of Birth <span style={{ color: '#94A3B8', fontWeight: '600', fontSize: '0.82rem' }}>(optional)</span></label>
                  <input
                    type="date"
                    value={addForm.date_of_birth}
                    onChange={e => { setAddForm({ ...addForm, date_of_birth: e.target.value }); if (addErrors.date_of_birth) setAddErrors(p => ({ ...p, date_of_birth: '' })); }}
                    max={new Date().toISOString().split('T')[0]}
                    style={addErrors.date_of_birth ? { borderColor: '#E11D48' } : {}}
                  />
                  <FieldError msg={addErrors.date_of_birth} />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
                  <button type="button" onClick={() => { setShowAdd(false); setAddErrors({}); }} className="btn"
                    style={{ flex: 1, background: '#F1F5F9', color: '#64748B', border: 'none' }} disabled={adding}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 2, gap: '0.375rem' }} disabled={adding}>
                    {adding ? 'Adding…' : <><PlusIcon size={13} />Add student</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Delete Confirmation Modal ──────────────────────────────── */}
        {confirmDelete && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}
            onClick={e => e.target === e.currentTarget && !deleting && setConfirmDelete(null)}>
            <div style={{ background: 'white', borderRadius: '24px', padding: '2.5rem', width: '100%', maxWidth: '420px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', textAlign: 'center' }}>
              <div style={{ background: '#FEE2E2', borderRadius: '8px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                <AlertTriangleIcon size={20} style={{ color: '#EF4444' }} />
              </div>
              <h2 style={{ fontSize: '1.1rem', color: 'var(--text)', margin: '0 0 0.5rem', fontWeight: '700' }}>Remove student?</h2>
              <p style={{ color: '#64748B', margin: '0 0 2rem 0', lineHeight: '1.6' }}>
                This will permanently remove <strong>{confirmDelete.full_name}</strong> from the roster. Their screening history will also be deleted.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => setConfirmDelete(null)} className="btn" style={{ flex: 1, background: '#F1F5F9', color: '#64748B', border: 'none' }} disabled={deleting}>
                  Cancel
                </button>
                <button onClick={handleDelete} className="btn" style={{ flex: 1, background: '#EF4444', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }} disabled={deleting}>
                  {deleting ? 'Removing…' : <><Trash2Icon size={13} />Remove</>}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
      <style>{`
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes slideIn { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default StudentManagement;
