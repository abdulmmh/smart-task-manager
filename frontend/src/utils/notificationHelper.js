/**
 * Computes role-specific notifications for BrightMind workspace:
 * - Admin: Overdue tasks ("date sesh") and completed tasks ("konta sesh").
 * - Member: Newly assigned tasks ("notun assign kora kaaj") and upcoming deadlines within 1-2 days ("deadline kachakachi").
 */

export function computeNotifications(tasks = [], user = null) {
  if (!user || !Array.isArray(tasks)) return [];

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const getDaysDiff = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length < 3) return null;
    const taskDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return Math.round((taskDate - today) / (1000 * 60 * 60 * 24));
  };

  const notifications = [];

  if (user.role === 'admin') {
    // 1. Overdue tasks ("date sesh") across the company
    tasks.forEach((t) => {
      const daysDiff = getDaysDiff(t.due_date);
      const isOverdue = t.status !== 'Completed' && (t.is_overdue || (daysDiff !== null && daysDiff < 0));

      if (isOverdue) {
        const overdueDays = daysDiff !== null ? Math.abs(daysDiff) : 1;
        notifications.push({
          id: `admin-overdue-${t.id}`,
          taskId: t.id,
          taskTitle: t.title,
          type: 'overdue',
          tag: overdueDays === 0 ? 'Due Today' : `${overdueDays}d Overdue`,
          title: t.title,
          subtitle: `Deadline passed (${t.due_date})`,
          context: `${t.project_name} • Assignee: ${t.assignee_name || 'Unassigned'}`,
          priority: t.priority,
          urgent: true,
          order: 1,
        });
      }
    });

    // 2. Completed tasks ("konta sesh")
    const completedTasks = tasks
      .filter((t) => t.status === 'Completed')
      .sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0))
      .slice(0, 6);

    completedTasks.forEach((t) => {
      notifications.push({
        id: `admin-completed-${t.id}`,
        taskId: t.id,
        taskTitle: t.title,
        type: 'completed',
        tag: 'Task Done',
        title: t.title,
        subtitle: `Completed in ${t.project_name}`,
        context: `Done by ${t.assignee_name || 'Team member'}`,
        priority: t.priority,
        urgent: false,
        order: 3,
      });
    });
  } else {
    // Member view: Only tasks assigned to this specific member
    const memberTasks = tasks.filter((t) => String(t.assignee_id) === String(user.id));

    memberTasks.forEach((t) => {
      const daysDiff = getDaysDiff(t.due_date);
      const isCompleted = t.status === 'Completed';

      // 1. Overdue assigned task
      if (!isCompleted && (t.is_overdue || (daysDiff !== null && daysDiff < 0))) {
        const overdueDays = daysDiff !== null ? Math.abs(daysDiff) : 1;
        notifications.push({
          id: `member-overdue-${t.id}`,
          taskId: t.id,
          taskTitle: t.title,
          type: 'overdue',
          tag: `${overdueDays}d Overdue`,
          title: t.title,
          subtitle: `Your deadline passed on ${t.due_date}`,
          context: `Project: ${t.project_name} • Priority: ${t.priority}`,
          priority: t.priority,
          urgent: true,
          order: 1,
        });
      }
      // 2. Approaching deadlines: within 1-2 days (or today)
      else if (!isCompleted && daysDiff !== null && daysDiff >= 0 && daysDiff <= 2) {
        const label = daysDiff === 0 ? 'Due Today' : daysDiff === 1 ? 'Due Tomorrow' : 'Due in 2 Days';
        notifications.push({
          id: `member-deadline-${t.id}`,
          taskId: t.id,
          taskTitle: t.title,
          type: 'due_soon',
          tag: label,
          title: t.title,
          subtitle: `Deadline is approaching (${t.due_date})`,
          context: `Project: ${t.project_name} • Priority: ${t.priority}`,
          priority: t.priority,
          urgent: true,
          order: 2,
        });
      }
      // 3. Newly assigned tasks (created/assigned within the last 7 days)
      else if (!isCompleted) {
        const createdDate = t.created_at ? new Date(t.created_at) : null;
        const daysOld = createdDate ? Math.round((today - createdDate) / (1000 * 60 * 60 * 24)) : 0;
        if (daysOld <= 7) {
          notifications.push({
            id: `member-new-${t.id}`,
            taskId: t.id,
            taskTitle: t.title,
            type: 'new_assignment',
            tag: daysOld === 0 ? 'Assigned Today' : `${daysOld}d ago`,
            title: t.title,
            subtitle: `New task assigned to you in ${t.project_name}`,
            context: `Deadline: ${t.due_date || 'No date set'} • ${t.priority} Priority`,
            priority: t.priority,
            urgent: false,
            order: 3,
          });
        }
      }
    });
  }

  // Sort: most urgent first (order 1 -> 2 -> 3)
  return notifications.sort((a, b) => a.order - b.order);
}
