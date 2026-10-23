
export default function Badge({ type, value, isOverdue }) {
  if (isOverdue) {
    return (
      <span className="badge badge-overdue" title="Past deadline and incomplete">
        <span className="badge-dot" />
        Overdue
      </span>
    );
  }

  if (type === 'status') {
    switch (value) {
      case 'Completed':
        return (
          <span className="badge badge-completed">
            <span className="badge-dot" />
            Completed
          </span>
        );
      case 'In Progress':
        return (
          <span className="badge badge-in-progress">
            <span className="badge-dot" />
            In Progress
          </span>
        );
      case 'To Do':
      default:
        return (
          <span className="badge badge-todo">
            <span className="badge-dot" />
            To Do
          </span>
        );
    }
  }

  if (type === 'priority') {
    switch (value) {
      case 'High':
        return (
          <span className="badge badge-high">
            <span className="badge-dot" />
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="badge badge-medium">
            <span className="badge-dot" />
            Medium
          </span>
        );
      case 'Low':
      default:
        return (
          <span className="badge badge-low">
            <span className="badge-dot" />
            Low
          </span>
        );
    }
  }

  if (type === 'role') {
    const isAdmin = value === 'admin';
    return (
      <span style={{
        fontSize: '11px',
        fontWeight: '600',
        padding: '2px 8px',
        borderRadius: '9999px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        backgroundColor: isAdmin ? 'var(--navy-dark)' : 'var(--bg-subtle)',
        color: isAdmin ? '#ffffff' : 'var(--text-secondary)',
        border: isAdmin ? '1px solid var(--navy-dark)' : '1px solid var(--border-subtle)',
      }}>
        {isAdmin ? 'Admin' : 'Member'}
      </span>
    );
  }

  return <span className="badge">{value}</span>;
}
