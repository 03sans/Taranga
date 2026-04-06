import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginUser } from '../api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message || '';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Backend expects JSON body
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (data.error || !data.access_token) {
        setError(data.error || "Invalid credentials.");
        return;
      }

      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('role', data.role);

      // Route based on role
      if (data.role === 'admin') navigate('/admin-dashboard');
      else if (data.role === 'student') navigate('/student-dashboard');
      else navigate('/dashboard'); // teacher or parent
    } catch (err) {
      setError("Network error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="split-layout">
      <div className="split-left">
        <div style={{ maxWidth: "500px", zIndex: 1 }}>
          <h1 style={{ fontSize: "4rem", color: "white", marginBottom: "1rem", lineHeight: "1.1" }}>
            Welcome to Taranga.
          </h1>
          <p style={{ fontSize: "1.25rem", color: "rgba(255,255,255,0.9)", marginBottom: "2rem" }}>
            The vibrant platform for learning disability screening and brilliant student interventions.
          </p>
          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ background: "rgba(255,255,255,0.2)", padding: "1rem", borderRadius: "var(--radius-md)", backdropFilter: "blur(10px)" }}>
              <h3 style={{ color: "white", fontSize: "1.5rem" }}>99%</h3>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem" }}>AI Accuracy</p>
            </div>
            <div style={{ background: "rgba(255,255,255,0.2)", padding: "1rem", borderRadius: "var(--radius-md)", backdropFilter: "blur(10px)" }}>
              <h3 style={{ color: "white", fontSize: "1.5rem" }}>5+</h3>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem" }}>LDs Screened</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="split-right">
        <div style={{ width: "100%", maxWidth: "450px" }}>
          <div style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "2.5rem", color: "var(--primary-color)", marginBottom: "0.5rem" }}>Sign In</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Access your educator dashboard.</p>
          </div>
          
          {successMessage && (
            <div style={{ color: "#065F46", marginBottom: "1.5rem", background: "#D1FAE5", padding: "1rem", borderRadius: "var(--radius-sm)", fontWeight: "700" }}>
              ✅ {successMessage}
            </div>
          )}
          {error && <div style={{ color: "var(--danger-color)", marginBottom: "1.5rem", background: "#FFE4E6", padding: "1rem", borderRadius: "var(--radius-sm)", fontWeight: "700" }}>{error}</div>}
          
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                placeholder="teacher@school.edu" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem", padding: "1rem" }} disabled={loading}>
              {loading ? "Authenticating..." : "Login to Workspace"}
            </button>
          </form>
          
          <div style={{ marginTop: "2.5rem", textAlign: "center", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ color: "var(--text-secondary)", fontWeight: "600" }}>
              Don't have an account? <Link to="/register">Create one now</Link>
            </p>
            <div style={{ padding: "1.5rem", background: "var(--bg-color)", borderRadius: "var(--radius-md)", border: "2px dashed var(--border-color)" }}>
               <p style={{ color: "var(--text-primary)", fontWeight: "700" }}>Are you a student?</p>
               <Link to="/student-login" className="btn btn-accent" style={{ marginTop: "1rem", width: "100%" }}>Student Portal Login 🚀</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
