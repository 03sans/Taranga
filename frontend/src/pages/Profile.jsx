import React from 'react';

const Profile = () => {
  return (
    <div style={styles.container}>
      <h1 style={{ color: "var(--primary-color)", marginBottom: "2rem" }}>My Profile</h1>
      
      <div className="glass-panel" style={{ maxWidth: "600px", background: "var(--surface-color)" }}>
        <div style={styles.profileHeader}>
          <div style={styles.avatar}>T</div>
          <div>
            <h2>John Doe</h2>
            <p style={{ color: "var(--primary-color)", fontWeight: "500" }}>Teacher • Grade 4</p>
          </div>
        </div>

        <hr style={{ borderTop: "1px solid var(--border-color)", borderBottom: "none", margin: "2rem 0" }} />

        <form style={styles.form}>
          <div style={styles.inputGroup}>
            <label>Email Details</label>
            <input type="email" value="john@example.com" disabled />
          </div>
          
          <div style={styles.inputGroup}>
            <label>Update Password</label>
            <input type="password" placeholder="••••••••" />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem" }}>
            Save Changes
          </button>
        </form>
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
  profileHeader: {
    display: "flex",
    alignItems: "center",
    gap: "1.5rem"
  },
  avatar: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, var(--primary-color), var(--secondary-color))",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "2rem",
    fontWeight: "bold",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem"
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    fontWeight: "500"
  }
};

export default Profile;
