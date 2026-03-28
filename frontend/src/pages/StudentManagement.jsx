import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const StudentManagement = () => {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={{ color: "var(--primary-color)" }}>Student Roster</h1>
        <div style={{ display: "flex", gap: "1rem" }}>
          <input type="text" placeholder="Search students..." style={{ width: "250px" }} />
          <button className="btn btn-primary">+ Register Student</button>
        </div>
      </div>

      <div className="glass-panel">
        <div style={styles.grid}>
          {/* Card 1 */}
          <div style={styles.card}>
            <div style={styles.avatar}>A</div>
            <h3>Aarav Patel</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>Grade 4 • ID: 1042</p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Link to="/results/1" className="btn btn-primary" style={{ flex: 1, padding: "0.5rem" }}>View Profile</Link>
            </div>
          </div>
          
          {/* Card 2 */}
          <div style={styles.card}>
            <div style={styles.avatar}>S</div>
            <h3>Sita Sharma</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>Grade 3 • ID: 1043</p>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Link to="/results/2" className="btn btn-primary" style={{ flex: 1, padding: "0.5rem" }}>View Profile</Link>
            </div>
          </div>
        </div>
      </div>
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
    marginBottom: "2rem",
    flexWrap: "wrap",
    gap: "1rem"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "1.5rem"
  },
  card: {
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius-md)",
    padding: "1.5rem",
    textAlign: "center",
    background: "var(--surface-color)",
    boxShadow: "var(--shadow-sm)"
  },
  avatar: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "var(--primary-color)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    fontWeight: "bold",
    margin: "0 auto 1rem auto"
  }
};

export default StudentManagement;
