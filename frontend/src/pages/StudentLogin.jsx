import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeOffIcon, AlertTriangleIcon, ArrowRightIcon, UserIcon, SparklesIcon } from '../components/icons';

const StudentLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    if (!username.trim()) return 'Please enter your username.';
    if (username.trim().length < 3) return 'Username must be at least 3 characters.';
    if (!password) return 'Please enter your password.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/student-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      sessionStorage.setItem('access_token', data.access_token);
      sessionStorage.setItem('role', 'student');
      sessionStorage.setItem('student_name', data.full_name || username);
      navigate('/student-dashboard');
    } catch {
      setError('Could not connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #0F172A 0%, #1E293B 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
      {/* Subtle background elements */}
      <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(124,58,237,0.06)', top: '-200px', right: '-200px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(16,185,129,0.05)', bottom: '-100px', left: '-100px', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '400px', background: '#FFFFFF', borderRadius: '16px', padding: '2.5rem', boxShadow: '0 25px 50px rgba(0,0,0,0.4)', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #10B981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <SparklesIcon size={22} style={{ color: 'white' }} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.25rem', letterSpacing: '-0.03em' }}>Student Portal</h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem', fontWeight: '400' }}>Sign in to access your learning activities.</p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FEE2E2', color: '#B91C1C', marginBottom: '1.25rem', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.8125rem', fontWeight: '600', border: '1px solid #FECACA' }}>
            <AlertTriangleIcon size={14} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} noValidate>
          <div className="form-group">
            <label style={{ color: '#0F172A' }}>Username</label>
            <div style={{ position: 'relative' }}>
              <UserIcon size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="e.g. hero123"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                style={{ paddingLeft: '2.25rem', borderColor: error && !username ? '#FCA5A5' : undefined }}
                autoComplete="username"
                autoFocus
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ color: '#0F172A' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem', borderColor: error && !password ? '#FCA5A5' : undefined }}
                autoComplete="current-password"
                required
              />
              <button type="button" onClick={() => setShowPw(p => !p)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', padding: 0 }}>
                {showPw ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '0.75rem', background: loading ? '#6EE7B7' : 'linear-gradient(135deg, #10B981, #059669)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', transition: 'all 0.15s' }}>
            {loading ? 'Signing in…' : <><span>Sign in</span><ArrowRightIcon size={14} /></>}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link to="/login" style={{ fontSize: '0.8125rem', color: '#64748B', fontWeight: '500' }}>
            Back to educator login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
