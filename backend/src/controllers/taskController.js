const { query } = require('../config/db');

/**
 * List tasks with multi-field filtering, search, and overdue calculation
 * Query parameters supported:
 * - search (matches title or description)
 * - projectId (filter by project)
 * - status (filter by To Do, In Progress, Completed)
 * - priority (filter by Low, Medium, High)
 * - assigneeId (filter by assigned user)
 * - overdue (if 'true', filters only overdue incomplete tasks)
 */
async function getTasks(req, res, next) {
  try {
    const rawSearch = req.query.search;
    const search = typeof rawSearch === 'string' ? rawSearch : Array.isArray(rawSearch) ? rawSearch[0] : '';
    const projectId = req.query.projectId || req.query.project_id;
    const status = req.query.status;
    const priority = req.query.priority;
    const assigneeId = req.query.assigneeId || req.query.assignee_id;
    const overdue = req.query.overdue;

    const conditions = [];
    const values = [];

    if (search && search.trim() !== '') {
      values.push(`%${search.trim()}%`);
      conditions.push(`(t.title ILIKE $${values.length} OR t.description ILIKE $${values.length})`);
    }

    if (projectId) {
      values.push(projectId);
      conditions.push(`t.project_id = $${values.length}`);
    }

    if (status) {
      values.push(status);
      conditions.push(`t.status = $${values.length}`);
    }

    if (priority) {
      values.push(priority);
      conditions.push(`t.priority = $${values.length}`);
    }

    if (assigneeId) {
      values.push(assigneeId);
      conditions.push(`t.assignee_id = $${values.length}`);
    }

    if (overdue === 'true') {
      conditions.push(`(t.due_date < CURRENT_DATE AND t.status != 'Completed')`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        t.id, 
        t.title, 
        t.description, 
        t.status, 
        t.priority, 
        TO_CHAR(t.due_date, 'YYYY-MM-DD') AS due_date,
        t.project_id, 
        p.name AS project_name,
        t.assignee_id, 
        u_assignee.name AS assignee_name,
        u_assignee.email AS assignee_email,
        t.created_by,
        u_creator.name AS created_by_name,
        t.created_at, 
        t.updated_at,
        (t.due_date < CURRENT_DATE AND t.status != 'Completed') AS is_overdue
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id
      LEFT JOIN users u_creator ON t.created_by = u_creator.id
      ${whereClause}
      ORDER BY 
        CASE WHEN t.due_date < CURRENT_DATE AND t.status != 'Completed' THEN 0 ELSE 1 END,
        CASE t.priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 3 ELSE 4 END,
        t.due_date ASC NULLS LAST,
        t.created_at DESC;
    `;

    const result = await query(sql, values);
    res.json({ tasks: result.rows, totalCount: result.rows.length });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single task by ID
 */
async function getTaskById(req, res, next) {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        t.id, 
        t.title, 
        t.description, 
        t.status, 
        t.priority, 
        TO_CHAR(t.due_date, 'YYYY-MM-DD') AS due_date,
        t.project_id, 
        p.name AS project_name,
        t.assignee_id, 
        u_assignee.name AS assignee_name,
        u_assignee.email AS assignee_email,
        t.created_by,
        u_creator.name AS created_by_name,
        t.created_at, 
        t.updated_at,
        (t.due_date < CURRENT_DATE AND t.status != 'Completed') AS is_overdue
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id
      LEFT JOIN users u_creator ON t.created_by = u_creator.id
      WHERE t.id = $1;
    `;

    const result = await query(sql, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    res.json({ task: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new task (Admin only)
 */
async function createTask(req, res, next) {
  try {
    const { title, description, status, priority, due_date, project_id, assignee_id } = req.body;

    // Check project exists
    const projectCheck = await query('SELECT id FROM projects WHERE id = $1', [project_id]);
    if (projectCheck.rows.length === 0) {
      return res.status(400).json({ error: 'The specified project does not exist.' });
    }

    // Check assignee exists if provided
    if (assignee_id) {
      const assigneeCheck = await query('SELECT id FROM users WHERE id = $1', [assignee_id]);
      if (assigneeCheck.rows.length === 0) {
        return res.status(400).json({ error: 'The specified assignee user does not exist.' });
      }
    }

    const insertSql = `
      INSERT INTO tasks (
        title, description, status, priority, due_date, project_id, assignee_id, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const result = await query(insertSql, [
      title.trim(),
      description ? description.trim() : null,
      status || 'To Do',
      priority || 'Medium',
      due_date || null,
      project_id,
      assignee_id || null,
      req.user.id,
    ]);

    res.status(201).json({
      message: 'Task created successfully.',
      task: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing task
 * RBAC Rules:
 * - Admins can update all fields (title, description, status, priority, due_date, assignee_id, project_id)
 * - Team Members can only update the status of tasks assigned to them
 */
async function updateTask(req, res, next) {
  try {
    const { id } = req.params;
    const { title, description, status, priority, due_date, project_id, assignee_id } = req.body;

    // Fetch existing task to check permissions
    const existing = await query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const currentTask = existing.rows[0];

    // If regular team member:
    if (req.user.role !== 'admin') {
      if (currentTask.assignee_id !== req.user.id) {
        return res.status(403).json({
          error: 'Access denied. You can only update tasks that are assigned to you.'
        });
      }

      // Member can only change status — reject if other fields are present
      const forbiddenKeys = Object.keys(req.body).filter((key) => key !== 'status');
      if (forbiddenKeys.length > 0) {
        return res.status(403).json({
          error: 'Access denied. Team members are only permitted to update task status.'
        });
      }

      if (!status) {
        return res.status(400).json({ error: 'Status update is required.' });
      }

      const updateStatusResult = await query(
        `UPDATE tasks 
         SET status = $1, updated_at = NOW() 
         WHERE id = $2 
         RETURNING *`,
        [status, id]
      );

      return res.json({
        message: 'Task status updated successfully.',
        task: updateStatusResult.rows[0],
      });
    }

    // Admin updating:
    const hasTitle = 'title' in req.body;
    const hasDesc = 'description' in req.body;
    const hasStatus = 'status' in req.body;
    const hasPriority = 'priority' in req.body;
    const hasDueDate = 'due_date' in req.body;
    const hasProjectId = 'project_id' in req.body;
    const hasAssignee = 'assignee_id' in req.body;

    const updateSql = `
      UPDATE tasks
      SET 
        title = CASE WHEN $1::boolean THEN $2 ELSE title END,
        description = CASE WHEN $3::boolean THEN $4 ELSE description END,
        status = CASE WHEN $5::boolean THEN $6 ELSE status END,
        priority = CASE WHEN $7::boolean THEN $8 ELSE priority END,
        due_date = CASE WHEN $9::boolean THEN $10::date ELSE due_date END,
        project_id = CASE WHEN $11::boolean THEN $12::uuid ELSE project_id END,
        assignee_id = CASE WHEN $13::boolean THEN $14::uuid ELSE assignee_id END,
        updated_at = NOW()
      WHERE id = $15
      RETURNING *;
    `;

    const result = await query(updateSql, [
      hasTitle,
      title ? title.trim() : null,
      hasDesc,
      description !== undefined && description !== null ? description.trim() : null,
      hasStatus,
      status || null,
      hasPriority,
      priority || null,
      hasDueDate,
      due_date || null,
      hasProjectId,
      project_id || null,
      hasAssignee,
      assignee_id || null,
      id,
    ]);

    res.json({
      message: 'Task updated successfully.',
      task: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a task (Admin only)
 */
async function deleteTask(req, res, next) {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM tasks WHERE id = $1 RETURNING id, title', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    res.json({
      message: `Task '${result.rows[0].title}' deleted successfully.`,
      deletedId: id,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
