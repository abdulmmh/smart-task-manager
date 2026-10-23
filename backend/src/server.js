const app = require('./app');
const { pool } = require('./config/db');
const { PORT, NODE_ENV } = require('./config/env');

const server = app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Smart Task Manager REST API is running on port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🔒 Environment:  ${process.env.NODE_ENV || 'development'}`);
  console.log(`======================================================\n`);
});

// Graceful shutdown handling
function shutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Closing HTTP server and database pool...`);
  server.close(async () => {
    try {
      await pool.end();
      console.log('[Server] Database connections closed. Process exited gracefully.');
      process.exit(0);
    } catch (err) {
      console.error('[Server] Error closing pool:', err.message);
      process.exit(1);
    }
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
