/**
 * Centralized error handling middleware.
 * Translates PostgreSQL errors and unhandled exceptions into structured JSON responses.
 */
function errorHandler(err, req, res, next) {
  console.error('[Error Caught]', {
    path: req.originalUrl,
    method: req.method,
    message: err.message,
    code: err.code,
  });

  // PostgreSQL Unique Constraint Violation (e.g. duplicate email)
  if (err.code === '23505') {
    return res.status(409).json({
      error: 'A record with this identifier already exists (duplicate entry).'
    });
  }

  // PostgreSQL Foreign Key Violation (e.g. invalid project_id or assignee_id)
  if (err.code === '23503') {
    return res.status(400).json({
      error: 'Referenced foreign record does not exist.'
    });
  }

  // PostgreSQL Invalid UUID format
  if (err.code === '22P02') {
    return res.status(400).json({
      error: 'Invalid ID format provided (expected UUID).'
    });
  }

  // Custom operational errors with status codes
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error. Please try again later.';

  res.status(statusCode).json({ error: message });
}

module.exports = errorHandler;
