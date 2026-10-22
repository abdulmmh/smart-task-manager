import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout() {
  const location = useLocation();

  const getPageTitle = (pathname) => {
    if (pathname.startsWith('/dashboard')) return 'Executive Dashboard & Metrics';
    if (pathname.startsWith('/projects')) return 'Project Portfolio Management';
    if (pathname.startsWith('/tasks')) return 'Task Management & Assignment';
    return 'Task & Project Hub';
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-wrapper">
        <Navbar title={getPageTitle(location.pathname)} />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
