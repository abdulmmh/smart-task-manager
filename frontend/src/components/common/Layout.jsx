import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  const getPageTitle = (pathname) => {
    if (pathname.startsWith('/dashboard')) return 'Dashboard';
    if (pathname.startsWith('/projects')) return 'Projects';
    if (pathname.startsWith('/tasks')) return 'Tasks & Workflow';
    if (pathname.startsWith('/profile')) return 'My Profile';
    return 'Workspace';
  };

  return (
    <div className="app-container">
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div className="main-wrapper">
        <Navbar title={getPageTitle(location.pathname)} onToggleSidebar={toggleSidebar} />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
