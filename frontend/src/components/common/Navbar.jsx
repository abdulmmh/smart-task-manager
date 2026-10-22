import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Badge from './Badge';
import { LogOut } from 'lucide-react';

export default function Navbar({ title = 'Overview' }) {
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
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>{title}</h2>
      </div>

      <div className="topbar-right">
        {user && (
          <div className="user-badge">
            <div className="user-avatar">{getInitials(user.name)}</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
                {user.name}
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
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
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
