import React from 'react';
import { Link } from 'react-router-dom';

const TeacherDashboard = () => {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={{ color: "var(--primary-color)" }}>Teacher Dashboard</h1>
          <p style={{ color: "var(--text-secondary)" }}>Welcome to your screening hub</p>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <Link to="/profile" className="btn" style={{ border: "1px solid var(--border-color)" }}>Profile</Link>
          <button className="btn btn-primary" style={{ background: "var(--danger-color)" }}>Logout</button>
        </div>
      </header>

      <main>
        <div style={styles.heroAction}>
          <div className="glass-panel" style={styles.heroCard}>
            <h2>Start a New Screening 📝</h2>
            <p>Assess a student for Learning Difficulties using our adaptive questionnaire.</p>
            <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
              <Link to="/screening/adaptive" className="btn btn-primary">Start Assessment</Link>
              <Link to="/screening/nlp" className="btn" style={{ border: "1px solid var(--primary-color)", color: "var(--primary-color)" }}>Upload Text Observation</Link>
            </div>
          </div>
        </div>

        <h2 style={{marginTop: "3rem", marginBottom: "1rem"}}>My Students</h2>
        <div className="glass-panel">
          <table style={styles.table}>
            <thead>
              <tr style={{textAlign: "left", color: "var(--text-secondary)"}}>
                <th style={{padding: "1rem", borderBottom: "1px solid var(--border-color)"}}>Name</th>
                <th style={{padding: "1rem", borderBottom: "1px solid var(--border-color)"}}>Grade</th>
                <th style={{padding: "1rem", borderBottom: "1px solid var(--border-color)"}}>Last Screening</th>
                <th style={{padding: "1rem", borderBottom: "1px solid var(--border-color)"}}>Status</th>
                <th style={{padding: "1rem", borderBottom: "1px solid var(--border-color)"}}>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{padding: "1rem", fontWeight: "500"}}>Aarav Patel</td>
                <td style={{padding: "1rem"}}>Grade 4</td>
                <td style={{padding: "1rem", color: "var(--text-secondary)"}}>2 weeks ago</td>
                <td style={{padding: "1rem"}}><span style={styles.badgeWarning}>Action Needed</span></td>
                <td style={{padding: "1rem"}}><Link to="/results/1" style={{color: "var(--primary-color)", fontWeight: "500"}}>View Report</Link></td>
              </tr>
              <tr>
                <td style={{padding: "1rem", fontWeight: "500"}}>Sita Sharma</td>
                <td style={{padding: "1rem"}}>Grade 3</td>
                <td style={{padding: "1rem", color: "var(--text-secondary)"}}>1 month ago</td>
                <td style={{padding: "1rem"}}><span style={styles.badgeSuccess}>Typical</span></td>
                <td style={{padding: "1rem"}}><Link to="/results/2" style={{color: "var(--primary-color)", fontWeight: "500"}}>View Report</Link></td>
              </tr>
            </tbody>
          </table>
          <div style={{ marginTop: "1.5rem", textAlign: "right" }}>
            <Link to="/students" className="btn" style={{ background: "var(--surface-color)", border: "1px solid var(--border-color)" }}>Manage All Students</Link>
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
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '3rem'
  },
  heroAction: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  heroCard: {
    background: 'linear-gradient(120deg, var(--glass-bg), rgba(255, 255, 255, 0.9))',
    borderLeft: '6px solid var(--primary-color)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  badgeWarning: {
    background: '#FEF3C7',
    color: '#D97706',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.85rem',
    fontWeight: '600'
  },
  badgeSuccess: {
    background: '#D1FAE5',
    color: '#059669',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.85rem',
    fontWeight: '600'
  }
};

export default TeacherDashboard;
