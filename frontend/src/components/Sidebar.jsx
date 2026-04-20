import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboardIcon, UsersIcon, BarChartIcon, ClipboardListIcon,
  TargetIcon, BrainIcon, UserIcon, LogOutIcon, ShieldIcon, HomeIcon,
  GraduationCapIcon, TrendingUpIcon,
} from './icons';
import './Sidebar.css';

const navConfig = {
  admin: [
    { to: '/admin-dashboard', icon: LayoutDashboardIcon, label: 'Overview' },
    { to: '/users',           icon: UsersIcon,           label: 'Users' },
    { to: '/analytics',       icon: BarChartIcon,        label: 'Analytics' },
  ],
  teacher: [
    { to: '/dashboard',        icon: LayoutDashboardIcon, label: 'My Classroom' },
    { to: '/students',         icon: GraduationCapIcon,   label: 'Student List' },
    { to: '/interventions',    icon: TargetIcon,          label: 'Interventions' },
    { to: '/screening/adaptive', icon: ClipboardListIcon, label: 'New Screening' },
    { to: '/screening/nlp',    icon: BrainIcon,           label: 'NLP Observation' },
    { to: '/analytics',        icon: BarChartIcon,        label: 'Analytics' },
    { to: '/profile',          icon: UserIcon,            label: 'Profile' },
  ],
  parent: [
    { to: '/dashboard', icon: HomeIcon,        label: 'Home' },
    { to: '/students',  icon: UsersIcon,       label: 'My Child' },
    { to: '/analytics', icon: TrendingUpIcon,  label: 'Progress' },
    { to: '/profile',   icon: UserIcon,        label: 'Profile' },
  ],
};

const ROLE_LABELS = { admin: 'Administrator', teacher: 'Educator', parent: 'Parent' };

const Sidebar = ({ role = 'teacher' }) => {
  const location = useLocation();
  const navigate  = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('role');
    navigate('/login');
  };

  const navItems = navConfig[role] || navConfig.teacher;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-dot" />
        <span className="sidebar-brand-text">Taranga</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.to ||
            (item.to !== '/dashboard' &&
             item.to !== '/admin-dashboard' &&
             location.pathname.startsWith(item.to));
          const IconComp = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`sidebar-link${isActive ? ' sidebar-link--active' : ''}`}
            >
              <span className="sidebar-link-icon">
                <IconComp size={15} />
              </span>
              <span className="sidebar-link-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-role-badge">{ROLE_LABELS[role] || role}</div>
        <button onClick={handleLogout} className="sidebar-logout">
          <LogOutIcon size={14} />
          Sign out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
