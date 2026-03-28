import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const StudentActivity = () => {
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const navigate = useNavigate();

  const handleCatch = () => {
    setScore(score + 10);
    if (score >= 40) {
      setFinished(true);
    }
  };

  if (finished) {
    return (
      <div style={styles.containerCenter}>
        <div className="glass-panel" style={{ textAlign: "center", padding: "4rem" }}>
          <h1 style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎉</h1>
          <h2 style={{ color: "var(--secondary-color)", fontSize: "2rem" }}>Awesome Job!</h2>
          <p style={{ fontSize: "1.2rem", margin: "1rem 0 2rem 0" }}>You scored 50 points!</p>
          <button onClick={() => navigate("/student-dashboard")} className="btn btn-primary" style={{ background: "var(--secondary-color)", fontSize: "1.2rem" }}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2 style={{ color: "white" }}>Letter Catch 🔤</h2>
        <div style={styles.scoreBadge}>Score: {score}</div>
      </header>

      <main style={{ flex: 1, position: "relative" }}>
        <p style={{ textAlign: "center", color: "white", fontSize: "1.2rem", marginTop: "2rem" }}>
          Click the floating letters to catch them!
        </p>
        
        <div 
          onClick={handleCatch}
          style={{
            ...styles.floatingObject,
            top: "30%", left: "40%"
          }}
        >
          A
        </div>
        <div 
          onClick={handleCatch}
          style={{
            ...styles.floatingObject,
            top: "60%", left: "70%"
          }}
        >
          B
        </div>
      </main>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, var(--primary-color) 0%, #818CF8 100%)",
    display: "flex",
    flexDirection: "column",
  },
  containerCenter: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%)"
  },
  header: {
    padding: "1.5rem 2rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(0,0,0,0.1)",
    backdropFilter: "blur(5px)"
  },
  scoreBadge: {
    background: "white",
    color: "var(--primary-color)",
    padding: "0.5rem 1.5rem",
    borderRadius: "99px",
    fontWeight: "bold",
    fontSize: "1.2rem"
  },
  floatingObject: {
    position: "absolute",
    width: "80px",
    height: "80px",
    background: "white",
    color: "var(--primary-color)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "2.5rem",
    fontWeight: "bold",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
    cursor: "pointer",
    transition: "transform 0.1s"
  }
};

export default StudentActivity;
