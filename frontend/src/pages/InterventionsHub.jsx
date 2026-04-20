import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { TargetIcon, UsersIcon, CheckCircleIcon, ClockIcon, ActivityIcon, BarChartIcon, EditIcon, CopyIcon, ChevronUpIcon, ChevronDownIcon, PlusIcon } from '../components/icons';

const authFetch = (url, opts = {}) => {
  const token = sessionStorage.getItem('access_token');
  return fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers },
  });
};

const LD_META = {
  dyslexia:    { label: 'Dyslexia',    color: '#6366F1', bg: '#EEF2FF',  },
  dyscalculia: { label: 'Dyscalculia', color: '#F59E0B', bg: '#FFFBEB',  },
  dysgraphia:  { label: 'Dysgraphia',  color: '#10B981', bg: '#ECFDF5',  },
  nvld:        { label: 'NVLD',        color: '#8B5CF6', bg: '#F5F3FF',  },
  apd:         { label: 'APD',         color: '#EF4444', bg: '#FEF2F2',  },
};

const Pill = ({ color, bg, children }) => (
  <span style={{ background: bg, color, padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '800', whiteSpace: 'nowrap' }}>
    {children}
  </span>
);

const Skeleton = ({ h = 60 }) => (
  <div style={{ background: '#E2E8F0', borderRadius: '14px', height: h, marginBottom: '1rem', animation: 'pulse 1.5s ease-in-out infinite' }} />
);

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
const InterventionsHub = () => {
  const navigate = useNavigate();
  const role = sessionStorage.getItem('role') || 'teacher';

  const [students, setStudents]       = useState([]);
  const [accounts, setAccounts]       = useState({});   // studentId → account info
  const [assignments, setAssignments] = useState({});   // studentId → [keys]
  const [progress, setProgress]       = useState({});   // studentId → summary
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [expandedId, setExpandedId]   = useState(null);
  const [copyMsg, setCopyMsg]         = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    if (!token) { navigate('/login'); return; }

    // 1. Fetch all students
    authFetch('/api/students')
      .then(r => r.json())
      .then(async (list) => {
        if (!Array.isArray(list)) { setStudents([]); setLoading(false); return; }
        setStudents(list);

        // 2. For each student, fetch account + assignments + progress in parallel
        const perStudent = await Promise.all(
          list.map(async (s) => {
            const [acct, prog] = await Promise.all([
              authFetch(`/api/students/${s.id}/account`).then(r => r.json()).catch(() => ({ has_account: false })),
              authFetch(`/api/students/${s.id}/progress`).then(r => r.json()).catch(() => null),
            ]);
            return { id: s.id, acct, prog };
          })
        );

        const acctMap = {}, progMap = {};
        perStudent.forEach(({ id, acct, prog }) => {
          acctMap[id] = acct;
          progMap[id] = prog;
        });
        setAccounts(acctMap);
        setProgress(progMap);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [navigate]);

  const copyCredentials = (username, password) => {
    navigator.clipboard.writeText(`Username: ${username}\nPassword: ${password}`);
    setCopyMsg('Copied!');
    setTimeout(() => setCopyMsg(''), 2000);
  };

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    accounts[s.id]?.username?.toLowerCase().includes(search.toLowerCase())
  );

  // Split into active (has account) vs not started
  const active   = filtered.filter(s => accounts[s.id]?.has_account);
  const noAcct   = filtered.filter(s => !accounts[s.id]?.has_account);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
      <Sidebar role={role} />
      <div style={{ flex: 1, padding: '2.5rem', overflowY: 'auto' }}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', color: 'var(--text)', margin: '0 0 0.125rem', fontWeight: '800', letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <TargetIcon size={20} style={{ color: 'var(--primary)' }} />Interventions
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>Manage student credentials, assigned activities, and progress at a glance.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {copyMsg && (
              <span style={{ background: '#ECFDF5', color: '#065F46', padding: '0.3rem 0.75rem', borderRadius: '7px', fontWeight: '600', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <CheckCircleIcon size={12} />{copyMsg}
              </span>
            )}
            <Link to="/students" style={{ background: 'white', border: '1.5px solid var(--border)', borderRadius: '8px', padding: '0.45rem 0.875rem', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.8125rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <UsersIcon size={13} />Student list
            </Link>
          </div>
        </div>

        {/* ── Stats strip ────────────────────────────────────────────── */}
        {!loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: 'Total Students', value: students.length, color: '#7C3AED', icon: UsersIcon },
              { label: 'With Accounts',  value: active.length,   color: '#10B981', icon: CheckCircleIcon },
              { label: 'Not Started',    value: noAcct.length,   color: '#F59E0B', icon: ClockIcon },
              { label: 'Total Activities',
                value: Object.values(progress).reduce((sum, p) => sum + (p?.total_attempts ?? 0), 0),
                color: '#8B5CF6', icon: ActivityIcon },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'white', borderRadius: '10px', padding: '1rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ background: `${stat.color}18`, borderRadius: '7px', padding: '0.375rem', display: 'flex', width: 'fit-content' }}>
                  <stat.icon size={14} style={{ color: stat.color }} />
                </div>
                <div style={{ fontSize: '1.625rem', fontWeight: '800', color: stat.color, letterSpacing: '-0.04em' }}>{stat.value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Search ────────────────────────────────────────────────── */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', maxWidth: '360px' }}>
            <input type="text" placeholder="Search by name or username…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '2rem' }} />
          </div>
        </div>

        {loading && <><Skeleton h={100} /><Skeleton h={100} /><Skeleton h={100} /></>}

        {/* ── Active Interventions ──────────────────────────────────── */}
        {!loading && active.length > 0 && (
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '0.9375rem', color: 'var(--text)', margin: '0 0 1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircleIcon size={15} style={{ color: '#10B981' }} />Active interventions
              <span style={{ background: '#ECFDF5', color: '#10B981', padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.72rem' }}>{active.length}</span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {active.map(s => {
                const acct = accounts[s.id] || {};
                const prog = progress[s.id];
                const isOpen = expandedId === s.id;
                const assignedKeys = acct.assigned_activities || [];
                const ldGroups = assignedKeys.reduce((acc, key) => {
                  const ld = key.split('_')[0] === 'apd' ? 'apd'
                    : key.startsWith('dys') ? 'dyslexia'
                    : key.startsWith('dc_') ? 'dyscalculia'
                    : key.startsWith('dg_') ? 'dysgraphia'
                    : key.startsWith('nv_') ? 'nvld' : 'other';
                  (acc[ld] ??= []).push(key);
                  return acc;
                }, {});

                return (
                  <div key={s.id} style={{ background: 'white', borderRadius: '20px', border: '2px solid #E2E8F0', overflow: 'hidden', transition: 'box-shadow 0.2s', boxShadow: isOpen ? '0 8px 32px rgba(99,102,241,0.12)' : '0 2px 8px rgba(0,0,0,0.04)' }}>
                    {/* Row header */}
                    <div
                      onClick={() => setExpandedId(isOpen ? null : s.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem', cursor: 'pointer', flexWrap: 'wrap' }}
                    >
                      {/* Avatar */}
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '900', fontSize: '1.1rem', flexShrink: 0 }}>
                        {s.full_name?.charAt(0) || '?'}
                      </div>

                      {/* Name + username */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: '800', color: '#1E293B', fontSize: '1rem' }}>{s.full_name}</p>
                        <p style={{ margin: 0, color: '#6366F1', fontSize: '0.82rem', fontWeight: '700' }}>@{acct.username}</p>
                      </div>

                      {/* Badges */}
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {prog && (
                          <>
                            <span style={{ background: '#F5F3FF', color: '#8B5CF6', padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.72rem', fontWeight: '700' }}>{prog.total_xp || 0} XP</span>
                            <span style={{ background: '#ECFDF5', color: '#10B981', padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.72rem', fontWeight: '700' }}>{prog.completed_count || 0} done</span>
                          </>
                        )}
                        <Pill color="#6366F1" bg="#EEF2FF">{assignedKeys.length} activities</Pill>
                      </div>

                      {/* Quick actions */}
                      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        <Link to={`/students/${s.id}/progress`}
                          style={{ background: '#EEF2FF', color: 'var(--primary)', border: 'none', borderRadius: '7px', padding: '0.4rem 0.75rem', fontSize: '0.75rem', fontWeight: '700', textDecoration: 'none', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <BarChartIcon size={12} />Progress
                        </Link>
                        <Link to={`/students/${s.id}/intervention`}
                          style={{ background: '#F5F3FF', color: '#8B5CF6', border: 'none', borderRadius: '7px', padding: '0.4rem 0.75rem', fontSize: '0.75rem', fontWeight: '700', textDecoration: 'none', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <EditIcon size={12} />Edit
                        </Link>
                      </div>

                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', flexShrink: 0 }}>{isOpen ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />}</span>
                    </div>

                    {/* Expanded detail */}
                    {isOpen && (
                      <div style={{ borderTop: '2px solid #F1F5F9', padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>

                        {/* Credentials card */}
                        <div style={{ background: 'linear-gradient(135deg,#7C3AED,#4338CA)', borderRadius: '10px', padding: '1.1rem 1.25rem', color: 'white', position: 'relative', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', right: '-5%', top: '-20%', fontSize: '6rem', opacity: 0.08 }}><KeyIcon size={80} /></div>
                          <p style={{ margin: '0 0 0.75rem', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7 }}>Login Credentials</p>
                          <p style={{ margin: '0 0 0.4rem', fontSize: '1rem' }}>
                            <span style={{ opacity: 0.7 }}>Username: </span>
                            <strong style={{ fontFamily: 'monospace', fontSize: '1.05rem' }}>{acct.username}</strong>
                          </p>
                          <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', opacity: 0.7 }}>
                            Password hidden — use Edit to update credentials.
                          </p>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button onClick={() => copyCredentials(acct.username, '••••••')}
                              style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.35)', color: 'white', borderRadius: '7px', padding: '0.35rem 0.75rem', cursor: 'pointer', fontWeight: '600', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'Inter, sans-serif' }}>
                              <CopyIcon size={11} />Copy username
                            </button>
                            <Link to={`/students/${s.id}/intervention`}
                              style={{ background: 'rgba(255,255,255,0.9)', color: 'var(--primary)', borderRadius: '7px', padding: '0.35rem 0.75rem', fontWeight: '700', fontSize: '0.75rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <EditIcon size={11} />Update password
                            </Link>
                          </div>
                        </div>

                        {/* Assigned activities */}
                        <div>
                          <p style={{ margin: '0 0 0.625rem', fontWeight: '700', color: 'var(--text)', fontSize: '0.875rem' }}>
                            Assigned activities ({assignedKeys.length})
                          </p>
                          {assignedKeys.length === 0 ? (
                            <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>No activities assigned yet.</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              {Object.entries(ldGroups).map(([ld, keys]) => {
                                const meta = LD_META[ld] || { label: ld, color: '#6366F1', bg: '#EEF2FF' };
                                return (
                                  <div key={ld} style={{ background: meta.bg, borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
                                    <p style={{ margin: '0 0 0.2rem', fontWeight: '700', color: meta.color, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: meta.color, display: 'inline-block' }} />{meta.label}
                                    </p>
                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem' }}>{keys.length} activit{keys.length !== 1 ? 'ies' : 'y'} assigned</p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <Link to={`/students/${s.id}/intervention`}
                            style={{ display: 'inline-block', marginTop: '0.75rem', color: '#8B5CF6', fontWeight: '800', fontSize: '0.82rem', textDecoration: 'none', borderBottom: '2px solid #C4B5FD' }}>
                            + Add / Remove Activities
                          </Link>
                        </div>

                        {/* Progress summary */}
                        {prog && (
                          <div>
                           <p style={{ margin: '0 0 0.625rem', fontWeight: '700', color: 'var(--text)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <BarChartIcon size={13} style={{ color: 'var(--primary)' }} />Progress summary
                          </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                              {[
                                { label: 'Total XP', value: prog.total_xp || 0, color: '#8B5CF6' },
                                { label: 'Level', value: prog.level || 1, color: '#6366F1' },
                                { label: 'Completed', value: prog.completed_count || 0, color: '#10B981' },
                                { label: 'Attempts', value: prog.total_attempts || 0, color: '#F59E0B' },
                              ].map(item => (
                                <div key={item.label} style={{ background: '#F8FAFC', borderRadius: '10px', padding: '0.75rem', textAlign: 'center' }}>
                                  <div style={{ fontSize: '1.4rem', fontWeight: '900', color: item.color }}>{item.value}</div>
                                  <div style={{ fontSize: '0.73rem', color: '#94A3B8', fontWeight: '700' }}>{item.label}</div>
                                </div>
                              ))}
                            </div>
                            <Link to={`/students/${s.id}/progress`}
                              style={{ display: 'inline-block', marginTop: '0.75rem', color: '#6366F1', fontWeight: '800', fontSize: '0.82rem', textDecoration: 'none', borderBottom: '2px solid #A5B4FC' }}>
                              View Full Report →
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Not started ───────────────────────────────────────────── */}
        {!loading && noAcct.length > 0 && (
          <section>
            <h2 style={{ fontSize: '0.9375rem', color: 'var(--text)', margin: '0 0 0.875rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ClockIcon size={14} style={{ color: '#F59E0B' }} />No intervention yet
              <span style={{ background: '#FFFBEB', color: '#D97706', padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.72rem' }}>{noAcct.length}</span>
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
              {noAcct.map(s => (
                <div key={s.id} style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', border: '2px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#94A3B8', flexShrink: 0 }}>
                    {s.full_name?.charAt(0) || '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: '700', color: '#1E293B', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.full_name}</p>
                    <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.78rem' }}>{s.grade || 'No grade'}</p>
                  </div>
                  <Link to={`/students/${s.id}/intervention`}
                    style={{ background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '7px', padding: '0.375rem 0.75rem', fontSize: '0.75rem', fontWeight: '700', textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <PlusIcon size={12} />Intervene
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {!loading && students.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <TargetIcon size={28} style={{ color: 'var(--text-placeholder)', margin: '0 auto 0.75rem', display: 'block' }} />
            <h2 style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: '700', marginBottom: '0.375rem' }}>No students yet</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>Add students from the Student List, then set up their interventions here.</p>
            <Link to="/students" style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '0.875rem' }}>Go to Student List →</Link>
          </div>
        )}

        <style>{`
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
          input:focus { border-color: #6366F1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        `}</style>
      </div>
    </div>
  );
};

export default InterventionsHub;
