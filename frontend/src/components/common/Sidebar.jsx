import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, CheckCircle2, Database, X } from 'lucide-react';
import client from '../../api/client';

export default function Sidebar({ isOpen, onClose }) {
  const [isDbConnected, setIsDbConnected] = useState(true);

  useEffect(() => {
    let isMounted = true;
    client.get('/health')
      .then((res) => { 
        if (isMounted) setIsDbConnected(res.data?.database === 'connected'); 
      })
      .catch(() => { 
        if (isMounted) setIsDbConnected(false); 
      });
    return () => { isMounted = false; };
  }, []);

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <CheckCircle2 size={22} color="#FFFFFF" strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sidebar-title">Bright Mind</div>
            <div className="sidebar-subtitle">Task & Project Hub</div>
          </div>
          <button 
            type="button" 
            className="sidebar-close-btn" 
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-section-title">Main Menu</div>
        <nav className="sidebar-nav">
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink 
            to="/tasks" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <CheckSquare size={18} />
            <span>Task</span>
          </NavLink>

          <NavLink 
            to="/projects" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <FolderKanban size={18} />
            <span>Projects</span>
          </NavLink>
        </nav>

        <div className="sidebar-section-title">Infrastructure</div>
        <div className="sidebar-bottom">
          <Database size={15} color={isDbConnected ? 'var(--success)' : 'var(--danger)'} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)' }}>
              {isDbConnected ? 'PostgreSQL Active' : 'PostgreSQL Down'}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {isDbConnected ? 'Database Connected' : 'Connection Failed'}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
