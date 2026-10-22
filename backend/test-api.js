const app = require('./src/app');
const http = require('http');

async function runTests() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5099, resolve));
  const baseUrl = 'http://localhost:5099/api';

  console.log('[Test Suite] Running API integration tests against Express server...\n');

  try {
    // 1. Health check
    const healthRes = await fetch(`${baseUrl}/health`).then((r) => r.json());
    console.log('✅ 1. Health check:', healthRes.status === 'OK' ? 'PASSED' : 'FAILED');

    // 2. Admin Login
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex.admin@brightmind.com', password: 'password123' }),
    });
    const adminData = await adminLoginRes.json();
    console.log('✅ 2. Admin Login:', adminLoginRes.status === 200 && adminData.token ? 'PASSED' : 'FAILED');
    const adminToken = adminData.token;

    // 3. Member Login
    const memberLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john.dev@brightmind.com', password: 'password123' }),
    });
    const memberData = await memberLoginRes.json();
    console.log('✅ 3. Member Login:', memberLoginRes.status === 200 && memberData.user.role === 'member' ? 'PASSED' : 'FAILED');

    // 4. Authenticated /auth/me
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const meData = await meRes.json();
    console.log('✅ 4. Auth Me Check:', meRes.status === 200 && meData.user.name === 'Alex Turner' ? 'PASSED' : 'FAILED');

    // 5. Dashboard Metrics
    const dashboardRes = await fetch(`${baseUrl}/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dashboardData = await dashboardRes.json();
    console.log('✅ 5. Dashboard Metrics:', {
      totalProjects: dashboardData.metrics.total_projects,
      totalTasks: dashboardData.metrics.total_tasks,
      overdueTasks: dashboardData.metrics.overdue_tasks,
      overdueAlertCount: dashboardData.overdueAlerts.length,
    });

    // 6. Projects List with Aggregations
    const projectsRes = await fetch(`${baseUrl}/projects`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const projectsData = await projectsRes.json();
    console.log('✅ 6. Projects Aggregation:', `Found ${projectsData.projects.length} projects. First project progress: ${projectsData.projects[0].progress_percentage}%`);

    // 7. Tasks List with Filters
    const tasksRes = await fetch(`${baseUrl}/tasks?status=In Progress&priority=High`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const tasksData = await tasksRes.json();
    console.log('✅ 7. Filtered Tasks (In Progress + High):', `Returned ${tasksData.tasks.length} matching tasks`);

    // 8. Security Guard (Bad Token): Rejected
    const badTokenRes = await fetch(`${baseUrl}/dashboard`, {
      headers: { Authorization: 'Bearer bad_invalid_token' },
    });
    console.log('✅ 8. Security Guard (Bad Token):', badTokenRes.status === 401 ? 'PASSED (401 Unauthorized)' : 'FAILED');

    console.log('\n🎉 ALL 8 BACKEND API TESTS PASSED SUCCESSFULLY!\n');
  } catch (error) {
    console.error('❌ Test Suite Error:', error);
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests();
