# Bright Mind Task Manager — REST API Documentation

Comprehensive technical reference for the Smart Task & Project Management REST API.

- **Base URL**: `http://localhost:5000/api`
- **Data Format**: `application/json`
- **Authentication**: Bearer Token in `Authorization` header (`Authorization: Bearer <JWT_TOKEN>`)

---

## Table of Contents
1. [Authentication Endpoints](#1-authentication-endpoints)
   - [Register New User](#11-register-new-user)
   - [User Login](#12-user-login)
   - [Get Current User Profile](#13-get-current-user-profile)
   - [List Team Members](#14-list-team-members)
   - [Update User Profile](#15-update-user-profile)
   - [Change Password](#16-change-password)
2. [Project Management Endpoints](#2-project-management-endpoints)
   - [List All Projects](#21-list-all-projects)
   - [Get Project by ID](#22-get-project-by-id)
   - [Create New Project](#23-create-new-project)
   - [Update Project](#24-update-project)
   - [Delete Project](#25-delete-project)
3. [Task Management Endpoints](#3-task-management-endpoints)
   - [List & Filter Tasks](#31-list--filter-tasks)
   - [Get Task by ID](#32-get-task-by-id)
   - [Create New Task](#33-create-new-task)
   - [Update Task](#34-update-task-rbac-aware)
   - [Delete Task](#35-delete-task)
4. [Dashboard & Metrics Endpoints](#4-dashboard--metrics-endpoints)
   - [Get Executive Dashboard Metrics](#41-get-executive-dashboard-metrics)
5. [Standard Error Responses](#5-standard-error-responses)
6. [Ready-to-Run cURL Commands](#6-ready-to-run-curl-commands)
7. [Health Check (Monitoring)](#7-health-check-monitoring)
---

## 1. Authentication Endpoints

### 1.1 Register New User
Creates a new user account with hashed password (`bcryptjs`, 10 rounds).

- **Method**: `POST`
- **Path**: `/auth/register`
- **Access**: Public
- **Request Body**:
```json
{
  "name": "Jane Developer",
  "email": "jane.dev@brightmind.com",
  "password": "password123"
}
```
*Validation & Security Rules*:
- `name`: String, 1–100 characters (required).
- `email`: Valid email format, maximum 255 characters (required, unique).
- `password`: String, minimum 8 characters, maximum 72 bytes (bcrypt limit) (required).
- *Privilege Escalation Protection*: Any `role` sent in registration payload is ignored; new accounts always default to `"member"`.

- **Success Response** (`201 Created`):
```json
{
  "message": "User registered successfully.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Jane Developer",
    "email": "jane.dev@brightmind.com",
    "role": "member",
    "created_at": "2026-10-23T10:00:00.000Z"
  }
}
```

---

### 1.2 User Login
Authenticates user credentials and returns a signed stateless JWT.

- **Method**: `POST`
- **Path**: `/auth/login`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "alex.admin@brightmind.com",
  "password": "password123"
}
```

- **Success Response** (`200 OK`):
```json
{
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "11111111-1111-1111-1111-111111111111",
    "name": "Alex Turner",
    "email": "alex.admin@brightmind.com",
    "role": "admin"
  }
}
```

---

### 1.3 Get Current User Profile
Returns currently authenticated user session. Re-queries PostgreSQL to guarantee user still exists and role hasn't changed.

- **Method**: `GET`
- **Path**: `/auth/me`
- **Access**: Authenticated
- **Success Response** (`200 OK`):
```json
{
  "user": {
    "id": "11111111-1111-1111-1111-111111111111",
    "name": "Alex Turner",
    "email": "alex.admin@brightmind.com",
    "role": "admin"
  }
}
```

---

### 1.4 List Team Members
Returns all registered users for assignment dropdowns.

- **Method**: `GET`
- **Path**: `/auth/users`
- **Access**: Authenticated
- **Success Response** (`200 OK`):
```json
{
  "users": [
    {
      "id": "11111111-1111-1111-1111-111111111111",
      "name": "Alex Turner",
      "email": "alex.admin@brightmind.com",
      "role": "admin"
    },
    {
      "id": "33333333-3333-3333-3333-333333333333",
      "name": "John Smith",
      "email": "john.dev@brightmind.com",
      "role": "member"
    }
  ]
}
```

---

### 1.5 Update User Profile
Updates the authenticated user's display name.

- **Method**: `PUT`
- **Path**: `/auth/profile`
- **Access**: Authenticated
- **Request Body**:
```json
{
  "name": "Alex Turner Jr."
}
```
*Validation Rules*:
- `name`: String, 1–100 characters (required).

- **Success Response** (`200 OK`):
```json
{
  "message": "Profile updated successfully.",
  "user": {
    "id": "11111111-1111-1111-1111-111111111111",
    "name": "Alex Turner Jr.",
    "email": "alex.admin@brightmind.com",
    "role": "admin",
    "created_at": "2026-10-23T10:00:00.000Z",
    "updated_at": "2026-10-26T12:00:00.000Z"
  }
}
```

---

### 1.6 Change Password
Changes the authenticated user's password after verifying the current password against the stored bcrypt hash.

- **Method**: `PUT`
- **Path**: `/auth/change-password`
- **Access**: Authenticated
- **Request Body**:
```json
{
  "currentPassword": "password123",
  "newPassword": "NewStr0ng!Pass"
}
```
*Validation Rules*:
- `currentPassword`: String, minimum 1 character (required).
- `newPassword`: String, minimum 8 characters, maximum 72 bytes (bcrypt limit) (required).
- `newPassword` must differ from `currentPassword`.

- **Success Response** (`200 OK`):
```json
{
  "message": "Password updated successfully."
}
```

- **Error Response** (`400 Bad Request` — wrong current password):
```json
{
  "error": "Current password is incorrect."
}
```

---

### 1.7 Session Lifecycle & Client-Side Logout
Authentication is powered by stateless JSON Web Tokens (JWT).

**Instant Session Hydration**: On page load or refresh, `AuthContext` reads the cached `user` object from `localStorage` immediately, eliminating any blocking spinner. A background `GET /auth/me` call silently revalidates the session and refreshes the stored user record.

Logout is executed client-side by purging the token and user from `localStorage` and resetting React application state.

> **Architectural Note**: In this stateless prototype, previously issued JWT tokens remain valid until their configured expiration timestamp (`JWT_EXPIRES_IN`). For strict zero-trust or banking environments requiring immediate server-side revocation upon logout, a distributed Redis token-blocklist or database-backed refresh-token rotation model can be incorporated.

---

## 2. Project Management Endpoints

### 2.1 List All Projects
Retrieves all projects with dynamic task aggregations and completion percentages calculated in a single database round-trip.

- **Method**: `GET`
- **Path**: `/projects`
- **Access**: Authenticated
- **Success Response** (`200 OK`):
```json
{
  "projects": [
    {
      "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "name": "Customer Portal Redesign",
      "description": "Revamp client-facing dashboard with modern UI, self-service billing, and telemetry.",
      "created_by": "11111111-1111-1111-1111-111111111111",
      "created_by_name": "Alex Turner",
      "created_at": "2026-10-23T00:00:00.000Z",
      "updated_at": "2026-10-23T00:00:00.000Z",
      "total_tasks": 5,
      "completed_tasks": 2,
      "pending_tasks": 3,
      "overdue_tasks": 1,
      "progress_percentage": 40
    }
  ]
}
```

---

### 2.2 Get Project by ID
Retrieves details for a single project along with its associated task list.

- **Method**: `GET`
- **Path**: `/projects/:id`
- **Access**: Authenticated
- **Success Response** (`200 OK`):
```json
{
  "project": {
    "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "name": "Customer Portal Redesign",
    "description": "Revamp client-facing dashboard with modern UI, self-service billing, and telemetry.",
    "created_by": "11111111-1111-1111-1111-111111111111",
    "created_by_name": "Alex Turner",
    "created_at": "2026-10-23T00:00:00.000Z",
    "updated_at": "2026-10-23T00:00:00.000Z"
  },
  "tasks": [
    {
      "id": "10000000-0000-0000-0000-000000000001",
      "title": "Design High-Fidelity Figma Mockups",
      "description": "Create responsive mobile and desktop wireframes for customer analytics view.",
      "status": "Completed",
      "priority": "High",
      "due_date": "2026-10-13",
      "project_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "assignee_id": "66666666-6666-6666-6666-666666666666",
      "assignee_name": "Emma Watson",
      "assignee_email": "emma.ui@brightmind.com",
      "created_by": "11111111-1111-1111-1111-111111111111",
      "created_at": "2026-10-23T00:00:00.000Z",
      "updated_at": "2026-10-23T00:00:00.000Z"
    }
  ]
}
```

---

### 2.3 Create New Project
Creates a new project record.

- **Method**: `POST`
- **Path**: `/projects`
- **Access**: Admin Only (`role = 'admin'`)
- **Request Body**:
```json
{
  "name": "Internal Developer Portal",
  "description": "Centralized documentation, service catalog, and API mocking playground."
}
```
*Validation Rules*:
- `name`: String, 1–150 characters (required).
- `description`: Optional string or `null`.

- **Success Response** (`201 Created`):
```json
{
  "message": "Project created successfully.",
  "project": {
    "id": "9a8b7c6d-5e4f-3a2b-1c0d-e9f8a7b6c5d4",
    "name": "Internal Developer Portal",
    "description": "Centralized documentation, service catalog, and API mocking playground.",
    "created_by": "11111111-1111-1111-1111-111111111111",
    "created_at": "2026-10-23T10:00:00.000Z",
    "updated_at": "2026-10-23T10:00:00.000Z"
  }
}
```

---

### 2.4 Update Project
Updates project name or description. Passing `description: null` clears the description in PostgreSQL.

- **Method**: `PUT`
- **Path**: `/projects/:id`
- **Access**: Admin Only
- **Request Body**:
```json
{
  "name": "Internal Developer Portal v2",
  "description": null
}
```

- **Success Response** (`200 OK`):
```json
{
  "message": "Project updated successfully.",
  "project": {
    "id": "9a8b7c6d-5e4f-3a2b-1c0d-e9f8a7b6c5d4",
    "name": "Internal Developer Portal v2",
    "description": null,
    "created_by": "11111111-1111-1111-1111-111111111111",
    "created_at": "2026-10-23T10:00:00.000Z",
    "updated_at": "2026-10-23T10:05:00.000Z"
  }
}
```

---

### 2.5 Delete Project
Permanently deletes a project. Due to foreign key `ON DELETE CASCADE`, all tasks linked to this project are automatically deleted.

- **Method**: `DELETE`
- **Path**: `/projects/:id`
- **Access**: Admin Only
- **Success Response** (`200 OK`):
```json
{
  "message": "Project 'Internal Developer Portal v2' and all associated tasks deleted successfully.",
  "deletedId": "9a8b7c6d-5e4f-3a2b-1c0d-e9f8a7b6c5d4"
}
```

---

## 3. Task Management Endpoints

### 3.1 List & Filter Tasks
Retrieves tasks with multi-field server-side filtering, live text search, and overdue detection.

- **Method**: `GET`
- **Path**: `/tasks`
- **Access**: Authenticated
- **Query Parameters**:
  - `search` (string): Searches title and description (`ILIKE %search%`).
  - `projectId` or `project_id` (UUID): Filters by specific project.
  - `status` (string): Filters by `"To Do"`, `"In Progress"`, or `"Completed"`.
  - `priority` (string): Filters by `"Low"`, `"Medium"`, or `"High"`.
  - `assigneeId` or `assignee_id` (UUID): Filters by assigned team member.
  - `overdue` (boolean): If `'true'`, filters uncompleted tasks past deadline.

- **Example Request**:
  `GET /api/tasks?status=In%20Progress&priority=High&overdue=true`

- **Success Response** (`200 OK`):
```json
{
  "tasks": [
    {
      "id": "10000000-0000-0000-0000-000000000005",
      "title": "Audit Accessibility (WCAG 2.1 AA)",
      "description": "Review color contrast, keyboard navigation, and aria labels across portal.",
      "status": "In Progress",
      "priority": "High",
      "due_date": "2026-10-21",
      "project_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "project_name": "Customer Portal Redesign",
      "assignee_id": "55555555-5555-5555-5555-555555555555",
      "assignee_name": "Michael Scott",
      "assignee_email": "michael.qa@brightmind.com",
      "created_by": "11111111-1111-1111-1111-111111111111",
      "created_by_name": "Alex Turner",
      "created_at": "2026-10-23T00:00:00.000Z",
      "updated_at": "2026-10-23T00:00:00.000Z",
      "is_overdue": true
    }
  ],
  "totalCount": 1
}
```

---

### 3.2 Get Task by ID
Retrieves details for a single task.

- **Method**: `GET`
- **Path**: `/tasks/:id`
- **Access**: Authenticated
- **Success Response** (`200 OK`):
```json
{
  "task": {
    "id": "10000000-0000-0000-0000-000000000005",
    "title": "Audit Accessibility (WCAG 2.1 AA)",
    "description": "Review color contrast, keyboard navigation, and aria labels across portal.",
    "status": "In Progress",
    "priority": "High",
    "due_date": "2026-10-21",
    "project_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "project_name": "Customer Portal Redesign",
    "assignee_id": "55555555-5555-5555-5555-555555555555",
    "assignee_name": "Michael Scott",
    "assignee_email": "michael.qa@brightmind.com",
    "created_by": "11111111-1111-1111-1111-111111111111",
    "created_by_name": "Alex Turner",
    "created_at": "2026-10-23T00:00:00.000Z",
    "updated_at": "2026-10-23T00:00:00.000Z",
    "is_overdue": true
  }
}
```

---

### 3.3 Create New Task
Creates a new task linked to a project and an optional assignee.

- **Method**: `POST`
- **Path**: `/tasks`
- **Access**: Admin Only
- **Request Body**:
```json
{
  "title": "Implement Redis Cache Layer",
  "description": "Cache session token revocation checks in memory.",
  "status": "To Do",
  "priority": "High",
  "due_date": "2026-11-15",
  "project_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "assignee_id": "33333333-3333-3333-3333-333333333333"
}
```
*Validation Rules*:
- `title`: String, 1–200 characters (required).
- `project_id`: Valid UUID referencing an existing project (required).
- `status`: Optional, defaults to `"To Do"`. Allowed: `"To Do"`, `"In Progress"`, `"Completed"`.
- `priority`: Optional, defaults to `"Medium"`. Allowed: `"Low"`, `"Medium"`, `"High"`.
- `due_date`: Optional valid `YYYY-MM-DD` date string or `null`. Invalid calendar dates (e.g. `2026-02-31`) return 400.
- `assignee_id`: Optional UUID referencing a valid user or `null`.

- **Success Response** (`201 Created`):
```json
{
  "message": "Task created successfully.",
  "task": {
    "id": "e2f3a4b5-c6d7-8e9f-0a1b-2c3d4e5f6a7b",
    "title": "Implement Redis Cache Layer",
    "description": "Cache session token revocation checks in memory.",
    "status": "To Do",
    "priority": "High",
    "due_date": "2026-11-15T00:00:00.000Z",
    "project_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "assignee_id": "33333333-3333-3333-3333-333333333333",
    "created_by": "11111111-1111-1111-1111-111111111111",
    "created_at": "2026-10-23T10:15:00.000Z",
    "updated_at": "2026-10-23T10:15:00.000Z"
  }
}
```

---

### 3.4 Update Task (RBAC Aware)
Modifies task fields with role-based operational permissions:
- **`admin`**: Can update any field (`title`, `description`, `status`, `priority`, `due_date`, `project_id`, `assignee_id`). Sending `due_date: null` or `description: null` clears the field in PostgreSQL.
- **`member`**: Can **only** update the `status` of tasks assigned to them. Attempting to send other fields (`title`, `priority`, etc.) returns `403 Forbidden`. Attempting to modify tasks assigned to another team member returns `403 Forbidden`.

- **Method**: `PUT`
- **Path**: `/tasks/:id`
- **Access**: Admin (All Fields) or Member (Status Only on Assigned Tasks)

**Example A: Member Updating Status on Assigned Task**:
```json
{
  "status": "Completed"
}
```

**Example B: Admin Clearing Due Date and Description**:
```json
{
  "due_date": null,
  "description": null
}
```

- **Success Response** (`200 OK`):
```json
{
  "message": "Task updated successfully.",
  "task": {
    "id": "e2f3a4b5-c6d7-8e9f-0a1b-2c3d4e5f6a7b",
    "title": "Implement Redis Cache Layer",
    "description": null,
    "status": "Completed",
    "priority": "High",
    "due_date": null,
    "project_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "assignee_id": "33333333-3333-3333-3333-333333333333",
        "created_by": "11111111-1111-1111-1111-111111111111",
    "created_at": "2026-10-23T10:00:00.000Z",
    "updated_at": "2026-10-23T10:20:00.000Z"
  }
}
```

- **Forbidden Response** (`403 Forbidden` if a member attempts to send non-status fields):
```json
{
  "error": "Access denied. Team members are only permitted to update task status."
}
```

---

### 3.5 Delete Task
Permanently deletes a task record.

- **Method**: `DELETE`
- **Path**: `/tasks/:id`
- **Access**: Admin Only
- **Success Response** (`200 OK`):
```json
{
  "message": "Task 'Implement Redis Cache Layer' deleted successfully.",
  "deletedId": "e2f3a4b5-c6d7-8e9f-0a1b-2c3d4e5f6a7b"
}
```

---

## 4. Dashboard & Metrics Endpoints

### 4.1 Get Executive Dashboard Metrics
Executes single-pass SQL aggregations returning all high-level KPIs, overdue alerts, and project progress distributions with zero N+1 overhead.

- **Method**: `GET`
- **Path**: `/dashboard`
- **Access**: Authenticated
- **Success Response** (`200 OK`):
```json
{
  "metrics": {
    "total_projects": 3,
    "total_tasks": 14,
    "completed_tasks": 4,
    "pending_tasks": 10,
    "overdue_tasks": 3,
    "high_priority_pending": 4,
    "completion_rate": 29
  },
  "overdueAlerts": [
    {
      "id": "10000000-0000-0000-0000-000000000005",
      "title": "Audit Accessibility (WCAG 2.1 AA)",
      "priority": "High",
      "due_date": "2026-10-21",
      "project_name": "Customer Portal Redesign",
      "assignee_name": "Michael Scott"
    }
  ],
  "projectSummaries": [
    {
      "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      "name": "Payment Gateway Integration",
      "total_tasks": 4,
      "completed_tasks": 1,
      "progress": 25
    }
  ]
}
```

---

## 5. Standard Error Responses

All error responses return consistent, predictable JSON structures:

| HTTP Status | Reason | Example Response Body |
|---|---|---|
| `400 Bad Request` | Validation failure (invalid date, overlong string, malformed UUID) | `{"error": "Invalid due_date. Must be a valid calendar date in YYYY-MM-DD format."}` |
| `401 Unauthorized` | Missing, malformed, or expired JWT | `{"error": "Authentication required. No token provided."}` |
| `403 Forbidden` | Insufficient role privileges | `{"error": "Access denied. Administrator privileges required for this action."}` |
| `404 Not Found` | Target record or route does not exist | `{"error": "Task not found."}` |
| `409 Conflict` | Unique constraint violation (e.g. duplicate email) | `{"error": "An account with this email address already exists."}` |
| `429 Too Many Requests` | Login/register rate limit exceeded | `{"error":"Too many attempts. Please try again later."}` |
| `500 Internal Error`| Unhandled database or server exception (sanitized) | `{"error": "Internal server error. Please try again later."}` |

---

## 6. Ready-to-Run cURL Commands

These commands can be directly executed against a running backend (`http://localhost:5000`):

### Step 1: Login as Admin and Capture Token
```bash
# Standard Bash / cURL
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alex.admin@brightmind.com","password":"password123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Admin Token: $TOKEN"
```

```powershell
# Windows PowerShell
$res = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"alex.admin@brightmind.com","password":"password123"}'
$TOKEN = $res.token
Write-Host "Admin Token:" $TOKEN
```

### Step 2: Fetch Executive Dashboard Metrics
```bash
curl -X GET http://localhost:5000/api/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

### Step 3: Fetch Filtered Tasks (Overdue Only)
```bash
curl -X GET "http://localhost:5000/api/tasks?overdue=true" \
  -H "Authorization: Bearer $TOKEN"
```

### Step 4: Create a New Project (Admin)
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Live Assessment Demonstration Project",
    "description": "Created dynamically during technical interview review."
  }'
```

### Step 5: Verify Cascading Deletion
```bash
# Deleting a project automatically cascades to delete all child tasks
curl -X DELETE "http://localhost:5000/api/projects/<PROJECT_ID>" \
  -H "Authorization: Bearer $TOKEN"
```


---

## 7. Health Check (Monitoring)

Used by the frontend sidebar and by uptime monitors. It runs `SELECT 1` against PostgreSQL, so it reports whether the **database** is reachable, not just whether the API process is running.

- **Method**: `GET`
- **Path**: `/health`
- **Access**: Public

- **Success Response** (`200 OK`):
```json
{
  "status": "OK",
  "database": "connected",
  "service": "Smart Task & Project Manager API",
  "timestamp": "2026-10-27T05:33:15.119Z"
}
```

- **Failure Response** (`503 Service Unavailable`, database unreachable):
```json
{
  "status": "Degraded",
  "database": "disconnected",
  "error": "PostgreSQL database connectivity check failed.",
  "timestamp": "2026-10-27T05:33:15.119Z"
}
```