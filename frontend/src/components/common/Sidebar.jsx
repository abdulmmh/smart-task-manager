import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, X } from 'lucide-react';
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
          <div className="sidebar-logo">BM</div>
          <div style={{ flex: 1 }}>
            <div className="sidebar-title">Bright Mind</div>
            <div className="sidebar-subtitle">Project & Task Hub</div>
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

        <nav className="sidebar-nav">
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink 
            to="/projects" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <FolderKanban size={16} />
            <span>Projects</span>
          </NavLink>

          <NavLink 
            to="/tasks" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <CheckSquare size={16} />
            <span>Tasks & Workflow</span>
          </NavLink>
        </nav>

        <div style={{
          padding: '14px 18px',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontFamily: 'ui-monospace, monospace',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isDbConnected ? 'var(--success)' : 'var(--danger)',
            display: 'inline-block'
          }} />
          <span>{isDbConnected ? 'PostgreSQL Connected' : 'PostgreSQL Disconnected'}</span>
        </div>
      </aside>
    </>
  );
}
