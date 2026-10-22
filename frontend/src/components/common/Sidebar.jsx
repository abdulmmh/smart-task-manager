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
          <div className="sidebar-subtitle">Task & Project Hub</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink 
          to="/projects" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <FolderKanban size={18} />
          <span>Projects</span>
        </NavLink>

        <NavLink 
          to="/tasks" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <CheckSquare size={18} />
          <span>Tasks & Workflow</span>
        </NavLink>
      </nav>

      <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', fontSize: '12px', color: '#94a3b8' }}>
        <span>v1.0.0 • PostgreSQL Connected</span>
      </div>
    </aside>
  );
}
