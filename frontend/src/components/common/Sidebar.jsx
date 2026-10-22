import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">BM</div>
        <div>
          <div className="sidebar-title">Bright Mind</div>
          <div className="sidebar-subtitle">Project & Task Hub</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={16} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink 
          to="/projects" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <FolderKanban size={16} />
          <span>Projects</span>
        </NavLink>

        <NavLink 
          to="/tasks" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
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
        fontFamily: 'ui-monospace, monospace'
      }}>
        <span>● PostgreSQL Connected</span>
      </div>
    </aside>
  );
}
