import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    // API Call goes here
    console.log("Logging in via API...");
    navigate("/dashboard");
  };

  return (
    <div style={styles.container}>
      <div className="glass-panel" style={styles.card}>
        <div style={styles.header}>
          <h1 style={{ color: "var(--primary-color)" }}>TARANGA</h1>
          <p style={{ color: "var(--text-secondary)" }}>Welcome back to the Learning Portal</p>
        </div>
        
        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="Enter your email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label>Password</label>
            <input 
              type="password" 
              placeholder="Enter your password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }}>
            Sign In
          </button>
        </form>
        
        <div style={styles.footer}>
          <p>Don't have an account? <Link to="/register">Register here</Link></p>
          <p style={{ marginTop: "1rem" }}>
            Are you a student? <Link to="/student-login" style={{ color: "var(--accent-color)" }}>Student Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
    padding: '2rem'
  },
  card: {
    width: '100%',
    maxWidth: '450px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    fontWeight: '500',
    fontSize: '0.9rem'
  },
  footer: {
    marginTop: '2rem',
    textAlign: 'center',
    fontSize: '0.9rem',
    color: 'var(--text-secondary)'
  }
};

export default Login;
