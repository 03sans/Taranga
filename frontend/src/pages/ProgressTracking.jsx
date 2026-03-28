import React from 'react';

const ProgressTracking = () => {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={{ color: "var(--primary-color)" }}>Analytics & Progress Tracking</h1>
        <button className="btn btn-primary">Export PDF Report</button>
      </div>

      <div style={styles.grid}>
        <div className="glass-panel" style={styles.chartContainer}>
           <h3 style={{marginBottom: "1rem"}}>System Engagement Overview</h3>
           <div style={styles.mockChart}>
             {/* Mock Bar Chart */}
             <div style={{height: "100%", width: "40px", background: "var(--primary-color)", borderRadius: "4px 4px 0 0", alignSelf: "flex-end"}}></div>
             <div style={{height: "60%", width: "40px", background: "var(--secondary-color)", borderRadius: "4px 4px 0 0", alignSelf: "flex-end"}}></div>
             <div style={{height: "80%", width: "40px", background: "var(--accent-color)", borderRadius: "4px 4px 0 0", alignSelf: "flex-end"}}></div>
             <div style={{height: "30%", width: "40px", background: "var(--danger-color)", borderRadius: "4px 4px 0 0", alignSelf: "flex-end"}}></div>
             <div style={{height: "90%", width: "40px", background: "var(--primary-color)", borderRadius: "4px 4px 0 0", alignSelf: "flex-end"}}></div>
           </div>
           <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
             <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span>
           </div>
        </div>

        <div className="glass-panel">
          <h3 style={{marginBottom: "1rem"}}>Recent Activities</h3>
          <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "1rem" }}>
            <li style={styles.listItem}>
              <div>
                <strong>Aarav Patel</strong> completed <em>Letter Catch</em>
              </div>
              <span style={styles.scoreBadge}>95%</span>
            </li>
            <li style={styles.listItem}>
               <div>
                <strong>Sita Sharma</strong> completed <em>Tracing Magic</em>
              </div>
              <span style={styles.scoreBadge}>80%</span>
            </li>
            <li style={styles.listItem}>
               <div>
                <strong>John Doe</strong> started <em>Number Sequence</em>
              </div>
              <span style={{...styles.scoreBadge, background: "#FEF3C7", color: "#D97706"}}>In Progress</span>
            </li>
          </ul>
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
    marginBottom: "3rem"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "2rem"
  },
  chartContainer: {
    display: "flex",
    flexDirection: "column",
  },
  mockChart: {
    flex: 1,
    borderBottom: "2px solid var(--border-color)",
    borderLeft: "2px solid var(--border-color)",
    display: "flex",
    justifyContent: "space-around",
    paddingTop: "2rem"
  },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem",
    background: "var(--bg-color)",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-color)"
  },
  scoreBadge: {
    background: "#D1FAE5",
    color: "#059669",
    padding: "0.25rem 0.75rem",
    borderRadius: "9999px",
    fontSize: "0.85rem",
    fontWeight: "bold"
  }
};

export default ProgressTracking;
