import React from 'react';
import { Link } from 'react-router-dom';

const ScreeningResults = () => {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={{ color: "var(--primary-color)" }}>Diagnostic Report: Aarav Patel</h1>
          <p style={{ color: "var(--text-secondary)" }}>AI Screening run on Oct 24, 2026</p>
        </div>
        <button className="btn btn-primary">Download PDF Report</button>
      </header>

      <main style={styles.grid}>
        {/* ML Outputs */}
        <div style={styles.col}>
          <h2 style={{ marginBottom: "1rem" }}>Predictive Analytics 🤖</h2>
          
          <div className="glass-panel" style={{ ...styles.card, borderLeft: "6px solid var(--danger-color)" }}>
            <div style={styles.cardHeader}>
              <h3>Dyslexia</h3>
              <span style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--danger-color)" }}>99.0%</span>
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>High risk indicated. Key drivers (XAI):</p>
            <ul style={styles.shapList}>
              <li><span style={styles.shapValue}>+0.41</span> Letter reversal frequency</li>
              <li><span style={styles.shapValue}>+0.19</span> Spelling errors</li>
              <li><span style={styles.shapValue}>+0.16</span> Slow reading pace</li>
            </ul>
          </div>

          <div className="glass-panel" style={{ ...styles.card, borderLeft: "6px solid var(--secondary-color)" }}>
            <div style={styles.cardHeader}>
              <h3>Dyscalculia</h3>
              <span style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--secondary-color)" }}>0.0%</span>
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>Low risk indicated. No significant concerns.</p>
          </div>
          
          <div className="glass-panel" style={{ ...styles.card, borderLeft: "6px solid var(--accent-color)" }}>
            <div style={styles.cardHeader}>
              <h3>Dysgraphia</h3>
              <span style={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--accent-color)" }}>90.0%</span>
            </div>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>Elevated risk indicated. Key drivers (XAI):</p>
            <ul style={styles.shapList}>
              <li><span style={styles.shapValue}>+0.24</span> Pencil grip difficulty</li>
              <li><span style={styles.shapValue}>+0.23</span> Spacing between words</li>
            </ul>
          </div>
        </div>

        {/* NLP & Interventions */}
        <div style={styles.col}>
          <h2 style={{ marginBottom: "1rem" }}>NLP Teacher Observations 📝</h2>
          <div className="glass-panel" style={styles.card}>
            <p style={{ fontStyle: "italic", background: "#f3f4f6", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
              "The student <mark style={{background: "#fca5a5"}}>struggles</mark> to <mark style={{background: "#fca5a5"}}>read</mark> aloud and her <mark style={{background: "#fcd34d"}}>handwriting</mark> is consistently <mark style={{background: "#fcd34d"}}>messy</mark>. She <mark style={{background: "#fca5a5"}}>reverses</mark> <mark style={{background: "#fca5a5"}}>letters</mark> sometimes."
            </p>
            <div style={{ display: "flex", gap: "1rem" }}>
              <span style={styles.badgeDanger}>Dyslexia: 5 matches</span>
              <span style={styles.badgeWarning}>Dysgraphia: 2 matches</span>
            </div>
          </div>

          <h2 style={{ marginTop: "2rem", marginBottom: "1rem" }}>Recommended Interventions 🎯</h2>
          <div className="glass-panel" style={styles.card}>
            <h3 style={{ marginBottom: "0.5rem" }}>For Dyslexia / Multi-sensory Reading</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>Assign "Letter Catch" and "Rhyme Match" minigames.</p>
            <Link to="/students" className="btn btn-primary" style={{ width: "100%", background: "var(--secondary-color)" }}>+ Assign Activities</Link>
          </div>
        </div>
      </main>
    </div>
  );
};

const styles = {
  container: {
    padding: "2rem",
    maxWidth: "1200px",
    margin: "0 auto"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "3rem"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "2rem"
  },
  col: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem"
  },
  card: {
    padding: "1.5rem",
    background: "var(--surface-color)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.5rem"
  },
  shapList: {
    listStyleType: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem"
  },
  shapValue: {
    background: "#FEE2E2",
    color: "#DC2626",
    padding: "0.1rem 0.4rem",
    borderRadius: "4px",
    fontSize: "0.8rem",
    fontWeight: "bold",
    marginRight: "0.5rem"
  },
  badgeDanger: {
    background: "#FEE2E2",
    color: "#DC2626",
    padding: "0.25rem 0.75rem",
    borderRadius: "9999px",
    fontSize: "0.85rem",
    fontWeight: "600"
  },
  badgeWarning: {
    background: '#FEF3C7',
    color: '#D97706',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.85rem',
    fontWeight: '600'
  }
};

export default ScreeningResults;
