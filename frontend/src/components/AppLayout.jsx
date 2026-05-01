import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearSession, getStoredUser } from '../utils/auth';

const navigationItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/projects', label: 'Projects' },
  { to: '/tasks', label: 'Tasks' },
];

function AppLayout() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <h1>Team Task Manager</h1>
          <p>Simple project and task tracking with role-based access.</p>
        </div>

        <nav className="topbar-nav">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="topbar-user">
          <span className="tag">
            {user?.name} · {user?.role}
          </span>
          <button className="btn btn-secondary btn-small" type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="page-shell">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
