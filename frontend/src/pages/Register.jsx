import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'teacher'
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    // API Call goes here
    console.log("Registering via API...", formData);
    navigate("/login");
  };

  return (
    <div style={styles.container}>
      <div className="glass-panel" style={styles.card}>
        <div style={styles.header}>
          <h2 style={{ color: "var(--primary-color)" }}>Create Account</h2>
          <p style={{ color: "var(--text-secondary)" }}>Join TARANGA to support student learning</p>
        </div>
        
        <form onSubmit={handleRegister} style={styles.form}>
          <div style={styles.inputGroup}>
            <label>Full Name</label>
            <input 
              type="text" 
              name="fullName"
              placeholder="John Doe" 
              value={formData.fullName}
              onChange={handleChange}
              required 
            />
          </div>

          <div style={styles.inputGroup}>
            <label>Email Address</label>
            <input 
              type="email" 
              name="email"
              placeholder="john@example.com" 
              value={formData.email}
              onChange={handleChange}
              required 
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label>Password</label>
            <input 
              type="password" 
              name="password"
              placeholder="Create a password" 
              value={formData.password}
              onChange={handleChange}
              required 
            />
          </div>

          <div style={styles.inputGroup}>
            <label>I am a...</label>
            <select name="role" value={formData.role} onChange={handleChange} required>
              <option value="teacher">Teacher / Educator</option>
              <option value="parent">Parent / Guardian</option>
            </select>
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem" }}>
            Register Now
          </button>
        </form>
        
        <div style={styles.footer}>
          <p>Already have an account? <Link to="/login">Sign in</Link></p>
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
    maxWidth: '500px',
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

export default Register;
