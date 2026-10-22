const { query } = require('../config/db');

/**
 * Returns aggregated KPI metrics and overdue task alerts for the main executive dashboard
 */
async function getDashboardMetrics(req, res, next) {
  try {
    // 1. High-performance single aggregation query for core metrics
    const metricsSql = `
      SELECT 
        (SELECT COUNT(*)::int FROM projects) AS total_projects,
        COUNT(t.id)::int AS total_tasks,
        COUNT(t.id) FILTER (WHERE t.status = 'Completed')::int AS completed_tasks,
        COUNT(t.id) FILTER (WHERE t.status IN ('To Do', 'In Progress'))::int AS pending_tasks,
        COUNT(t.id) FILTER (WHERE t.due_date < CURRENT_DATE AND t.status != 'Completed')::int AS overdue_tasks,
        COUNT(t.id) FILTER (WHERE t.priority = 'High' AND t.status != 'Completed')::int AS high_priority_pending,
        CASE 
          WHEN COUNT(t.id) = 0 THEN 0
          ELSE ROUND((COUNT(t.id) FILTER (WHERE t.status = 'Completed')::numeric / COUNT(t.id)::numeric) * 100)::int
        END AS completion_rate
      FROM tasks t;
    `;

    const metricsResult = await query(metricsSql);

    // 2. Fetch overdue tasks for immediate notification banner
    const overdueSql = `
      SELECT 
        t.id, 
        t.title, 
        t.priority, 
        TO_CHAR(t.due_date, 'YYYY-MM-DD') AS due_date,
        p.name AS project_name,
        u.name AS assignee_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.due_date < CURRENT_DATE AND t.status != 'Completed'
      ORDER BY t.due_date ASC, t.priority DESC
      LIMIT 5;
    `;
    const overdueResult = await query(overdueSql);

    // 3. Project progress distribution (for progress charts)
    const projectsSummarySql = `
      SELECT 
        p.id,
        p.name,
        COUNT(t.id)::int AS total_tasks,
        COUNT(t.id) FILTER (WHERE t.status = 'Completed')::int AS completed_tasks,
        CASE 
          WHEN COUNT(t.id) = 0 THEN 0
          ELSE ROUND((COUNT(t.id) FILTER (WHERE t.status = 'Completed')::numeric / COUNT(t.id)::numeric) * 100)::int
        END AS progress
      FROM projects p
      LEFT JOIN tasks t ON p.id = t.project_id
      GROUP BY p.id
      ORDER BY progress ASC
      LIMIT 5;
    `;
    const projectsSummaryResult = await query(projectsSummarySql);

    res.json({
      metrics: metricsResult.rows[0],
      overdueAlerts: overdueResult.rows,
      projectSummaries: projectsSummaryResult.rows,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardMetrics,
};
