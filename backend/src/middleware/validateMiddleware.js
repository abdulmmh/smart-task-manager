/**
 * Input validation middleware for registration, login, projects, and tasks
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_STATUSES = ['To Do', 'In Progress', 'Completed'];
const ALLOWED_PRIORITIES = ['Low', 'Medium', 'High'];

/**
 * Strict calendar date validation (YYYY-MM-DD)
 * Rejects invalid dates like '2026-02-31' and non-standard formats like '10/05/2026'
 */
function isValidDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function validateRegister(req, res, next) {
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required and cannot be empty.' });
  }

  if (name.trim().length > 100) {
    return res.status(400).json({ error: 'Name cannot exceed 100 characters.' });
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim()) || email.trim().length > 255) {
    return res.status(400).json({ error: 'A valid email address (max 255 characters) is required.' });
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  if (password.length > 128) {
    return res.status(400).json({ error: 'Password cannot exceed 128 characters.' });
  }

  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim()) || email.trim().length > 255) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ error: 'Password is required.' });
  }

  next();
}

function validateProject(req, res, next) {
  const { name, description } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Project name is required and cannot be empty.' });
  }

  if (name.trim().length > 150) {
    return res.status(400).json({ error: 'Project name cannot exceed 150 characters.' });
  }

  if (description !== undefined && description !== null && typeof description !== 'string') {
    return res.status(400).json({ error: 'Project description must be a string.' });
  }

  next();
}

function validateTask(req, res, next) {
  const { title, project_id, status, priority, due_date, description, assignee_id } = req.body;

  // Title validation for creation (required)
  if (req.method === 'POST') {
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Task title is required and cannot be empty.' });
    }
    if (title.trim().length > 200) {
      return res.status(400).json({ error: 'Task title cannot exceed 200 characters.' });
    }

    if (!project_id || typeof project_id !== 'string' || !UUID_REGEX.test(project_id)) {
      return res.status(400).json({ error: 'A valid project_id (UUID) is required.' });
    }
  }

  // Title validation for update (if supplied, cannot be whitespace-only or >200 chars)
  if (req.method === 'PUT' && 'title' in req.body) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Task title cannot be empty or whitespace only.' });
    }
    if (title.trim().length > 200) {
      return res.status(400).json({ error: 'Task title cannot exceed 200 characters.' });
    }
  }

  // Validate project_id on update if supplied
  if (req.method === 'PUT' && 'project_id' in req.body) {
    if (!project_id || typeof project_id !== 'string' || !UUID_REGEX.test(project_id)) {
      return res.status(400).json({ error: 'A valid project_id (UUID) is required.' });
    }
  }

  // Validate description if provided
  if (description !== undefined && description !== null && typeof description !== 'string') {
    return res.status(400).json({ error: 'Task description must be a string.' });
  }

  // Validate assignee_id if provided
  if (assignee_id !== undefined && assignee_id !== null) {
    if (typeof assignee_id !== 'string' || !UUID_REGEX.test(assignee_id)) {
      return res.status(400).json({ error: 'A valid assignee_id (UUID) is required.' });
    }
  }

  // Validate status if supplied (cannot be null or undefined if the key is present)
  if ('status' in req.body) {
    if (status === null || status === undefined || !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Status cannot be null and must be one of: ${ALLOWED_STATUSES.join(', ')}`
      });
    }
  }

  // Validate priority if supplied (cannot be null or undefined if the key is present)
  if ('priority' in req.body) {
    if (priority === null || priority === undefined || !ALLOWED_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        error: `Invalid priority. Priority cannot be null and must be one of: ${ALLOWED_PRIORITIES.join(', ')}`
      });
    }
  }

  // Validate due_date if supplied
  if ('due_date' in req.body) {
    if (due_date === '') {
      return res.status(400).json({
        error: 'Invalid due_date. Must be a valid date in YYYY-MM-DD format, or null.'
      });
    }
    if (due_date !== null && !isValidDate(due_date)) {
      return res.status(400).json({
        error: 'Invalid due_date. Must be a valid calendar date in YYYY-MM-DD format (e.g. 2026-11-15).'
      });
    }
  }

  next();
}

module.exports = {
  isValidDate,
  validateRegister,
  validateLogin,
  validateProject,
  validateTask,
};
