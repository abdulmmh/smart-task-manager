import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Search, Bell, LogOut, Menu } from 'lucide-react';
import { tasksApi } from '../../api/tasksApi';
import { computeNotifications } from '../../utils/notificationHelper';
import { getUserTheme } from '../../utils/projectTheme';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar({ title = 'Dashboard', onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [tasks, setTasks] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  // Storage key scoped to current user so admin and members don't share read state
  const currentUserId = user?.id || 'guest';
  const storageKey = `bm_read_notifs_${currentUserId}`;

  const [prevUserId, setPrevUserId] = useState(currentUserId);
  const [readIds, setReadIds] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Sync readIds if user changes during render (official React pattern)
  if (currentUserId !== prevUserId) {
    setPrevUserId(currentUserId);
    try {
      const stored = localStorage.getItem(`bm_read_notifs_${currentUserId}`);
      setReadIds(stored ? JSON.parse(stored) : []);
    } catch {
      setReadIds([]);
    }
  }

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      navigate(`/tasks?search=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  // Fetch tasks to compute active notifications
  useEffect(() => {
    let isMounted = true;
    tasksApi.getTasks()
      .then((data) => {
        if (isMounted) setTasks(data.tasks || []);
      })
      .catch(() => {
        // Silently ignore background notification fetch errors
      });

    return () => { isMounted = false; };
  }, [user]);

  // Compute notifications based on user role and tasks
  const notifications = useMemo(() => {
    return computeNotifications(tasks, user);
  }, [tasks, user]);

  // Compute only UNREAD notifications count for the red badge
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !readIds.includes(n.id)).length;
  }, [notifications, readIds]);

  // Mark all currently computed notifications as read and save to localStorage
  const markAllAsRead = useCallback(() => {
    if (notifications.length === 0) return;
    const currentIds = notifications.map((n) => n.id);
    const updatedIds = Array.from(new Set([...readIds, ...currentIds]));
    setReadIds(updatedIds);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedIds));
    } catch {
      // Ignore storage errors
    }
  }, [notifications, readIds, storageKey]);

  // Mark a single notification item as read
  const markItemAsRead = useCallback((itemId) => {
    if (!readIds.includes(itemId)) {
      const updatedIds = [...readIds, itemId];
      setReadIds(updatedIds);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updatedIds));
      } catch {
        // Ignore storage errors
      }
    }
  }, [readIds, storageKey]);

  // When user clicks the bell icon: only toggle dropdown (notifications are marked read when user clicks/views the task)
  const handleToggleDropdown = () => {
    setIsNotifOpen((prev) => !prev);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };

    if (isNotifOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isNotifOpen]);

  const handleSelectNotification = (item) => {
    markItemAsRead(item.id);
    setIsNotifOpen(false);
    // Navigate to tasks page filtered by this specific task title
    navigate(`/tasks?search=${encodeURIComponent(item.taskTitle)}`);
  };

  const handleViewAllTasks = () => {
    setIsNotifOpen(false);
    navigate('/tasks');
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

        <div className="topbar-title-box">
          <div className="topbar-breadcrumb">
            <span className="breadcrumb-brand">BrightMind</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">{title}</span>
          </div>
        </div>

        <div className="topbar-search-pill">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search tasks, projects, deliverables..." 
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
        </div>
      </div>

      <div className="topbar-right">
        {/* Notification Bell with Floating Dropdown */}
        <div className="notif-wrapper" ref={notifRef}>
          <button 
            type="button" 
            className={`icon-btn-circle ${isNotifOpen ? 'active' : ''}`}
            title={unreadCount > 0 ? `${unreadCount} unread alerts` : 'Notifications'}
            onClick={handleToggleDropdown}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="notif-badge-pill">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <>
              <div 
                className="notif-mobile-backdrop" 
                onClick={() => setIsNotifOpen(false)} 
                aria-hidden="true" 
              />
              <NotificationDropdown 
                notifications={notifications}
                readIds={readIds}
                unreadCount={unreadCount}
                userRole={user?.role}
                onClose={() => setIsNotifOpen(false)}
                onMarkAllAsRead={markAllAsRead}
                onSelectNotification={handleSelectNotification}
                onViewAll={handleViewAllTasks}
              />
            </>
          )}
        </div>

        {user && (
          <div className="user-profile-chip">
            <div className={`user-avatar-circle tone-${getUserTheme(user.id)}`}>
              {getInitials(user.name)}
            </div>
            <div className="user-details">
              <span className="user-details-name">{user.name}</span>
              <span className="user-details-role">
                {user.role === 'admin' ? 'Lead Admin' : 'Team Member'}
              </span>
            </div>
          </div>
        )}

        <button 
          type="button" 
          onClick={logout} 
          className="icon-btn-circle"
          title="Sign out of system"
          aria-label="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
