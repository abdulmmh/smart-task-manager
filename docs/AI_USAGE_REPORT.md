# AI Usage & Engineering Reflection Report
**Assessment**: Bright Mind Ltd. Full-Stack Developer Assessment · **Project**: Smart Task & Project Management System

## 1. Tools Used
- **Antigravity AI Assistant**: pair-programming for scaffolding, SQL aggregation design, full-stack integration and the Profile/password features.
- **Claude**: independent static code review, security audit and requirements check.
- **`node:test`** and **`psql`**: 30 integration tests; constraint and cascade verification.

## 2. Three Important Prompts
1. *"Design a single PostgreSQL query that computes total projects, total/completed/pending/overdue tasks in one round-trip, without application loops or N+1."* → `COUNT(*) FILTER (WHERE …)` aggregates.
2. *"Admins have full CRUD; members may only update the status of tasks assigned to them and get 403 for any other field."* → key inspection in `taskController.updateTask`.
3. *"Implement PUT /auth/change-password: verify the current password against the bcrypt hash, reject identical passwords, return clear 400 errors."* → reuses the login bcrypt compare.

## 3. Problem Solved with AI: N+1 on the project list
Each project card needs completion %, task and pending counts. A naive loop runs one `COUNT(*)` per project. One `LEFT JOIN … GROUP BY` with `COUNT(*) FILTER (…)` returns every metric in a single round-trip.

## 4. Incorrect or Incomplete AI Suggestions and How They Were Fixed
- **Hard-coded JWT fallback secrets** in the controller and middleware allowed token forging with a public default. Fix: fallbacks removed, one `config/env.js`; the server refuses to start without `JWT_SECRET`, rejects placeholder/short secrets in production and warns in development.
- **`COALESCE($n, due_date)` could not clear a field**: `null` meant "keep", so the API returned 200 and changed nothing. Found during AI-assisted review and reproduced with API probes. Fix: `due_date = CASE WHEN $flag::boolean THEN $val::date ELSE due_date END`, plus regression tests.
- **`!isNaN(new Date(s))` date check** let `2026-02-31` reach PostgreSQL (500). Fix: strict `YYYY-MM-DD` regex plus a calendar round-trip check.

## 5. Verification
1. 30 automated tests (401/403/400/404, RBAC, field clearing, cascades).
2. Constraint and cascade checks in `psql`.
3. `npm run lint` and production `vite build`.
4. Manual end-to-end test of profile update and password change with admin and member accounts.