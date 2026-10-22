import React from 'react';

export default function Badge({ type, value, isOverdue }) {
  if (isOverdue) {
    return (
      <span className="badge badge-overdue" title="Past deadline and incomplete">
        ⚠️ Overdue
      </span>
    );
  }

  if (type === 'status') {
    switch (value) {
      case 'Completed':
        return <span className="badge badge-completed">✓ Completed</span>;
      case 'In Progress':
        return <span className="badge badge-in-progress">⏳ In Progress</span>;
      case 'To Do':
      default:
        return <span className="badge badge-todo">○ To Do</span>;
    }
  }

  if (type === 'priority') {
    switch (value) {
      case 'High':
        return <span className="badge badge-high">▲ High</span>;
      case 'Medium':
        return <span className="badge badge-medium">■ Medium</span>;
      case 'Low':
      default:
        return <span className="badge badge-low">▼ Low</span>;
    }
  }

  if (type === 'role') {
    return (
      <span style={{
        fontSize: '11px',
        fontWeight: '700',
        padding: '2px 8px',
        borderRadius: '9999px',
        textTransform: 'uppercase',
        backgroundColor: value === 'admin' ? '#e0e7ff' : '#f1f5f9',
        color: value === 'admin' ? '#4338ca' : '#475569',
        border: value === 'admin' ? '1px solid #c7d2fe' : '1px solid #e2e8f0',
      }}>
        {value === 'admin' ? 'Admin' : 'Member'}
      </span>
    );
  }

  return <span className="badge">{value}</span>;
}
