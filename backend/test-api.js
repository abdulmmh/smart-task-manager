const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('./src/app');
const { pool, query } = require('./src/config/db');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

let server;
let baseUrl;
let adminToken;
let memberToken;
let memberUserId = '33333333-3333-3333-3333-333333333333'; // John Smith (member)
let testProjectId;
let testTaskId;

before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}/api`;

  // Authenticate Admin demo account
  const adminRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'alex.admin@brightmind.com', password: 'password123' }),
  });
  assert.strictEqual(adminRes.status, 200, 'Admin login must succeed');
  const adminData = await adminRes.json();
  adminToken = adminData.token;

  // Authenticate Member demo account
  const memberRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'john.dev@brightmind.com', password: 'password123' }),
  });
  assert.strictEqual(memberRes.status, 200, 'Member login must succeed');
  const memberData = await memberRes.json();
  memberToken = memberData.token;
  memberUserId = memberData.user.id;
});

after(async () => {
  // Cleanup any leftover test data
  if (testProjectId) {
    await query('DELETE FROM projects WHERE id = $1', [testProjectId]);
  }
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

describe('1. Health Check & Core Infrastructure', () => {
  test('GET /health returns 200 OK and database connectivity', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, 'OK');
    assert.strictEqual(body.database, 'connected');
  });

  test('Undefined endpoint returns 404 with structured error', async () => {
    const res = await fetch(`${baseUrl}/non-existent-route`);
    assert.strictEqual(res.status, 404);
    const body = await res.json();
    assert.ok(body.error.includes('Endpoint not found'));
  });
});

describe('2. Authentication & Authorization Security', () => {
  test('Login with invalid password returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex.admin@brightmind.com', password: 'wrongpassword' }),
    });
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.error, 'Invalid email or password.');
  });

  test('Protected endpoint without token returns 401', async () => {
    const res = await fetch(`${baseUrl}/dashboard`);
    assert.strictEqual(res.status, 401);
  });

  test('Protected endpoint with invalid / forged token returns 401', async () => {
    const res = await fetch(`${baseUrl}/dashboard`, {
      headers: { Authorization: 'Bearer forged.token.value' },
    });
    assert.strictEqual(res.status, 401);
  });

  test('Registration ignores role: "admin" and strictly creates a member', async () => {
    const testEmail = `sec.test.${Date.now()}@brightmind.com`;
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Escalation Test',
        email: testEmail,
        password: 'password123',
        role: 'admin', // Attempted privilege escalation
      }),
    });
    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.user.role, 'member', 'Role must remain member despite payload');

    // Clean up created user
    await query('DELETE FROM users WHERE email = $1', [testEmail]);
  });

  test('Change password rejects invalid current password and accepts valid change', async () => {
    const testEmail = `pwd.test.${Date.now()}@brightmind.com`;
    // Register temporary user
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Password Tester',
        email: testEmail,
        password: 'initialPassword123',
      }),
    });
    assert.strictEqual(regRes.status, 201);
    const { token } = await regRes.json();

    // Try wrong current password
    const wrongRes = await fetch(`${baseUrl}/auth/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword: 'wrongPassword123',
        newPassword: 'newValidPassword456',
      }),
    });
    assert.strictEqual(wrongRes.status, 400);
    const wrongBody = await wrongRes.json();
    assert.strictEqual(wrongBody.error, 'Current password is incorrect.');

    // Try too short new password
    const shortRes = await fetch(`${baseUrl}/auth/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword: 'initialPassword123',
        newPassword: 'short',
      }),
    });
    assert.strictEqual(shortRes.status, 400);

    // Try valid password change
    const validRes = await fetch(`${baseUrl}/auth/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword: 'initialPassword123',
        newPassword: 'newValidPassword456',
      }),
    });
    assert.strictEqual(validRes.status, 200);

    // Verify login with new password succeeds
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'newValidPassword456',
      }),
    });
    assert.strictEqual(loginRes.status, 200);

    // Verify update profile name works
    const profileRes = await fetch(`${baseUrl}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: 'Updated Name',
      }),
    });
    assert.strictEqual(profileRes.status, 200);
    const profileBody = await profileRes.json();
    assert.strictEqual(profileBody.user.name, 'Updated Name');

    // Clean up test user
    await query('DELETE FROM users WHERE email = $1', [testEmail]);
  });


  test('Profile update rejects invalid names and ignores role/email changes', async () => {
    const email = `profile.${Date.now()}@example.com`;
    const reg = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Profile Tester', email, password: 'profilePass123' }),
    });
    const { token } = await reg.json();
    const put = (body) =>
      fetch(`${baseUrl}/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

    assert.strictEqual((await put({})).status, 400);
    assert.strictEqual((await put({ name: '   ' })).status, 400);
    assert.strictEqual((await put({ name: 'n'.repeat(101) })).status, 400);
    assert.strictEqual((await put({ name: 42 })).status, 400);

    const res = await put({ name: 'Renamed', role: 'admin', email: 'hacker@example.com' });
    assert.strictEqual(res.status, 200);
    const { user } = await res.json();
    assert.strictEqual(user.name, 'Renamed');
    assert.strictEqual(user.role, 'member');
    assert.strictEqual(user.email, email);

    await query('DELETE FROM users WHERE email = $1', [email]);
  });
});

describe('3. Strict Input Validation & Edge-Case Handling', () => {
  test('Invalid date "2026-02-31" returns 400 Bad Request', async () => {
    const res = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Invalid Date Task',
        project_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        due_date: '2026-02-31',
      }),
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.ok(body.error.toLowerCase().includes('due_date'));
  });

  test('Non-ISO date format "10/05/2026" returns 400 Bad Request', async () => {
    const res = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Non-ISO Date Task',
        project_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        due_date: '10/05/2026',
      }),
    });
    assert.strictEqual(res.status, 400);
  });

  test('Whitespace-only title on update returns 400 Bad Request', async () => {
    const res = await fetch(`${baseUrl}/tasks/10000000-0000-0000-0000-000000000001`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ title: '   ' }),
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.ok(body.error.toLowerCase().includes('title'));
  });

  test('Title exceeding 200 characters returns 400 Bad Request', async () => {
    const longTitle = 'A'.repeat(250);
    const res = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: longTitle,
        project_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      }),
    });
    assert.strictEqual(res.status, 400);
  });

  test('Empty string due_date "" returns 400 Bad Request', async () => {
    const res = await fetch(`${baseUrl}/tasks/10000000-0000-0000-0000-000000000001`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ due_date: '' }),
    });
    assert.strictEqual(res.status, 400);
  });

  test('Explicit null status on update returns 400 Bad Request', async () => {
    const res = await fetch(`${baseUrl}/tasks/10000000-0000-0000-0000-000000000001`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: null }),
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.ok(body.error.toLowerCase().includes('status'));
  });

  test('Explicit null priority on update returns 400 Bad Request', async () => {
    const res = await fetch(`${baseUrl}/tasks/10000000-0000-0000-0000-000000000001`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ priority: null }),
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.ok(body.error.toLowerCase().includes('priority'));
  });

  test('Password longer than 72 bytes is rejected (bcrypt limit)', async () => {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Long Password',
        email: `long.pw.${Date.now()}@example.com`,
        password: 'a'.repeat(73),
      }),
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.ok(body.error.includes('72 bytes'));
  });
});

describe('4. Role-Based Access Control (RBAC) Enforcement', () => {
  test('Member CANNOT create a project (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({ name: 'Unauthorized Project' }),
    });
    assert.strictEqual(res.status, 403);
  });

  test('Member CANNOT update a project (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/projects/11111111-1111-1111-1111-111111111111`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({ name: 'Member Renamed Project' }),
    });
    assert.strictEqual(res.status, 403);
  });

  test('Member CANNOT delete a project (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/projects/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    assert.strictEqual(res.status, 403);
  });

  test('Member CANNOT create a task (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({
        title: 'Unauthorized Task',
        project_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      }),
    });
    assert.strictEqual(res.status, 403);
  });

  test('Member CANNOT delete a task (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/tasks/10000000-0000-0000-0000-000000000001`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    assert.strictEqual(res.status, 403);
  });

  test('Member attempting to update task title/priority returns 403 Forbidden', async () => {
    // Task 10000000-0000-0000-0000-000000000004 is assigned to John Smith
    const res = await fetch(`${baseUrl}/tasks/10000000-0000-0000-0000-000000000004`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({
        title: 'Attempted Title Edit by Member',
        status: 'In Progress',
      }),
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.ok(body.error.toLowerCase().includes('status'));
  });

  test('Member CAN update status of a task assigned to them (200 OK)', async () => {
    const res = await fetch(`${baseUrl}/tasks/10000000-0000-0000-0000-000000000004`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({ status: 'In Progress' }),
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.task.status, 'In Progress');
  });

  test('Member CANNOT update status on another member\'s task (403 Forbidden)', async () => {
    // Task 20000000-0000-0000-0000-000000000001 is assigned to Sarah Connor (not John Smith)
    const res = await fetch(`${baseUrl}/tasks/20000000-0000-0000-0000-000000000001`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({ status: 'To Do' }),
    });
    assert.strictEqual(res.status, 403);
  });
});

describe('5. CRUD Operations & Clearing Fields to Null', () => {
  test('Admin creates a project and child task', async () => {
    // 1. Create Project
    const projRes = await fetch(`${baseUrl}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Automated Test Project',
        description: 'Test Project Description',
      }),
    });
    assert.strictEqual(projRes.status, 201);
    const projBody = await projRes.json();
    testProjectId = projBody.project.id;
    assert.ok(testProjectId);

    // 2. Create Task with due date and description
    const taskRes = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Task with Deadlines',
        description: 'Initial task description',
        due_date: '2026-11-20',
        project_id: testProjectId,
        assignee_id: memberUserId,
        priority: 'High',
      }),
    });
    assert.strictEqual(taskRes.status, 201);
    const taskBody = await taskRes.json();
    testTaskId = taskBody.task.id;
    assert.ok(testTaskId);
    assert.ok(taskBody.task.due_date);
    assert.strictEqual(taskBody.task.description, 'Initial task description');
  });

  test('Admin updates task clearing due_date and description to null', async () => {
    // Explicitly send null for due_date and description to verify CASE WHEN logic
    const updateRes = await fetch(`${baseUrl}/tasks/${testTaskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        due_date: null,
        description: null,
      }),
    });
    assert.strictEqual(updateRes.status, 200);
    const updateBody = await updateRes.json();

    // Verify fields are now null in the returned record
    assert.strictEqual(updateBody.task.due_date, null, 'due_date must be cleared to null');
    assert.strictEqual(updateBody.task.description, null, 'description must be cleared to null');
    assert.ok(updateBody.task.created_by && updateBody.task.created_at, 'update response must include created_by/created_at (documented)');

    // Cross-verify directly with database query
    const dbCheck = await query('SELECT due_date, description FROM tasks WHERE id = $1', [testTaskId]);
    assert.strictEqual(dbCheck.rows[0].due_date, null, 'DB record due_date must be null');
    assert.strictEqual(dbCheck.rows[0].description, null, 'DB record description must be null');
  });

  test('Admin updates project name and description', async () => {
    const updateProject = (body) =>
      fetch(`${baseUrl}/projects/${testProjectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + adminToken,
        },
        body: JSON.stringify(body),
      });

    const emptyBodyRes = await fetch(`${baseUrl}/projects/${testProjectId}`, {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + adminToken },
    });
    assert.strictEqual(emptyBodyRes.status, 400, 'missing request body must be rejected');
    assert.strictEqual((await updateProject({})).status, 400, 'empty updates must be rejected');
    assert.strictEqual((await updateProject({ name: '   ' })).status, 400, 'blank names must be rejected');
    assert.strictEqual((await updateProject({ name: 'n'.repeat(151) })).status, 400, 'long names must be rejected');

    const updateRes = await fetch(`${baseUrl}/projects/${testProjectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Renamed Project by Admin',
        description: 'Updated Project Scope & Details',
      }),
    });
    assert.strictEqual(updateRes.status, 200);
    const updateBody = await updateRes.json();
    assert.strictEqual(updateBody.project.name, 'Renamed Project by Admin');
    assert.strictEqual(updateBody.project.description, 'Updated Project Scope & Details');
    assert.ok(updateBody.project.created_by && updateBody.project.created_at, 'update response must include created_by/created_at (documented)');

    // Verify directly in DB
    const dbCheck = await query('SELECT name, description FROM projects WHERE id = $1', [testProjectId]);
    assert.strictEqual(dbCheck.rows[0].name, 'Renamed Project by Admin');
    assert.strictEqual(dbCheck.rows[0].description, 'Updated Project Scope & Details');

    const descriptionOnlyRes = await updateProject({ description: null });
    assert.strictEqual(descriptionOnlyRes.status, 200, 'description-only updates must be accepted');
    const descriptionOnlyBody = await descriptionOnlyRes.json();
    assert.strictEqual(descriptionOnlyBody.project.name, 'Renamed Project by Admin');
    assert.strictEqual(descriptionOnlyBody.project.description, null, 'null description must clear the field');
  });

  test('Cascading deletion: deleting project removes associated tasks', async () => {
    const deleteRes = await fetch(`${baseUrl}/projects/${testProjectId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(deleteRes.status, 200);

    // Verify the project is gone
    const projCheck = await query('SELECT id FROM projects WHERE id = $1', [testProjectId]);
    assert.strictEqual(projCheck.rows.length, 0);

    // Verify the child task was cascade-deleted
    const taskCheck = await query('SELECT id FROM tasks WHERE id = $1', [testTaskId]);
    assert.strictEqual(taskCheck.rows.length, 0, 'Child task must be cascade deleted');

    testProjectId = null;
    testTaskId = null;
  });
});

describe('6. Multi-Field Filtering, Query Aliases & Dashboard Analytics', () => {
  test('Task filters work with both projectId and project_id query parameters', async () => {
    const projId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

    const resCamel = await fetch(`${baseUrl}/tasks?projectId=${projId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const bodyCamel = await resCamel.json();

    const resSnake = await fetch(`${baseUrl}/tasks?project_id=${projId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const bodySnake = await resSnake.json();

    assert.strictEqual(resCamel.status, 200);
    assert.strictEqual(resSnake.status, 200);
    assert.strictEqual(bodyCamel.tasks.length, bodySnake.tasks.length);
    assert.ok(bodyCamel.tasks.length > 0);
  });

  describe('7. Startup Safety & Deployment Configuration', () => {
    // Loads config/env.js in a fresh process, so every scenario starts from a clean environment.
    const loadEnv = (overrides) =>
      spawnSync(process.execPath, ['-e', "require('./src/config/env')"], {
        cwd: __dirname,
        env: { ...process.env, ...overrides },
        encoding: 'utf8',
      });
    const STRONG = 'x7Kp2mQ9vL4nR8sT1wY6zB3cD5fG0hJ2kM7pQ9rS';

    test('Production refuses to start with a placeholder JWT secret', () => {
      const r = loadEnv({ NODE_ENV: 'production', JWT_SECRET: 'replace_with_a_secure_random_secret_min_32_chars', DB_PASSWORD: 'x' });
      assert.notStrictEqual(r.status, 0);
      assert.ok(r.stderr.includes('Insecure JWT_SECRET'));
    });

    test('Production refuses to start without DB_PASSWORD', () => {
      const r = loadEnv({ NODE_ENV: 'production', JWT_SECRET: STRONG, DB_PASSWORD: '' });
      assert.notStrictEqual(r.status, 0);
      assert.ok(r.stderr.includes('DB_PASSWORD'));
    });

    test('Production starts with a strong secret and an explicit DB password', () => {
      const r = loadEnv({ NODE_ENV: 'production', JWT_SECRET: STRONG, DB_PASSWORD: 'x' });
      assert.strictEqual(r.status, 0, r.stderr);
    });

    test('Development only warns about a placeholder JWT secret', () => {
      const r = loadEnv({ NODE_ENV: 'development', JWT_SECRET: 'replace_with_a_secure_random_secret_min_32_chars' });
      assert.strictEqual(r.status, 0, r.stderr);
      assert.ok(r.stderr.includes('SECURITY WARNING'));
    });

    test('docker-compose.yml publishes PostgreSQL on localhost only and has no obsolete version key', () => {
      const compose = fs.readFileSync(path.join(__dirname, '..', 'docker-compose.yml'), 'utf8');
      assert.ok(compose.includes('"127.0.0.1:5432:5432"'));
      assert.ok(!/^version:/m.test(compose));
    });

    test('backend Dockerfile runs as the unprivileged node user', () => {
      const dockerfile = fs.readFileSync(path.join(__dirname, 'Dockerfile'), 'utf8');
      assert.ok(/^USER node$/m.test(dockerfile));
    });
  });

  describe('8. API Documentation Stays in Sync With the Code', () => {
    test('docs/API_DOCUMENTATION.md documents every route the API exposes (and nothing else)', () => {
      const appSrc = fs.readFileSync(path.join(__dirname, 'src', 'app.js'), 'utf8');
      const routeModules = new Map(
        [...appSrc.matchAll(/const\s+(\w+)\s*=\s*require\(['"]\.\/routes\/([^'"]+)['"]\);/g)]
          .map(([, routerName, moduleName]) => [routerName, moduleName])
      );

      const exposed = new Set(['GET /api/health']);
      for (const m of appSrc.matchAll(/app\.use\('([^']+)',\s*(\w+)\)/g)) {
        const [, prefix, routerName] = m;
        const moduleName = routeModules.get(routerName);
        if (!moduleName) continue;

        const src = fs.readFileSync(path.join(__dirname, 'src', 'routes', `${moduleName}.js`), 'utf8');
        for (const m of src.matchAll(/router\.(get|post|put|delete|patch)\(\s*'([^']*)'/g)) {
          exposed.add(`${m[1].toUpperCase()} ${prefix}${m[2] === '/' ? '' : m[2]}`);
        }
      }

      const doc = fs.readFileSync(path.join(__dirname, '..', 'docs', 'API_DOCUMENTATION.md'), 'utf8');
      const documented = new Set();
      for (const m of doc.matchAll(/\*\*Method\*\*:\s*`(\w+)`\s*\n-\s*\*\*Path\*\*:\s*`([^`]+)`/g)) {
        documented.add(`${m[1]} /api${m[2]}`);
      }
      assert.deepStrictEqual([...documented].sort(), [...exposed].sort());
    });
  });
  test('Task filters work with both assigneeId and assignee_id query parameters', async () => {
    const userId = '33333333-3333-3333-3333-333333333333';

    const resCamel = await fetch(`${baseUrl}/tasks?assigneeId=${userId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const bodyCamel = await resCamel.json();

    const resSnake = await fetch(`${baseUrl}/tasks?assignee_id=${userId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const bodySnake = await resSnake.json();

    assert.strictEqual(resCamel.status, 200);
    assert.strictEqual(resSnake.status, 200);
    assert.strictEqual(bodyCamel.tasks.length, bodySnake.tasks.length);
  });

  test('Overdue filter returns only uncompleted tasks with past due dates', async () => {
    const res = await fetch(`${baseUrl}/tasks?overdue=true`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.tasks.length > 0);
    for (const task of body.tasks) {
      assert.strictEqual(task.is_overdue, true);
      assert.notStrictEqual(task.status, 'Completed');
    }
  });

  test('Dashboard metrics endpoint returns aggregated KPIs', async () => {
    const res = await fetch(`${baseUrl}/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.metrics);
    assert.strictEqual(typeof body.metrics.total_projects, 'number');
    assert.strictEqual(typeof body.metrics.total_tasks, 'number');
    assert.strictEqual(typeof body.metrics.completed_tasks, 'number');
    assert.ok(Array.isArray(body.overdueAlerts));
    assert.ok(Array.isArray(body.projectSummaries));
  });
});
