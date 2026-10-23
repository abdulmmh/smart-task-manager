const { query } = require('../config/db');

/**
 * List all projects with computed task metrics and completion progress
 */
async function getProjects(req, res, next) {
  try {
    const result = await query(`
      SELECT 
        p.id, 
        p.name, 
        p.description, 
        p.created_by,
        u.name AS created_by_name,
        p.created_at, 
        p.updated_at,
        COUNT(t.id)::int AS total_tasks,
        COUNT(t.id) FILTER (WHERE t.status = 'Completed')::int AS completed_tasks,
        COUNT(t.id) FILTER (WHERE t.status IN ('To Do', 'In Progress'))::int AS pending_tasks,
        COUNT(t.id) FILTER (WHERE t.due_date < CURRENT_DATE AND t.status != 'Completed')::int AS overdue_tasks,
        CASE 
          WHEN COUNT(t.id) = 0 THEN 0
          ELSE ROUND((COUNT(t.id) FILTER (WHERE t.status = 'Completed')::numeric / COUNT(t.id)::numeric) * 100)::int
        END AS progress_percentage
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN tasks t ON p.id = t.project_id
      GROUP BY p.id, u.name
      ORDER BY p.created_at DESC;
    `);

    res.json({ projects: result.rows });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single project by ID with its associated tasks
 */
async function getProjectById(req, res, next) {
  try {
    const { id } = req.params;

    const projectResult = await query(
      `SELECT p.*, u.name AS created_by_name
       FROM projects p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const tasksResult = await query(
      `SELECT t.*, u.name AS assignee_name, u.email AS assignee_email
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE t.project_id = $1
       ORDER BY t.created_at DESC`,
      [id]
    );

    res.json({
      project: projectResult.rows[0],
      tasks: tasksResult.rows,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new project (Admin only)
 */
async function createProject(req, res, next) {
  try {
    const { name, description } = req.body;

    const result = await query(
      `INSERT INTO projects (name, description, created_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name.trim(), description ? description.trim() : null, req.user.id]
    );

    res.status(201).json({
      message: 'Project created successfully.',
      project: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing project (Admin only)
 */
async function updateProject(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const hasName = 'name' in req.body;
    const hasDesc = 'description' in req.body;

    const result = await query(
      `UPDATE projects
       SET name = CASE WHEN $1::boolean THEN $2 ELSE name END,
           description = CASE WHEN $3::boolean THEN $4 ELSE description END,
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [
        hasName,
        name ? name.trim() : null,
        hasDesc,
        description !== undefined && description !== null ? description.trim() : null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    res.json({
      message: 'Project updated successfully.',
      project: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a project (Admin only) — automatically cascades to delete all child tasks
 */
async function deleteProject(req, res, next) {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM projects WHERE id = $1 RETURNING id, name',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    res.json({
      message: `Project '${result.rows[0].name}' and all associated tasks deleted successfully.`,
      deletedId: id,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
