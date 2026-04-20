import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserIcon, EyeIcon, EyeOffIcon, CheckCircleIcon, AlertTriangleIcon, ArrowRightIcon, SparklesIcon } from '../components/icons';

const Login = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();
  const successMessage = location.state?.message || '';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.error || !data.access_token) {
        setError(data.error || 'Invalid credentials.');
        return;
      }
      sessionStorage.setItem('access_token', data.access_token);
      sessionStorage.setItem('role', data.role);
      if (data.role === 'admin') navigate('/admin-dashboard');
      else if (data.role === 'student') navigate('/student-dashboard');
      else navigate('/dashboard');
    } catch {
      setError('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (focused) => ({
    padding: '0.625rem 0.75rem 0.625rem 2.5rem',
    fontSize: '0.875rem',
    borderRadius: '8px',
    border: `1.5px solid ${focused ? 'var(--primary)' : 'var(--border)'}`,
    background: '#FFFFFF',
    width: '100%',
  });

  return (
    <div className="split-layout">
      {/* ── Left panel ── */}
      <div className="split-left">
        <div style={{ maxWidth: '420px', zIndex: 1, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
            <SparklesIcon size={18} style={{ color: 'rgba(255,255,255,0.7)' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>AI-Powered Platform</span>
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: '800', color: 'white', marginBottom: '1rem', lineHeight: '1.1', letterSpacing: '-0.04em' }}>
            Taranga
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.75)', marginBottom: '2.5rem', lineHeight: '1.65', fontWeight: '400' }}>
            The intelligent learning disability screening platform built for educators and students.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {[['99%', 'AI Accuracy'], ['5+', 'LDs Detected'], ['Real-time', 'Insights']].map(([val, label]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.08)', padding: '0.875rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
                <div style={{ color: 'white', fontSize: '1.1rem', fontWeight: '800', letterSpacing: '-0.03em' }}>{val}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', marginTop: '0.1rem', fontWeight: '500' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="split-right">
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.75rem', color: 'var(--text)', marginBottom: '0.35rem', fontWeight: '800', letterSpacing: '-0.03em' }}>Sign in</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '400' }}>Access your educator workspace.</p>
          </div>

          {successMessage && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--success-light)', color: '#065F46', marginBottom: '1.25rem', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '600', border: '1px solid #A7F3D0' }}>
              <CheckCircleIcon size={15} />
              {successMessage}
            </div>
          )}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#B91C1C', marginBottom: '1.25rem', background: 'var(--danger-light)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '600', border: '1px solid #FECACA' }}>
              <AlertTriangleIcon size={15} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email address</label>
              <div style={{ position: 'relative' }}>
                <UserIcon size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-placeholder)' }} />
                <input
                  type="email"
                  placeholder="you@school.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={inputStyle(false)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-placeholder)', display: 'flex' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ ...inputStyle(false), paddingRight: '2.5rem' }}
                  required
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-placeholder)', display: 'flex', padding: 0 }}>
                  {showPw ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontSize: '0.875rem', borderRadius: '8px' }} disabled={loading}>
              {loading ? 'Authenticating…' : (
                <><span>Sign in to workspace</span><ArrowRightIcon size={14} /></>
              )}
            </button>
          </form>

          <div style={{ marginTop: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', textAlign: 'center' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600' }}>Create one</Link>
            </p>
            <div style={{ padding: '1rem', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
              <p style={{ color: 'var(--text)', fontWeight: '600', fontSize: '0.8125rem', marginBottom: '0.625rem' }}>Student access</p>
              <Link to="/student-login" className="btn" style={{ background: 'var(--success)', color: 'white', width: '100%', justifyContent: 'center', borderColor: 'var(--success)', fontSize: '0.8125rem' }}>
                Student portal login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
