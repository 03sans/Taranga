import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const StudentLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    // API Call goes here. Since we unified student login to use the same auth:
    console.log("Student logging in via API...");
    navigate("/student-dashboard");
  };

  return (
    <div style={styles.container}>
      <div className="glass-panel" style={styles.card}>
        <div style={styles.header}>
          <h1 style={{ color: "var(--secondary-color)", fontSize: "2.5rem" }}>Hi! 👋</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.2rem" }}>Ready to play and learn?</p>
        </div>
        
        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={{ fontSize: "1.1rem" }}>Your Username / Email</label>
            <input 
              type="email" 
              placeholder="e.g. hero123@student.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ fontSize: "1.1rem", padding: "1rem" }}
              required 
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={{ fontSize: "1.1rem" }}>Your Secret Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ fontSize: "1.1rem", padding: "1rem", letterSpacing: "3px" }}
              required 
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ 
            width: "100%", 
            marginTop: "1.5rem", 
            padding: "1rem", 
            fontSize: "1.2rem",
            backgroundColor: "var(--secondary-color)",
            boxShadow: "0 4px 14px 0 rgba(16, 185, 129, 0.4)"
          }}>
            Let's Go! 🚀
          </button>
        </form>
        
        <div style={styles.footer}>
          <p><Link to="/login">Back to Teacher / Parent Login</Link></p>
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
    background: 'linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%)', // Playful green background
    padding: '2rem'
  },
  card: {
    width: '100%',
    maxWidth: '450px',
    borderTop: '6px solid var(--secondary-color)'
  },
  header: {
    textAlign: 'center',
    marginBottom: '2.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    fontWeight: '600',
    color: 'var(--text-primary)'
  },
  footer: {
    marginTop: '2rem',
    textAlign: 'center',
    fontSize: '0.9rem',
    fontWeight: '500'
  }
};

export default StudentLogin;
