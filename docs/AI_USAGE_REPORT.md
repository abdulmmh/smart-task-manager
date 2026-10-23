# AI Usage & Engineering Reflection Report

**Assessment**: Bright Mind Ltd. Full-Stack Developer Assessment  
**Project**: Smart Task & Project Management System  
**Deliverable**: Mandatory 1-Page AI Usage Report  

---

### 1. Tools & Workflow
- **Antigravity AI Assistant**: Utilized as a pair-programming partner for architectural scaffolding, SQL aggregation design, and full-stack integration.
- **Node.js Native Test Runner (`node:test`, `node:assert`)**: Used to construct a 25-assertion integration test suite verifying authorization, RBAC boundaries, schema cascades, and validation edge cases.
- **PostgreSQL Native Engine (`psql`)**: Used to validate schema constraints, foreign key cascades (`ON DELETE CASCADE`, `ON DELETE SET NULL`), and query execution.

---

### 2. Critical Prompts & Engineering Context

#### Prompt 1: Single-Query Dashboard Aggregation
> *"Design a single atomic PostgreSQL query for the executive dashboard that computes total projects, total tasks, completed tasks, pending tasks, and overdue tasks in one round-trip without application-level looping or N+1 queries."*
- **Context**: Standard ORM approaches generate 4 to 6 sequential queries. This prompt guided the implementation of PostgreSQL's native `FILTER (WHERE ...)` clause inside aggregate subqueries, executing all KPI calculations on the database engine in a single pass.

#### Prompt 2: Strict RBAC with Payload Whitelisting
> *"Implement Express authorization where admins have full CRUD permissions, while members can only update the status of tasks assigned to them and are forbidden with a 403 error from modifying title, description, priority, project, or assignee."*
- **Context**: Ensuring separation of concerns. While members need autonomy to transition assigned tasks, allowing arbitrary field updates creates data corruption. Strict key inspection was enforced at the controller boundary.

#### Prompt 3: Dynamic Seed Data Intervals
> *"Write a seed script where overdue tasks are computed dynamically relative to CURRENT_DATE (e.g., CURRENT_DATE - INTERVAL '2 days') so overdue counters and assertions remain valid indefinitely."*
- **Context**: Static calendar dates inevitably expire, causing test suites and dashboard alerts to break on future evaluation dates.

---

### 3. Core Problem Solved with AI: Eliminating N+1 Query Overhead
In portfolio management, each project requires real-time completion percentages and task counters. A naive implementation fetches all projects and executes a separate `COUNT(*)` query per project. Using SQL conditional aggregation with `LEFT JOIN` and `GROUP BY`, all project metrics and progress percentages are computed in a single database round-trip.

---

### 4. Deficient AI Suggestions & How They Were Corrected
1. **Insecure JWT Secret Fallback**: The initial AI draft included a hardcoded fallback string (`process.env.JWT_SECRET || 'secret'`), allowing attackers to forge tokens using public defaults. I rejected this pattern, centralized environment loading in `src/config/env.js`, and configured the application to fail fast on startup if `JWT_SECRET` is unset.
2. **Silent Failure When Clearing Nullable Fields**: The AI originally scaffolded updates using `COALESCE($n, due_date)`. When clients sent `null` to clear a due date or description, `COALESCE` treated `null` as absent and retained the old value while returning `200 OK`. I identified this through automated tests and refactored the query to use explicit boolean flags: `due_date = CASE WHEN $flag::boolean THEN $val::date ELSE due_date END`.
3. **Permissive Date Parsing**: The AI suggested `!isNaN(new Date(s).getTime())` for date validation. This allowed non-existent calendar dates like `2026-02-31` to reach PostgreSQL, triggering unhandled 500 exceptions. I replaced it with strict ISO format and calendar day matching.

---

### 5. Verification Methodology
All AI-generated code was verified empirically:
1. **Automated Integration Tests**: 25 tests covering 401/403/400/404 HTTP codes, RBAC rules, field clearing, and cascading deletes.
2. **Database Verification**: Confirming check constraints and cascading foreign keys in PostgreSQL.
3. **Static Analysis & Build**: Verified with ESLint (0 errors, 0 warnings) and production Vite build.
