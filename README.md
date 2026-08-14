# Task Manager

A full-stack learning project for managing tasks with a Spring Boot REST API, PostgreSQL persistence, and a React + TypeScript frontend.

The app supports creating, viewing, editing, deleting, searching, filtering, sorting, paginating, and updating the status of tasks. It is intentionally structured as a clear educational codebase: simple layered backend architecture, typed frontend API calls, and minimal dependencies.

## Tech Stack

### Backend

- Java 21
- Spring Boot 4.1
- Spring MVC
- Spring Data JPA / Hibernate
- PostgreSQL
- Flyway database migrations
- Maven
- Jakarta Bean Validation
- Lombok

### Frontend

- React 19
- TypeScript
- Vite
- Material UI
- React Router
- Axios
- React Hook Form
- Yup
- Oxlint

## Project Structure

```text
learning-task-manager/
├── backend/                 Spring Boot REST API
│   ├── docker-compose.yml   Local PostgreSQL service
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/learning/taskmanager/
│       │   ├── common/      Shared exception handling
│       │   └── task/        Task entity, DTOs, repository, service, controller
│       └── main/resources/
│           ├── application.yml
│           └── db/migration/
└── frontend/                Vite React application
    ├── package.json
    └── src/
        ├── api/             Axios client and task API functions
        ├── components/      Reusable UI components
        ├── hooks/           Task list state and fetching
        ├── pages/           Routed screens
        └── types/           Shared TypeScript types
```

## Prerequisites

- Java 21
- Node.js and npm
- Docker Desktop, or another Docker-compatible runtime
- Git

The backend uses the Maven wrapper included in `backend/`, so Maven does not need to be installed globally.

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/AbdullahSaimun/task-manager-spring-react.git
cd task-manager-spring-react
```

### 2. Start PostgreSQL

```bash
cd backend
docker compose up -d
```

This starts PostgreSQL on port `5433` with:

- Database: `taskmanager`
- Username: `taskmanager`
- Password: `taskmanager`

These values match `backend/src/main/resources/application.yml`.

### 3. Run the backend

From the `backend/` directory:

```bash
./mvnw spring-boot:run
```

On Windows PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
```

The API runs at:

```text
http://localhost:8080
```

Flyway applies database migrations automatically when the backend starts.

### 4. Run the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

Vite proxies `/api` requests to the backend at `http://localhost:8080`.

## Available Commands

### Backend

Run the app:

```bash
cd backend
./mvnw spring-boot:run
```

Run tests:

```bash
cd backend
./mvnw test
```

Build:

```bash
cd backend
./mvnw clean package
```

Stop local PostgreSQL:

```bash
cd backend
docker compose down
```

### Frontend

Install dependencies:

```bash
cd frontend
npm install
```

Run the dev server:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

Preview the production build:

```bash
npm run preview
```

## API Overview

Base path:

```text
/api/tasks
```

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/tasks` | List tasks with optional search, status filter, sorting, and pagination |
| `GET` | `/api/tasks/{id}` | Get one task by ID |
| `POST` | `/api/tasks` | Create a task |
| `PUT` | `/api/tasks/{id}` | Update a task |
| `PATCH` | `/api/tasks/{id}/status` | Update only a task status |
| `DELETE` | `/api/tasks/{id}` | Delete a task |

### Query Parameters

`GET /api/tasks` supports:

- `search`: text search
- `status`: `TODO`, `IN_PROGRESS`, `DONE`, or `CANCELLED`
- `page`: zero-based page number
- `size`: page size
- `sort`: Spring pageable sort value, for example `createdAt,desc`

Example:

```text
GET /api/tasks?search=report&status=TODO&page=0&size=10&sort=dueDate,asc
```

### Task Request

```json
{
  "title": "Finish project README",
  "description": "Document setup, commands, and API routes",
  "status": "TODO",
  "priority": "HIGH",
  "dueDate": "2026-08-20"
}
```

Valid statuses:

- `TODO`
- `IN_PROGRESS`
- `DONE`
- `CANCELLED`

Valid priorities:

- `LOW`
- `MEDIUM`
- `HIGH`

## Architecture Notes

The backend follows a strict layered structure:

```text
Controller -> Service -> Repository -> Entity
```

- Controllers handle HTTP concerns and expose DTOs.
- Services contain business logic.
- Repositories handle persistence through Spring Data JPA.
- Entities map to database tables.

The frontend keeps API access isolated in `src/api/`, uses typed models from `src/types/`, and composes pages from focused presentational components.

## Development Notes

- Backend database schema changes should be added as Flyway migrations under `backend/src/main/resources/db/migration/`.
- The frontend should call the backend through the shared Axios client in `frontend/src/api/client.ts`.
- Generated files such as `target/`, `node_modules/`, `dist/`, IDE metadata, and logs are intentionally ignored.
