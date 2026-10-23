const { Pool } = require('pg');
const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, DB_SSL } = require('./env');

const poolConfig = {
  host: DB_HOST,
  port: DB_PORT,
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
  max: 20, // Maximum number of connection clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // 10s allowance for serverless databases (Neon) to wake from idle
};

// Enable TLS/SSL when connecting to cloud-hosted databases (Neon, Render, Supabase)
if (DB_SSL) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[DB Pool Error] Unexpected error on idle client:', err.message);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
