# Smart Task & Project Management System

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v5.3-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v16%2B-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-v19.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-v8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Demo-Live%20App-0A1931?style=flat&logo=render&logoColor=white)](https://smart-task-manager-frontend-ing7.onrender.com)

> ### 🌐 Live Production Deployment
> - **Live Web Application**: [https://smart-task-manager-frontend-ing7.onrender.com](https://smart-task-manager-frontend-ing7.onrender.com)
> - **Live REST API (Health Check)**: [https://smart-task-manager-akxk.onrender.com/api/health](https://smart-task-manager-akxk.onrender.com/api/health)
> - **Cloud Database**: Neon Serverless PostgreSQL (AWS us-east-2)
> - **Pre-Configured Demo Credentials**:
>   - **Admin Access**: `alex.admin@brightmind.com` | `password123`
>   - **Team Member Access**: `john.dev@brightmind.com` | `password123`
>
> *Tip: Hosted on Render Free Tier. If the backend is idle, the very first API request may take ~45–50 seconds for the instance to warm up.*

An enterprise-grade, full-stack Task and Project Management platform developed for the **Bright Mind Ltd. Full-Stack Developer Assessment**. Designed with a performance-first PostgreSQL schema, secure JWT Role-Based Access Control (RBAC), atomic analytical metric queries, and an executive Midnight Navy UI with mobile-responsive navigation.

---

## Table of Contents
- [System Architecture](#system-architecture)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Database Schema & Design](#database-schema--design)
- [Pre-Seeded Accounts](#pre-seeded-accounts)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup & Database Migration](#1-backend-setup--database-migration)
  - [Frontend Setup](#2-frontend-setup)
- [Running Automated Tests](#running-automated-tests)
- [Deployment (Render + Neon)](#deployment-render--neon)
- [Known Limitations](#known-limitations)
- [API Reference Overview](#api-reference-overview)
- [Project Structure](#project-structure)
- [Assessment Deliverables](#assessment-deliverables)

---

## System Architecture

```mermaid
graph TD
    Client["React 19 SPA (Vite 8)"]
    Router["React Router v7"]
    AuthCtx["Auth Context (JWT State + Instant localStorage Hydration)"]
    Axios["Axios API Client (Bearer Interceptor)"]

    API["Express 5.3 REST API (:5000)"]
    AuthMW["JWT & RBAC Middleware"]
    ValMW["Strict Validation Middleware"]
    ErrMW["Centralized Error Handler (Code Mapping)"]

    DB[(PostgreSQL 16+ :5432)]

    Client --> Router
    Router --> AuthCtx
    AuthCtx --> Axios
    Axios -->|HTTP + Bearer Token| API

    API --> AuthMW
    AuthMW --> ValMW
    ValMW --> Controllers["Controllers (Auth, Projects, Tasks, Dashboard)"]
    Controllers --> ErrMW
    Controllers -->|"Parameterized SQL"| DB
```

---

## Key Features

### 1. Robust Authentication, RBAC & User Profile Management
- **Password Security**: Passwords hashed using `bcryptjs` (10 salt rounds).
- **Session Tokens**: Stateless JSON Web Tokens (JWT) signed with HMAC-SHA256 and expiration.
- **Instant Session Hydration**: On page refresh, `AuthContext` reads the cached user from `localStorage` immediately — eliminating any blocking spinner. A background `GET /auth/me` call silently revalidates the session with the server.
- **Notification Center**: bell dropdown lists overdue and recently completed tasks (All / Urgent / Unread) with per-item read tracking.

- **Role Enforcement**:
  - **`admin`**: Full administrative access — create/update/delete projects, assign tasks to any employee, manage task lifecycle, and view executive metrics.
  - **`member`**: Focused team access — view projects (read-only), view tasks, and independently update task completion status (`To Do` -> `In Progress` -> `Completed`) on their assigned work. Attempting to modify other fields returns a `403 Forbidden` error.
- **Session Lifecycle**: Stateless client-side logout purging `localStorage` and React authentication state. Tokens expire automatically based on `JWT_EXPIRES_IN=7d`.
- **User Profile Page** (`/profile`): Authenticated users can update their display name via `PUT /auth/profile` and change their account password via `PUT /auth/change-password` (verified against the bcrypt hash of their current password). A profile dropdown in the navbar provides quick access to both functions.

### 2. Project Portfolio Management
- Real-time dynamic completion percentage computation (`COUNT(*) FILTER (WHERE status = 'Completed') / total * 100`).
- Relational cascading deletion (`ON DELETE CASCADE`) to eliminate orphaned task records upon project deletion.

### 3. Advanced Task Lifecycle & Filtering
- Categorized by **Status** (`To Do`, `In Progress`, `Completed`) and **Priority** (`Low`, `Medium`, `High`).
- **Multi-Field Real-Time Filtering**: Live server-side filtering combining project, status, priority, assignee, text search, and overdue toggles. Accepts both camelCase (`projectId`, `assigneeId`) and snake_case (`project_id`, `assignee_id`) query parameters.
- **Relational Integrity**: Foreign key to assignees (`ON DELETE SET NULL`) preserves tasks when team members are removed.
- **Nullable Field Clearing**: Updating tasks with `due_date: null` or `description: null` explicitly clears the database record using SQL `CASE WHEN` logic.

### 4. Executive Dashboard & Metrics
- **Zero N+1 Roundtrips**: The KPI block uses one aggregation query, plus overdue alerts and project summaries, for 3 queries total.
- **Overdue Task Tracking**: Dedicated alert banner and filter for tasks with past-due deadlines that are not yet completed, ordered by due date and ranked priority (`High` > `Medium` > `Low`).

### 5. Polished Executive UI & Responsive Design
- Built on a clean **ice canvas** (`#F4F7FC`) with a **royal-blue primary** (`#2563EB`), slate-navy accents (`#0F172A`) and gradient KPI cards; green/amber/red are reserved for status.
- Fixed `100vh` non-scrolling sidebar on desktop with independent scrollable tables, and a sliding drawer with hamburger menu on mobile devices (<=768px).
- **Profile Dropdown Navbar**: Clicking the user avatar chip reveals a dropdown with quick links to View Profile, Change Password, and Sign Out.
- **Profile Page**: Tabbed layout with "Personal Information" (display name editing) and "Password & Security" (password change with live strength meter and requirements checklist).
- **Floating Toast Alerts**: A reusable app-wide component supports success, error, info, and warning variants. Task, project, and profile actions show success or error feedback, with optional actions, dismissal, and pause-on-hover/focus behavior.
- Debounced search input (~300ms) with stale-response cancellation and bidirectional URL parameter synchronization.
- Dot-style semantic badges and quick demo-fill buttons for instant reviewer evaluation.

---

## Tech Stack

| Layer | Technology | Key Libraries / Modules |
|---|---|---|
| **Frontend** | React 19.3, Vite 8.3 | `react-router-dom` v7, `axios`, `lucide-react`, Vanilla CSS Tokens |
| **Backend** | Node.js (v20.19+ or v22+ LTS), Express 5.3 | `pg` (Connection Pooling), `jsonwebtoken`, `bcryptjs`, `cors`, `dotenv` |
| **Database** | PostgreSQL 14+, 16+, 17 | Relational DDL, UUID v4 (`gen_random_uuid()`), B-Tree Indexes, Dynamic Interval Seeds |
| **Testing** | Node.js Test Runner | Native Integration Test Suite (`node:test`, `node:assert`) |

---

## Database Schema & Design

The database schema is strictly normalized and enforced with database-level constraints:

```mermaid
erDiagram
    USERS ||--o{ TASKS : "assigned_to"
    PROJECTS ||--o{ TASKS : "contains"

    USERS {
        uuid id PK
        string name
        string email
        string password_hash
        string role
        timestamptz created_at
        timestamptz updated_at
    }

    PROJECTS {
        uuid id PK
        string name
        string description
        uuid created_by FK
        timestamptz created_at
        timestamptz updated_at
    }

    TASKS {
        uuid id PK
        string title
        string description
        string status
        string priority
        date due_date
        uuid project_id FK
        uuid assignee_id FK
        uuid created_by FK
        timestamptz created_at
        timestamptz updated_at
    }
```

### Strategic B-Tree Indexes
- `idx_projects_created_by`: Foreign key index for project creator queries.
- `idx_tasks_project_id`: Fast joins and cascading deletes on project tasks.
- `idx_tasks_assignee_id`: Fast filtering by assigned team member.
- `idx_tasks_status`: Accelerated aggregation for status filtering and KPI metrics.
- `idx_tasks_priority`: Priority-based sorting and filtering.
- `idx_tasks_due_date`: Instant overdue task detection (`due_date < CURRENT_DATE`).

---

## Pre-Seeded Accounts

The database migration seeds **7 users**, **3 realistic projects**, and **14 tasks** (including 3 dynamically overdue tasks):

| Role | Name | Email | Password | Access Rights |
|---|---|---|---|---|
| **Admin** | Alex Turner | `alex.admin@brightmind.com` | `password123` | Full administrative control (CRUD projects, tasks, assign to all members, view KPIs) |
| **Admin** | Rachel Adams | `rachel.pm@brightmind.com` | `password123` | Full administrative control |
| **Member** | John Smith | `john.dev@brightmind.com` | `password123` | View projects & tasks, update status on assigned tasks |
| **Member** | Sarah Connor | `sarah.dev@brightmind.com` | `password123` | View projects & tasks, update status on assigned tasks |
| **Member** | Michael Scott | `michael.qa@brightmind.com` | `password123` | View projects & tasks, update status on assigned tasks |
| **Member** | Emma Watson | `emma.ui@brightmind.com` | `password123` | View projects & tasks, update status on assigned tasks |
| **Member** | David Miller | `david.ops@brightmind.com` | `password123` | View projects & tasks, update status on assigned tasks |

> **Tip**: One-click **"Fill Admin"** and **"Fill Team Member"** buttons are available on the Login page for instant reviewer access.

---

## Getting Started

### Prerequisites
- **Node.js**: v20.19+ or v22+ LTS ([Download](https://nodejs.org/))
- **PostgreSQL**: v14, v16, or v17 ([Download](https://www.postgresql.org/))
- **npm**: v10+ (bundled with Node)
- **Git** ([Download](https://git-scm.com/))

---

### 1. Backend Setup & Database Migration

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the provided `.env.example` file to create your `.env`:
   ```bash
   cp .env.example .env
   ```
   *(On Windows PowerShell: `Copy-Item .env.example .env`)*

   Verify or update the connection settings in `backend/.env`. Generate a cryptographically strong secret for `JWT_SECRET`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

   ```env
   PORT=5000
   NODE_ENV=development
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=bm_task_manager
   DB_USER=postgres
   DB_PASSWORD=postgres
   JWT_SECRET=your_generated_cryptographic_secret_min_32_characters
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:5173
   ```

4. **Initialize Database & Seed Data**:
   Ensure PostgreSQL is running locally. You can create the database manually via:
   ```bash
   createdb bm_task_manager
   ```
   *(Or in psql: `CREATE DATABASE bm_task_manager;`)*

   Then execute the automated initialization script:
   ```bash
   npm run init-db
   ```
   > ⚠️ **Data Reset Caution**: `initDb.js` connects to PostgreSQL, creates `bm_task_manager` if absent, applies `schema.sql` (dropping and recreating tables cleanly via `DROP TABLE IF EXISTS ... CASCADE`), and seeds realistic demo data. This is designed for fresh reviewer evaluation; avoid running it on databases with persistent production data.

5. **Start Backend Server**:
   ```bash
   npm run dev
   ```
   The API server will listen on `http://localhost:5000` with PostgreSQL connected.

---

### 2. Frontend Setup

1. **Open a new terminal and navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start Vite Development Server**:
   ```bash
   npm run dev
   ```
   The application will be live at `http://localhost:5173`.

---

### 3. Docker Containerization Setup

Run PostgreSQL 16 and the Express API in containers from the project root. Secrets are never stored in the repository, so first create a git-ignored `.env` file:

```bash
cp .env.example .env
```

Open `.env` and set `DB_PASSWORD` and a random `JWT_SECRET` (32+ characters; the API refuses to start with the placeholder value). Then start everything:

```bash
docker compose up --build
```

- **`bm-postgres-db`**: PostgreSQL 16 Alpine container with automatic schema and seed initialization mounted via `/docker-entrypoint-initdb.d`.
- **`bm-backend-api`**: Node.js 20 Alpine container listening on port `5000`; it starts after the database health check passes.

The frontend is not containerized; run it separately with `cd frontend && npm install && npm run dev`.

---

## Deployment (Render + Neon)

| Service | Settings |
|---|---|
| API (Web Service, root `backend`) | Build `npm ci` · Start `node src/server.js` · Env: `NODE_ENV=production`, `DB_*` (Neon), `DB_SSL=true`, `JWT_SECRET` (random, 48+ bytes, never from the repo), `JWT_EXPIRES_IN=7d`, `CLIENT_URL=https://<frontend>.onrender.com` |
| Frontend (Static Site, root `frontend`) | Build `npm ci && npm run build` · Publish `dist` · Env `VITE_API_URL=https://<api>.onrender.com/api` · Rewrite `/*` → `/index.html` |

### One-Time Database Initialization

Before the first API deployment, initialize the new database with the schema and seed data once. Configure `backend/.env` with the target Neon database credentials, then run `npm run init-db` from the `backend/` directory.

> ⚠️ `npm run init-db` drops and recreates the tables. Run it only against a new or intentionally disposable database. Never use it as a recurring deploy or start command.

## Known Limitations

- JWTs are stateless: tokens issued before a password change stay valid until they expire (7 days).
- bcrypt uses only the first 72 bytes of a password.
- The token lives in `localStorage` (React escapes output; no `dangerouslySetInnerHTML` is used).
- The shared demo accounts are public; do not store real data in the live deployment.

---

## Running Automated Tests

The backend includes a comprehensive 39-test integration suite built with Node's native test runner (`node:test`, `node:assert`). It starts an in-process HTTP server and tests actual network round-trips and database mutations.

Run the test suite from the `backend/` directory:
```bash
npm test
```


### Test Coverage Highlights:
- **Authentication & Infrastructure**: Live `/health` database ping verification (200 with `database: connected`), valid login, bad password rejection (401), invalid/forged JWT rejection (401), missing token guard (401).
- **Privilege Escalation Prevention**: Registering with `role: "admin"` strictly creates a member account (201).
- **Input Validation**: Rejection of invalid calendar dates like `"2026-02-31"` (400), non-ISO dates `"10/05/2026"` (400), whitespace titles (400), overlong titles >200 chars (400), empty string due dates (400), and null status/priority payloads (400).
- **Role-Based Access Control (RBAC)**:
  - Member cannot create a project (403).
  - Member cannot update a project (403).
  - Member cannot delete a project (403).
  - Member cannot create a task (403).
  - Member cannot delete a task (403).
  - Member cannot update task title or priority (403).
  - Member cannot update status on another member's task (403).
  - Member **can** update status on their assigned task (200).
- **CRUD & Field Clearing**:
  - Admin creates project and task.
  - Admin updates project title and description (200).
  - Admin updates task clearing `due_date: null` and `description: null`, verifying values become `null` in PostgreSQL.
  - Cascading deletion: deleting a project deletes all associated child tasks.
- **Filtering & Dashboard**: Multi-field query filtering with support for both `projectId`/`project_id` and `assigneeId`/`assignee_id`, overdue filter, and KPI metric aggregations.

- **Startup Safety & Deployment Config**: production refuses to boot with a placeholder JWT secret or without `DB_PASSWORD`; development only warns; `docker-compose.yml` keeps PostgreSQL on `127.0.0.1`; the backend image runs as the unprivileged `node` user.
- **Docs Sync**: `docs/API_DOCUMENTATION.md` must document exactly the routes the API exposes; the backend test suite fails if an endpoint is added or removed without updating the docs.
- **Frontend (`cd frontend && npm test`)**: a network error or `503` (e.g. a Render cold start) keeps the cached login, while a `401` signs the user out.
---

## API Reference Overview

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Required Role | Description |
|---|---|---|---|
| `GET` | `/health` | Public | System uptime and health status |
| `POST` | `/auth/register` | Public | Register new team member account |
| `POST` | `/auth/login` | Public | Authenticate user and receive JWT |
| `GET` | `/auth/me` | Authenticated | Retrieve authenticated session profile |
| `GET` | `/auth/users` | Authenticated | List all registered users for task assignment |
| `PUT` | `/auth/profile` | Authenticated | Update authenticated user's display name |
| `PUT` | `/auth/change-password` | Authenticated | Change authenticated user's account password |
| `GET` | `/dashboard` | Authenticated | Retrieve system KPIs, overdue alerts, and progress |
| `GET` | `/projects` | Authenticated | List all projects with computed task completion rates |
| `GET` | `/projects/:id` | Authenticated | Get project details and all child tasks |
| `POST` | `/projects` | Admin | Create new project |
| `PUT` | `/projects/:id` | Admin | Update project name or description |
| `DELETE` | `/projects/:id` | Admin | Delete project (cascades to all associated tasks) |
| `GET` | `/tasks` | Authenticated | Multi-field task filtering, search, and overdue filter |
| `GET` | `/tasks/:id` | Authenticated | Get single task details |
| `POST` | `/tasks` | Admin | Create new task linked to project & assignee |
| `PUT` | `/tasks/:id` | Admin / Member | Admins update any field; Members update status on assigned tasks |
| `DELETE` | `/tasks/:id` | Admin | Delete task |

> For comprehensive request/response payloads, field schemas, and cURL examples, see [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md).

---

## Project Structure

```
smart-task-manager/
├── backend/
│   ├── Dockerfile               # Production image (non-root)
│   ├── .dockerignore
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js           # Centralized environment validator
│   │   │   └── db.js            # PostgreSQL connection pool (pg.Pool)
│   │   ├── controllers/
│   │   │   ├── authController.js       # Auth, user directory, profile & password update
│   │   │   ├── dashboardController.js  # KPI block (1 query) + overdue alerts + project summaries (3 queries total)
│   │   │   ├── projectController.js    # Projects CRUD with progress percentages
│   │   │   └── taskController.js       # Tasks CRUD, RBAC, and clearing null fields
│   │   ├── db/
│   │   │   ├── initDb.js        # Resilient automated DB creator & runner
│   │   │   ├── schema.sql       # PostgreSQL DDL with constraints and indexes
│   │   │   └── seed.sql         # Seed data with relative CURRENT_DATE intervals
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js       # JWT verification & requireAdmin RBAC
│   │   │   ├── errorHandler.js         # PostgreSQL code mapper (22001, 22007 -> 400)
│   │   │   └── validateMiddleware.js   # Strict regex & ISO calendar date validation
│   │   ├── routes/              # Express route definitions
│   │   ├── app.js               # Express application configuration
│   │   └── server.js            # Server entrypoint with graceful shutdown
│   ├── .env.example             # Documented template without committed secrets
│   ├── package.json
│   └── test-api.js              # 39-test Node.js native test suite
│
├── frontend/
│   ├── public/_redirects        # SPA fallback (on Render add a rewrite rule in the dashboard)
│   ├── src/
│   │   ├── api/                 # Axios HTTP client with Bearer interceptor
│   │   ├── components/common/   # Badge, Modal, Navbar, NotificationDropdown, ToastProvider, Sidebar, Layout
│   │   │   └── NotificationDropdown.jsx
│   │   ├── context/             # AuthContext (instant localStorage hydration, login, logout, updateUser)
│   │   ├── pages/               # DashboardPage, ProjectsPage, TasksPage, LoginPage, RegisterPage, ProfilePage
│   │   ├── routes/              # ProtectedRoute with role enforcement and redirect state
│   │   ├── utils/               # Notification helpers, project theme utilities
│   │   ├── index.css            # Design tokens (royal-blue primary, slate-navy accents) & responsive media queries
│   │   └── main.jsx             # React 19 entrypoint
│   ├── index.html               # Semantic HTML5 shell with descriptive title
│   ├── eslint.config.js         # ESLint 10 configuration (0 errors, 0 warnings)
│   ├── package.json
│   └── vite.config.js
│
├── docs/
│   ├── API_DOCUMENTATION.md     # Complete REST API reference with real payloads
│   └── AI_USAGE_REPORT.md       # Mandatory 1-page engineering reflection report
├── docker-compose.yml           # Local PostgreSQL and API containers
├── .env.example                 # Root environment template; no committed secrets
├── LICENSE                      # MIT License
└── README.md
```

---

## Assessment Deliverables

- **REST API Documentation**: [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md)
- **1-Page AI Reflection Report**: [`docs/AI_USAGE_REPORT.md`](docs/AI_USAGE_REPORT.md)
- **Automated Test Suite**: [`backend/test-api.js`](backend/test-api.js) (`npm test`)
