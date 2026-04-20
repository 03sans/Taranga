import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { AlertTriangleIcon, CheckCircleIcon, UserIcon, LockIcon, EyeIcon, EyeOffIcon } from '../components/icons';

/* ─── helpers ──────────────────────────────────────────────────────── */
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

/* ─── toast component ──────────────────────────────────────────────── */
const Toast = ({ message, type }) => {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <div style={{
      position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 1000,
      background: isError ? '#FFF1F2' : '#1E293B',
      color: isError ? '#E11D48' : 'white',
      border: isError ? '2px solid #FECDD3' : 'none',
      padding: '1rem 1.5rem', borderRadius: '14px', fontWeight: '700',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
      animation: 'slideIn 0.3s ease',
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      maxWidth: '380px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {isError ? <AlertTriangleIcon size={14} /> : <CheckCircleIcon size={14} style={{ color: '#4ADE80' }} />}
        {message}
      </div>
    </div>
  );
};

/* ─── inline field error ───────────────────────────────────────────── */
const FieldError = ({ msg }) =>
  msg ? <p style={{ color: '#E11D48', fontSize: '0.82rem', fontWeight: '700', margin: '0.35rem 0 0' }}>{msg}</p> : null;

/* ─── password strength indicator ─────────────────────────────────── */
const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  const levels = ['Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['#E11D48', '#F59E0B', '#0EA5E9', '#10B981'];
  const tips = [
    !( password.length >= 8)          && '8+ characters',
    !(/[A-Z]/.test(password))         && 'uppercase letter',
    !(/[0-9]/.test(password))         && 'a number',
  ].filter(Boolean);
  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '0.3rem' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i < score ? colors[score - 1] : '#E2E8F0', transition: 'background 0.3s' }} />
        ))}
      </div>
      <span style={{ fontSize: '0.78rem', color: colors[score - 1] || '#94A3B8', fontWeight: '700' }}>
        {score > 0 ? levels[score - 1] : ''}
      </span>
      {tips.length > 0 && score < 3 && (
        <span style={{ fontSize: '0.76rem', color: '#94A3B8', marginLeft: '0.5rem' }}>· needs {tips.join(', ')}</span>
      )}
    </div>
  );
};

/* ─── main component ───────────────────────────────────────────────── */
const Profile = () => {
  const navigate   = useNavigate();
  const role       = sessionStorage.getItem('role') || 'teacher';

  // user state
  const [user,         setUser]         = useState(null);
  const [loadingUser,  setLoadingUser]  = useState(true);

  // profile-info form
  const [form,         setForm]         = useState({ full_name: '', email: '' });
  const [formErrors,   setFormErrors]   = useState({});
  const [savingInfo,   setSavingInfo]   = useState(false);
  const [infoChanged,  setInfoChanged]  = useState(false);

  // password form
  const [pwForm,       setPwForm]       = useState({ current: '', newPass: '', confirm: '' });
  const [pwErrors,     setPwErrors]     = useState({});
  const [savingPw,     setSavingPw]     = useState(false);
  const [showPw,       setShowPw]       = useState({ current: false, newPass: false, confirm: false });

  // toast
  const [toast,        setToast]        = useState({ msg: '', type: 'success' });

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 4000);
  }, []);

  /* fetch current user */
  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    if (!token) { navigate('/login'); return; }
    authFetch('/api/me')
      .then(r => r.json())
      .then(data => {
        if (data.detail) { navigate('/login'); return; }
        setUser(data);
        setForm({ full_name: data.full_name || '', email: data.email || '' });
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoadingUser(false));
  }, [navigate]);

  /* track whether profile form has unsaved changes */
  useEffect(() => {
    if (!user) return;
    setInfoChanged(form.full_name !== user.full_name || form.email !== user.email);
  }, [form, user]);

  /* ── validate & save profile info ────────────────────────────────── */
  const handleSaveInfo = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = 'Name cannot be empty.';
    if (!form.email.trim())     errs.email     = 'Email cannot be empty.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Enter a valid email address.';
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});
    setSavingInfo(true);

    try {
      const res  = await authFetch('/api/me', {
        method: 'PATCH',
        body: JSON.stringify({ full_name: form.full_name.trim(), email: form.email.trim().toLowerCase() }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Server-side error (e.g. email taken)
        showToast(data.detail || 'Failed to save. Please try again.', 'error');
        return;
      }

      // Update local state with the server's confirmed values
      setUser(data);
      setForm({ full_name: data.full_name, email: data.email });
      setInfoChanged(false);
      showToast('Profile saved successfully!');
    } catch {
      showToast('Network error — check your connection.', 'error');
    } finally {
      setSavingInfo(false);
    }
  };

  /* ── validate & save password ─────────────────────────────────────── */
  const handleChangePassword = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwForm.current)                         errs.current = 'Enter your current password.';
    if (!pwForm.newPass)                         errs.newPass = 'Enter a new password.';
    else if (pwForm.newPass.length < 8)          errs.newPass = 'Must be at least 8 characters.';
    else if (!/[A-Z]/.test(pwForm.newPass))      errs.newPass = 'Must contain at least one uppercase letter.';
    else if (!/[0-9]/.test(pwForm.newPass))      errs.newPass = 'Must contain at least one number.';
    else if (pwForm.current && pwForm.newPass === pwForm.current)
                                                 errs.newPass = 'New password must be different from your current one.';
    if (!pwForm.confirm)                         errs.confirm = 'Please confirm your new password.';
    else if (pwForm.newPass !== pwForm.confirm)  errs.confirm = 'Passwords do not match.';
    if (Object.keys(errs).length) { setPwErrors(errs); return; }
    setPwErrors({});
    setSavingPw(true);

    try {
      const res  = await authFetch('/api/me/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: pwForm.current, new_password: pwForm.newPass }),
      });
      const data = await res.json();

      if (!res.ok) {
        setPwErrors({ current: data.detail || 'Incorrect password.' });
        showToast(data.detail || 'Password change failed.', 'error');
        return;
      }

      setPwForm({ current: '', newPass: '', confirm: '' });
      showToast('Password changed successfully!');
    } catch {
      showToast('Network error — check your connection.', 'error');
    } finally {
      setSavingPw(false);
    }
  };

  /* ── loading state ────────────────────────────────────────────────── */
  if (loadingUser) return (
    <div className="dashboard-layout">
      <Sidebar role={role} />
      <div className="dashboard-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', animation: 'pulse 1.5s ease-in-out infinite' }}>
              <UserIcon size={20} style={{ color: 'var(--primary)' }} />
            </div>
            <p style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.875rem', margin: 0 }}>Loading your profile…</p>
          </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </div>
    </div>
  );

  const initials = (user?.full_name || user?.email || '?')
    .split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="dashboard-layout">
      <Sidebar role={role} />
      <div className="dashboard-main" style={{ maxWidth: '1000px' }}>

        <Toast message={toast.msg} type={toast.type} />

        {/* Header */}
        <header style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2.25rem', color: '#1E293B', margin: '0 0 0.25rem 0' }}>My Profile</h1>
          <p style={{ color: '#64748B', margin: 0 }}>Changes are saved directly to your account in the database.</p>
        </header>

        {/* Hero banner */}
        <div style={{ background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)', borderRadius: '24px', padding: '2.25rem 2.5rem', color: 'white', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ width: '84px', height: '84px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.25rem', fontWeight: '800', border: '3px solid rgba(255,255,255,0.45)', flexShrink: 0, color: 'white', fontFamily: 'var(--font-heading)' }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <h2 style={{ color: 'white', fontSize: '1.75rem', margin: '0 0 0.3rem 0' }}>{user?.full_name}</h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', margin: '0 0 0.6rem 0', fontSize: '0.95rem' }}>{user?.email}</p>
            <span style={{ background: 'rgba(255,255,255,0.22)', color: 'white', padding: '0.22rem 0.85rem', borderRadius: '99px', fontWeight: '700', fontSize: '0.8rem' }}>
              {role === 'admin' ? 'Administrator' : role === 'parent' ? 'Parent' : 'Educator'}
            </span>
          </div>
          {infoChanged && (
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '0.5rem 0.875rem', fontSize: '0.8125rem', fontWeight: '600', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>
              Unsaved changes
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.75rem' }}>

          {/* ── Account Details ──────────────────────────────────── */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', border: '2px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text)', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700' }}>
              <div style={{ background: '#EEF2FF', padding: '0.375rem', borderRadius: '7px', display: 'flex' }}><UserIcon size={14} style={{ color: 'var(--primary)' }} /></div>
              Account details
            </h3>

            <form onSubmit={handleSaveInfo} noValidate>
              {/* Full name */}
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Your full name"
                  style={formErrors.full_name ? { borderColor: '#E11D48' } : {}}
                />
                <FieldError msg={formErrors.full_name} />
              </div>

              {/* Email */}
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="your@email.com"
                  style={formErrors.email ? { borderColor: '#E11D48' } : {}}
                />
                <FieldError msg={formErrors.email} />
              </div>

              {/* Role — read-only */}
              <div className="form-group">
                <label>Role <span style={{ color: '#94A3B8', fontWeight: '600', fontSize: '0.82rem' }}>(cannot be changed)</span></label>
                <input
                  type="text"
                  value={role.charAt(0).toUpperCase() + role.slice(1)}
                  disabled
                  style={{ background: '#F8FAFC', color: '#94A3B8', cursor: 'not-allowed' }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.25rem', opacity: !infoChanged && !savingInfo ? 0.6 : 1, transition: 'opacity 0.2s' }}
                disabled={savingInfo || !infoChanged}
              >
                {savingInfo ? 'Saving…' : infoChanged ? 'Save changes' : 'No changes'}
              </button>
            </form>
          </div>

          {/* ── Right column ─────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Change Password */}
            <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', border: '2px solid #E2E8F0' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text)', margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700' }}>
                <div style={{ background: '#FEE2E2', padding: '0.375rem', borderRadius: '7px', display: 'flex' }}><LockIcon size={14} style={{ color: '#EF4444' }} /></div>
                Change password
              </h3>

              <form onSubmit={handleChangePassword} noValidate>
                {/* Current password */}
                <div className="form-group">
                  <label>Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw.current ? 'text' : 'password'}
                      value={pwForm.current}
                      onChange={e => setPwForm({ ...pwForm, current: e.target.value })}
                      placeholder="••••••••"
                      style={pwErrors.current ? { borderColor: '#E11D48', paddingRight: '3rem' } : { paddingRight: '3rem' }}
                      autoComplete="current-password"
                    />
                    <button type="button" onClick={() => setShowPw(p => ({ ...p, current: !p.current }))}
                      style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
                      {showPw.current ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                    </button>
                  </div>
                  <FieldError msg={pwErrors.current} />
                </div>

                {/* New password */}
                <div className="form-group">
                  <label>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw.newPass ? 'text' : 'password'}
                      value={pwForm.newPass}
                      onChange={e => setPwForm({ ...pwForm, newPass: e.target.value })}
                      placeholder="••••••••"
                      style={pwErrors.newPass ? { borderColor: '#E11D48', paddingRight: '3rem' } : { paddingRight: '3rem' }}
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowPw(p => ({ ...p, newPass: !p.newPass }))}
                      style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
                      {showPw.newPass ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                    </button>
                  </div>
                  <PasswordStrength password={pwForm.newPass} />
                  <FieldError msg={pwErrors.newPass} />
                </div>

                {/* Confirm */}
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw.confirm ? 'text' : 'password'}
                      value={pwForm.confirm}
                      onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
                      placeholder="••••••••"
                      style={pwErrors.confirm ? { borderColor: '#E11D48', paddingRight: '3rem' } : { paddingRight: '3rem' }}
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))}
                      style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
                      {showPw.confirm ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                    </button>
                  </div>
                  {pwForm.confirm && pwForm.newPass === pwForm.confirm && (
                    <p style={{ color: '#10B981', fontSize: '0.82rem', fontWeight: '700', margin: '0.35rem 0 0' }}>✓ Passwords match</p>
                  )}
                  <FieldError msg={pwErrors.confirm} />
                </div>

                <button type="submit" className="btn"
                  style={{ width: '100%', background: '#FEE2E2', color: '#EF4444', border: '1.5px solid #FECACA', fontFamily: 'var(--font-body)', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  disabled={savingPw}>
                  <LockIcon size={13} />{savingPw ? 'Updating…' : 'Update password'}
                </button>
              </form>
            </div>

            {/* Danger Zone */}
            <div style={{ background: '#FFF1F2', borderRadius: '20px', padding: '1.75rem', border: '2px solid #FECDD3' }}>
              <h3 style={{ fontSize: '0.9375rem', color: '#EF4444', margin: '0 0 0.5rem 0', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertTriangleIcon size={15} />Danger zone</h3>
              <p style={{ color: '#9F1239', fontSize: '0.88rem', margin: '0 0 1rem 0', lineHeight: '1.6' }}>
                This will clear your session token and you'll be taken back to the login screen.
              </p>
              <button
                className="btn"
                style={{ background: '#E11D48', color: 'white', border: 'none', width: '100%', fontFamily: 'var(--font-body)', fontWeight: '800' }}
                onClick={() => {
                  sessionStorage.removeItem('access_token');
                  sessionStorage.removeItem('role');
                  navigate('/login');
                }}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>

      </div>
      <style>{`
        @keyframes slideIn { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
};

export default Profile;
