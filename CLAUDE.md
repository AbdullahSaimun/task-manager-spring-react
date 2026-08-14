# Task Management App — Project Memory (Source of Truth)

This file is the project's living source of truth for architecture, conventions,
and status. Read it at the start of every session, inspect the actual project
structure, and continue from current state — do not rebuild or re-decide
anything already settled here unless explicitly asked to revisit it. Update it
whenever an architectural or dependency decision changes; never let it drift
from what actually exists in the repo.

## 1. Project overview

A Task Management application built incrementally, one phase at a time, as a
guided learning project pairing a Spring Boot REST API backend with a React +
TypeScript frontend. Each phase is explained (what, why, architecture, files
touched) and approved before it's built — the emphasis is on understanding the
implementation, not generating a finished app in one shot.

## 2. Business purpose

From an end-user perspective, the app manages a task list: create, view,
update, and delete tasks; change task status; search by text; filter by
status; sort; paginate. It's a single shared task list with no per-user
ownership until authentication is introduced (Phase 17) — no multi-tenancy or
collaboration features are in scope. The project's actual purpose is
educational: give a Java/Spring Boot developer a realistic, incremental
introduction to React and full-stack integration patterns.

## 3. Backend technology stack

- Java 21
- **Spring Boot 4.1.0** (upgraded from the originally-planned 3.x — by Phase 2,
  start.spring.io no longer offered any 3.x line; see section 16)
- Spring MVC (starter artifact is `spring-boot-starter-webmvc` in Boot 4.1,
  not `spring-boot-starter-web`)
- Spring Data JPA / Hibernate 7
- PostgreSQL
- Maven
- Bean Validation (Jakarta Validation)
- Flyway (schema migrations)
- Lombok — used selectively, only where it removes real boilerplate, not
  applied reflexively

This is the actual stack now scaffolded in `backend/pom.xml` (Phase 2 —
done). Boot 4.1 also splits test support per-starter
(`spring-boot-starter-data-jpa-test`, `-webmvc-test`, `-validation-test`,
`-flyway-test`) instead of one monolithic `spring-boot-starter-test` — all
added automatically by Initializr alongside their runtime counterparts.

**Gotcha worth remembering**: start.spring.io's metadata API labels its
current Spring Boot version as `4.1.0.RELEASE`, but that exact string
doesn't resolve on Maven Central — the actual artifact version is `4.1.0`
(no suffix; Spring dropped `.RELEASE`/`.RC`/`.M` suffixes from final
releases years ago). If a dependency version ever fails to resolve, check
Maven Central's `maven-metadata.xml` directly rather than trusting a
generator's display label.

## 4. Frontend technology stack

- React 19.2 (`frontend/package.json`)
- TypeScript ~6.0 (project-reference build: `tsconfig.json` →
  `tsconfig.app.json` / `tsconfig.node.json`, matching Vite's current
  scaffold — see section 16)
- Vite 8.2
- Material UI (MUI) 9.3 (`@mui/material` + `@emotion/react` +
  `@emotion/styled`, MUI's required peer dependencies for its styling engine)
- React Router 7.18 (`react-router-dom`)
- Axios 1.19
- React Hook Form 7.85 + Yup 1.7 (form state + schema validation)

Deliberately excluded: Redux, Zustand, React Query, or any other
state-management/data-fetching library (rationale in section 16).

This is the actual stack now scaffolded in `frontend/` (Phase 11 — done):
`npm create vite@latest . -- --template react-ts` followed by `npm install
@mui/material @emotion/react @emotion/styled react-router-dom axios
react-hook-form yup` — exactly the packages named above, nothing extra
(no `@mui/icons-material`, no state-management library). `npm run build`
and `npm run dev` both verified working (section 17).

`@hookform/resolvers` (the adapter that lets a Yup schema plug into React
Hook Form's `resolver` option) was installed in Phase 14, once `TaskForm`
actually needed it — not before, per section 7's no-dependency-ahead-of-need
rule.

Axios is now genuinely wired up end-to-end (Phase 16): `api/client.ts` holds
one configured instance, `api/tasks.ts` holds the typed calls. No new
dependency was needed — Axios has been installed since Phase 11 waiting for
this phase.

## 5. Project structure

**Actual, current structure:**

```
learning-task-manager/
├── CLAUDE.md
├── backend/                Spring Boot 4.1 project (Phases 2–10 — done)
│   ├── pom.xml
│   ├── docker-compose.yml        dedicated local Postgres (Phase 3)
│   ├── mvnw / mvnw.cmd / .mvn/
│   ├── src/main/java/com/learning/taskmanager/
│   │   ├── TaskManagerApplication.java
│   │   ├── common/
│   │   │   └── exception/
│   │   │       ├── ResourceNotFoundException.java   (Phase 7)
│   │   │       ├── ApiExceptionHandler.java          @RestControllerAdvice (Phase 9)
│   │   │       └── ErrorResponse.java                error response DTO (Phase 9)
│   │   └── task/
│   │       ├── Task.java             JPA entity (Phase 4)
│   │       ├── TaskStatus.java       enum (Phase 4)
│   │       ├── TaskPriority.java     enum (Phase 4)
│   │       ├── TaskRepository.java   Spring Data JPA (Phase 5)
│   │       ├── TaskService.java      service layer (Phase 7)
│   │       ├── TaskController.java   REST controller (Phase 8)
│   │       └── dto/
│   │           ├── TaskRequest.java             request DTO, Bean Validation (Phase 6)
│   │           ├── TaskResponse.java            response DTO (Phase 6)
│   │           ├── TaskStatusUpdateRequest.java  PATCH .../status body (Phase 8)
│   │           └── PageResponse.java             generic list-endpoint wrapper (Phase 8)
│   ├── src/main/resources/
│   │   ├── application.yml       datasource, JPA, Flyway config (Phase 3)
│   │   └── db/migration/
│   │       └── V1__create_tasks_table.sql   (Phase 4)
│   └── src/test/java/com/learning/taskmanager/
│       ├── TaskManagerApplicationTests.java
│       └── task/
│           ├── TaskServiceTest.java      unit test, Mockito, no Spring context (Phase 10)
│           ├── TaskRepositoryTest.java   @DataJpaTest against real Postgres (Phase 10)
│           └── TaskControllerTest.java   @WebMvcTest, service mocked (Phase 10)
└── frontend/                Vite + React + TS project (Phases 11–16 — done)
    ├── package.json         scripts: dev, build (tsc -b && vite build), lint (oxlint), preview
    ├── vite.config.ts       server.proxy forwards /api → http://localhost:8080 (Phase 16)
    ├── tsconfig.json         references tsconfig.app.json / tsconfig.node.json
    ├── index.html           <title>Task Manager</title> (Phase 12)
    ├── public/               favicon.svg (Vite default; icons.svg removed, Phase 12 — see section 16)
    └── src/
        ├── main.tsx          createRoot(...).render(<App />), no global stylesheet import
        ├── App.tsx           BrowserRouter + Routes + MUI ThemeProvider/CssBaseline (Phase 12)
        ├── types/
        │   ├── task.ts        Task, TaskStatus, TaskPriority, TaskSortField, PageResponse<T>
        │   │                   (Phases 13, 15, 16)
        │   └── api.ts         ApiErrorResponse, ApiFieldError — mirrors backend ErrorResponse (Phase 16)
        ├── api/
        │   ├── client.ts      one shared Axios instance (baseURL '/api') + getErrorMessage helper (Phase 16)
        │   └── tasks.ts       listTasks/getTask/createTask/updateTask/deleteTask, typed (Phase 16)
        ├── hooks/
        │   └── useTasks.ts    search/filter/sort/paginate state; calls the real API (Phase 16
        │                       rewired this from Phase 15's client-side array filtering)
        ├── components/
        │   ├── Layout.tsx      MUI AppBar + Container, <Outlet/> for routed pages (Phase 12)
        │   ├── StatusBadge.tsx MUI Chip, maps TaskStatus to label + color (Phase 13)
        │   ├── TaskTable.tsx   MUI Table, presentational; sortable headers, TablePagination
        │   │                    footer (Phase 15), Delete action added (Phase 16)
        │   ├── TaskForm.tsx    React Hook Form + Yup, mirrors backend TaskRequest validation (Phase 14)
        │   └── SearchBar.tsx   text search + status filter, presentational (Phase 15)
        └── pages/
            ├── TaskListPage.tsx   composes SearchBar + TaskTable; shows a spinner while
            │                       loading and an Alert on fetch/delete failure (Phase 16)
            └── TaskFormPage.tsx   fetches the real task for edit mode, submits via the
                                    real createTask/updateTask, shows a real 404 message
                                    for an unknown id, an Alert on submit failure (Phase 16)
```

The backend now matches the structure originally planned back in Phase 1 in
full — every file section 5 anticipated exists. `frontend/` now has a real
routing + layout shell (Phase 12), a working task list with search,
filtering, sorting, and pagination (Phases 13, 15), a working create/edit
form (Phase 14), and — as of Phase 16 — **all of it now runs against the
real Spring Boot backend**: `mocks/sampleTasks.ts` is gone, `useTasks` and
`TaskFormPage` call `api/tasks.ts`, and both loading and error states are
handled. The two apps are genuinely integrated for the first time since
Phase 1's architecture diagram was drawn.

**Planned** frontend structure still to come (nothing left from the
original section 5 plan — see section 16 for what Phase 16 added beyond
that plan, e.g. task Delete):

```
src/
(nothing — Phase 16 built this)
```

## 6. Architecture

Two independently deployable apps over HTTP/JSON:

```
React (Vite, TS, MUI)  <-- HTTP/JSON -->  Spring Boot REST API  -->  PostgreSQL
```

Backend is strictly layered:

```
Controller → Service → Repository → Entity
```

Controllers handle HTTP concerns only and speak DTOs, never entities.
Services hold business logic and are HTTP-agnostic. Repositories are Spring
Data JPA interfaces, persistence only. Packaging is feature-based
(`task/...`) rather than layer-based (top-level `controller/`, `service/`,
`repository/` packages) — everything about one feature lives together.

Frontend is component-based with a thin API layer: pages compose components,
a custom hook (`useTasks`) owns list-fetching/search/filter/sort/paginate
state, and `api/` isolates all Axios calls behind typed functions so
components never call Axios directly.

## 7. Coding conventions

- Prefer readable code over clever code; avoid unnecessary abstractions.
- Don't design for hypothetical future requirements — build what the current
  phase needs, nothing more.
- Lombok only where it genuinely improves readability.
- Meaningful, consistent naming for packages/classes/variables.
- No dependency is added unless a phase actually needs it.

## 8. Backend conventions

- Controller → Service → Repository → Entity is enforced strictly; no
  layer-skipping.
- Controllers never accept or return JPA entities — only request/response
  DTOs.
- Services never reference HTTP types (status codes, `HttpServletRequest`,
  etc.).
- Domain-meaningful exceptions (e.g. `ResourceNotFoundException`) are thrown
  from the service layer; controllers never catch them directly.
- Feature-based package layout under `com.learning.taskmanager` (section 5).
- Status transitions get a dedicated `PATCH /api/tasks/{id}/status`
  endpoint, separate from the general `PUT /api/tasks/{id}` update.

## 9. Frontend conventions

- All HTTP calls go through `api/`, typed against `types/` — components
  never import Axios directly.
- List-level state (fetch, search, filter, sort, pagination) is centralized
  in a custom hook (`useTasks`), not duplicated per component.
- Forms use React Hook Form for state/submission and Yup for schema
  validation, mirroring backend Bean Validation constraints.
- Routing lives in `App.tsx` via React Router; pages are route-level
  containers, components are presentational/reusable.
- No global state library — local/component and hook state only.

**Implemented** (Phase 12): `App.tsx` wraps `BrowserRouter`/`Routes` in an
MUI `ThemeProvider` (default theme, no custom palette yet) + `CssBaseline`.
A single layout route (`components/Layout.tsx`, an MUI `AppBar` + `Container`
around React Router's `<Outlet/>`) wraps three child routes: `index` →
`TaskListPage`, `tasks/new` → `TaskFormPage`, `tasks/:id/edit` →
`TaskFormPage` (one page component for both create and edit, mirroring the
backend's single `TaskRequest` for both `POST`/`PUT` — section 16). Both
pages are currently placeholders (a heading + a `Link`), verified only for
routing correctness (direct-URL load, client-side `Link` navigation, and
`useParams` extracting `:id`) — real content is Phases 13–14.

**Implemented** (Phase 15): `hooks/useTasks.ts` centralizes all list-level
state — `search`, `status`, `sortField`/`sortDirection`, `page`/`size` — and
derives the visible page of tasks from `SAMPLE_TASKS` via `filter`/`sort`/
`slice` (all `useMemo`d). `TaskListPage` itself holds no state of its own;
it just calls `useTasks()` and passes the results down to the new
`SearchBar` (text + status filter) and the extended `TaskTable` (sortable
`TableSortLabel` headers, `TablePagination` footer) — both still purely
presentational, controlled entirely via props. Changing search text,
status filter, or sort field all reset `page` back to `0`, mirroring how a
real paginated query should behave. The word "fetching" in this section's
own wording is aspirational until Phase 16 — `useTasks` filters an in-memory
array today; Phase 16 swaps its internals to call the real
`/api/tasks?search=&status=&sort=&page=&size=` endpoint (section 10)
instead, without changing what it returns to its callers.

**Implemented** (Phase 16): `useTasks`'s internals now call `api/tasks.ts`'s
`listTasks` instead of filtering `SAMPLE_TASKS`, exactly as anticipated
above — its return shape to `TaskListPage` didn't need to change, only what
happens inside the hook. New this phase: `loading`/`error` state (an MUI
`CircularProgress` while fetching, an `Alert` on failure), a `removeTask`
method backing a new Delete action on each row (native `window.confirm`
gate, per section 16), and search-input debouncing (300ms) so the real
endpoint isn't hit on every keystroke. `TaskFormPage` similarly now calls
`getTask`/`createTask`/`updateTask` for real, with its own loading/error
states — an unknown id now shows the backend's actual 404 message (e.g.
"Task not found with id 26"), not a client-side guess. `mocks/
sampleTasks.ts` is deleted; nothing in the frontend reads hardcoded data
anymore. Every case was verified against the real running backend, not
assumed: create (`POST` → 201), edit-prefill (`GET` → 200), update (`PUT`
→ 200, persisted), delete (both the "confirm declined" and "confirm
accepted" paths), a genuine 404, and a genuine backend-down failure (which
correctly shows "Failed to load tasks. Is the backend running?" instead of
crashing).

## 10. API conventions

- Base path: `/api/tasks`.
- Standard verbs/status codes: `GET` (200), `POST` (201), `PUT` (200),
  `DELETE` (204), `PATCH` for status (200).
- List endpoint returns pagination metadata alongside content:
  `{ content, page, size, totalElements, totalPages }` (mirrors Spring
  Data's `Page<T>`).
- Errors return the consistent shape defined in section 13, never raw stack
  traces or ad hoc messages.
- Status changes go through `PATCH /api/tasks/{id}/status`, not the general
  update endpoint.
- Search/filter/sort/pagination are query parameters on the list endpoint:
  `search` (optional, matches title/description), `status` (optional, exact
  match), plus `page`/`size`/`sort` bound directly to a Spring Data
  `Pageable` controller parameter (e.g.
  `?status=DONE&search=...&sort=dueDate,asc&page=0&size=20`) — no manual
  pagination/sorting parsing.
- Search + status filtering is implemented as a single repository query
  (JPQL `@Query` or derived query) handling both optional conditions,
  rather than the JPA Specification/Criteria API — unnecessary abstraction
  for two optional filters at this scale.
- **Implemented** as `TaskRepository.search(TaskStatus status, String
  search, Pageable pageable)` (Phase 5) — see section 16 for a real gotcha
  hit while building it (a `CAST` is required around the `:search`
  parameter).
- **Implemented** (Phase 8): `TaskController` exposes all six endpoints at
  `/api/tasks` exactly as specified above — `GET` (list, with
  `status`/`search`/`page`/`size`/`sort` params and a `@PageableDefault(size
  = 20, sort = "id")` for deterministic ordering when the caller doesn't
  specify one), `GET /{id}`, `POST` (201), `PUT /{id}` (200), `PATCH
  /{id}/status` (200), `DELETE /{id}` (204). The list endpoint returns a new
  `PageResponse<T>` DTO (`task/dto/`) rather than Spring Data's `Page<T>`
  directly, since serializing `Page<T>` as-is via Jackson includes internal
  fields (`pageable`, `sort`, `numberOfElements`, `first`, `last`, `empty`,
  ...) beyond the shape this section specifies. `@Valid` is applied to both
  `TaskRequest` (`POST`/`PUT`) and the new `TaskStatusUpdateRequest`
  (`PATCH .../status`) so the Phase 6 constraints actually run — confirmed
  they do (Spring's default `MethodArgumentNotValidException` handling
  already rejects invalid bodies with a 4xx, even before Phase 9 adds our
  custom error shape).

## 11. Database conventions

- PostgreSQL, accessed through Spring Data JPA/Hibernate.
- **Local dev database**: a dedicated Docker container, defined in
  `backend/docker-compose.yml` (`postgres:17`, container name
  `taskmanager-postgres`, DB/user/password all `taskmanager`, host port
  `5433`, named volume for persistence). Start with `docker compose up -d`
  from `backend/`. Port `5433` (not the default `5432`) deliberately, to
  avoid colliding with an unrelated Postgres container already used on this
  machine for a different project — this project never touches that
  container or its data.
- Connection wired explicitly in `application.yml`
  (`spring.datasource.url/username/password`) — not through Spring Boot's
  official `spring-boot-docker-compose` auto-integration module, even
  though it exists and could auto-start the container and inject
  connection details. Skipped deliberately: explicit, visible config is
  more valuable for learning the actual mechanism than the convenience of
  auto-wiring. Worth adopting later once the fundamentals are solid.
- `spring.jpa.open-in-view: false` — the OSIV pattern (keeping the
  Hibernate session open through view rendering) is a well-known
  anti-pattern for REST APIs (masks N+1 queries, risks lazy-loading
  exceptions leaking as 500s); Spring Boot warns about this by default and
  we've explicitly disabled it. Any lazy association access must happen
  inside the service layer, inside the transaction.
- `spring.jpa.hibernate.ddl-auto: validate` — Hibernate checks entities
  against the schema but never modifies it; Flyway is schema owner.
- Schema is owned by Flyway migrations
  (`backend/src/main/resources/db/migration`, `V1__create_tasks_table.sql`,
  `V2__...`); Hibernate `ddl-auto` is not used to manage schema once Flyway
  is in place.
- **Implemented** in `V1__create_tasks_table.sql` (Phase 4), mapped by the
  `Task` entity (`com.learning.taskmanager.task`) — a single `tasks` table:

| Column | Type | Notes |
|---|---|---|
| id | BIGINT | PK, generated |
| title | VARCHAR | NOT NULL |
| description | TEXT | nullable |
| status | VARCHAR | NOT NULL, default `TODO` |
| priority | VARCHAR | NOT NULL |
| due_date | DATE | nullable |
| created_at | TIMESTAMP | NOT NULL, immutable |
| updated_at | TIMESTAMP | NOT NULL, updated on every write |

- `status`/`priority` are plain `VARCHAR`, mapped via Java
  `@Enumerated(EnumType.STRING)` — not native PostgreSQL `ENUM` types, which
  are painful to alter (`ALTER TYPE ... ADD VALUE`) once values change.
- An index on `status` (`idx_tasks_status`) since filtering by status is a
  first-class, frequent query pattern. `due_date`/`created_at` are not
  indexed yet — fine at this data volume, revisit if the table grows large.
- `created_at`/`updated_at` are set via Hibernate's `@CreationTimestamp`/
  `@UpdateTimestamp` entity annotations, not manual `@PrePersist`/
  `@PreUpdate` callbacks.

No `user_id`/ownership column yet — every task is globally visible until
Phase 17.

## 12. Validation rules

Backend (Bean Validation on request DTOs):

- `title`: required, non-blank
- `description`: optional
- `status`: required, one of `TODO`, `IN_PROGRESS`, `DONE`, `CANCELLED`
- `priority`: required, one of `LOW`, `MEDIUM`, `HIGH`
- `dueDate`: optional, must be a valid date (enforced by the `LocalDate` type
  itself — Jackson rejects an unparseable date before validation ever runs,
  so no extra annotation is needed)

Frontend: Yup schema mirrors the same constraints for fast client-side
feedback; the backend remains the validation authority — frontend validation
is UX, not a security boundary.

**Implemented** in `TaskRequest` (Phase 6) as `@NotBlank String title`,
`@NotNull TaskStatus status`, `@NotNull TaskPriority priority`; `description`
and `dueDate` carry no constraints (optional). Applying `@Valid` in the
controller so these actually run is Phase 8's job — Phase 6 only defines and
verifies the constraints themselves.

**Implemented** on the frontend in `components/TaskForm.tsx` (Phase 14) as
a Yup object schema: `title` — `.trim().required()`; `status`/`priority` —
`.oneOf([...]).required()` against the same literal value sets as the
backend enums; `description`/`dueDate` — no constraint beyond `.default('')`
(optional), mirroring the backend's "no annotation needed" reasoning for
`dueDate` — a native HTML `<input type="date">` structurally can't submit an
invalid date string, the same way `LocalDate` structurally can't on the
backend. Wired to React Hook Form via `@hookform/resolvers`'s `yupResolver`
(installed this phase, section 4). Verified in a real browser, not just by
reading the code: submitting with a blank title shows "Title is required"
and does not submit; a valid submission fires `onSubmit` with the exact
typed values.

## 13. Error-handling conventions

- A single `@RestControllerAdvice` (`ApiExceptionHandler`) translates
  exceptions to HTTP responses — no scattered `try/catch` in controllers.
- Domain exceptions (e.g. `ResourceNotFoundException`) are thrown from the
  service layer.
- **Implemented** (Phase 7): `ResourceNotFoundException` exists and is
  thrown by `TaskService` for `getById`/`update`/`updateStatus`/`delete`
  when no task matches the given id. It is not yet translated to a 404 —
  until Phase 9 adds `ApiExceptionHandler`, an unhandled instance reaching
  the (not-yet-built) controller would fall through to Spring's default
  500 response. That's expected at this point in the build, not a defect.
- **Confirmed** (Phase 8, now that `TaskController` actually exists): an
  unhandled `ResourceNotFoundException` reaching a real request does not
  produce a clean 500 HTTP response the way it would behind a real servlet
  container's default error page — under Spring MVC Test (`MockMvc`)
  specifically, it surfaces as a raw `ServletException` wrapping the cause,
  since nothing has resolved it into a response yet. Bean Validation
  failures (`MethodArgumentNotValidException`), by contrast, are already
  handled by Spring's own built-in default resolver and correctly produce
  a 4xx — only domain exceptions without any built-in equivalent are
  affected. Phase 9 fixes both cases uniformly under one shape.
- Every error response shares one shape:
  `{ timestamp, status, error, message, path, fieldErrors? }` —
  `fieldErrors` present only for validation failures.
- 404 for missing resources, 400 for validation failures, 500 reserved for
  genuinely unexpected failures, not business-rule violations.
- **Implemented** (Phase 9): `ErrorResponse` (record, `common/exception/`)
  is the one shape every handler below returns; `fieldErrors` is annotated
  `@JsonInclude(NON_NULL)` so it's omitted from the JSON entirely (not sent
  as an explicit `null`) for non-validation errors. `ApiExceptionHandler`
  (`@RestControllerAdvice`) maps: `ResourceNotFoundException` → 404;
  `MethodArgumentNotValidException` → 400, with `fieldErrors` populated
  from the binding result; `MethodArgumentTypeMismatchException` → 400
  (bad enum query param, non-numeric path id); `HttpMessageNotReadableException`
  → 400 (malformed/unparseable request body); and a catch-all
  `Exception.class` → 500, logged server-side via SLF4J before responding
  with a generic client-facing message (never a raw stack trace). The
  three specific 400 cases beyond `MethodArgumentNotValidException` exist
  because adding the `Exception.class` catch-all would otherwise silently
  regress those cases — which Spring already handled correctly as 400 by
  default — down to an incorrect 500; see section 16 for the reasoning and
  the one exception type deliberately left unhandled
  (`HttpRequestMethodNotSupportedException`, 405).

## 14. Testing conventions

- **Implemented** (Phase 10): a real, permanent backend test suite now
  exists under `backend/src/test/java/com/learning/taskmanager/task/` —
  the first phase to leave test code in the repository rather than
  deleting it after verification. Three layers, matching the plan below:
  - `TaskServiceTest` — true unit test: `@ExtendWith(MockitoExtension.class)`,
    `TaskRepository` mocked with Mockito, `TaskService` constructed
    directly (no Spring context at all). Fastest tier (~3s); covers
    create/getById/update/updateStatus/delete/search plus not-found
    exceptions.
  - `TaskRepositoryTest` — `@DataJpaTest` + `@AutoConfigureTestDatabase
    (replace = Replace.NONE)` against the real Postgres container;
    promotes Phase 5's throwaway query-correctness checks (no filters,
    status-only, text-only, combined) to permanent coverage.
  - `TaskControllerTest` — `@WebMvcTest(TaskController.class)` with
    `TaskService` replaced by `@MockitoBean`; exercises the HTTP surface
    (status codes, the documented list-response shape) and confirms
    `ApiExceptionHandler` is active in the slice (404 on not-found, 400 on
    blank title/bad enum/malformed JSON) without needing a real database.
  - All 21 tests (these three classes plus the pre-existing
    `TaskManagerApplicationTests`) pass together via `mvn test`.
- Prior throwaway verification tests (Phases 5–9: written, run, then
  deleted to keep the "no test code yet" status accurate at the time) are
  now superseded by this permanent suite — same techniques, kept for good.
- `@DataJpaTest` defaults to swapping in an embedded database; since there's
  no embedded DB dependency in this project (Postgres is the real target),
  any `@DataJpaTest` needs `@AutoConfigureTestDatabase(replace =
  Replace.NONE)` to run against the real Postgres container instead.
  `TaskRepositoryTest` relies on this; each test method gets its own
  automatically-rolled-back transaction, so no manual cleanup is needed
  and the real dev database is left untouched.
- Frontend test tooling is not yet chosen — deferred to Phase 19; no test
  library is currently in the frontend stack.

## 15. Security conventions

- No authentication or authorization exists yet — every endpoint is
  currently intended to be publicly accessible with no ownership checks
  (consistent with no `user_id` column, section 11).
- Planned: Spring Security + JWT in Phase 17, role-based authorization in
  Phase 18.
- Until Phase 17, no ad hoc security code (filters, manual token checks) —
  it will be designed properly as its own phase.

## 16. Important architectural decisions

- **Feature-based backend packaging** over layer-based: keeps everything
  about `Task` together; easiest to navigate at this app's scale.
- **DTOs mandatory at the controller boundary**: keeps persistence concerns
  (JPA annotations, lazy loading) out of the API contract, and keeps the
  contract stable if the entity changes.
- **Dedicated `PATCH .../status` endpoint**: status transitions are a
  distinct operation from a full edit, and the natural place to add
  transition-validity rules later without complicating the general update
  path.
- **Flyway over Hibernate `ddl-auto`**: versioned, reviewable schema
  history — realistic production practice.
- **`VARCHAR` + `@Enumerated(EnumType.STRING)` over native PostgreSQL enum
  types** for `status`/`priority`: far easier to evolve via Flyway
  migrations than `ALTER TYPE ... ADD VALUE`.
- **Spring Data `Pageable` binding for pagination/sorting** instead of
  custom `page`/`sortBy`/`sortDirection` parsing: idiomatic, less code, and
  the framework already does it correctly.
- **JPQL query over JPA Specifications** for search + status filtering:
  only two optional conditions exist today — Specifications are the right
  tool once filter combinations grow, not before.
- **No frontend state-management library**: Redux/Zustand/React Query would
  be over-engineering for a single-list app; a custom hook keeps the
  learning focus on React fundamentals.
- **4-state status enum** (`TODO/IN_PROGRESS/DONE/CANCELLED`) and
  **Standard task fields** (adds `priority`, `dueDate` to the minimal set):
  give sorting/filtering something realistic to operate on without
  over-scoping the entity.
- **No auth until Phase 17**: keeps early phases focused on core REST/CRUD/
  React skills before layering in security concerns.
- **Spring Boot 4.1 instead of 3.x**: by the time Phase 2 ran,
  start.spring.io no longer served any 3.x line at all (only 4.0.x/4.1.x) —
  confirmed against its live metadata, not assumed. Java 21 stays fully
  compatible; user chose to move forward with current stable rather than
  hand-pin an aging, soon-unsupported 3.x version.
- **Main class named `TaskManagerApplication`, not `BackendApplication`**:
  Initializr derives the class name from the artifact id (`backend`); it
  was renamed post-generation to match the name already documented in this
  file (section 5).
- **Dedicated Docker Compose Postgres on port 5433**, manually wired via
  `application.yml` rather than Spring Boot's auto-integration module: see
  section 11 for both the port-collision reason and the learning-clarity
  reason.
- **`spring.jpa.open-in-view: false`**: disables a default that's an
  anti-pattern for REST APIs; see section 11.
- **`Task` entity uses Lombok `@Getter @Setter @NoArgsConstructor`, not
  `@Data`**: `@Data` also generates `equals`/`hashCode` over every field,
  which is a well-known JPA footgun (mutable fields, lazy associations, and
  generated IDs make field-based equality unreliable — two transient
  instances with all-null fields would be "equal"). `equals`/`hashCode` are
  deliberately left at the default (identity-based) for now.
- **`status` field has a Java-side default** (`= TaskStatus.TODO`) mirroring
  the migration's `DEFAULT 'TODO'`: keeps in-memory `new Task()` instances
  consistent with what the database would default to, without duplicating
  logic anywhere else.
- **`CAST(:search AS string)` required in the search JPQL query**: binding a
  `null` `:search` parameter that only ever appears inside `LOWER(CONCAT(...))`
  made PostgreSQL's JDBC driver unable to infer the parameter's type — it
  guessed `bytea`, and Postgres has no `lower(bytea)` overload, so the query
  failed at runtime (not at startup — JPQL syntax validation passed fine;
  this only surfaces when the query actually executes with a null search
  value). Wrapping the parameter in an explicit JPQL `CAST(... AS string)`
  fixes it. Worth remembering for any future JPQL parameter that's only used
  inside a function call and can be null.
- **Boot 4.1 relocated test annotations into per-feature packages**:
  `@DataJpaTest` is now `org.springframework.boot.data.jpa.test.
  autoconfigure.DataJpaTest` and `@AutoConfigureTestDatabase` is
  `org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase`
  — not the old `org.springframework.boot.test.autoconfigure.orm.jpa`/
  `...jdbc` packages. Relevant for Phase 10.
- **DTOs are Java `record`s, not Lombok `@Getter`/`@Setter` classes**:
  `TaskRequest`/`TaskResponse` carry no mutable state and no JPA/lazy-loading
  concerns (unlike `Task`), so a record's built-in immutability, accessors,
  `equals`/`hashCode`, and `toString` are a better fit than Lombok, and nothing
  needs Lombok's help. Keeps Lombok scoped to the one place it earns its
  keep — the entity (see the `@Data`-avoidance decision above). Confirmed
  Jakarta Bean Validation constraints on record components (`@NotBlank`,
  `@NotNull`) are honored out of the box by Hibernate Validator 9.1 (bundled
  with Boot 4.1) with no extra compiler flags — verified with a throwaway
  test (section 14), not assumed.
- **Single `TaskRequest` for both create (`POST`) and full update (`PUT`)**,
  matching the shape already planned in section 5 — no separate
  `TaskCreateRequest`/`TaskUpdateRequest`. `status` is included and required
  on this DTO even though a dedicated `PATCH .../status` endpoint also
  exists (section 8): the `PATCH` endpoint is for a lightweight,
  transition-focused status-only change; `PUT` still replaces the full
  resource, status included.
- **`ResourceNotFoundException` built in Phase 7, ahead of the rest of
  Phase 9**: `TaskService` cannot fulfill the domain-exception convention
  already committed to in section 8 without something to throw on a
  missing id. Rather than invent a workaround (returning `null`/`Optional`
  from the service, or reusing a framework exception type), the one class
  section 5 already planned for `common/exception/` was created now, since
  it's a small, already-decided shape. The actual substance of Phase 9 —
  `ApiExceptionHandler`, `ErrorResponse`, translating exceptions into the
  section 13 error shape — has deliberately not been built yet.
- **`TaskService.update`/`updateStatus` rely on JPA dirty checking, no
  explicit `.save()` call**: `findTaskOrThrow` returns a managed entity
  (fetched inside the same `@Transactional` method), so mutating it via
  setters is enough — Hibernate detects the change and flushes it at
  transaction commit. Confirmed empirically (not assumed) via the Phase 7
  scratch test: the SQL log showed an `update tasks set ...` statement
  even though `update()` never calls `taskRepository.save(...)`.
- **`TaskService.updateStatus` takes a plain `TaskStatus` parameter**, not a
  request DTO: the service layer doesn't need to know the exact JSON shape
  of the `PATCH .../status` body — that translation is Phase 8's job
  (controller layer), keeping the service HTTP-agnostic per section 8.
- **No status-transition validity rules yet** (e.g. blocking `DONE` →
  `TODO`): section 16's `PATCH .../status` rationale calls this out as
  future work, not yet designed — `updateStatus` currently accepts any
  target status unconditionally, consistent with not inventing
  requirements that haven't been specified.
- **`PageResponse<T>` introduced (Phase 8) instead of returning Spring
  Data's `Page<T>` directly from the controller**: `Page<T>` serializes via
  Jackson with several internal fields (`pageable`, `sort`,
  `numberOfElements`, `first`, `last`, `empty`) beyond the exact shape
  section 10 specifies, and leaks a Spring Data-specific representation
  into the API contract. `PageResponse.from(Page<T>)` maps to precisely
  `{ content, page, size, totalElements, totalPages }` instead. Placed in
  `task/dto/` (not a new `common/dto/` package) since it's currently only
  used by one resource — introducing a shared package for a single caller
  would be the premature abstraction section 7 already warns against.
- **`TaskStatusUpdateRequest` introduced (Phase 8)** as the `PATCH
  .../status` request body (`{"status": "DONE"}`), completing the design
  Phase 7 deferred: the service takes a plain `TaskStatus`, and the
  controller is where the JSON-shape decision belongs.
- **Boot 4.1 relocated `TestRestTemplate`** from
  `org.springframework.boot.test.web.client.TestRestTemplate` to
  `org.springframework.boot.resttestclient.TestRestTemplate`, and it's no
  longer auto-registered by `@SpringBootTest(webEnvironment = RANDOM_PORT)`
  alone — it now requires an explicit `@AutoConfigureTestRestTemplate`
  annotation, and even then needs a `RestTemplateBuilder`
  (`spring-boot-restclient` module) that isn't pulled in by any dependency
  already declared in `pom.xml`. Rather than add a new dependency just to
  support one throwaway test, the Phase 8 verification test used `MockMvc`
  (already available via `spring-boot-starter-webmvc-test`) instead —
  worth remembering if a future phase specifically needs a real HTTP client
  in tests.
- **`spring-boot-starter-jackson` pulls in Jackson 3.x**
  (`tools.jackson.core`/`tools.jackson.databind`), not the classic Jackson 2
  (`com.fasterxml.jackson.databind`) most existing Spring/Jackson
  documentation and tutorials assume. Discovered while deciding how to
  build JSON request bodies for the Phase 8 `MockMvc` test — sidestepped by
  hand-writing JSON strings and asserting responses with `jsonPath`/
  `JsonPath` (from `com.jayway.jsonpath`, already on the test classpath),
  neither of which depends on which Jackson major version is in play.
  Relevant to any future code that autowires an `ObjectMapper` directly.
- **Individual `@ExceptionHandler` methods on a plain `@RestControllerAdvice`,
  not `ApiExceptionHandler extends ResponseEntityExceptionHandler`**: Spring's
  `ResponseEntityExceptionHandler` base class already handles the full range
  of built-in Spring MVC exceptions correctly, but overriding its
  `handleExceptionInternal` hook to inject our custom `ErrorResponse` shape
  is more surface area and more framework-internal coupling than this app's
  actual exposed surface needs. Instead, `ApiExceptionHandler` explicitly
  handles exactly the exception types genuinely reachable through
  `TaskController`'s current endpoints.
- **Adding a catch-all `@ExceptionHandler(Exception.class)` required also
  adding handlers for `MethodArgumentTypeMismatchException` and
  `HttpMessageNotReadableException`, not just `MethodArgumentNotValidException`**:
  before Phase 9, Spring's own default exception resolution already
  returned 400 for a bad `status` query param value, a non-numeric `{id}`
  path variable, or a malformed JSON body — all real, easily-triggered
  cases given this API's actual shape. Defining `@ExceptionHandler(Exception.class)`
  as a last-resort 500 handler, without also handling these three
  specifically, would have silently regressed all of them from a correct
  400 to an incorrect 500. Verified via a throwaway test that all three
  still return 400 after Phase 9's handler was added (section 14).
- **`HttpRequestMethodNotSupportedException` (wrong HTTP verb → 405) is a
  known, deliberate gap**: unlike the three cases above, no currently
  planned feature or test exercises this path, and section 13 doesn't
  specifically commit to it. Left to fall through to the generic 500
  catch-all for now rather than adding a fourth specific handler for a case
  nothing in the app currently exercises — revisit if a real need for it
  ever surfaces.
- **`ErrorResponse.fieldErrors` uses `@JsonInclude(Include.NON_NULL)`**: per
  section 13, `fieldErrors` should be present "only for validation
  failures" — read as *absent from the JSON entirely* for every other error
  (rather than present with an explicit `null`), which is the more precise
  reading of "present only... ".
- **Boot 4.1 / Spring Framework 7 removed `@MockBean`/`@SpyBean` entirely**
  (confirmed by inspecting `spring-boot-test-4.1.0.jar` and
  `spring-test-7.0.8.jar` directly — no `MockBean.class` in either).
  `TaskControllerTest`'s `@WebMvcTest` slice uses the replacement,
  `org.springframework.test.context.bean.override.mockito.MockitoBean`
  (core Spring Framework, not Spring Boot-specific), to swap in a mocked
  `TaskService`. Relevant for any future test that needs to mock a Spring
  bean.
- **Three-tier test split (unit / slice / real-DB) instead of one broad
  style**: `TaskServiceTest` mocks `TaskRepository` with Mockito (fastest,
  no Spring context) precisely because Phase 7's dirty-checking behavior
  and business logic don't need a real database to verify in isolation;
  `TaskControllerTest` mocks `TaskService` via `@WebMvcTest` to verify HTTP
  concerns (status codes, response shape, `ApiExceptionHandler` wiring)
  without the service's real logic getting in the way; `TaskRepositoryTest`
  is the one layer that must hit real Postgres, since the whole point of
  Phase 5's custom JPQL query is verifying it against the actual database
  engine (recall the `CAST(:search AS string)` bug — a mocked repository
  would never have caught it). Each test's dependencies are scoped to only
  what that layer actually needs to prove.
- **Frontend scaffolded via `npm create vite@latest . -- --template
  react-ts` resolved a noticeably newer toolchain than the tutorials most
  React learning material assumes** (Phase 11): Vite 8.2, React 19.2,
  TypeScript ~6.0, and MUI 9.3 — not the Vite 5/React 18/MUI 5 versions
  still common in most write-ups. Confirmed by reading `package.json`
  after scaffolding rather than assuming an older baseline; same
  investigative discipline as the Boot 4.1 version surprises in section 3.
  Two concrete consequences worth remembering: (1) the generated template
  ships a different default `App.tsx` ("Get started" hero layout, not the
  classic spinning-logo counter) and an `.oxlintrc.json` — Vite's default
  scaffold now uses **oxlint** (a Rust-based linter) instead of ESLint,
  wired as the `lint` npm script; (2) `npm run build` runs `tsc -b` (a
  TypeScript **project-reference** build across `tsconfig.app.json` /
  `tsconfig.node.json`) before `vite build`, not a flat single-tsconfig
  compile. Both verified working as scaffolded — not changed, since
  nothing about this project's plan depends on the older layout.
- **`@mui/material` requires `@emotion/react` + `@emotion/styled` as
  explicit dependencies, not just a peer of MUI alone**: MUI's default
  styling engine is Emotion; without both packages installed directly,
  `@mui/material` imports fail to resolve. Installed all three together in
  one `npm install` command in Phase 11, matching MUI's own installation
  instructions.
- **`@hookform/resolvers` deliberately not installed in Phase 11**: it's
  the adapter package that lets a Yup schema be passed to React Hook
  Form's `resolver` option, but section 4 names only "React Hook Form +
  Yup" as the stack, and nothing wires them together until an actual form
  exists (Phase 14). Installing it now would be a dependency added ahead
  of need, which section 7 already rules out. Revisit at Phase 14.
- **`@mui/icons-material` also deliberately not installed in Phase 11**:
  section 4 names "Material UI (MUI)" without committing to the separate
  icons package; no icon is needed until real UI exists (Phase 13+). Same
  no-dependency-ahead-of-need reasoning as `@hookform/resolvers` above.
- **Planned `src/api/`, `src/types/`, `src/pages/`, `src/components/`,
  `src/hooks/` folders intentionally not pre-created in Phase 11**: mirrors
  the backend precedent of not pre-creating `task/`/`common/` packages back
  in Phase 2 — each folder gets created by the phase that actually first
  needs it (section 5), rather than scaffolding empty structure ahead of
  content.
- **`.claude/launch.json` added (Phase 11) to preview the frontend dev
  server**: registers `npm run dev --prefix frontend` on port 5173 so the
  Vite dev server can be started and inspected in a browser during future
  phases, mirroring how the backend is already run manually via `mvnw`.
  This file is tooling configuration for this development environment, not
  part of the shipped application.
- **Classic `<BrowserRouter>`/`<Routes>`/`<Route>` chosen over React
  Router's newer data-router API (`createBrowserRouter`/`RouterProvider`)**
  (Phase 12): the data-router API's main value is loaders/actions tied to
  route transitions, which this app doesn't use — data fetching is a
  Phase 15/16 concern, handled by the planned `useTasks` hook and `api/`
  layer instead. The declarative component form is simpler to explain at
  this stage and matches section 9's existing wording ("Routing lives in
  `App.tsx` via React Router") literally.
- **Layout implemented as a parent route wrapping `<Outlet/>`**, not a
  component every page imports and renders manually: React Router's layout
  route pattern (`<Route element={<Layout/>}>` wrapping child `<Route>`s)
  means adding a new page later is just another child route — `Layout`
  itself never needs to change. Chose this over prop-drilling children
  into `Layout` since it's the idiomatic React Router v6+/v7 pattern for
  this exact shape (shared chrome + swappable content).
- **Single `TaskFormPage` for both `tasks/new` and `tasks/:id/edit`**,
  deliberately mirroring the backend's single `TaskRequest` DTO serving
  both `POST` and `PUT` (section 16, DTO decisions): the presence/absence
  of the `:id` route param (read via `useParams`) is what will distinguish
  create vs. edit once real form logic lands in Phase 14 — no separate
  `CreateTaskPage`/`EditTaskPage` components.
- **MUI wired in with `createTheme()`'s default theme, no custom palette
  or typography overrides** (Phase 12): section 4 commits to MUI as the
  component library, but no design decision (brand colors, custom
  typography scale) has been made or asked for yet — inventing one now
  would be exactly the kind of hypothetical-future-requirement design
  section 7 rules out. `ThemeProvider`/`CssBaseline` are wired so the
  mechanism is in place; customizing the theme is deferred until an actual
  design need arises.
- **Vite's default scaffold content deleted rather than kept alongside the
  new app shell** (Phase 12): `App.css`, `index.css`, `src/assets/`
  (`react.svg`, `vite.svg`, `hero.png`), and `public/icons.svg` all existed
  only to support the starter "Get started" page that `App.tsx` no longer
  renders. MUI's `CssBaseline` now owns global resets/typography, so a
  second, competing global stylesheet (`index.css`, with its own `:root`
  color variables and dark-mode media query) would just be dead, unused
  CSS — deleted outright rather than left in place "just in case."
- **`TaskListPage` renders a hardcoded `SAMPLE_TASKS` array, not a real API
  call** (Phase 13): deliberately isolates "does the table/StatusBadge
  rendering logic work" from "does data fetching work" — the latter is
  explicitly Phase 16's job (section 19), and neither `api/` nor the
  `useTasks` hook exist yet. `SAMPLE_TASKS` covers all four `TaskStatus`
  values (to visually check each `StatusBadge` color) and both a present
  and a `null` `dueDate` (to check the table's `'—'` fallback), then stops
  — it is intentionally not the seed for later phases; Phase 15/16 replaces
  it outright rather than growing it into pagination test data.
- **MUI 9's `Stack` no longer accepts `justifyContent`/`alignItems` as
  direct shorthand props** — confirmed by reading `Stack.d.ts` in
  `node_modules/@mui/material` directly (same investigative technique as
  the Boot 4.1/Vite/React version surprises, sections 3 and 16):
  `StackOwnProps` now only exposes `direction`, `spacing`, `divider`,
  `useFlexGap`, and `sx` — unlike MUI v5, where `Stack` accepted the full
  system-props surface (`justifyContent`, `alignItems`, etc.) as top-level
  props. `TaskListPage`'s header row now passes those two through `sx`
  instead (`sx={{ justifyContent: 'space-between', alignItems: 'center' }}`).
  Worth remembering for any future MUI layout component — check `sx` first
  if a system-prop-style prop doesn't type-check in this MUI version.
- **`Button component={RouterLink} to="..."` pattern used for "New Task"**
  (Phase 13), replacing the plain React Router `Link` from Phase 12: this
  is MUI's documented way to get an MUI-styled `Button` that still performs
  React Router's client-side navigation (`component` swaps the rendered
  root element while MUI keeps its own props/styling, and `to` passes
  through to the underlying `RouterLink`) — confirmed working via the
  build and a real browser click, not assumed. The `TaskTable`'s per-row
  "Edit" action uses the same pattern with MUI's `Link` instead of `Button`
  (`Link component={RouterLink} to={...}`), since a table action reads
  better as a link than a button.
- **`TaskTable` and `StatusBadge` are pure presentational components**:
  `TaskTable` takes `tasks: Task[]` as its only prop and owns no state;
  `StatusBadge` takes `status: TaskStatus` and maps it to a label/color via
  two `Record` lookups. Neither imports Axios or knows anything about
  pagination — matches section 9's "components are presentational/
  reusable" convention and keeps them trivially reusable once Phase 15/16
  wire in real, paginated data.
- **Environment note (frontend, mirrors the Postgres note below): the Vite
  dev server does not always get fully stopped between sessions** — the
  Browser tool's `preview_stop` has, twice now, left an orphaned
  `node.exe` still listening on port 5173 after the tab/tracking was torn
  down, causing the next `preview_start` to fail with a port-in-use error.
  Fix: check for and kill the stray `node.exe` (confirm via `Get-Process
  -Id <pid>` that it's actually this project's dev server before killing
  it) rather than assuming something is misconfigured.
- **Environment note (backend, Phase 16): the Browser tool's `preview_start`
  refuses port 8080 outright** ("reserved by the OS... or a privileged
  port"), even though it isn't in Windows's actual excluded-port-range
  (confirmed via `netsh interface ipv4 show excludedportrange`) — it's the
  tool's own conservative gate, not a real bind failure. Fix: run the
  backend directly via a plain background shell command
  (`./mvnw.cmd spring-boot:run`) instead of through `preview_start`, and
  check readiness with `curl`/`netstat` rather than the Browser tool's
  log-reading. `.claude/launch.json` still has a `backend-dev` entry
  documenting the command, for reference, even though `preview_start`
  can't be used to run it.
- **Both apps must be running for any real frontend verification from
  Phase 16 onward**: Postgres container (`docker compose up -d` from
  `backend/`) → Spring Boot backend (port 8080) → Vite dev server (port
  5173, proxying `/api` to 8080). All three were already independently
  documented; Phase 16 is the first phase where a frontend check is
  meaningless without the other two also running.
- **`SAMPLE_TASKS` extracted from `TaskListPage` into `mocks/sampleTasks.ts`
  (Phase 14)**: `TaskFormPage`'s edit mode needs the same fixture data (to
  look up a task by the `:id` route param and prefill the form) that
  `TaskListPage` already had hardcoded inline. Duplicating the array in two
  files would let them drift; a single shared module is the minimal fix,
  not a new architectural layer — the whole `mocks/` folder is deleted
  outright once Phase 15/16 replace it with real fetched data, unlike the
  `types/`/`components/` folders which are permanent.
- **`TaskForm`'s `onSubmit` currently just `console.log`s the values and
  navigates to `/`, for both create and edit** (Phase 14): proves the
  validation → submit → navigate pipeline works end-to-end without
  pretending a network call happens — there is no `api/` layer yet, and
  building one now would jump ahead to Phase 16. The real `create`/`update`
  Axios calls replace this stub directly; the form's own validation and
  field wiring don't change.
- **Create-form defaults `priority` to `'MEDIUM'`, no equivalent invented
  for `status` beyond backend's own `TODO` default**: `status` already has
  a documented backend-side default (`Task.status = TaskStatus.TODO`,
  section 16); `priority` has no such default anywhere in the spec, since
  Bean Validation only requires it non-null. Rather than leave the MUI
  `Select` with no initial value (which would need an artificial "unset"
  sentinel not in the `TaskPriority` type, complicating both the Yup schema
  and the type), the form defaults it to `'MEDIUM'` as a reasonable UX
  choice — the user can still change it before saving. Documented here
  precisely because it's an invented default, not one derived from an
  existing rule.
- **MUI's `Select`/`TextField select` wired via React Hook Form's
  `Controller`, not `register`**: unlike plain text `TextField`s (`title`,
  `description`, `dueDate`, all wired with `register` directly), MUI's
  `Select` is a fully controlled component that needs an explicit `value`/
  `onChange` pair to render its selected option correctly — `register`
  alone (which relies on being able to read an uncontrolled DOM ref) is the
  officially-documented-as-unreliable path for MUI `Select`/`Autocomplete`.
  `status` and `priority` use `Controller` for this reason; the plain text
  fields don't need it.
- **`SAMPLE_TASKS` grown from 4 to 7 entries in Phase 15**, contradicting
  the Phase 13 comment that said it wouldn't be extended: that comment
  assumed the fixture would stay frozen until deleted outright by Phase 16.
  It turned out Phase 15 itself (client-side pagination) couldn't be
  meaningfully verified with only 4 rows against a page size that shows the
  whole list on one page — pagination's own correctness (does "next page"
  actually change what's shown, does the count math work) needs enough
  rows to force at least two pages. Grew the fixture to 7 (default page
  size 5 → a 5-and-2 split) and gave one entry a non-null `description`
  specifically so search-by-description (not just title) has something
  real to match against. This is the one instance in this project where an
  earlier "won't change this" note turned out to be wrong once the next
  phase's actual requirements were known — corrected here rather than left
  stale.
- **`mocks/sampleTasks.ts`'s deletion trigger corrected: Phase 16 (the
  `api/` layer), not Phase 15 (`useTasks`)**: the Phase 14 comment in that
  file said it would be "deleted once the api/ layer and useTasks hook
  land," implying both phases jointly retire it. In practice `useTasks`
  (Phase 15) still reads `SAMPLE_TASKS` directly — it's the client-side
  data source being paginated/filtered, not yet a real fetch — and
  `TaskFormPage`'s edit-mode lookup still needs it too. Only Phase 16,
  when `useTasks` is rewired to call the real backend, actually removes
  the need for this file. The comment now says "Phase 16" specifically.
- **Default page size of 5, not the backend's `@PageableDefault(size =
  20)`** (Phase 15): a deliberate, temporary mismatch — 20 would put all 7
  sample tasks on one page, making pagination impossible to exercise in
  the browser. `useTasks`'s `size` state defaults to 5 for now, precisely
  so multi-page behavior has something to click through and verify; once
  Phase 16 wires this to the real paginated endpoint, matching the
  backend's actual default becomes the natural (and correct) choice, since
  a real dataset will usually be larger than one page anyway.
- **Sorting is plain alphabetical `String.localeCompare` on `status`/
  `priority`'s raw enum strings, not business-meaningful ordering** (e.g.
  not `TODO → IN_PROGRESS → DONE → CANCELLED`, and not `LOW → MEDIUM →
  HIGH`): simplest correct behavior for this phase, matching the "don't
  invent unspecified business rules" principle from earlier phases (the
  `priority` default value decision above, and the backend's
  never-built status-transition-validity rule, section 16). Alphabetical
  is the same ordering `TableSortLabel`'s click affordance implies for a
  text column; a business-meaningful ordering can be introduced later if
  actually requested. `dueDate` sorts nulls last regardless of direction
  (a deliberate, explicit choice, not a side effect of comparator logic) —
  since a "no due date" task isn't meaningfully "earlier" or "later" than
  a dated one in either direction.
- **Vite dev-server proxy (`server.proxy: { '/api': 'http://localhost:8080' }`)
  chosen over backend CORS configuration** (Phase 16): the frontend needed
  some way to reach the backend across ports (5173 vs. 8080) in local dev.
  Adding a `@CrossOrigin`/`CorsConfigurationSource` bean would touch backend
  code in a phase titled "Frontend API integration" — the proxy is a
  frontend-only, dev-tooling-only fix: the browser only ever talks to the
  Vite origin, which forwards server-side, so no CORS headers are needed at
  all. Explicitly dev-only — `vite preview`/a production build don't get
  this proxy, and production deployment topology (reverse proxy? backend
  CORS? same-origin behind a gateway?) is genuinely undecided until
  Phase 20. `apiClient`'s `baseURL: '/api'` is what makes this work; it's a
  relative path, not `http://localhost:8080/api`.
- **Task Delete added to the UI in Phase 16, even though no phase name
  ever said "build a delete button"**: section 2 (business purpose)
  explicitly commits to "create, view, update, and delete tasks" as core
  functionality, and Phase 16 is the phase that wires up the *complete*
  real API surface for the first time — leaving `DELETE /api/tasks/{id}`
  (built and tested since Phase 8/10) with no frontend caller at all would
  leave a documented core feature permanently unbuilt, since no later
  phase in section 19 revisits list/table UI. Implemented as a per-row
  "Delete" action in `TaskTable` gated by a native `window.confirm(...)` —
  not a custom MUI `Dialog` component, which would be more UI machinery
  than a destructive-action confirmation needs at this app's scale.
- **`PATCH /api/tasks/{id}/status` deliberately still has no frontend
  caller**: unlike `DELETE`, section 2's "change task status" is already
  fully achievable through the existing edit form's status field +
  general `PUT` update — there's no separate "quick status change"
  feature named anywhere in this project's docs, so building one now
  would be inventing a requirement, the same reasoning section 16 already
  applied to the backend's own never-built status-transition-validity
  rules. `api/tasks.ts` has no `updateTaskStatus` function for the same
  reason it doesn't have anything else nothing calls yet.
- **Search input debounced 300ms before triggering a real request**
  (Phase 16): flagged as a known gap back in Phase 15 ("the natural point
  to consider debouncing before it starts hitting a real network endpoint
  on every keystroke") and now addressed — `useTasks` keeps two pieces of
  state, the raw `searchInput` (what the `TextField` shows immediately,
  so typing never feels laggy) and a debounced `search` (what actually
  drives the fetch). Verified empirically: typing a 6-character search
  term produced exactly one `GET .../api/tasks?search=...` request, not
  six.
- **Data-fetching `useEffect`s guard against out-of-order responses with a
  `cancelled` flag, not just a loading spinner**: if the user changes
  filters faster than a request resolves, an older, slower response must
  not overwrite state after a newer request already completed. Both the
  list fetch (`useTasks`) and the edit-mode fetch (`TaskFormPage`) return
  a cleanup function that sets `cancelled = true`, checked before every
  `setState` call inside the `.then`/`.catch`/`.finally`. This is also
  what makes both effects safe under React 19's `StrictMode` (which
  double-invokes effects in development specifically to catch missing
  cleanup like this) — confirmed in the browser: duplicate `GET` requests
  appear in the network log (harmless, both resolve to the same data), but
  no duplicate `POST`/`PUT`/`DELETE` ever fired from a single click.
- **No fieldErrors-to-form-field mapping on a failed submit**: the backend
  can return per-field validation errors (`ErrorResponse.fieldErrors`,
  section 13), and a more polished integration might call RHF's
  `setError('title', ...)` for each one. Not built — `TaskForm` owns its
  `useForm()` internally and doesn't expose `setError` to its parent, and
  since the frontend's Yup schema already mirrors every backend Bean
  Validation constraint exactly (section 12), a real request reaching the
  server with data the server would reject is essentially unreachable
  through the actual UI. `TaskFormPage` instead shows the server's
  `message` in a generic `Alert` on any submit failure — simpler, and
  correct for the failures that can actually occur (network errors,
  backend down, a raced 404 on an edit).
- **`getErrorMessage(error, fallback)` helper in `api/client.ts`**: a
  small shared function that extracts `error.response.data.message` from
  an Axios error when the backend's `ErrorResponse` shape is present, and
  falls back to a caller-supplied generic message otherwise (network
  failure, backend down, unexpected non-JSON response). Used by both
  `useTasks` and `TaskFormPage` so error messages are extracted
  consistently rather than each call site re-implementing the same
  `axios.isAxiosError` check.
- **`LocalDate` round-trips through Jackson 3 with no extra
  configuration**: verified directly against the running backend (not
  assumed, given this project's history of real Jackson-3-vs-2 surprises
  — section 16, Phase 8) — `POST`ing `{"dueDate":"2026-09-15"}` and
  reading it back returns the same plain ISO date string, confirming
  `spring-boot-starter-jackson`'s Jackson 3 handles `java.time.LocalDate`
  out of the box. No `TaskRequestBody`/`Task` type changes were needed.
- **Test data seeded and deleted via direct `curl` calls against the real
  backend during verification, not left in the dev database**: mirrors
  the backend's own established pattern (section 14) of using throwaway
  verification data and cleaning up afterward rather than leaving scratch
  state lying around. The dev database is empty again after this phase's
  verification, same as before it started.

## 17. Current implementation status

- Phase 1 (architecture & requirements) — **done**.
- **Phase 2 (Spring Boot backend initialization) — done.** `backend/`
  contains a real Maven project: `pom.xml` (Spring Boot 4.1.0 parent,
  groupId `com.learning.taskmanager`, artifactId `backend`, deps: data-jpa,
  flyway, validation, webmvc, postgresql runtime, lombok) and the
  `TaskManagerApplication` main class.
- **Phase 3 (database configuration) — done.** `backend/docker-compose.yml`
  runs a dedicated `taskmanager-postgres` container (Postgres 17, port
  5433). `application.yml` now has real `spring.datasource.*` properties,
  `spring.jpa.open-in-view: false`, `spring.jpa.hibernate.ddl-auto:
  validate`, and `spring.flyway.enabled: true`. `src/main/resources/db/
  migration` exists but is still empty — the first migration is Phase 4.
- `mvn compile` and `mvn test` both **succeed** (with the Postgres
  container running) — `contextLoads` now genuinely starts the full
  application context against a real database, Flyway creates its
  `flyway_schema_history` table, and Hibernate initializes with zero
  entities (nothing to validate yet).
- **Environment note for future sessions**: the Postgres container is not
  always running — if `mvn test` fails with a connection error, first check
  `docker ps` and run `docker compose up -d` from `backend/` before
  assuming something is broken.
- **Phase 4 (Task entity and database migration) — done.**
  `V1__create_tasks_table.sql` creates the `tasks` table exactly as
  specified in section 11. `Task`, `TaskStatus`, `TaskPriority` exist in
  `com.learning.taskmanager.task`. Verified two ways: (1) `mvn test` passes
  with Flyway applying the migration and Hibernate's `ddl-auto: validate`
  raising no mismatch against the entity mapping, and (2) `\d tasks` inside
  the container confirms the physical schema matches exactly (columns,
  types, nullability, the `idx_tasks_status` index).
- **Phase 5 (Repository) — done.** `TaskRepository extends
  JpaRepository<Task, Long>` plus a custom `search(status, search,
  pageable)` JPQL query implementing the optional status filter + text
  search designed in Phase 1. Verified with a temporary `@DataJpaTest`
  (written, run against the real Postgres container, then deleted — no
  permanent test code exists yet, consistent with section 14). Found and
  fixed a real bug in the process: see section 16, `CAST(:search AS
  string)`.
- **Phase 6 (DTOs and validation) — done.** `task/dto/TaskRequest.java`
  (record, Bean Validation constraints per section 12) and
  `task/dto/TaskResponse.java` (record, with a `TaskResponse.from(Task)`
  static factory) now exist. Verified with a temporary plain-JUnit test
  (`jakarta.validation.Validator`, no Spring context needed) proving the
  constraints actually fire and resolve to the right property paths, then
  deleted (section 14); full `mvn compile`/`mvn test` re-run confirmed a
  clean baseline afterward.
- **Phase 7 (Service layer) — done.** `TaskService` implements
  `search`/`getById`/`create`/`update`/`updateStatus`/`delete`, mapping to
  and from `TaskResponse`/`TaskRequest` and throwing
  `ResourceNotFoundException` (new, minimal — see section 16) when an id
  doesn't exist. `@Transactional`/`@Transactional(readOnly = true)` mark
  transaction boundaries at the service layer. Verified with a temporary
  `@DataJpaTest` exercising all six operations against the real Postgres
  container (including confirming dirty-checking persists `update()`
  without an explicit `save()`), then deleted (section 14); full
  `mvn compile`/`mvn test` re-run confirmed a clean baseline afterward.
- **Phase 8 (REST controller) — done.** `TaskController` exposes the full
  `/api/tasks` surface (section 10); two new DTOs support it
  (`PageResponse<T>`, `TaskStatusUpdateRequest`). Verified with a temporary
  `@SpringBootTest` + `@AutoConfigureMockMvc` + `@Transactional` test
  driving the full CRUD lifecycle, the list endpoint's documented response
  shape, and Bean Validation rejection through real HTTP requests against
  the real Postgres container, then deleted (section 14). Along the way,
  confirmed two more Boot 4.1 relocations/behavior changes (`TestRestTemplate`
  package move + new opt-in annotation requirement, and Jackson 3 replacing
  Jackson 2 under `spring-boot-starter-jackson`) — both in section 16.
- **Phase 9 (Exception handling) — done.** `ApiExceptionHandler`
  (`@RestControllerAdvice`) and `ErrorResponse` now exist, completing the
  `common/exception/` package exactly as planned back in Phase 1. Every
  error path through `TaskController` now returns the consistent
  `{ timestamp, status, error, message, path, fieldErrors? }` shape from
  section 13: `ResourceNotFoundException` → 404, `MethodArgumentNotValidException`
  → 400 (with `fieldErrors`), bad enum query params/non-numeric path ids/
  malformed JSON bodies → 400, everything else → a logged, generic 500.
  Verified with a temporary `@SpringBootTest` + `@AutoConfigureMockMvc` +
  `@Transactional` test covering all five cases against the real Postgres
  container, then deleted (section 14). The backend now matches Phase 1's
  originally planned structure in full (section 5).
- **Phase 10 (Backend testing) — done.** A permanent test suite now exists:
  `TaskServiceTest` (unit, Mockito), `TaskRepositoryTest` (`@DataJpaTest`,
  real Postgres), `TaskControllerTest` (`@WebMvcTest`, mocked service) —
  21 tests total across the suite, all passing via `mvn test`. This is the
  first phase whose test code is *not* deleted afterward; details in
  section 14.
- **Phase 11 (React project initialization) — done.** `frontend/` now
  contains a real Vite + React + TypeScript project (`npm create
  vite@latest . -- --template react-ts`), plus the core dependencies from
  section 4 installed via a single `npm install`: `@mui/material`,
  `@emotion/react`, `@emotion/styled`, `react-router-dom`, `axios`,
  `react-hook-form`, `yup`. Verified two ways: (1) `npm run build`
  completes cleanly (`tsc -b && vite build`, output written to `dist/`),
  and (2) the dev server (`npm run dev`, port 5173) was started and loaded
  in a browser via `.claude/launch.json` (new this phase — section 16),
  confirming Vite's HMR client connects and no console errors appear, with
  the page still showing Vite's default generated content. No routing,
  pages, components, hooks, or API layer exist yet — `src/App.tsx` is
  still the scaffold's starter page; that's Phase 12+ work, not a gap in
  this phase. Toolchain versions resolved noticeably newer than most React
  tutorials assume (Vite 8, React 19, MUI 9, oxlint instead of ESLint) —
  details and consequences in section 16.
- **Phase 12 (React routing and application layout) — done.** `App.tsx`
  now wraps `BrowserRouter`/`Routes` in an MUI `ThemeProvider`/`CssBaseline`;
  `components/Layout.tsx` (AppBar + Container around `<Outlet/>`) is a
  layout route wrapping three child routes (`index`, `tasks/new`,
  `tasks/:id/edit`) resolved to `pages/TaskListPage.tsx` and
  `pages/TaskFormPage.tsx` — both still placeholders (heading + `Link`),
  since real content is Phases 13–14. Vite's leftover starter content
  (`App.css`, `index.css`, `src/assets/`, `public/icons.svg`) was deleted
  since nothing referenced it after the rewrite (section 16). Verified in
  a real browser via the dev server: the AppBar renders with the "Task
  Manager" title on `/`, clicking the "New Task" `Link` client-side-
  navigates to `/tasks/new` with no full page reload, and directly loading
  `/tasks/42/edit` by URL renders "Edit Task 42" — confirming `useParams`
  correctly extracts the `:id` segment and that Vite's dev server serves
  the SPA fallback correctly for a deep link, not just `/`. `npm run
  build` and `npm run lint` (oxlint) both pass clean.
- **Phase 13 (Task list UI) — done.** `types/task.ts` defines `Task`,
  `TaskStatus`, `TaskPriority` (mirroring the backend's `TaskResponse`
  shape). `components/StatusBadge.tsx` maps each `TaskStatus` to an MUI
  `Chip` label/color; `components/TaskTable.tsx` is a presentational MUI
  `Table` taking `tasks: Task[]` as its only prop, with a status column
  (via `StatusBadge`), a priority column, a due-date column (`'—'` when
  `null`), and a per-row "Edit" link to `/tasks/{id}/edit`.
  `pages/TaskListPage.tsx` renders `TaskTable` against a hardcoded
  `SAMPLE_TASKS` array (all four statuses, one `null` due date) — real
  fetching is deliberately deferred to Phases 15–16 (section 16). The
  "New Task" link became a proper MUI `Button` using the `component=
  {RouterLink}` pattern. Hit and fixed one real MUI 9 API surprise along
  the way: `Stack` no longer accepts `justifyContent`/`alignItems` as
  direct props (moved into `sx`) — confirmed via `Stack.d.ts`, documented
  in section 16. Verified in a real browser: all four status colors
  render distinctly, the missing-due-date fallback shows correctly, and
  clicking a row's "Edit" link (not just typing the URL) correctly
  navigates to that task's edit route. `npm run build` and `npm run lint`
  both pass clean.
- **Phase 14 (Create/update task form) — done.** `components/TaskForm.tsx`
  is a React Hook Form + Yup form (fields: title, description, status,
  priority, due date) matching the backend's `TaskRequest` validation
  rules (section 12); `@hookform/resolvers` was installed this phase to
  wire the two together. `pages/TaskFormPage.tsx` decides create vs. edit
  from the `:id` route param, prefilling from `mocks/sampleTasks.ts` (new
  this phase — extracted from `TaskListPage`, section 16) in edit mode and
  showing "Task not found." for an unknown id. `onSubmit` currently just
  logs the submitted values and navigates back to `/` — real `POST`/`PUT`
  requests are Phase 16. Verified in a real browser (not just the build):
  submitting a blank title shows "Title is required" and blocks
  navigation; a valid submission logs the exact typed values (`{title:
  "Buy milk", description: "", status: "TODO", priority: "MEDIUM",
  dueDate: ""}`) and returns to the list; navigating directly to
  `/tasks/2/edit` correctly prefills every field from that task's sample
  data; navigating to a nonexistent id shows the not-found fallback.
  `npm run build` and `npm run lint` both pass clean.
- **Phase 15 (Search, filtering and pagination) — done.** `hooks/
  useTasks.ts` centralizes search text, status filter, sort field/
  direction, and page/size state, deriving the visible rows from
  `SAMPLE_TASKS` (grown to 7 entries this phase — section 16) via
  `filter`/`sort`/`slice`. `components/SearchBar.tsx` (new) provides the
  text search + status dropdown; `components/TaskTable.tsx` gained
  clickable `TableSortLabel` column headers and an MUI `TablePagination`
  footer. `TaskListPage` composes these with no state of its own — all of
  it lives in the hook. Verified in a real browser: searching "structured"
  (a word that only appears in one task's `description`, not its title)
  correctly matches just that task, confirming search checks both fields;
  filtering by status "DONE"/"CANCELLED" showed exactly the expected
  counts; clicking the "Status" column header re-sorted rows to
  alphabetical-by-status and reset back to page 1; clicking "next page"
  correctly showed the remaining 2 of 7 tasks; and searching for a
  non-matching term showed the "No tasks match your search." empty state
  with a correct "0–0 of 0" count. `npm run build` and `npm run lint` both
  pass clean. (Along the way, hit the same stale-`ref`-after-rerender
  browser-automation issue as Phase 14 — verified by re-clicking via fresh
  coordinates each time rather than reusing refs across state changes; not
  an application bug.)
- **Phase 16 (Frontend API integration and error handling) — done.** The
  frontend now talks to the real backend end to end, with `mocks/
  sampleTasks.ts` deleted entirely. New: `api/client.ts` (one Axios
  instance, `baseURL: '/api'`) and `api/tasks.ts` (typed `listTasks`/
  `getTask`/`createTask`/`updateTask`/`deleteTask`); `vite.config.ts` gained
  a dev-only `server.proxy` forwarding `/api` to `http://localhost:8080`
  (no backend CORS config needed — section 16). `useTasks`'s internals were
  rewired from filtering an in-memory array to calling `listTasks`, with
  debounced search (300ms), `loading`/`error` state, and a new `removeTask`
  backing a per-row Delete action (added this phase — section 16 explains
  why, given section 2's business-purpose commitment to full CRUD).
  `TaskFormPage` now fetches the real task for edit mode and submits via
  the real `createTask`/`updateTask`, with its own loading/error states.
  Verified against the actual running Spring Boot backend (Postgres
  container + `mvnw spring-boot:run`), not mocked: created a task through
  the real UI (`POST` → 201, confirmed in the re-fetched list); edited it
  (`GET` prefill → changed status → `PUT` → 200, change persisted);
  deleted it two ways — declining the `window.confirm` correctly left it
  in place (no `DELETE` fired), accepting it correctly removed it
  (`DELETE` → 204); navigated to the now-deleted task's edit URL and got
  the backend's real 404 message ("Task not found with id 26"), not a
  guess; killed the backend process and confirmed the list showed "Failed
  to load tasks. Is the backend running?" instead of crashing; seeded 6
  real tasks via `curl` and confirmed real pagination ("1–5 of 6") and
  debounced search (one request for a 6-character typed term, not six)
  against them; and separately confirmed a non-null `dueDate` round-trips
  correctly through Jackson 3 with no extra config. All seeded/test data
  was deleted afterward, leaving the dev database empty (section 16,
  mirroring the backend's own throwaway-verification-data convention).
  `npm run build` and `npm run lint` both pass clean.
- Phases 17–20 are not started.

## 18. Known limitations

- Single global task list — no per-user data isolation (by design, until
  Phase 17).
- No authentication/authorization — every endpoint will be open once built.
- Backend has automated tests (Phase 10); frontend does not yet — deferred
  to Phase 19. The frontend now has real, non-trivial logic worth testing
  (`useTasks`'s debounce/cancellation, the API layer, form validation), so
  this gap is now a genuine one to close, not a placeholder for empty
  scaffolding the way it was through Phase 15.
- No containerization/deployment setup yet (Phase 20). Relatedly, the
  frontend↔backend connection only works via Vite's dev-server proxy
  (section 16) — there is no answer yet for how the two will talk to each
  other outside local dev (reverse proxy, backend CORS config, same origin
  behind a gateway); that's explicitly a Phase 20 question.
- No frontend state-management library — acceptable at this app's size,
  would need revisiting if the app grew significantly.
- No per-field server-validation-error mapping in `TaskForm` (section 16)
  — acceptable because the frontend's Yup schema already mirrors every
  backend constraint, making the gap practically unreachable through the
  UI, but worth knowing if backend validation ever adds a rule the
  frontend doesn't mirror.

## 19. Future learning phases

1. Project architecture and requirements — done
2. Spring Boot backend initialization — done
3. Database configuration — done
4. Task entity and database migration — done
5. Repository — done
6. DTOs and validation — done
7. Service layer — done
8. REST controller — done
9. Exception handling — done
10. Backend testing — done
11. React project initialization — done
12. React routing and application layout — done
13. Task list UI — done
14. Create/update task form — done
15. Search, filtering and pagination — done
16. Frontend API integration and error handling — done
17. Authentication with Spring Security + JWT
18. Role-based authorization
19. Testing
20. Docker and deployment basics
