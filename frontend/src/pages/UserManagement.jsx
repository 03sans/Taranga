import React, { useState } from 'react';

const UserManagement = () => {
  // Mock data
  const [users, setUsers] = useState([
    { id: 1, name: "Anita Sharma", email: "anita@school.edu", role: "teacher", active: true },
    { id: 2, name: "Rahul Singh", email: "rahul@school.edu", role: "parent", active: true },
    { id: 3, name: "Vikram Mehta", email: "vikram@school.edu", role: "teacher", active: false }
  ]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={{ color: "var(--primary-color)" }}>User Management</h1>
        <button className="btn btn-primary">+ Add New User</button>
      </div>

      <div className="glass-panel" style={{ overflowX: "auto" }}>
        <table style={styles.table}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--text-secondary)", borderBottom: "2px solid var(--border-color)" }}>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Email Address</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                <td style={{...styles.td, fontWeight: "500"}}>{user.name}</td>
                <td style={styles.td}>{user.email}</td>
                <td style={styles.td}><span style={styles.roleBadge}>{user.role.toUpperCase()}</span></td>
                <td style={styles.td}>
                  {user.active ? 
                    <span style={styles.activeBadge}>Active</span> : 
                    <span style={styles.inactiveBadge}>Inactive</span>
                  }
                </td>
                <td style={styles.td}>
                  <button className="btn" style={{ padding: "0.25rem 0.75rem", fontSize: "0.85rem", border: "1px solid var(--border-color)" }}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
    marginBottom: "2rem"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  th: {
    padding: "1rem",
  },
  td: {
    padding: "1rem",
  },
  roleBadge: {
    background: "#F3F4F6",
    color: "#4B5563",
    padding: "0.25rem 0.5rem",
    borderRadius: "6px",
    fontSize: "0.8rem",
    fontWeight: "bold",
    letterSpacing: "1px"
  },
  activeBadge: {
    color: "var(--secondary-color)",
    fontWeight: "600"
  },
  inactiveBadge: {
    color: "var(--danger-color)",
    fontWeight: "600"
  }
}

export default UserManagement;
