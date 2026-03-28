import React from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={{ color: "var(--primary-color)" }}>TARANGA Admin</h1>
        <button className="btn btn-primary" style={{ background: "var(--danger-color)" }}>Logout</button>
      </header>

      <main style={styles.main}>
        <div className="glass-panel" style={styles.statsGrid}>
          <div style={styles.statCard}>
            <h3>Total Users</h3>
            <p style={styles.statNumber}>142</p>
          </div>
          <div style={styles.statCard}>
            <h3>Students Screened</h3>
            <p style={styles.statNumber}>89</p>
          </div>
          <div style={styles.statCard}>
            <h3>Active Interventions</h3>
            <p style={styles.statNumber}>34</p>
          </div>
        </div>

        <h2 style={{marginTop: "2rem", marginBottom: "1rem"}}>Quick Actions</h2>
        <div style={styles.actionGrid}>
          <Link to="/users" className="glass-panel" style={styles.actionCard}>
            <h3>👥 Manage Users</h3>
            <p>Add, deactivate, or edit teacher and parent roles.</p>
          </Link>
          <Link to="/students" className="glass-panel" style={styles.actionCard}>
            <h3>🎓 Manage Students</h3>
            <p>View all student profiles and screening histories system-wide.</p>
          </Link>
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
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '3rem'
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '2rem',
    textAlign: 'center'
  },
  statCard: {
    padding: '1rem',
  },
  statNumber: {
    fontSize: '3rem',
    fontWeight: '700',
    color: 'var(--primary-color)',
    lineHeight: '1'
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  actionCard: {
    textDecoration: 'none',
    color: 'inherit',
    transition: 'var(--transition)',
    cursor: 'pointer'
  }
};

export default AdminDashboard;
