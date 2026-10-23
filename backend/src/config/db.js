const { Pool } = require('pg');
const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = require('./env');

const pool = new Pool({
  host: DB_HOST,
  port: DB_PORT,
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
  max: 20, // Maximum number of connection clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[DB Pool Error] Unexpected error on idle client:', err.message);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
