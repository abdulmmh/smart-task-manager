/**
 * Input validation middleware for registration, login, projects, and tasks
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_STATUSES = ['To Do', 'In Progress', 'Completed'];
const ALLOWED_PRIORITIES = ['Low', 'Medium', 'High'];

function validateRegister(req, res, next) {
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required and cannot be empty.' });
  }

  if (!email || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;

  if (!email || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Password is required.' });
  }

  next();
}

function validateProject(req, res, next) {
  const { name } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Project name is required and cannot be empty.' });
  }

  if (name.trim().length > 150) {
    return res.status(400).json({ error: 'Project name cannot exceed 150 characters.' });
  }

  next();
}

function validateTask(req, res, next) {
  const { title, project_id, status, priority, due_date } = req.body;

  // Title validation (for creation)
  if (req.method === 'POST') {
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Task title is required.' });
    }

    if (!project_id || !UUID_REGEX.test(project_id)) {
      return res.status(400).json({ error: 'A valid project_id (UUID) is required.' });
    }
  }

  // Validate status if supplied
  if (status && !ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(', ')}`
    });
  }

  // Validate priority if supplied
  if (priority && !ALLOWED_PRIORITIES.includes(priority)) {
    return res.status(400).json({
      error: `Invalid priority. Allowed values: ${ALLOWED_PRIORITIES.join(', ')}`
    });
  }

  // Validate due_date if supplied
  if (due_date) {
    const parsedDate = new Date(due_date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid due_date. Must be a valid date (YYYY-MM-DD).' });
    }
  }

  next();
}

module.exports = {
  validateRegister,
  validateLogin,
  validateProject,
  validateTask,
};
