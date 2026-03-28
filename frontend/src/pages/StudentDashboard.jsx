import React from 'react';
import { Link } from 'react-router-dom';

const StudentDashboard = () => {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={styles.avatar}>🦸‍♂️</div>
          <div>
            <h1 style={{ color: "var(--text-primary)", fontSize: "2rem" }}>Hi, Aarav!</h1>
            <p style={{ color: "var(--secondary-color)", fontWeight: "600" }}>Level 4 Explorer 🌟</p>
          </div>
        </div>
        <button className="btn btn-primary" style={{ background: "#EF4444", borderRadius: "99px" }}>Log Out</button>
      </header>

      <main style={styles.main}>
        <div className="glass-panel" style={styles.banner}>
          <h2 style={{ fontSize: "1.8rem", color: "white" }}>Ready for today's adventure?</h2>
          <p style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "1.1rem" }}>You have 2 new activities waiting!</p>
        </div>

        <h3 style={{marginTop: "2rem", marginBottom: "1rem", fontSize: "1.5rem"}}>My Interventions (Activities) ✨</h3>
        <div style={styles.activityGrid}>
          
          <div className="glass-panel" style={styles.activityCard}>
            <div style={styles.iconBox}>🔤</div>
            <h3 style={{ margin: "1rem 0 0.5rem 0" }}>Letter Catch</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>Catch the falling letters to spell the word!</p>
            <Link to="/activity/1" className="btn btn-primary" style={{ width: "100%", background: "var(--primary-color)" }}>Play Now</Link>
          </div>

          <div className="glass-panel" style={styles.activityCard}>
            <div style={styles.iconBox}>✍️</div>
            <h3 style={{ margin: "1rem 0 0.5rem 0" }}>Tracing Magic</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>Follow the magical line to draw shapes.</p>
            <Link to="/activity/2" className="btn btn-primary" style={{ width: "100%", background: "var(--secondary-color)", color: "white" }}>Play Now</Link>
          </div>

        </div>
      </main>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: '"Outfit", sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem'
  },
  avatar: {
    fontSize: '3.5rem',
    background: 'white',
    borderRadius: '50%',
    padding: '0.5rem',
    boxShadow: 'var(--shadow-md)'
  },
  banner: {
    background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)',
    color: 'white',
    border: 'none',
    boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)'
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
  },
  activityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '2rem',
  },
  activityCard: {
    textAlign: 'center',
    transition: 'transform 0.3s ease',
    cursor: 'pointer',
    borderTop: '6px solid var(--primary-color)'
  },
  iconBox: {
    fontSize: '4rem',
    marginBottom: '0.5rem'
  }
};

export default StudentDashboard;
