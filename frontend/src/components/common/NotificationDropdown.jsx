import { useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  X, 
  BellOff,
  FolderKanban,
  CheckCheck
} from 'lucide-react';

export default function NotificationDropdown({ 
  notifications = [], 
  readIds = [],
  unreadCount = 0,
  userRole = 'member', 
  onClose, 
  onMarkAllAsRead,
  onSelectNotification,
  onViewAll 
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'urgent' | 'unread'

  const urgentCount = notifications.filter((n) => n.urgent).length;
  
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'urgent') return n.urgent;
    if (filter === 'unread') return !readIds.includes(n.id);
    return true;
  });

  const renderIcon = (type) => {
    switch (type) {
      case 'overdue':
        return <AlertTriangle size={15} color="#DC2626" />;
      case 'due_soon':
        return <Clock size={15} color="#D97706" />;
      case 'completed':
        return <CheckCircle2 size={15} color="#059669" />;
      case 'new_assignment':
      default:
        return <Sparkles size={15} color="#2563EB" />;
    }
  };

  const getToneClass = (type) => {
    switch (type) {
      case 'overdue':
        return 'notif-tone-overdue';
      case 'due_soon':
        return 'notif-tone-duesoon';
      case 'completed':
        return 'notif-tone-completed';
      case 'new_assignment':
      default:
        return 'notif-tone-new';
    }
  };

  return (
    <div className="notif-dropdown" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="notif-header">
        <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h4 className="notif-title">Notifications</h4>
            {unreadCount > 0 ? (
              <span className="notif-count-pill">{unreadCount} new</span>
            ) : (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', whiteSpace: 'nowrap' }}>
                All caught up
              </span>
            )}
          </div>
          <p className="notif-subtitle">
            {userRole === 'admin' 
              ? 'Overdue deadlines & completed milestones' 
              : 'Your new assignments & approaching deadlines'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {unreadCount > 0 && (
            <button 
              type="button" 
              onClick={onMarkAllAsRead}
              className="notif-mark-read-btn"
              title="Mark all notifications as read"
            >
              <CheckCheck size={13} />
              <span>Mark all read</span>
            </button>
          )}

          <button 
            type="button" 
            onClick={onClose} 
            className="notif-close-btn"
            aria-label="Close notification popover"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Quick Filter Tabs (if notifications exist) */}
      {notifications.length > 0 && (
        <div className="notif-filter-tabs">
          <button 
            type="button" 
            className={`notif-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({notifications.length})
          </button>
          {urgentCount > 0 && (
            <button 
              type="button" 
              className={`notif-tab urgent-tab ${filter === 'urgent' ? 'active' : ''}`}
              onClick={() => setFilter('urgent')}
            >
              Urgent ({urgentCount})
            </button>
          )}
          {unreadCount > 0 && (
            <button 
              type="button" 
              className={`notif-tab ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </button>
          )}
        </div>
      )}

      {/* Notifications List */}
      <div className="notif-list">
        {filteredNotifications.length === 0 ? (
          <div className="notif-empty">
            <div className="notif-empty-icon">
              <BellOff size={22} color="var(--text-light)" />
            </div>
            <div style={{ fontWeight: '700', color: 'var(--navy-dark)', fontSize: '13.5px' }}>
              {filter === 'unread' ? 'No Unread Notifications' : 'All Caught Up!'}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '240px' }}>
              {filter === 'urgent' 
                ? 'No urgent alerts right now.' 
                : filter === 'unread'
                ? 'You have viewed all active alerts and updates.'
                : 'No pending deadlines or activity right now.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((item) => {
            const isUnread = !readIds.includes(item.id);

            return (
              <div 
                key={item.id} 
                className={`notif-item ${getToneClass(item.type)} ${isUnread ? 'is-unread' : 'is-read'}`}
                onClick={() => onSelectNotification(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectNotification(item);
                  }
                }}
              >
                <div className="notif-item-icon">
                  {renderIcon(item.type)}
                </div>

                <div className="notif-item-body">
                  <div className="notif-item-head">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                      {isUnread && <span className="notif-unread-dot" title="Unread alert" />}
                      <span className="notif-item-title" title={item.title}>
                        {item.title}
                      </span>
                    </div>
                    <span className={`notif-tag notif-tag-${item.type}`}>
                      {item.tag}
                    </span>
                  </div>

                  <div className="notif-item-sub">
                    {item.subtitle}
                  </div>

                  <div className="notif-item-context">
                    <FolderKanban size={11} />
                    <span>{item.context}</span>
                  </div>
                </div>

                <div className="notif-item-arrow">
                  <ArrowRight size={13} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="notif-footer">
        <button 
          type="button" 
          onClick={onViewAll} 
          className="notif-footer-link"
        >
          <span>Open Full Tasks & Workflow Board</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
