import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Sidebar.css';

const navConfig = {
  admin: [
    { to: '/admin-dashboard', icon: '📊', label: 'Overview' },
    { to: '/users', icon: '👥', label: 'Educators' },
    { to: '/students', icon: '🎓', label: 'Students' },
    { to: '/analytics', icon: '📈', label: 'Analytics' },
  ],
  teacher: [
    { to: '/dashboard', icon: '🏫', label: 'My Classroom' },
    { to: '/students', icon: '📋', label: 'Student List' },
    { to: '/screening/adaptive', icon: '📝', label: 'New Screening' },
    { to: '/screening/nlp', icon: '🧠', label: 'NLP Observation' },
    { to: '/analytics', icon: '📈', label: 'Analytics' },
    { to: '/profile', icon: '👤', label: 'Profile' },
  ],
  parent: [
    { to: '/dashboard', icon: '🏠', label: 'Home' },
    { to: '/students', icon: '👶', label: 'My Child' },
    { to: '/analytics', icon: '📈', label: 'Progress' },
    { to: '/profile', icon: '👤', label: 'Profile' },
  ],
};

const Sidebar = ({ role = 'teacher' }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const navItems = navConfig[role] || navConfig.teacher;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-icon">🌊</span>
        <span className="sidebar-brand-text">Taranga</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to ||
            (item.to !== '/dashboard' && item.to !== '/admin-dashboard' && location.pathname.startsWith(item.to));
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span className="sidebar-link-label">{item.label}</span>
              {isActive && <span className="sidebar-link-indicator" />}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-role-badge">
          {role === 'admin' ? '🛡️ Admin' : role === 'parent' ? '👨‍👩‍👧 Parent' : '🍎 Educator'}
        </div>
        <button onClick={handleLogout} className="sidebar-logout">
          <span>🚪</span> Log Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
