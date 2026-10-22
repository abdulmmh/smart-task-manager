# Technical Review & Interview Preparation Guide

**Assessment**: Bright Mind Ltd. Full-Stack Developer Assessment  
**Format**: 20-Minute Technical Interview & Architecture Walkthrough  

This guide provides a structured script, key talking points, live demonstration commands, and anticipated coding tweaks to help you ace the 20-minute technical review.

---

## 1. Two-Minute Architecture Elevator Pitch

> *"The Smart Task & Project Management System is an enterprise-grade full-stack platform built with Node.js/Express 5, PostgreSQL 17, and React 19. 
> 
> My primary engineering focus was on three pillars: **data integrity**, **query efficiency**, and **role-based security**.
> 
> On the database layer, I avoided ORM overhead and wrote optimized raw SQL DDL with UUID primary keys, foreign key cascading constraints, check constraints for enums, and composite B-tree indexes for multi-field filtering.
> 
> On the API layer, I eliminated the N+1 query problem by aggregating all project completion percentages and dashboard metrics in single, atomic queries using PostgreSQL's `FILTER` clause.
> 
> Finally, on security, I implemented strict Role-Based Access Control: admins have full administrative control, while team members can view projects and are mathematically restricted to only updating task completion status on their work.
> 
> The frontend features an executive Deep Midnight Navy theme with an independently scrollable workspace and automated integration testing verifying all 8 core workflows."*

---

## 2. Live Technical Demonstrations

Interviewers frequently ask candidates to demonstrate 1 API call and 1 direct database query.

### Demo 1: Direct Database Query (Run in `psql` or pgAdmin)
Demonstrate how the dashboard aggregates 5 metrics with zero N+1 latency:

```sql
SELECT 
  (SELECT COUNT(*) FROM projects) AS total_projects,
  COUNT(t.id) AS total_tasks,
  COUNT(t.id) FILTER (WHERE t.status = 'Completed') AS completed_tasks,
  COUNT(t.id) FILTER (WHERE t.status != 'Completed') AS pending_tasks,
  COUNT(t.id) FILTER (WHERE t.due_date < CURRENT_DATE AND t.status != 'Completed') AS overdue_tasks,
  CASE 
    WHEN COUNT(t.id) = 0 THEN 0
    ELSE ROUND((COUNT(t.id) FILTER (WHERE t.status = 'Completed')::decimal / COUNT(t.id)) * 100)
  END AS completion_rate
FROM tasks t;
```

**Talking Point**:
> *"Notice that this executes in 1 to 2 milliseconds because it computes everything in a single pass over the indexed `tasks` table without multiple round-trips from Node.js."*

---

### Demo 2: API Call via cURL / PowerShell
Demonstrate the overdue filter endpoint:

```bash
# 1. Log in and capture token
$RES = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"alex.admin@brightmind.com","password":"password123"}'
$TOKEN = $RES.token

# 2. Fetch overdue tasks
Invoke-RestMethod -Uri "http://localhost:5000/api/tasks?overdue=true" `
  -Method GET `
  -Headers @{"Authorization"="Bearer $TOKEN"}
```

**Talking Point**:
> *"Notice that the query uses parameterized SQL (`WHERE due_date < CURRENT_DATE AND status != 'Completed'`), indexed by `idx_tasks_due_date`."*

---

## 3. Anticipated Technical Questions & Model Answers

### Q1: "Why did you use UUIDs instead of auto-incrementing integer IDs?"
**Answer**:
> *"Auto-incrementing integers (`1, 2, 3...`) expose sequential entity counts to the outside world, making the system vulnerable to enumeration and ID-scraping attacks. UUIDs (`gen_random_uuid()`) are cryptographically random, allow safe client-side ID generation if needed in distributed systems, and prevent ID collision across sharded databases."*

---

### Q2: "How does the system prevent SQL injection?"
**Answer**:
> *"Every single query throughout all controllers uses parameterized queries via the `pg.Pool` client (`$1, $2, $3`). User input is never concatenated into raw SQL strings. In addition, string lengths and enum values are validated via regex middleware before the database query is even formed."*

---

### Q3: "What happens to tasks when a project is deleted versus when a user is deleted?"
**Answer**:
> *"This is enforced strictly at the database schema level via foreign key constraints:
> 1. When a **project** is deleted: `ON DELETE CASCADE` removes all associated tasks, because a task cannot exist without a parent project.
> 2. When a **user (assignee)** is deleted: `ON DELETE SET NULL` preserves the task record and sets `assignee_id = NULL`, ensuring that company work history and project metrics remain intact."*

---

### Q4: "How does your Role-Based Access Control (RBAC) work?"
**Answer**:
> *"RBAC is enforced at two distinct boundaries:
> 1. **Route-level**: The `requireAdmin` middleware checks `req.user.role === 'admin'` and rejects non-admin requests with a 403 Forbidden on project CRUD and task deletion.
> 2. **Field-level**: In the `PUT /api/tasks/:id` endpoint, if the authenticated user has the `member` role, the controller rejects any request that attempts to modify `title`, `description`, `project_id`, `assignee_id`, or `priority`, allowing them strictly to update `status`."*

---

## 4. Anticipated Live Coding Tweaks

Interviewers often ask candidates to make a minor live code modification to see how well they understand the codebase.

### Tweak 1: "Add a new Task Priority level called 'Urgent'"
1. **Schema**:
   ```sql
   ALTER TABLE tasks DROP CONSTRAINT tasks_priority_check;
   ALTER TABLE tasks ADD CONSTRAINT tasks_priority_check CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent'));
   ```
2. **Backend**:
   In `backend/src/middleware/validateMiddleware.js`:
   ```javascript
   const validPriorities = ['Low', 'Medium', 'High', 'Urgent'];
   ```
3. **Frontend**:
   Add `'Urgent'` option in `TasksPage.jsx` select dropdowns, and add styling in `Badge.jsx` and `index.css`:
   ```css
   .badge-urgent { background-color: #fef2f2; color: #991b1b; border: 1px solid #f87171; }
   ```

---

### Tweak 2: "Add Pagination to the Tasks API"
1. **Backend** (`taskController.js`):
   ```javascript
   const page = parseInt(req.query.page, 10) || 1;
   const limit = parseInt(req.query.limit, 10) || 10;
   const offset = (page - 1) * limit;
   
   // Append to query:
   query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
   values.push(limit, offset);
   ```
2. **Frontend** (`TasksPage.jsx`):
   Add Next / Previous buttons tracking `page` state in `fetchTasks()`.

---

### Tweak 3: "Allow filtering tasks by multiple statuses simultaneously"
1. **Backend**:
   ```javascript
   // Convert comma-separated string to array
   const statusArray = req.query.status.split(','); // ['To Do', 'In Progress']
   query += ` AND status = ANY($${paramIndex}::varchar[])`;
   values.push(statusArray);
   ```

---

## 5. Pre-Interview 60-Second Sanity Checklist

Before opening the screen share with Bright Mind Ltd.:
1. [ ] PostgreSQL is running (`netstat -ano | findstr 5432`).
2. [ ] Backend is running on port 5000 (`npm run dev` in `/backend`).
3. [ ] Frontend is running on port 5173 (`npm run dev` in `/frontend`).
4. [ ] Run `npm test` in `/backend` to verify all 8/8 tests pass green.
5. [ ] Open browser to `http://localhost:5173` and log in with `alex.admin@brightmind.com`.
