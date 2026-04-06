import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const StudentLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    if (!username.trim()) return 'Please enter your username.';
    if (username.trim().length < 3) return 'Username must be at least 3 characters.';
    if (!password)         return 'Please enter your password.';
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
      if (data.error) {
        setError(data.error);
        return;
      }
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('role', 'student');
      localStorage.setItem('student_name', data.full_name || username);
      navigate('/student-dashboard');
    } catch {
      setError('Could not connect to the server. Please try again!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="full-bleed" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', alignItems: 'center', justifyContent: 'center' }}>

      {/* Decorative Background */}
      <div style={{ position: 'absolute', top: '10%', left: '5%', fontSize: '8rem', opacity: 0.2, transform: 'rotate(-15deg)' }}>⭐️</div>
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', fontSize: '10rem', opacity: 0.1, transform: 'rotate(20deg)' }}>🚀</div>
      <div style={{ position: 'absolute', top: '20%', right: '20%', fontSize: '6rem', opacity: 0.15 }}>🎨</div>

      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '3.5rem', background: 'rgba(255,255,255,0.97)', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>🦸</div>
          <h1 style={{ color: '#059669', fontSize: '2.5rem', marginBottom: '0.35rem' }}>Hey there! 👋</h1>
          <p style={{ color: '#64748B', fontSize: '1.1rem', fontWeight: '700' }}>Ready for another learning adventure?</p>
        </div>

        {error && (
          <div style={{ background: '#FFF1F2', border: '2px solid #FECDD3', borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.3rem' }}>😕</span>
            <span style={{ color: '#E11D48', fontWeight: '700', fontSize: '0.95rem' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} noValidate>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '1.1rem', color: '#1E293B', fontWeight: '800' }}>Your Username</label>
            <input
              type="text"
              placeholder="e.g. hero123"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }}
              style={{
                fontSize: '1.15rem', padding: '1rem 1.25rem', borderRadius: '14px',
                border: `2px solid ${error && !username ? '#FECDD3' : '#D1FAE5'}`,
                background: '#F0FDF4',
              }}
              autoComplete="username"
              autoFocus
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2.5rem' }}>
            <label style={{ fontSize: '1.1rem', color: '#1E293B', fontWeight: '800' }}>Your Secret Password</label>
            <input
              type="password"
              placeholder="••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              style={{
                fontSize: '1.5rem', padding: '1rem 1.25rem', letterSpacing: '4px', borderRadius: '14px',
                border: `2px solid ${error && !password ? '#FECDD3' : '#D1FAE5'}`,
                background: '#F0FDF4',
              }}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '1.25rem', fontSize: '1.4rem', borderRadius: '18px',
              background: loading ? '#A7F3D0' : 'linear-gradient(135deg, #10B981, #059669)',
              color: 'white', border: 'none', fontWeight: '900', cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 25px rgba(16,185,129,0.3)', transition: 'all 0.2s',
              fontFamily: 'var(--font-heading)',
            }}
          >
            {loading ? '🔑 Logging in…' : "Let's Go! 🎮"}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link to="/login" style={{ fontSize: '0.95rem', color: '#64748B', fontWeight: '700', textDecoration: 'underline' }}>
            Back to Teacher Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
