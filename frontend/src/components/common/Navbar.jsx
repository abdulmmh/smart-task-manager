import { useAuth } from '../../context/AuthContext';
import Badge from './Badge';
import { LogOut, Menu } from 'lucide-react';

export default function Navbar({ title = 'Overview', onToggleSidebar }) {
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button 
          type="button" 
          className="hamburger-btn" 
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>
        <h2 className="topbar-title">
          {title}
        </h2>
      </div>

      <div className="topbar-right">
        {user && (
          <div className="user-badge">
            <div className="user-avatar">{getInitials(user.name)}</div>
            <div className="user-info-text">
              <span className="user-name">
                {user.name}
              </span>
              <span className="user-email">
                {user.email}
              </span>
            </div>
            <Badge type="role" value={user.role} />
          </div>
        )}

        <button 
          type="button" 
          onClick={logout} 
          className="btn btn-secondary btn-sm"
          title="Sign out of system"
        >
          <LogOut size={13} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
