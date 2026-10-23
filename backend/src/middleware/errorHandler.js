/**
 * Centralized error handling middleware.
 * Translates PostgreSQL errors and operational exceptions into structured JSON responses.
 * Hides raw database error messages and stack traces from 5xx responses.
 */
function errorHandler(err, req, res, next) {
  // Always log detailed error information on the server for debugging
  console.error('[Error Caught]', {
    path: req.originalUrl,
    method: req.method,
    code: err.code,
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
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

  // PostgreSQL Invalid syntax / UUID format
  if (err.code === '22P02') {
    return res.status(400).json({
      error: 'Invalid parameter format provided (expected valid UUID or number).'
    });
  }

  // PostgreSQL String data right truncation (value exceeds column length)
  if (err.code === '22001') {
    return res.status(400).json({
      error: 'Input string exceeds maximum allowable length for this field.'
    });
  }

  // PostgreSQL Invalid datetime format / overflow (e.g., non-existent date like 2026-02-31)
  if (err.code === '22007' || err.code === '22008') {
    return res.status(400).json({
      error: 'Invalid date format or out-of-range calendar date.'
    });
  }

  // PostgreSQL Check constraint violation
  if (err.code === '23514') {
    return res.status(400).json({
      error: 'Provided value violates database validation constraints.'
    });
  }

  // PostgreSQL Not-Null constraint violation (attempting to set a NOT NULL column to NULL)
  if (err.code === '23502') {
    return res.status(400).json({
      error: `A required field cannot be null (database not-null constraint violation on column: ${err.column || 'field'}).`
    });
  }

  // Operational client errors with explicit statusCode (e.g., 400, 401, 403, 404)
  if (err.statusCode && err.statusCode < 500) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // All other unhandled or 5xx exceptions return a clean generic error
  res.status(500).json({
    error: 'Internal server error. Please try again later.'
  });
}

module.exports = errorHandler;
