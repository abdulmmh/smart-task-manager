const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { pool } = require('../config/db');
const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, DB_SSL } = require('../config/env');

async function ensureDatabaseExists() {
  const adminClientConfig = {
    host: DB_HOST,
    port: DB_PORT,
    database: 'postgres',
    user: DB_USER,
    password: DB_PASSWORD,
  };

  if (DB_SSL) {
    adminClientConfig.ssl = { rejectUnauthorized: false };
  }

  const adminClient = new Client(adminClientConfig);

  try {
    await adminClient.connect();
    const res = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [DB_NAME]
    );

    if (res.rows.length === 0) {
      console.log(`[DB Init] Database "${DB_NAME}" does not exist. Creating database automatically...`);
      // Escape identifier safely
      await adminClient.query(`CREATE DATABASE "${DB_NAME.replace(/"/g, '""')}"`);
      console.log(`[DB Init] Database "${DB_NAME}" created successfully.`);
    } else {
      console.log(`[DB Init] Database "${DB_NAME}" verified.`);
    }
  } catch (error) {
    console.warn(`[DB Init Warning] Could not verify/create database via maintenance connection: ${error.message}`);
    console.warn(`[DB Init Warning] Proceeding with direct connection to target database "${DB_NAME}"...`);
  } finally {
    try {
      await adminClient.end();
    } catch {
      // Ignore cleanup error
    }
  }
}

async function initializeDatabase() {
  await ensureDatabaseExists();

  const client = await pool.connect();
  console.log('[DB Init] Connected to PostgreSQL. Starting schema and seed execution...');

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const seedPath = path.join(__dirname, 'seed.sql');

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    // 1. Run Schema (DDL) — drops and recreates tables, constraints, indexes
    console.log('[DB Init] Applying schema.sql (tables, constraints, indexes)...');
    await client.query(schemaSql);
    console.log('[DB Init] Schema created successfully.');

    // 2. Run Seed (DML) — test accounts, projects, tasks
    console.log('[DB Init] Applying seed.sql (test accounts, projects, tasks)...');
    await client.query(seedSql);
    console.log('[DB Init] Seed data inserted successfully.');

    // 3. Verify Counts
    const usersCount = await client.query('SELECT COUNT(*) FROM users');
    const projectsCount = await client.query('SELECT COUNT(*) FROM projects');
    const tasksCount = await client.query('SELECT COUNT(*) FROM tasks');
    const overdueCount = await client.query(
      "SELECT COUNT(*) FROM tasks WHERE due_date < CURRENT_DATE AND status != 'Completed'"
    );

    console.log('\n======================================================');
    console.log('   DATABASE INITIALIZATION REPORT');
    console.log('======================================================');
    console.log(`- Users in Database:    ${usersCount.rows[0].count} (2 Admins, 5 Members)`);
    console.log(`- Projects in Database: ${projectsCount.rows[0].count}`);
    console.log(`- Tasks in Database:    ${tasksCount.rows[0].count}`);
    console.log(`- Overdue Tasks:        ${overdueCount.rows[0].count}`);
    console.log('======================================================\n');

  } catch (error) {
    console.error('[DB Init Error] Failed to initialize database:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

initializeDatabase();
