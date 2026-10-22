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
   - [Update Task](#34-update-task)
   - [Delete Task](#35-delete-task)
4. [Dashboard & Metrics Endpoints](#4-dashboard--metrics-endpoints)
   - [Get System Metrics & Overdue Alerts](#41-get-system-metrics--overdue-alerts)
5. [Standard Error Responses](#5-standard-error-responses)
6. [Ready-to-Run cURL Commands](#6-ready-to-run-curl-commands)

---

## 1. Authentication Endpoints

### 1.1 Register New User
Creates a new user account with hashed password (`bcrypt`).

- **Method**: `POST`
- **Path**: `/auth/register`
- **Access**: Public
- **Request Body**:
```json
{
  "name": "Jane Developer",
  "email": "jane.dev@brightmind.com",
  "password": "password123",
  "role": "member"
}
```
*Validation Rules*:
- `name`: 2-100 characters.
- `email`: Valid RFC email format.
- `password`: Minimum 6 characters.
- `role`: Optional, defaults to `"member"`. Must be `"admin"` or `"member"`.

- **Success Response** (`201 Created`):
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Jane Developer",
    "email": "jane.dev@brightmind.com",
    "role": "member",
    "created_at": "2026-10-23T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 1.2 User Login
Authenticates user credentials and returns a signed JWT.

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
  "message": "Login successful",
  "user": {
    "id": "11111111-1111-1111-1111-111111111111",
    "name": "Alex Turner",
    "email": "alex.admin@brightmind.com",
    "role": "admin",
    "created_at": "2026-10-23T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

- **Error Response** (`401 Unauthorized`):
```json
{
  "error": "Invalid email or password"
}
```

---

### 1.3 Get Current User Profile
Retrieves the profile of the authenticated user from the active JWT.

- **Method**: `GET`
- **Path**: `/auth/me`
- **Access**: Authenticated (`admin` or `member`)
- **Headers**: `Authorization: Bearer <token>`

- **Success Response** (`200 OK`):
```json
{
  "user": {
    "id": "11111111-1111-1111-1111-111111111111",
    "name": "Alex Turner",
    "email": "alex.admin@brightmind.com",
    "role": "admin",
    "created_at": "2026-10-23T00:00:00.000Z"
  }
}
```

---

### 1.4 List Team Members
Retrieves all registered users for task assignment dropdowns.

- **Method**: `GET`
- **Path**: `/auth/users`
- **Access**: Authenticated (`admin` or `member`)

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

## 2. Project Management Endpoints

### 2.1 List All Projects
Retrieves all projects along with real-time calculated completion metrics.

- **Method**: `GET`
- **Path**: `/projects`
- **Access**: Authenticated
- **Success Response** (`200 OK`):
```json
{
  "projects": [
    {
      "id": "bbbbbbbb-1111-1111-1111-111111111111",
      "name": "Mobile Application API v2",
      "description": "Design and implement high-performance REST APIs with caching and rate limiting.",
      "created_at": "2026-10-20T00:00:00.000Z",
      "updated_at": "2026-10-20T00:00:00.000Z",
      "total_tasks": "5",
      "completed_tasks": "1",
      "pending_tasks": "4",
      "overdue_tasks": "0",
      "completion_rate": 20
    }
  ]
}
```

---

### 2.2 Get Project by ID
Retrieves single project details along with its full list of associated tasks.

- **Method**: `GET`
- **Path**: `/projects/:id`
- **Access**: Authenticated
- **Success Response** (`200 OK`):
```json
{
  "project": {
    "id": "bbbbbbbb-1111-1111-1111-111111111111",
    "name": "Mobile Application API v2",
    "description": "Design and implement high-performance REST APIs with caching and rate limiting.",
    "total_tasks": "5",
    "completed_tasks": "1",
    "pending_tasks": "4",
    "overdue_tasks": "0",
    "completion_rate": 20,
    "tasks": [
      {
        "id": "cccccccc-0001-0000-0000-000000000001",
        "title": "Setup OAuth2 & JWT Refresh Token Rotation",
        "status": "Completed",
        "priority": "High",
        "due_date": "2026-10-18",
        "assignee_name": "John Smith"
      }
    ]
  }
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
  "description": "Centralized documentation, service mesh catalog, and API mocking playground."
}
```
*Validation Rules*:
- `name`: 2-150 characters (required).
- `description`: Optional text.

- **Success Response** (`201 Created`):
```json
{
  "message": "Project created successfully",
  "project": {
    "id": "9a8b7c6d-5e4f-3a2b-1c0d-e9f8a7b6c5d4",
    "name": "Internal Developer Portal",
    "description": "Centralized documentation, service mesh catalog, and API mocking playground.",
    "created_at": "2026-10-23T00:00:00.000Z",
    "updated_at": "2026-10-23T00:00:00.000Z"
  }
}
```

- **Forbidden Response** (`403 Forbidden` if requested by a member):
```json
{
  "error": "Access denied: Administrator privileges required"
}
```

---

### 2.4 Update Project
Updates project name or description.

- **Method**: `PUT`
- **Path**: `/projects/:id`
- **Access**: Admin Only
- **Request Body**:
```json
{
  "name": "Internal Developer Portal v2",
  "description": "Updated project description with security enhancements."
}
```

- **Success Response** (`200 OK`):
```json
{
  "message": "Project updated successfully",
  "project": {
    "id": "9a8b7c6d-5e4f-3a2b-1c0d-e9f8a7b6c5d4",
    "name": "Internal Developer Portal v2",
    "description": "Updated project description with security enhancements.",
    "updated_at": "2026-10-23T00:05:00.000Z"
  }
}
```

---

### 2.5 Delete Project
Permanently deletes a project. Due to foreign key `ON DELETE CASCADE`, all tasks linked to this project are also automatically deleted.

- **Method**: `DELETE`
- **Path**: `/projects/:id`
- **Access**: Admin Only
- **Success Response** (`200 OK`):
```json
{
  "message": "Project and all associated tasks deleted successfully",
  "deleted_project_id": "9a8b7c6d-5e4f-3a2b-1c0d-e9f8a7b6c5d4"
}
```

---

## 3. Task Management Endpoints

### 3.1 List & Filter Tasks
Retrieves tasks with multi-field filtering, live text search, and overdue toggles.

- **Method**: `GET`
- **Path**: `/tasks`
- **Access**: Authenticated
- **Query Parameters**:
  - `search` (string): Searches title and description (`ILIKE %search%`).
  - `project_id` (UUID): Filters by specific project.
  - `status` (string): Filter by `"To Do"`, `"In Progress"`, or `"Completed"`.
  - `priority` (string): Filter by `"Low"`, `"Medium"`, or `"High"`.
  - `assignee_id` (UUID): Filter by assigned team member.
  - `overdue` (boolean): If `true`, returns tasks where `due_date < CURRENT_DATE` and `status != 'Completed'`.

- **Example Request**:
  `GET /api/tasks?status=In%20Progress&priority=High&overdue=true`

- **Success Response** (`200 OK`):
```json
{
  "tasks": [
    {
      "id": "cccccccc-0002-0000-0000-000000000002",
      "title": "Audit Accessibility (WCAG 2.1 AA)",
      "description": "Review color contrast, keyboard navigation, and aria labels across portal.",
      "status": "In Progress",
      "priority": "High",
      "due_date": "2026-10-21",
      "project_id": "bbbbbbbb-2222-2222-2222-222222222222",
      "project_name": "Customer Portal Redesign",
      "assignee_id": "55555555-5555-5555-5555-555555555555",
      "assignee_name": "Michael Scott",
      "assignee_email": "michael.qa@brightmind.com",
      "is_overdue": true,
      "created_at": "2026-10-15T00:00:00.000Z",
      "updated_at": "2026-10-15T00:00:00.000Z"
    }
  ]
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
    "id": "cccccccc-0002-0000-0000-000000000002",
    "title": "Audit Accessibility (WCAG 2.1 AA)",
    "description": "Review color contrast, keyboard navigation, and aria labels across portal.",
    "status": "In Progress",
    "priority": "High",
    "due_date": "2026-10-21",
    "project_id": "bbbbbbbb-2222-2222-2222-222222222222",
    "project_name": "Customer Portal Redesign",
    "assignee_id": "55555555-5555-5555-5555-555555555555",
    "assignee_name": "Michael Scott",
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
  "title": "Implement Redis Session Cache",
  "description": "Reduce PostgreSQL load by caching authenticated JWT session blacklists in Redis.",
  "status": "To Do",
  "priority": "High",
  "due_date": "2026-10-30",
  "project_id": "bbbbbbbb-1111-1111-1111-111111111111",
  "assignee_id": "33333333-3333-3333-3333-333333333333"
}
```
*Validation Rules*:
- `title`: 2-200 characters (required).
- `project_id`: Valid UUID referencing an existing project (required).
- `status`: Optional, defaults to `"To Do"`. Must be `"To Do"`, `"In Progress"`, or `"Completed"`.
- `priority`: Optional, defaults to `"Medium"`. Must be `"Low"`, `"Medium"`, or `"High"`.
- `due_date`: Optional valid `YYYY-MM-DD` date format.
- `assignee_id`: Optional UUID referencing a valid user.

- **Success Response** (`201 Created`):
```json
{
  "message": "Task created successfully",
  "task": {
    "id": "e2f3a4b5-c6d7-8e9f-0a1b-2c3d4e5f6a7b",
    "title": "Implement Redis Session Cache",
    "status": "To Do",
    "priority": "High",
    "due_date": "2026-10-30",
    "project_id": "bbbbbbbb-1111-1111-1111-111111111111",
    "assignee_id": "33333333-3333-3333-3333-333333333333",
    "created_at": "2026-10-23T00:00:00.000Z"
  }
}
```

---

### 3.4 Update Task (RBAC Aware)
Modifies task fields. Includes role-based operational permissions:
- **`admin`**: Can edit all fields (title, description, project, assignee, priority, status, due_date).
- **`member`**: Can **only** update the `status` field. Attempting to change title, priority, project, or assignee returns a 403 Forbidden error.

- **Method**: `PUT`
- **Path**: `/tasks/:id`
- **Access**: Admin (All Fields) or Member (Status Only)

**Example A: Member Updating Task Status**:
```json
{
  "status": "Completed"
}
```

**Example B: Admin Full Task Update**:
```json
{
  "title": "Implement Redis Session Cache & Cluster Failover",
  "description": "Expanded scope to include sentinel clustering.",
  "status": "In Progress",
  "priority": "High",
  "due_date": "2026-11-05",
  "assignee_id": "33333333-3333-3333-3333-333333333333"
}
```

- **Success Response** (`200 OK`):
```json
{
  "message": "Task updated successfully",
  "task": {
    "id": "e2f3a4b5-c6d7-8e9f-0a1b-2c3d4e5f6a7b",
    "title": "Implement Redis Session Cache & Cluster Failover",
    "status": "In Progress",
    "priority": "High",
    "due_date": "2026-11-05",
    "updated_at": "2026-10-23T00:10:00.000Z"
  }
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
  "message": "Task deleted successfully",
  "deleted_task_id": "e2f3a4b5-c6d7-8e9f-0a1b-2c3d4e5f6a7b"
}
```

---

## 4. Dashboard & Metrics Endpoints

### 4.1 Get System Metrics & Overdue Alerts
Executes a single-query SQL aggregation returning all high-level KPIs and actionable alerts with zero N+1 overhead.

- **Method**: `GET`
- **Path**: `/dashboard/metrics`
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
    "completion_rate": 29
  },
  "overdueAlerts": [
    {
      "id": "cccccccc-0002-0000-0000-000000000002",
      "title": "Audit Accessibility (WCAG 2.1 AA)",
      "due_date": "2026-10-21",
      "priority": "High",
      "status": "In Progress",
      "project_name": "Customer Portal Redesign",
      "assignee_name": "Michael Scott"
    }
  ],
  "projectSummaries": [
    {
      "id": "bbbbbbbb-1111-1111-1111-111111111111",
      "name": "Mobile Application API v2",
      "total_tasks": "5",
      "completed_tasks": "1",
      "completion_rate": 20
    }
  ]
}
```

---

## 5. Standard Error Responses

All error responses return consistent JSON structures with clear diagnostic messages:

| HTTP Status | Reason | Example Response Body |
|---|---|---|
| `400 Bad Request` | Validation failure (invalid email, missing title, invalid UUID) | `{"error": "Title must be between 2 and 200 characters"}` |
| `401 Unauthorized` | Missing, malformed, or expired JWT | `{"error": "Authentication token missing or invalid"}` |
| `403 Forbidden` | Insufficient role privileges | `{"error": "Access denied: Administrator privileges required"}` |
| `404 Not Found` | Entity does not exist | `{"error": "Project not found"}` |
| `409 Conflict` | Unique constraint violation (e.g., duplicate email) | `{"error": "A user with this email already exists"}` |
| `500 Internal Error`| Unhandled database or server exception | `{"error": "Internal server error"}` |

---

## 6. Ready-to-Run cURL Commands

These commands can be directly executed in PowerShell or Bash to demonstrate the API during technical review:

### Step 1: Login as Admin and Capture Token
```bash
# Windows PowerShell
$LOGIN_RES = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"alex.admin@brightmind.com","password":"password123"}'
$TOKEN = $LOGIN_RES.token
Write-Host "Admin JWT Token:" $TOKEN
```

```bash
# Standard Bash / cURL
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alex.admin@brightmind.com","password":"password123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Admin Token: $TOKEN"
```

### Step 2: Fetch Executive Dashboard Metrics
```bash
curl -X GET http://localhost:5000/api/dashboard/metrics \
  -H "Authorization: Bearer $TOKEN"
```

### Step 3: Fetch Overdue Tasks Only
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
    "name": "Live Review Demonstration Project",
    "description": "Created dynamically during technical interview walkthrough."
  }'
```

### Step 5: Verify Cascading Deletion
```bash
# Deleting a project will automatically cascade and delete its associated tasks:
curl -X DELETE "http://localhost:5000/api/projects/<PROJECT_ID>" \
  -H "Authorization: Bearer $TOKEN"
```
