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
status; sort; paginate. Through Phase 16 this was a single list shared by
every (unauthenticated) caller. **Phase 17 changed this**: the app now
requires a login, and each user owns a private task list — no user can see
or modify another user's tasks (section 15). This was a deliberate,
explicitly-confirmed revision of the original single-shared-list plan (see
section 16), not an oversight — the original wording anticipated staying
shared even after auth existed, but per-user ownership was chosen instead
once Phase 17 actually arrived. Still no collaboration/sharing features
(one task belongs to exactly one user, full stop) — that remains out of
scope. **Phase 18 adds one narrow exception**: a user with the `ADMIN`
role can *view* (not modify) every user's tasks through a separate
`/admin` area (section 15) — this is administrative oversight, not
collaboration/sharing between regular users, which is still out of scope
exactly as before. The project's actual purpose is educational: give a
Java/Spring Boot developer a realistic, incremental introduction to React,
full-stack integration patterns, Spring Security/JWT (Phase 17), and
role-based authorization (Phase 18).

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
- Spring Security 7.1 (`spring-boot-starter-security`) + JJWT 0.12.6
  (`jjwt-api`/`jjwt-impl`/`jjwt-gson`) for authentication (Phase 17)

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

Auth state (Phase 17) uses plain React Context (`createContext`/
`useContext`, built into React) — no new dependency, and deliberately not
one of the state-management libraries excluded above (see section 16 for
why a Context is a different thing than a "state management library" in
the sense this section rules out).

**Testing (Phase 19)**: Vitest 4.1 + `@testing-library/react` 16.3 +
`@testing-library/jest-dom` 6.9 + `@testing-library/user-event` 14.6, with
`jsdom` 27 as the DOM environment. Vitest specifically because it shares
Vite's config/transform pipeline (one `vite.config.ts`, via `import {
defineConfig } from 'vitest/config'`, section 16) rather than needing a
second, separately-configured tool (e.g. Jest) with its own transform
setup for the same TypeScript/JSX source.

## 5. Project structure

**Actual, current structure:**

```
learning-task-manager/
├── CLAUDE.md
├── docker-compose.yml      full containerized stack — postgres + backend + frontend
│                            (Phase 20; distinct from backend/docker-compose.yml below)
├── backend/                Spring Boot 4.1 project (Phases 2–10, 17–18, 20 — done)
│   ├── pom.xml
│   ├── docker-compose.yml        dedicated local Postgres, for non-containerized
│   │                               backend dev only (Phase 3) — untouched by Phase 20
│   ├── Dockerfile          multi-stage: maven:3.9-eclipse-temurin-21-alpine build →
│   │                        eclipse-temurin:21-jre-alpine run (Phase 20)
│   ├── .dockerignore
│   ├── mvnw / mvnw.cmd / .mvn/
│   ├── src/main/java/com/learning/taskmanager/
│   │   ├── TaskManagerApplication.java
│   │   ├── common/
│   │   │   └── exception/
│   │   │       ├── ResourceNotFoundException.java      (Phase 7)
│   │   │       ├── UsernameAlreadyExistsException.java  register conflict (Phase 17)
│   │   │       ├── ApiExceptionHandler.java             @RestControllerAdvice (Phase 9,
│   │   │       │                                          extended Phase 17 for auth errors)
│   │   │       └── ErrorResponse.java                   error response DTO (Phase 9)
│   │   ├── user/
│   │   │   ├── User.java             JPA entity: id/username/password/role (Phase 17,
│   │   │   │                          role added Phase 18)
│   │   │   ├── Role.java             enum USER/ADMIN (Phase 18)
│   │   │   └── UserRepository.java   findByUsername (Phase 17)
│   │   ├── security/                 (all Phase 17 except CustomAccessDeniedHandler, Phase 18)
│   │   │   ├── AppUserPrincipal.java          UserDetails wrapping User; getAuthorities()
│   │   │   │                                   derives a single ROLE_* from User.role (Phase 18)
│   │   │   ├── CustomUserDetailsService.java  loads AppUserPrincipal by username
│   │   │   ├── JwtService.java                generate/parse HS256 JWTs (JJWT)
│   │   │   ├── JwtAuthenticationFilter.java   OncePerRequestFilter, reads Bearer header
│   │   │   ├── SecurityConfig.java            SecurityFilterChain, stateless, BCrypt;
│   │   │   │                                   /api/admin/** gated hasRole("ADMIN") (Phase 18)
│   │   │   ├── CustomAuthenticationEntryPoint.java  401s in the section 13 ErrorResponse shape
│   │   │   ├── CustomAccessDeniedHandler.java 403s in the same shape, for hasRole(...)
│   │   │   │                                   denials (Phase 18)
│   │   │   ├── AuthController.java            POST /api/auth/login, /api/auth/register —
│   │   │   │                                   both responses now include role (Phase 18)
│   │   │   └── dto/
│   │   │       ├── LoginRequest.java / LoginResponse.java   (LoginResponse gained role, Phase 18)
│   │   │       └── RegisterRequest.java
│   │   ├── admin/                    (all Phase 18 — admin-only, role-gated endpoints)
│   │   │   ├── AdminController.java  GET /api/admin/tasks, GET /api/admin/users
│   │   │   ├── AdminService.java
│   │   │   └── dto/
│   │   │       ├── AdminTaskResponse.java   TaskResponse + ownerUsername
│   │   │       └── AdminUserResponse.java   id/username/role
│   │   └── task/
│   │       ├── Task.java             JPA entity — gained a User relation (Phase 17)
│   │       ├── TaskStatus.java       enum (Phase 4)
│   │       ├── TaskPriority.java     enum (Phase 4)
│   │       ├── TaskRepository.java   Spring Data JPA — search/findByIdAndUserId now
│   │       │                          user-scoped (Phase 17); findAll(Pageable) overridden
│   │       │                          with @EntityGraph(attributePaths = "user") (Phase 18,
│   │       │                          for AdminService's all-tasks listing)
│   │       ├── TaskService.java      service layer — every method takes a userId (Phase 17)
│   │       ├── TaskController.java   REST controller — resolves the caller via
│   │       │                          @AuthenticationPrincipal AppUserPrincipal (Phase 17)
│   │       └── dto/
│   │           ├── TaskRequest.java             request DTO, Bean Validation (Phase 6)
│   │           ├── TaskResponse.java            response DTO (Phase 6)
│   │           ├── TaskStatusUpdateRequest.java  PATCH .../status body (Phase 8)
│   │           └── PageResponse.java             generic list-endpoint wrapper (Phase 8)
│   ├── src/main/resources/
│   │   ├── application.yml       datasource, JPA, Flyway config (Phase 3); app.jwt.secret /
│   │   │                          app.jwt.expiration-ms added (Phase 17)
│   │   └── db/migration/
│   │       ├── V1__create_tasks_table.sql       (Phase 4)
│   │       ├── V2__create_users_table.sql       (Phase 17)
│   │       ├── V3__add_user_id_to_tasks.sql     (Phase 17)
│   │       ├── V4__seed_demo_users.sql          alice/bob, bcrypt hashes (Phase 17)
│   │       └── V5__add_role_to_users.sql        adds users.role, promotes alice to
│   │                                             ADMIN (Phase 18)
│   └── src/test/java/com/learning/taskmanager/
│       ├── TaskManagerApplicationTests.java
│       ├── task/
│       │   ├── TaskServiceTest.java      unit test, Mockito — now passes userId (Phase 10, 17)
│       │   ├── TaskRepositoryTest.java   @DataJpaTest — seeds real Users, adds a
│       │   │                             cross-user-isolation test (Phase 10, 17)
│       │   └── TaskControllerTest.java   @WebMvcTest, service mocked — @Import(SecurityConfig)
│       │                                 + authentication() post-processor per request (Phase 10, 17)
│       ├── security/
│       │   └── SecurityIntegrationTest.java  @SpringBootTest + @AutoConfigureMockMvc +
│       │                                      @Transactional; login/register/401/cross-user
│       │                                      isolation (Phase 17) + role/admin-endpoint
│       │                                      403/200 coverage (Phase 18)
│       └── admin/
│           └── AdminControllerTest.java  @WebMvcTest — same @Import(SecurityConfig, ...)
│                                          pattern as TaskControllerTest; admin-vs-user-vs-
│                                          unauthenticated for both admin endpoints (Phase 18)
└── frontend/                Vite + React + TS project (Phases 11–20 — done)
    ├── package.json         scripts: dev, build (tsc -b && vite build), lint (oxlint),
    │                         preview, test (vitest run, Phase 19)
    ├── vite.config.ts       server.proxy forwards /api → http://localhost:8080 (Phase 16);
    │                         imports defineConfig from 'vitest/config' + a `test` block
    │                         (environment: jsdom, setupFiles) (Phase 19)
    ├── Dockerfile           multi-stage: node:22-alpine build → nginx:alpine serve
    │                         (Phase 20)
    ├── nginx.conf           serves the built dist/, reverse-proxies /api/ to the
    │                         backend container, SPA fallback to index.html (Phase 20)
    ├── .dockerignore
    ├── tsconfig.json         references tsconfig.app.json / tsconfig.node.json
    ├── index.html           <title>Task Manager</title> (Phase 12)
    ├── public/               favicon.svg (Vite default; icons.svg removed, Phase 12 — see section 16)
    └── src/
        ├── main.tsx          createRoot(...).render(<App />), no global stylesheet import
        ├── setupTests.ts     Vitest setupFiles entry — @testing-library/jest-dom/vitest
        │                      matchers + a shared afterEach(cleanup) (Phase 19, section 16)
        ├── App.tsx           BrowserRouter + Routes + MUI ThemeProvider/CssBaseline (Phase 12);
        │                      AuthProvider + /login, /register, ProtectedRoute-wrapped
        │                      task routes (Phase 17); an AdminRoute-wrapped /admin route
        │                      nested inside ProtectedRoute (Phase 18)
        ├── types/
        │   ├── task.ts        Task, TaskStatus, TaskPriority, TaskSortField, PageResponse<T>
        │   │                   (Phases 13, 15, 16)
        │   ├── api.ts         ApiErrorResponse, ApiFieldError — mirrors backend ErrorResponse (Phase 16)
        │   ├── auth.ts        Role, AuthResponse (token, username, role) (Phase 17;
        │   │                   role added Phase 18)
        │   └── admin.ts       AdminTask (Task + ownerUsername), AdminUser (Phase 18)
        ├── contexts/
        │   ├── AuthContext.tsx  AuthProvider + useAuth() — token/username/role state, backed
        │   │                     by localStorage; login/register/logout; isAdmin derived
        │   │                     from role (Phase 17; role/isAdmin added Phase 18)
        │   └── AuthContext.test.tsx  renderHook + mocked api/auth — login/register/logout
        │                              state transitions, localStorage persistence, isAdmin
        │                              derivation, throws-outside-provider (Phase 19)
        ├── api/
        │   ├── client.ts      one shared Axios instance (baseURL '/api') + getErrorMessage
        │   │                   helper (Phase 16); token storage + request/response
        │   │                   interceptors (auth header, global 401 → logout) (Phase 17)
        │   ├── client.test.ts  getErrorMessage — backend message extraction vs. fallback
        │   │                    (Phase 19)
        │   ├── tasks.ts       listTasks/getTask/createTask/updateTask/deleteTask, typed (Phase 16)
        │   ├── auth.ts        login/register typed calls (Phase 17)
        │   └── admin.ts       listAllTasks/listAllUsers typed calls (Phase 18)
        ├── hooks/
        │   ├── useTasks.ts    search/filter/sort/paginate state; calls the real API (Phase 16
        │   │                   rewired this from Phase 15's client-side array filtering)
        │   └── useTasks.test.ts  renderHook + mocked api/tasks, fake timers for the 300ms
        │                          debounce — search debounce, sort/status/page-reset
        │                          interactions, delete-then-refetch, load/delete error
        │                          paths, and the stale-response `cancelled`-guard race
        │                          (section 16) (Phase 19)
        ├── components/
        │   ├── Layout.tsx      MUI AppBar + Container, <Outlet/> for routed pages (Phase 12);
        │   │                    shows username + Logout button (Phase 17); an Admin nav
        │   │                    link, shown only when isAdmin (Phase 18)
        │   ├── ProtectedRoute.tsx  redirects to /login when not authenticated (Phase 17)
        │   ├── ProtectedRoute.test.tsx  mocked useAuth — renders children vs. redirects (Phase 19)
        │   ├── AdminRoute.tsx  redirects to / when authenticated but not an admin (Phase 18)
        │   ├── AdminRoute.test.tsx  mocked useAuth — admin renders, non-admin redirects to
        │   │                        / (not /login) (Phase 19)
        │   ├── StatusBadge.tsx MUI Chip, maps TaskStatus to label + color (Phase 13)
        │   ├── StatusBadge.test.tsx  one case per TaskStatus → label (Phase 19)
        │   ├── TaskTable.tsx   MUI Table, presentational; sortable headers, TablePagination
        │   │                    footer (Phase 15), Delete action added (Phase 16)
        │   ├── TaskTable.test.tsx  row rendering + due-date fallback, empty state, sort-header
        │   │                       click, the window.confirm delete gate, pagination click
        │   │                       (Phase 19)
        │   ├── TaskForm.tsx    React Hook Form + Yup, mirrors backend TaskRequest validation (Phase 14)
        │   ├── TaskForm.test.tsx  blank-title validation, a valid submission's exact payload,
        │   │                      edit-mode prefill from defaultValues (Phase 19)
        │   └── SearchBar.tsx   text search + status filter, presentational (Phase 15)
        └── pages/
            ├── LoginPage.tsx      RHF + Yup username/password form (Phase 17)
            ├── LoginPage.test.tsx  mocked useAuth inside MemoryRouter — validation, a
            │                        successful login's navigation to /, a failed login's
            │                        inline error (Phase 19)
            ├── RegisterPage.tsx   RHF + Yup username/password/confirm form, auto-logs-in
            │                       on success (Phase 17)
            ├── RegisterPage.test.tsx  short-password/mismatched-confirm validation, a
            │                           successful registration's navigation, a duplicate-
            │                           username server error shown inline (Phase 19)
            ├── TaskListPage.tsx   composes SearchBar + TaskTable; shows a spinner while
            │                       loading and an Alert on fetch/delete failure (Phase 16)
            ├── TaskFormPage.tsx   fetches the real task for edit mode, submits via the
            │                       real createTask/updateTask, shows a real 404 message
            │                       for an unknown id, an Alert on submit failure (Phase 16)
            └── AdminPage.tsx      Users table + all-tasks table (with ownerUsername),
                                     both with their own loading/error state; tasks table
                                     paginated via MUI TablePagination (Phase 18)
```

`TaskListPage`/`TaskFormPage`/`AdminPage`/`SearchBar` deliberately have no
dedicated test file (Phase 19) — they're thin containers/presentational
wrappers whose real logic already lives in, and is already covered by,
`useTasks.test.ts`/`TaskForm.test.tsx` (section 16 explains why, mirroring
the backend's own precedent of not separately unit-testing a DTO factory
method already exercised through its service test).

The backend now matches the structure originally planned back in Phase 1 in
full, plus the `user`/`security` packages Phase 17 added on top and the
`admin` package Phase 18 added on top of that. `frontend/`
now has a real routing + layout shell (Phase 12), a working task list with
search, filtering, sorting, and pagination (Phases 13, 15), a working
create/edit form (Phase 14), real API integration (Phase 16), and — as of
Phase 17 — **the whole app requires login**: every task is owned by exactly
one user, `TaskController`'s endpoints resolve the caller from the JWT, and
the frontend has real login/register pages, token storage, and route
guarding. The two apps have been genuinely integrated since Phase 16;
Phase 17 is the first time that integration includes identity. Phase 18
adds the first thing identity alone couldn't do: an ADMIN role that can see
every user's data through a dedicated `/admin` area, while every other
authenticated user's capabilities are completely unchanged. Phase 19 closes
the one gap the backend didn't share with the frontend since Phase 10: the
frontend now has its own permanent, real test suite (Vitest + React Testing
Library, 43 tests) covering the hooks/context/forms/route-guards that
carry actual logic, not just a scaffold. Phase 20 — the last phase on the
original roadmap (section 19) — containerizes both apps and, in doing so,
finally answers the frontend↔backend connection question section 16 left
open back in Phase 16: an nginx reverse proxy in front of the built
frontend, forwarding `/api` to the backend container, the same
proxy-not-CORS shape the Vite dev-server proxy already used, just served
by nginx instead of Vite in this containerized context.

**Planned** frontend structure still to come: nothing from the original
section 5 plan. All 20 phases in section 19 are now done — further work
would be a genuinely new phase, not one already named on this roadmap.

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
- **(Phase 17)** Every `TaskController` endpoint resolves the caller via
  `@AuthenticationPrincipal AppUserPrincipal principal` and passes
  `principal.getUser().getId()` into `TaskService` as an explicit `userId`
  parameter — controllers still never touch entities directly, and
  services still don't reference HTTP types; `userId` is just a `Long`,
  the same as any other service parameter. `TaskService`/`TaskRepository`
  reject cross-user access by returning "not found" (404), never a 403 —
  see section 16 for why.
- **(Phase 18)** Role-gated endpoints (currently just `/api/admin/**`) are
  authorized entirely at the URL-matcher level in `SecurityConfig`
  (`.requestMatchers("/api/admin/**").hasRole("ADMIN")`), not with
  per-method `@PreAuthorize`/`@Secured` annotations. `AdminController`
  itself contains no role-checking code at all — see section 16 for why a
  URL matcher was chosen over method security for this app's one
  admin-gated area.

## 9. Frontend conventions

- All HTTP calls go through `api/`, typed against `types/` — components
  never import Axios directly.
- List-level state (fetch, search, filter, sort, pagination) is centralized
  in a custom hook (`useTasks`), not duplicated per component.
- Forms use React Hook Form for state/submission and Yup for schema
  validation, mirroring backend Bean Validation constraints.
- Routing lives in `App.tsx` via React Router; pages are route-level
  containers, components are presentational/reusable.
- No global state library — local/component and hook state only. **(Phase
  17 clarification)** Auth state (current username, whether logged in) is
  the one piece of state genuinely global to the whole app — a plain React
  Context (`contexts/AuthContext.tsx`) covers this without reaching for
  Redux/Zustand; still not a "state management library" in the sense this
  bullet rules out.
- **(Phase 17)** All authenticated HTTP calls carry a JWT automatically via
  an Axios request interceptor in `api/client.ts` — no page or component
  attaches the `Authorization` header itself.
- **(Phase 18)** Route-level authorization (not just authentication) uses a
  second guard component, `AdminRoute`, separate from `ProtectedRoute`:
  `ProtectedRoute` answers "are you logged in" (redirects to `/login`),
  `AdminRoute` answers "are you allowed here" (redirects to `/`) — the same
  401-vs-403 split the backend makes (section 13). `AuthContext` exposes a
  derived `isAdmin` boolean (`role === 'ADMIN'`) that both `AdminRoute` and
  `Layout`'s conditional "Admin" nav link read.

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

**Implemented** (Phase 17): the app now requires login. `contexts/
AuthContext.tsx` (`AuthProvider` + `useAuth()`) holds `username` and
derives `isAuthenticated` from whether a token is present, persisting both
to `localStorage` so a page refresh doesn't force a re-login.
`components/ProtectedRoute.tsx` wraps the task routes in `App.tsx` and
redirects to `/login` when `isAuthenticated` is false; `/login` and
`/register` are the only public routes. `api/client.ts` gained a request
interceptor that attaches `Authorization: Bearer <token>` to every call,
and a response interceptor that reacts to any 401 from a non-`/auth/*`
endpoint by clearing the stored token and hard-redirecting to `/login`
(`window.location.assign`, not a React Router navigate — see section 16).
`pages/LoginPage.tsx` and `pages/RegisterPage.tsx` are RHF + Yup forms,
consistent with `TaskForm`'s existing pattern; registration auto-logs the
user in on success (the backend's `/register` response has the same
`{token, username}` shape as `/login`). `Layout`'s `AppBar` now shows the
current username and a working Logout button. Verified in a real browser
against the real backend: registering a new account auto-logged in and
landed on an empty task list (correct — brand-new account, no tasks yet);
logging out cleared the token and redirected to `/login`; logging in with
a wrong password showed "Invalid username or password" without
navigating away; and corrupting the stored token and reloading correctly
triggered the global-401 path (backend 401 → token cleared → redirected
to `/login`), not a crash.

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
- **Implemented** (Phase 17): `/api/tasks/**` now requires a valid JWT —
  every endpoint above is unchanged in shape, but each one resolves the
  caller from the token and scopes to that user's own tasks (section 15).
  Two new public (unauthenticated) endpoints: `POST /api/auth/login`
  (`{username, password}` → `200 {token, username, role}`, `401` on bad
  credentials) and `POST /api/auth/register` (`{username, password}` →
  `201 {token, username, role}` — same response shape as login, since
  registering also logs you in; `409` if the username is taken, `400` on
  a too-short password). Both live outside `/api/tasks`, so they don't
  collide with this section's "Base path: `/api/tasks`" scope.
- **Implemented** (Phase 18): a new `/api/admin` base path, every endpoint
  under it requiring the `ADMIN` role (`403` otherwise, `401` with no
  token — section 13). `GET /api/admin/tasks` — every task from every
  user, paginated the same way as `GET /api/tasks` (`page`/`size`, default
  size 20), but each item is an `AdminTaskResponse` (adds `ownerUsername`
  on top of the regular task fields) rather than a `TaskResponse`. `GET
  /api/admin/users` — every user's `{id, username, role}` (never the
  password hash), not paginated (the user table is small enough at this
  app's scale that pagination would be premature — revisit if that stops
  being true). Both are read-only; there is no admin endpoint yet to
  promote/demote a user's role or to edit/delete another user's task —
  see section 18.

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
| user_id | BIGINT | NOT NULL, FK → `users.id` (Phase 17) |
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
  first-class, frequent query pattern. An index on `user_id`
  (`idx_tasks_user_id`, Phase 17) for the same reason — every single query
  against `tasks` is now scoped by user. `due_date`/`created_at` are not
  indexed yet — fine at this data volume, revisit if the table grows large.
- `created_at`/`updated_at` are set via Hibernate's `@CreationTimestamp`/
  `@UpdateTimestamp` entity annotations, not manual `@PrePersist`/
  `@PreUpdate` callbacks.

**Implemented** (Phase 17): `V2__create_users_table.sql` adds a `users`
table —

| Column | Type | Notes |
|---|---|---|
| id | BIGINT | PK, generated |
| username | VARCHAR(50) | NOT NULL, unique (`idx_users_username`) |
| password | VARCHAR(255) | NOT NULL — a bcrypt hash, never the raw password |
| role | VARCHAR(20) | NOT NULL, default `'USER'` (added by `V5`, Phase 18) |

`V3__add_user_id_to_tasks.sql` then adds `tasks.user_id` as `NOT NULL`
directly (no nullable-then-backfill two-step) — safe because the `tasks`
table was genuinely empty in this dev database when the migration was
written (confirmed, not assumed); a production migration against a
populated table would need a backfill step first. `V4__seed_demo_users.sql`
inserts two demo accounts, `alice`/`bob`, both password `password123`,
hashed with Spring Security's `BCryptPasswordEncoder` (the hash strings
were generated via a throwaway JUnit test — same "write a test, run it,
delete it" pattern as every other pre-Phase-10 verification in this
project, section 14). `Task.user` is a `@ManyToOne(fetch = FetchType.LAZY,
optional = false)` to the new `User` entity, matching this table's
`NOT NULL` FK.

**Implemented** (Phase 18): `V5__add_role_to_users.sql` adds `users.role`
(`VARCHAR(20) NOT NULL DEFAULT 'USER'` — plain `VARCHAR` +
`@Enumerated(EnumType.STRING)`, the same pattern already used for
`tasks.status`/`priority` rather than a native Postgres enum type, for the
same evolvability reason, section 16) and promotes the existing seeded
`alice` account to `ADMIN` in the same migration, rather than seeding a
third throwaway demo user — reusing existing seed data is the same pattern
`SecurityIntegrationTest` already follows (section 14).

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

**Implemented** (Phase 17, auth): `RegisterRequest` (backend) —
`@NotBlank @Size(max = 50) username` (matches the `users.username`
column's `VARCHAR(50)` — prevents a truncation-driven 500 rather than a
clean validation 400), `@NotBlank @Size(min = 6) password`. Mirrored on
the frontend in `RegisterPage`'s Yup schema, plus a `confirmPassword`
field (`.oneOf([yup.ref('password')])`) that has no backend equivalent —
it's pure client-side UX (catching a typo before submission), not a
constraint the server needs to enforce or even receive. `LoginRequest` is
deliberately minimal — `@NotBlank username`/`@NotBlank password` only, no
`@Size` — login should reject "blank" the same way it always would, but
adding a `min` length to login specifically would leak information about
the password policy to anyone probing the login endpoint (register is
naturally the place that reveals the policy, since you must satisfy it to
create an account there).

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
- **Implemented** (Phase 17): two more `ApiExceptionHandler` mappings —
  Spring Security's `AuthenticationException` → 401 (`"Invalid username or
  password"`, deliberately generic — doesn't reveal whether the username
  exists), and the new `UsernameAlreadyExistsException` → 409 (`"Username
  '...' is already taken"`). Both still return the same `ErrorResponse`
  shape as every other error in the app — auth errors aren't a special
  case at the JSON level. A 401 that happens *before* a request reaches
  `TaskController` at all (missing/invalid JWT on a protected endpoint) is
  handled differently — by `CustomAuthenticationEntryPoint`, not
  `ApiExceptionHandler` — since `@RestControllerAdvice` only intercepts
  exceptions thrown from controller methods; Spring Security's filter
  chain rejects unauthenticated requests earlier than that. Both paths are
  written to produce the *same* `ErrorResponse` JSON shape regardless, so
  the frontend's `getErrorMessage` helper doesn't need to know which one
  fired.
- **Implemented** (Phase 18): a `CustomAccessDeniedHandler` (`AccessDeniedHandler`)
  is the 403 counterpart to `CustomAuthenticationEntryPoint`'s 401 — same
  `ErrorResponse` shape, registered the same way
  (`.exceptionHandling(ex -> ex.authenticationEntryPoint(...).accessDeniedHandler(...))`
  in `SecurityConfig`). It fires when an authenticated caller without the
  `ADMIN` role hits `/api/admin/**` — a genuinely different situation from
  this app's other near-403 case (section 16's 404-not-403 choice for
  cross-user task access): there, hiding a resource's existence from an
  unauthorized caller is the point; here, "you're not an admin" leaks
  nothing sensitive about any specific resource, so a real 403 is the
  correct, more informative response. Like `CustomAuthenticationEntryPoint`,
  this fires from the security filter chain *before* a request reaches any
  controller, so `ApiExceptionHandler`'s `@RestControllerAdvice` never sees
  it — there is no `AccessDeniedException` handler there, and none is
  needed, since this app uses URL-matcher authorization (section 8) rather
  than `@PreAuthorize`, which is the only way `AccessDeniedException` could
  otherwise originate from inside a controller method.

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
  library is currently in the frontend stack. (Superseded by Phase 19,
  further down this section — Vitest was the eventual choice.)
- **Implemented** (Phase 17): all three existing test classes were updated
  for per-user scoping (every `TaskService`/`TaskRepository` call now
  takes a `userId`), and a new permanent class,
  `security/SecurityIntegrationTest.java`, was added —
  `@SpringBootTest` + `@AutoConfigureMockMvc` + `@Transactional`, the same
  "real Postgres, auto-rolled-back" pattern as `TaskRepositoryTest`, but
  driving full HTTP requests (`MockMvc`) through the *real* Spring
  Security filter chain rather than mocking it. Covers: login success/bad
  password/unknown username, `/api/tasks` requiring auth (401 with no
  token, 200 with a valid one), registration success/duplicate
  username/short password, login-immediately-after-registering, and —
  the one that actually matters most — that `alice` creating a task never
  makes it visible to `bob`. Reuses the migration-seeded `alice`/`bob`
  accounts directly rather than creating throwaway users, which
  incidentally also exercises the real seed data on every test run. All
  33 tests (up from 21) pass via `mvn test`. A real gotcha hit and fixed
  along the way — see section 16, `@WebMvcTest` + `@AuthenticationPrincipal`.
- **Implemented** (Phase 18): a new `admin/AdminControllerTest.java`
  (`@WebMvcTest(AdminController.class)`), following the exact same
  `@Import({SecurityConfig.class, CustomAuthenticationEntryPoint.class,
  CustomAccessDeniedHandler.class})` pattern as `TaskControllerTest` (all
  three imports are required now — omitting `CustomAccessDeniedHandler`
  from the slice throws a `NoSuchBeanDefinitionException` at context
  startup, since `SecurityConfig`'s constructor needs it; caught this by
  actually running the suite after adding the class, not assumed). Its
  `authed(...)` helper builds an `Authentication` with a real
  `ROLE_ADMIN`/`ROLE_USER` `GrantedAuthority` (unlike
  `TaskControllerTest`'s, which always passes an empty authority list,
  since ownership there never depended on roles) — covers admin-succeeds,
  regular-user-gets-403, and unauthenticated-gets-401 for both admin
  endpoints. `SecurityIntegrationTest` also gained real end-to-end
  coverage against the actual filter chain: login response includes the
  correct `role` for both `alice` (`ADMIN`) and `bob` (`USER`),
  self-registered accounts default to `USER`, `alice` can hit both admin
  endpoints, `bob` gets a real 403 from both. All 43 tests (up from 33)
  pass via `mvn test`.
- **Implemented** (Phase 19): the frontend gap noted above is closed. Vitest
  + React Testing Library, run via `npm test` (`vitest run` — a single
  non-watch pass, mirroring `mvn test`'s own single-run character; `npx
  vitest` still works directly for a watch-mode loop during development).
  10 test files, 43 tests, organized by the same principle as the
  backend's three-tier split (section 14 above) — test the layer that
  actually carries logic, at the level that layer naturally operates:
  - `hooks/useTasks.test.ts` — the frontend's closest equivalent to a
    service-layer unit test: `api/tasks` mocked via `vi.mock`, so no real
    network/backend involved. Covers the initial fetch, the 300ms search
    debounce (`vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync`),
    `toggleSort`'s flip-vs-reset behavior, `setStatus`/`toggleSort`
    resetting `page` to 0, `removeTask`'s delete-then-refetch, both error
    paths, and — the one test that exists specifically to protect a
    documented architectural decision — that a stale, slow-to-resolve
    request can't clobber a newer one's data (the `cancelled` guard,
    section 16).
  - `contexts/AuthContext.test.tsx` — `renderHook` + a mocked `api/auth`;
    covers login/register/logout state transitions, `localStorage`
    persistence, `isAdmin` derivation for both roles, a fresh mount
    picking up an already-stored session (refresh persistence), and
    `useAuth()` throwing outside a provider.
  - `api/client.test.ts` — `getErrorMessage` in isolation (backend-message
    extraction vs. every fallback case), using a plain duck-typed
    `{isAxiosError: true, ...}` object rather than a real Axios error,
    since `axios.isAxiosError` only checks that one flag.
  - `components/TaskForm.test.tsx`, `pages/LoginPage.test.tsx`,
    `pages/RegisterPage.test.tsx` — the form-validation layer, RTL-rendered
    with real user interaction (`@testing-library/user-event`) rather than
    calling Yup directly, so what's actually verified is the full
    RHF+Yup+MUI wiring, the same "verify the real integration, not just
    the library" discipline the backend applies to Bean Validation
    (section 14 above).
  - `components/ProtectedRoute.test.tsx`, `components/AdminRoute.test.tsx`
    — a mocked `useAuth` in a `MemoryRouter`, confirming each guard
    redirects to the *right* place (`/login` vs. `/`, section 16) rather
    than just "redirects somewhere."
  - `components/TaskTable.test.tsx`, `components/StatusBadge.test.tsx` —
    the interactive/mapping presentational layer: sort-header clicks,
    the `window.confirm` delete gate, pagination clicks, and the
    `TaskStatus`→label mapping.
  - Deliberately not given a dedicated test: `TaskListPage`/
    `TaskFormPage`/`AdminPage` (thin containers — their real logic is
    `useTasks`'s/`TaskForm`'s, already covered) and `SearchBar` (two
    controlled inputs with no logic of its own beyond prop delegation) —
    see section 16 for the reasoning and its backend precedent.
  - `TaskForm.test.tsx` deliberately never opens the MUI `Select` for
    `status`/`priority` (clicking to open its popup and choosing an
    option is real but brittle under jsdom); every test either accepts
    the form's own defaults or asserts a *rendered* prefilled value
    instead of driving a selection through the popup.
  - `npm run build` (`tsc -b`) type-checks test files too, since they live
    under `src/` alongside the app code (`tsconfig.app.json`'s `include`)
    — confirmed clean, not assumed. `npm run lint` (oxlint) also covers
    them; no new warnings from the new files.

## 15. Security conventions

**Implemented** (Phase 17): Spring Security 7.1 + a custom JWT filter,
replacing what was previously just a plan. Every endpoint under
`/api/tasks/**` requires a valid `Authorization: Bearer <token>` header;
`/api/auth/login` and `/api/auth/register` are the only public endpoints.
Sessions are stateless (`SessionCreationPolicy.STATELESS`) — no server-side
session state, no CSRF token (CSRF protection only matters for
cookie-based session auth; disabled deliberately, not by oversight, since
this API accepts no cookies at all).

- **Authentication**: `POST /api/auth/login` validates credentials via
  Spring Security's `AuthenticationManager` (which delegates to
  `CustomUserDetailsService` + the registered `BCryptPasswordEncoder`) and
  issues an HMAC-signed JWT (`JwtService`, JJWT 0.12.6) with the username
  as subject and a 1-hour expiration (`app.jwt.expiration-ms`,
  `application.yml`). `signWith(key)` auto-selects HS256/HS384/HS512 based
  on the signing key's byte length (JJWT 0.12.x behavior) rather than the
  app pinning one explicitly — the local dev default secret's length
  yields HS512, while the shorter (but still ≥256-bit) placeholder the
  Docker deployment's `docker-compose.yml` falls back to yields HS384;
  both are valid, secure choices for their respective key lengths (section
  16 has the real `WeakKeyException` this surfaced while wiring up Phase 20).
  `app.jwt.secret` is overridable via the `APP_JWT_SECRET` env var (Phase
  20) — the committed `application.yml` default remains fine for local,
  non-containerized dev, but `docker-compose.yml` sets its own via
  `APP_JWT_SECRET`, and a real deployment should set one explicitly rather
  than trust either default (section 18).
  `POST /api/auth/register` creates a new `User` (bcrypt-hashed password)
  and returns the same `{token, username, role}` shape — registering logs
  you in immediately, no separate login step required; self-registered
  accounts always get the default `USER` role (section 16 — there is no
  way to self-register as an admin).
- **Authorization model** (per-user ownership, Phase 17; role-based on top
  of it, Phase 18): every task still belongs to exactly one `User`
  (section 11), every `TaskService` method still takes the caller's
  `userId`, and every query is still scoped by it (section 8) — none of
  that changed. What Phase 18 adds is a second, orthogonal axis: every
  `User` also has a `Role` (`USER` or `ADMIN`, section 11),
  `AppUserPrincipal.getAuthorities()` now returns a single
  `ROLE_<name>` `GrantedAuthority` derived from it (no longer always
  empty), and `SecurityConfig` gates `/api/admin/**` on `hasRole("ADMIN")`.
  The two axes don't interact: an admin's *own* tasks are still reached
  through the regular per-user-scoped `/api/tasks` endpoints exactly like
  any other user's; `/api/admin/**` is a separate, additional capability
  layered on top for seeing *everyone's* data, not a replacement for or a
  bypass of per-user scoping. Accessing another user's task by id through
  `/api/tasks/{id}` still returns 404, not 403 (section 8, unchanged by
  this phase) — that's a different situation from an admin-gate denial,
  which *does* return a real 403 (section 13's `CustomAccessDeniedHandler`)
  since there's nothing sensitive to hide about "you're not an admin."
- **User provisioning**: two demo accounts are seeded via migration
  (`alice`/`bob`, both password `password123` — section 11; `alice`
  promoted to `ADMIN` in Phase 18's `V5` migration, `bob` remains a plain
  `USER`), *and* (per an explicit, later instruction expanding Phase 17's
  scope) self-service registration is open to anyone at `/register` — no
  invite code, no email verification, no admin approval, and always
  `USER` role (there is currently no way for anyone, including an admin,
  to promote another user to `ADMIN` through the app itself — section 18).
  Fine for a learning project; a real-world deployment would want at
  least email verification before Phase 20's deployment question is
  answered.
- **Token storage (frontend)**: `localStorage`, not an httpOnly cookie.
  The tradeoff is real — `localStorage` is readable by any script running
  on the page (XSS risk), whereas an httpOnly cookie isn't, but a cookie
  would need CSRF protection reintroduced and a same-site/cross-site
  cookie policy decided (complicated by Vite's dev-proxy-vs-production
  question already open per section 16/18). `localStorage` was chosen as
  the simpler mechanism appropriate for this app's current threat model —
  worth revisiting if this app ever handles real user data. Phase 18 adds
  `role` alongside `token`/`username` in the same storage, read the same
  way (section 16 has a gotcha worth knowing about this if a session was
  already logged in before this phase shipped).
- Roles are assigned once (at seed time or registration) and only change
  via a direct migration/DB edit — there is no admin UI or endpoint to
  change a user's role, and no re-authentication-on-role-change flow. A
  role change would only take effect on that user's *next* login anyway
  (the JWT doesn't carry the role — section 16 explains why), so revoking
  or granting admin access to an already-logged-in user isn't instant.

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
- **Per-user task ownership chosen over keeping a single shared list**
  (Phase 17): CLAUDE.md itself was internally inconsistent going into this
  phase — section 2 said "no multi-tenancy... in scope," while sections
  11/18 both said the globally-visible-tasks state held "until Phase 17,"
  implying the opposite. Rather than guess, this was put to the user
  directly as an explicit choice, and the user chose per-user ownership.
  This is recorded here specifically *because* it reverses what section 2
  used to say — a genuine plan change, not an oversight, the same
  category of correction as the Phase 15 `SAMPLE_TASKS`-growth note above.
- **`jjwt-gson` chosen over `jjwt-jackson`** for JJWT's JSON module: this
  project already has a real, documented Jackson-3-vs-Jackson-2 conflict
  history (section 3, Phase 8) — `jjwt-jackson` pulls in classic Jackson 2
  as a transitive dependency, which would sit alongside
  `spring-boot-starter-jackson`'s Jackson 3 in the same classpath.
  `jjwt-gson` sidesteps the whole question by depending on Gson instead,
  which has zero relationship to either Jackson line. Confirmed via `mvn
  dependency:tree` that only `com.google.code.gson:gson` is pulled in, no
  `com.fasterxml.jackson.databind` — not assumed.
- **`spring-security-test` resolves with no explicit version, unlike the
  per-feature `spring-boot-starter-*-test` artifacts** (Phase 17): Boot
  4.1's aggressive test-starter-splitting pattern (section 3, Phase 2) —
  `spring-boot-starter-data-jpa-test`, `-webmvc-test`, etc. — does **not**
  extend to Spring Security; its test support (`@WithMockUser`,
  `SecurityMockMvcRequestPostProcessors`, ...) still ships as the classic
  `org.springframework.security:spring-security-test` artifact, version
  managed by Boot's parent BOM same as `postgresql`. Confirmed by adding
  it with no version and a successful build, not guessed from an old
  tutorial.
- **A real, non-obvious gotcha: `@WebMvcTest` + `@AuthenticationPrincipal`
  silently resolves to a broken object instead of failing loudly** (Phase
  17, `TaskControllerTest`). The failure mode, in order of what was tried:
  1. With no security wiring at all in the slice, `@AuthenticationPrincipal
     AppUserPrincipal principal` resolved to a **non-null `AppUserPrincipal`
     with a `null` internal `user` field** — not `null`, not a
     `ClassCastException`. Root cause: `@WebMvcTest`'s allowlist includes
     `Filter` beans (so `JwtAuthenticationFilter` gets swept in) but *not*
     plain `@Component`/`@Service` beans, and — critically — it also
     doesn't pull in `@EnableWebSecurity` (`SecurityConfig` lives outside
     the slice), so Spring Security's own `AuthenticationPrincipalArgumentResolver`
     never gets registered. Spring MVC then falls back to its generic
     model-attribute binder for the unrecognized `@AuthenticationPrincipal`
     parameter, which allocates an `AppUserPrincipal` via reflection
     (bypassing the constructor entirely) rather than failing — leaving
     every field, including the `final user` field, at its default `null`.
  2. Manually registering `AuthenticationPrincipalArgumentResolver` as a
     bean via a nested `@TestConfiguration` did **not** fix it — the
     resolver requires `SecurityContextHolder.getContext().getAuthentication()`
     to be non-null, and that still wasn't being populated.
  3. `@Import(SecurityConfig.class)` (plus `CustomAuthenticationEntryPoint`,
     plus `@MockitoBean` stand-ins for `JwtService`/`CustomUserDetailsService`
     so `SecurityConfig`'s constructor resolves) correctly registered the
     real resolver via `@EnableWebSecurity`'s side effects — but paired
     with `@AutoConfigureMockMvc(addFilters = false)` (added earlier to
     avoid dealing with the real filter chain), the resolver now correctly
     returned `null` for an unauthenticated request... but also for a
     request carrying `SecurityMockMvcRequestPostProcessors.authentication(...)`.
     Root cause: that post-processor's mechanism for propagating a test
     `Authentication` into the real `SecurityContextHolder` depends on
     Spring Security's own `SecurityContextHolderFilter` actually running
     as part of the chain — which `addFilters = false` prevents.
  4. **Fix**: `@Import({SecurityConfig.class, CustomAuthenticationEntryPoint.class})`
     with `addFilters` left at its default (`true`). The real filter chain
     now runs, but since every test request goes through an `authed(...)`
     helper that already attaches a valid principal via the post-processor,
     `JwtAuthenticationFilter` has no `Authorization` header to act on and
     never touches the context — confirmed via a temporary debug
     `System.out.println` of `principal` and `SecurityContextHolder`
     inside the controller at each step above, not guessed. Worth
     remembering for any future `@WebMvcTest` covering a secured
     controller: importing the real `@EnableWebSecurity` config is
     necessary for `@AuthenticationPrincipal` to resolve *at all* in this
     slice, and disabling filters is the wrong lever if the test also
     needs `SecurityContextHolder` populated by a request post-processor.
- **`AppUserPrincipal` wraps the real `User` entity instead of using
  Spring Security's built-in `org.springframework.security.core.userdetails.User`**:
  `TaskController` needs the caller's database id to scope every query
  (section 8), and looking that up a second time from the username inside
  every controller method (or duplicating it into `TaskService`) would be
  wasted work when `CustomUserDetailsService` already loaded the full
  entity once, during authentication. Wrapping it in a `UserDetails`
  implementation instead means `principal.getUser().getId()` is free —
  no extra query, no extra dependency.
- **`AppUserPrincipal.getAuthorities()` always returns an empty list**:
  there are no roles yet (Phase 18's job — section 15). Returning an empty
  `List.of()` rather than inventing a placeholder authority (like a
  universal `"USER"` role no code actually checks) avoids implying a
  permission model exists before it does.
- **404, not 403, for another user's task** (section 15): a deliberate
  choice, not a gap — confirmed both empirically (`TaskRepositoryTest`'s
  `findByIdAndUserIdReturnsEmptyForAnotherUsersTask`,
  `SecurityIntegrationTest`'s `usersCannotSeeEachOthersTasks`) and as a
  matter of security practice: a 403 would confirm to an attacker that a
  given task id exists and belongs to *someone*, just not them; 404 leaks
  nothing beyond "you can't see this," identical to the id not existing
  at all.
- **JWT stored in `localStorage`, read via a module-level variable in
  `api/client.ts` rather than React state directly**: the Axios instance
  is a module-level singleton created outside any component, so it can't
  call `useContext`. `getToken()`/`setToken()` are the seam — `AuthContext`
  calls `setToken()` on login/register/logout (which updates both the
  module variable *and* `localStorage`) and separately keeps its own
  React state for `isAuthenticated`/`username` so components re-render
  correctly; the Axios request interceptor reads the module variable
  directly on every outgoing request. Two sources of truth for the same
  value (module variable + React state) sounds redundant but each serves
  a distinct consumer that can't reach the other (Axios can't `useContext`;
  React needs re-renders, not a plain variable read).
- **Global 401 handling redirects via `window.location.assign`, not React
  Router's `navigate()`**: the Axios response interceptor lives outside
  any component and has no access to a router `navigate` function (that
  only exists inside components rendered under `<BrowserRouter>`). A full
  page reload is an acceptable cost for "your session is no longer valid,
  please log in again" — simpler than wiring a pub-sub event from the
  interceptor back into a component just to call `navigate()` reactively.
  Explicitly excludes `/auth/*` requests from this handling — a wrong
  password on the login form itself returns 401 too, and that failure
  belongs to `LoginPage`'s own `catch` block, not a global logout-redirect
  (which would just bounce the user back to the page they're already on).
- **No fieldErrors-to-form-field mapping for login/register either**,
  consistent with the same decision already made for `TaskForm` (section
  16): both pages show the server's `message` in a generic `Alert` on
  failure. Registration's Yup schema mirrors the backend's constraints
  exactly (username max length, password min length), so a request
  reaching the server with data it would reject is — as with `TaskForm`
  — practically unreachable through the actual UI; the realistic failures
  are network errors, backend down, and the one the client genuinely
  can't predict client-side (username already taken).
- **Registration deliberately reuses `LoginResponse`'s shape
  (`{token, username}`)** rather than introducing a `RegisterResponse`:
  the two endpoints return identically-shaped data for an identical
  reason — both hand the caller a usable session. Introducing a
  same-shaped twin type would be exactly the kind of premature
  abstraction section 7 rules against.
- **Self-service registration added mid-phase, expanding what Phase 17
  originally scoped**: the initial plan (confirmed via an explicit
  question to the user before building anything) was demo users seeded
  by migration only, no public sign-up — reasoning being that no phase in
  section 19's roadmap names a registration UI, and Phase 18 already
  implies roles exist without implying self-service accounts. The user
  then explicitly asked for registration to be added after the
  auth/ownership groundwork was already built and verified, so it was
  layered on top rather than reworking what already existed: a new
  `POST /api/auth/register` endpoint (reusing `AuthController`,
  `JwtService`, and the existing `PasswordEncoder` bean — no new
  infrastructure needed), a new `UsernameAlreadyExistsException` → 409
  mapping, and `RegisterPage`/`api/auth.ts`'s `register()` on the
  frontend. The pre-seeded `alice`/`bob` accounts remain and are still
  what `SecurityIntegrationTest` authenticates as — registration is
  additive, not a replacement for the seeded-demo-user approach.
- **`Role` is a plain Java enum + `VARCHAR` column** (`users.role`), not a
  native Postgres enum type — the same reasoning as `tasks.status`/
  `priority` (far easier to evolve via a Flyway migration than
  `ALTER TYPE ... ADD VALUE`), applied consistently rather than
  re-litigated for this phase.
- **The JWT itself does not carry the user's role as a claim** — only the
  username (`JwtService.generateToken`, unchanged since Phase 17).
  `AppUserPrincipal`/`CustomUserDetailsService` re-fetch the full `User`
  (role included) from the database on *every* authenticated request, the
  same way they already did before roles existed. The alternative —
  embedding `role` in the token — would save a lookup but means a role
  change (promote/demote) wouldn't take effect until the user's *next*
  login, since nothing currently invalidates an already-issued token
  (there's no refresh/revocation mechanism at all, section 18). Given this
  app already does a full `UserDetailsService` lookup per request (no
  session cache), keeping role out of the token costs nothing extra and
  keeps authorization data always-fresh — worth revisiting only if this
  app ever adds a stateless-token-validation path that skips the DB.
- **Frontend mirrors this JWT-doesn't-carry-role choice with its own
  caveat**: `role` is read from the *login/register response*, not
  decoded from the token, and persisted to `localStorage` the same way
  `username` already was (Phase 17). This means a browser session that
  was already logged in *before* Phase 18 shipped has no `role` in
  storage until its next login — `isAdmin` would read `false` for such a
  session even for `alice`. Not fixed with a migration/fallback fetch,
  since this is a local learning-project dev database with a handful of
  known accounts — logging out and back in clears it, and the existing
  1-hour token expiration (section 18) forces that within an hour anyway.
  Worth a real fix (e.g. a `GET /api/auth/me` the frontend could call
  once on load) if this pattern ever mattered in a real deployment.
- **URL-matcher authorization (`SecurityConfig`'s
  `.requestMatchers("/api/admin/**").hasRole("ADMIN")`) chosen over method
  security (`@EnableMethodSecurity` + `@PreAuthorize`/`@Secured` on
  `AdminController`'s methods)**: this app has exactly one admin-gated
  area, cleanly identified by a single URL prefix — a URL matcher is less
  machinery (no new annotation, no SpEL expressions to get right) for
  that one case. Method security would earn its keep once authorization
  rules stop lining up cleanly with URL prefixes (e.g. "only the task's
  owner or an admin can edit it," a per-resource rule rather than a
  per-endpoint one) — not needed yet, since every existing rule (section
  8's per-user ownership, this phase's per-role admin gate) already lines
  up with either "the caller's own userId" or "one URL prefix."
- **`AdminService.listAllTasks` needed `TaskRepository.findAll(Pageable)`
  overridden with `@EntityGraph(attributePaths = "user")`** rather than
  left as JpaRepository's inherited default: `Task.user` is
  `FetchType.LAZY` (section 11), and `AdminTaskResponse.from(Task)` reads
  `task.getUser().getUsername()` for every row in the page — without the
  entity graph, that's one extra `SELECT` per task (classic N+1), which
  the repository-level test-driving-database discipline established back
  in Phase 5 (the `CAST(:search AS string)` bug, section 16) made worth
  catching before it shipped rather than after. `@EntityGraph` was chosen
  over a hand-written `JOIN FETCH` JPQL query specifically because
  overriding a repository method Spring Data already provides needs only
  one annotation, no new query string to maintain.
- **`AdminTaskResponse`/`AdminUserResponse` are separate DTOs from
  `TaskResponse`/a hypothetical plain `User` projection**, not the
  existing types reused or extended: `AdminTaskResponse` needs
  `ownerUsername`, which `TaskResponse` has no reason to carry (a regular
  user already knows every task in their own list is theirs); returning
  the `User` entity directly for `/api/admin/users` would violate the
  DTOs-mandatory-at-the-controller-boundary rule (section 16) and risk
  leaking the password hash field if a future edit to `User` ever forgot
  to exclude it. Both live in a new `admin/dto/` package rather than
  `task/dto/`/`user/`, matching this app's feature-based packaging
  (section 16) — they belong to the admin feature, not to `task` or `user`.
- **`/api/admin/users` is not paginated**, unlike `/api/admin/tasks`: the
  user table only ever grows by explicit registration or migration seed,
  and is expected to stay small for a learning app — pagination now would
  be exactly the kind of premature abstraction section 7 warns against.
  Revisit if registration volume ever makes this listing large.
- **No admin UI/endpoint to promote or demote a user's role, or to
  edit/delete another user's task, exists yet** — Phase 18 is deliberately
  scoped to *read* access across all users' data (proving the
  authorization mechanism works end-to-end) rather than also building
  admin *write* capabilities, which no phase in section 19's roadmap
  names and which would meaningfully expand this phase's scope beyond
  "role-based authorization." `alice`'s `ADMIN` role was granted via the
  `V5` migration specifically because there is no other way to grant it
  yet.
- **Vitest chosen over Jest** (Phase 19): Vitest reuses the project's
  existing Vite transform pipeline directly — `vite.config.ts`'s `test`
  block (via `import { defineConfig } from 'vitest/config'`, a superset of
  Vite's own `defineConfig`) is the *only* config file, handling both the
  dev server and the test runner. Jest would need its own separate
  transform configuration (`ts-jest`/`babel-jest`) for the same
  TypeScript+JSX source Vite already knows how to handle, duplicating
  configuration for no benefit at this project's scale.
- **`@testing-library/jest-dom/vitest` subpath import**, not the classic
  `@testing-library/jest-dom` root import: the current package ships a
  Vitest-specific entry that both registers the runtime matchers
  (`toBeInTheDocument`, etc.) *and* supplies their Vitest `expect` type
  augmentation together, in one import, in `src/setupTests.ts`. The
  classic root import only registers the runtime matchers — using it here
  would leave `expect(...).toBeInTheDocument()` a type error even though
  it works at runtime, since nothing would tell TypeScript's `expect`
  signature this matcher exists.
- **`test.globals` left at its default (`false`)**, so every test file
  imports `describe`/`it`/`expect`/`vi` explicitly from `'vitest'` rather
  than relying on ambient globals: consistent with this codebase's style
  everywhere else (nothing else in the frontend relies on unimported
  globals), and avoids a `tsconfig` types-array edit
  (`"types": ["vitest/globals"]`) that `globals: true` would otherwise
  require. The one real cost of this choice: `@testing-library/react`'s
  auto-cleanup-after-each-test only self-registers when it can detect a
  global `afterEach` — with globals off, it silently doesn't run, and
  every test in a multi-test file after the first would see the *previous*
  test's rendered DOM still mounted (caught exactly this way: several
  `RegisterPage.test.tsx` tests failed with "found multiple elements"
  before this was diagnosed). Fixed by explicitly importing `afterEach`
  from `'vitest'` and `cleanup` from `'@testing-library/react'` in
  `setupTests.ts` and calling `cleanup()` there, once, for every test file
  — cheaper than adding `afterEach(cleanup)` boilerplate to all ten files.
- **A real Node-version gotcha, caught by actually running the suite, not
  assumed**: `jsdom` 27 (a `vitest`/`@testing-library/react` transitive
  dependency) pulls in `@asamuzakjp/css-color`, which requires
  `@csstools/css-calc`'s ESM-only build via `require(...)` — this throws
  `ERR_REQUIRE_ESM` on Node versions below what these packages declare in
  `engines` (Node `^20.19.0 || >=22.12.0`). This machine's default `node`
  on `PATH` resolves to a much older Node 14 (a pre-existing, unrelated
  environment quirk — section 3/16's Boot-version-surprise precedent, but
  for Node this time), and even deliberately selecting `nvm`'s Node
  `20.17.0` — used successfully for `npm run build`/`npm run dev` earlier
  in this project purely because those tools tolerate the gap with just a
  warning — is *still* one patch series short of `20.19.0` and hits this
  exact `ERR_REQUIRE_ESM` crash for `npm test` specifically. Node 24
  (`nvm`'s `24.14.0`) satisfies the requirement cleanly and is what
  actually runs `npm test` (and, going forward, `npm run build`/`npm run
  dev` too, to stay clear of the gap entirely) for this session. Worth
  remembering: passing engine warnings during `npm install`/`npm run
  build` don't guarantee every dependency's actual runtime code tolerates
  the shortfall — jsdom's ESM interop didn't, even though Vite/oxlint's own
  warnings looked identical in kind.
- **`react-hook-form`'s `handleSubmit(onSubmit)` invokes `onSubmit` as
  `(data, event)`, not just `(data)`** — `TaskForm`'s own `onSubmit` prop
  type only declares one parameter (accurate for how every real caller
  uses it, since none of them read a second argument), but a test spying
  on it with `vi.fn()` still receives both, so
  `toHaveBeenCalledWith(expect.objectContaining({...}))` failed until the
  assertion added a second `expect.anything()` to match the real call
  shape. `LoginPage`/`RegisterPage` aren't affected the same way — their
  own internal `onSubmit` functions call `login(...)`/`register(...)`
  manually with exactly the explicit arguments those functions need, so
  the mocked `login`/`register` never see RHF's extra `event` argument.
- **Test files are co-located as `Component.test.tsx` next to the source
  they test**, not gathered under a separate `__tests__/`/`tests/`
  directory: Vitest discovers colocated test files with no extra
  configuration, and keeping a component and its test in the same folder
  makes "does this have a test yet" visible while browsing `src/` — the
  same reasoning `TaskForm.tsx`/`TaskFormPage.tsx` already being
  discoverable side-by-side with the rest of their feature supports.
- **Whole modules mocked with `vi.mock` at the API-layer boundary**
  (`api/auth`, `api/tasks`, and — for component tests that consume it
  indirectly — `contexts/AuthContext` itself), never Axios directly: tests
  exercise real component/hook/context logic against a controlled,
  in-memory substitute for "the backend," the same boundary this app's
  own architecture already treats as the seam between UI and network
  (section 6/9) — mirrors the backend's own `@MockitoBean`-the-next-layer-
  down pattern in `TaskControllerTest` (mock `TaskService`, not
  `TaskRepository` or the database).
- **Navigation assertions use a real `MemoryRouter`+`Routes` pair rather
  than mocking `useNavigate`**: `LoginPage.test.tsx`/`RegisterPage.test.tsx`
  render a two-route `Routes` (the page under test, plus a `<div>Home
  page</div>` stand-in at `/`) and assert the stand-in's text appears
  after a successful submit — proving the *real* `useNavigate('/')` call
  actually changed the route, not just that some navigate-shaped function
  was called with the right argument. `ProtectedRoute.test.tsx`/
  `AdminRoute.test.tsx` use the same pattern (a route to redirect to, a
  route to redirect from) for the same reason.
- **The frontend↔backend production topology question (open since Phase
  16) is answered with an nginx reverse proxy, not backend CORS
  configuration or a shared origin behind an external gateway**: the
  containerized frontend (`frontend/Dockerfile`, `nginx.conf`) serves the
  built static files *and* forwards `/api/*` to the backend container by
  its Compose service name (`proxy_pass http://backend:8080`) — the exact
  same proxy-not-CORS shape Vite's dev-server proxy already used
  (`vite.config.ts`, section 16's earlier entry), just served by nginx
  instead of Vite. This is precisely why `api/client.ts`'s `baseURL: '/api'`
  being a *relative* path (a deliberate Phase 16 choice) paid off here: the
  exact same frontend code and build output works unchanged in both dev
  (behind Vite) and this containerized deployment (behind nginx) — nothing
  about the API layer needed to change for Phase 20 at all.
- **Two separate Docker Compose files, deliberately not merged into one**:
  `backend/docker-compose.yml` (Phase 3) runs a bare Postgres for
  *non-containerized* backend dev (`./mvnw spring-boot:run` against it
  directly) and is untouched; the new root `docker-compose.yml` (Phase 20)
  runs all three services fully containerized, for a different purpose
  (seeing/deploying the whole app in containers, not day-to-day backend
  development). Running both at once doesn't conflict: the root compose's
  Postgres has its own container, its own named volume
  (`taskmanager-full-pgdata`, distinct from `taskmanager-postgres-data`),
  and — deliberately — no host port mapping at all (see below), so there's
  no port collision with the dev-only Postgres's `5433`.
- **The full-stack compose's Postgres has no host port mapping**: only the
  backend container needs to reach it, over the Compose network's internal
  DNS (`postgres:5432`) — mirroring how a real deployment wouldn't expose
  its database to the outside world either. `backend`/`frontend` do map
  host ports (`8080`, `8081`) since those are the ones meant to be reached
  from outside the Compose network (direct API access for the former,
  the actual app for the latter).
- **A Postgres `healthcheck` + `depends_on: condition: service_healthy`
  for the backend service**, not a plain `depends_on: [postgres]`: Compose's
  plain `depends_on` only waits for the Postgres *container* to start, not
  for Postgres itself to be ready to accept connections — a well-known gap
  that would otherwise let the backend's first connection attempt race
  Postgres's own startup. The healthcheck (`pg_isready`) closes that gap;
  confirmed working in practice (`docker compose up -d` showed
  `postgres-1 Healthy` before `backend-1 Starting` in the log, not just
  assumed from reading the compose file).
- **Backend Docker build uses the official `maven:3.9-eclipse-temurin-21-alpine`
  image directly, not the committed `./mvnw` wrapper**: the wrapper's whole
  purpose is guaranteeing a consistent Maven version for *local* dev across
  different machines/OSes (this project's own `mvnw`/`mvnw.cmd` files) —
  but a Docker build stage is already that guaranteed-consistent,
  throwaway environment, so there's nothing left for the wrapper to
  protect against, and using the official image directly is simpler (no
  wrapper-script/permission-bit considerations to think about inside the
  container at all).
- **`mvn package -DskipTests` in the Docker build stage**: `TaskRepositoryTest`/
  `SecurityIntegrationTest` need a real Postgres connection, which doesn't
  exist yet during an isolated image build (no Compose network, no
  guaranteed build order) — and `mvn test` already runs as its own
  dedicated, well-documented step (section 14) against a real Postgres
  container, not something to silently re-run (and likely fail) inside a
  build stage that was never meant to prove test correctness in the first
  place. This mirrors a distinction the project already draws elsewhere:
  building an artifact and verifying it are different activities, done at
  different times with different tooling.
- **`APP_JWT_SECRET`'s Docker Compose default placeholder is a real,
  non-obvious `WeakKeyException` catch**: the first placeholder tried
  (`change-me-in-a-real-deployment`, 30 ASCII characters = 240 bits) failed
  the backend's own startup — `JwtService`'s `Keys.hmacShaKeyFor(...)`
  requires a key of at least 256 bits for any HMAC-SHA algorithm (RFC
  7518 §3.2), and `secret.getBytes(UTF_8)` uses the string's raw byte
  length directly, no hashing/stretching. Caught by actually running
  `docker compose up` and reading the resulting stack trace, not assumed
  correct from the compose file alone — the fix was simply a longer
  placeholder string (57 characters = 456 bits, comfortably over the
  minimum), documented inline in `docker-compose.yml` so a future edit to
  that default doesn't reintroduce the same failure silently.
- **Datasource credentials are overridden purely through Spring's
  implicit environment-variable property binding**
  (`SPRING_DATASOURCE_URL`/`_USERNAME`/`_PASSWORD` in `docker-compose.yml`
  relaxed-bind to `spring.datasource.url`/`username`/`password`), with
  *no* corresponding `${...}` placeholder added to `application.yml` —
  unlike `app.jwt.secret`, which did get an explicit `${APP_JWT_SECRET:...}`
  placeholder. The difference: section 18 already specifically called out
  the JWT secret as a committed-plaintext-secret problem worth surfacing
  directly in the config file itself; the datasource credentials had no
  equivalent flagged concern; and unlike the JWT secret's fixed
  local-dev-default value, the datasource URL genuinely needs to *differ*
  between local dev (`localhost:5433`) and the Compose network
  (`postgres:5432`) — the override isn't optional/for-production-only the
  way the JWT secret's is, it's required for the containerized backend to
  reach its Postgres at all, and Spring's environment variable precedence
  (env vars outrank `application.yml`) already handles that with zero file
  changes needed.

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
- **Phase 17 (Authentication with Spring Security + JWT) — done.** The
  biggest phase so far — the first to touch backend and frontend together
  since Phase 16, because adding auth to the API would otherwise have
  broken the already-working frontend built in Phases 11–16. Backend:
  `user`/`security` packages (section 5), `V2`–`V4` migrations adding a
  `users` table + `tasks.user_id` + two seeded demo accounts (section 11),
  `SecurityConfig` (stateless JWT filter chain), `JwtService` (JJWT
  0.12.6, `jjwt-gson`), `AppUserPrincipal`/`CustomUserDetailsService`,
  `CustomAuthenticationEntryPoint` (401s in the standard `ErrorResponse`
  shape), and `AuthController` (`POST /api/auth/login`,
  `POST /api/auth/register` — the latter added after an explicit follow-up
  request expanding this phase's original seeded-users-only scope, section
  16). Every `TaskService`/`TaskRepository` method is now user-scoped;
  cross-user access returns 404, not 403 (section 15). All three existing
  test classes were updated for the new signatures, plus a new permanent
  `SecurityIntegrationTest` (33 tests total, up from 21) — hit and fixed a
  real, non-obvious `@WebMvcTest` + `@AuthenticationPrincipal` gotcha along
  the way (section 16, worth reading before writing any future secured
  `@WebMvcTest`). Frontend: `contexts/AuthContext.tsx`
  (`AuthProvider`/`useAuth`), `components/ProtectedRoute.tsx`,
  `pages/LoginPage.tsx`/`RegisterPage.tsx` (RHF + Yup, matching `TaskForm`'s
  established pattern), and `api/client.ts` gaining request/response
  interceptors (auth header attachment, global 401 → logout redirect).
  Verified end-to-end against the real running stack, not mocked: `mvn
  test` (33/33 passing) and direct `curl` against the live backend
  (login/register/cross-user-isolation/401-without-token, section 16's
  logs) *before* touching the frontend, then the full browser flow
  (register → auto-login → empty list for a new account → logout → clears
  token, redirects to `/login` → wrong-password error shown inline → login
  as the seeded `alice` → corrupted/invalid token correctly triggers the
  global-401 redirect). Test data (`daniel`, curl-created tasks) was
  cleaned up afterward, leaving only the two seeded demo users.
- **Phase 18 (Role-based authorization) — done.** Backend: `user/Role.java`
  (enum `USER`/`ADMIN`), `users.role` column (`V5__add_role_to_users.sql`,
  promotes the seeded `alice` to `ADMIN`), `AppUserPrincipal.getAuthorities()`
  now derives a real `ROLE_*` authority from it, `SecurityConfig` gates a
  new `/api/admin/**` prefix on `hasRole("ADMIN")`, and a new
  `CustomAccessDeniedHandler` produces the standard `ErrorResponse` shape
  for the 403s that gate now produces (section 13). A new `admin` feature
  package (`AdminController`, `AdminService`, `admin/dto/
  AdminTaskResponse`/`AdminUserResponse`) exposes two read-only endpoints:
  `GET /api/admin/tasks` (every user's tasks, paginated, each tagged with
  `ownerUsername`) and `GET /api/admin/users` (every user's `id`/
  `username`/`role`). `TaskRepository.findAll(Pageable)` was overridden
  with `@EntityGraph(attributePaths = "user")` to avoid an N+1 when the
  admin listing reads each task's lazy `user` association (section 16).
  `LoginResponse` gained a `role` field, returned by both `/login` and
  `/register` (self-registered accounts always default to `USER`). New
  `admin/AdminControllerTest` (`@WebMvcTest`, same security-slice-import
  pattern as `TaskControllerTest`) plus new `SecurityIntegrationTest`
  cases against the real filter chain — 43 tests total, up from 33.
  Frontend: `types/auth.ts` gained `Role`, `AuthContext` now tracks `role`
  and derives `isAdmin`, a new `AdminRoute` component (redirects to `/`
  rather than `/login` — the 403-equivalent, distinct from
  `ProtectedRoute`'s 401-equivalent), a new `AdminPage` (a users table and
  an all-tasks table, each with its own loading/error state, the tasks
  table paginated), `api/admin.ts`'s typed `listAllTasks`/`listAllUsers`,
  and `Layout`'s AppBar showing an "Admin" nav link only when `isAdmin`.
  Verified end-to-end against the real running stack: `mvn test` (43/43
  passing); direct `curl` confirming `alice` gets `role: "ADMIN"` from
  `/login`, `bob` gets `role: "USER"`, `alice` can read both admin
  endpoints, `bob` gets a real 403 (not a 404) from both, and a task
  created by `bob` shows up in `alice`'s admin tasks view correctly
  tagged `ownerUsername: "bob"`; then the full browser flow — logged in
  as `bob`, confirmed no "Admin" link renders and a direct visit to
  `/admin` redirects to `/`; logged in as `alice`, confirmed the "Admin"
  link renders, and `/admin` renders both tables with the correct data
  (including `bob`'s task appearing with the right owner and a correctly
  mapped status label). Test data was cleaned up afterward.
- **Phase 19 (Testing) — done.** Closed the one gap called out since Phase
  16/17 (section 18): the frontend had zero automated tests while the
  backend had 43. Installed Vitest 4.1 + `@testing-library/react` 16.3 +
  `@testing-library/jest-dom` 6.9 + `@testing-library/user-event` 14.6 +
  `jsdom` 27; `vite.config.ts` now builds its config via `import {
  defineConfig } from 'vitest/config'` with a `test: { environment:
  'jsdom', setupFiles: ['./src/setupTests.ts'] }` block, and
  `package.json` gained a `test` script (`vitest run`). Ten new test
  files, 43 tests total, organized by which layer actually carries logic
  (section 14 has the full breakdown): `useTasks.test.ts` (debounce,
  sort/status/page-reset, delete-refetch, both error paths, and a
  regression test for the `cancelled`-guard race — section 16),
  `AuthContext.test.tsx` (login/register/logout, `localStorage`
  persistence, `isAdmin` derivation, refresh-persistence, outside-provider
  throw), `client.test.ts` (`getErrorMessage`), `TaskForm.test.tsx`/
  `LoginPage.test.tsx`/`RegisterPage.test.tsx` (validation + real
  RHF+Yup+MUI submission flows), `ProtectedRoute.test.tsx`/
  `AdminRoute.test.tsx` (redirect-to-the-right-place, via real
  `MemoryRouter` navigation, not a mocked `navigate`), and
  `TaskTable.test.tsx`/`StatusBadge.test.tsx`. Deliberately not given a
  dedicated test: `TaskListPage`/`TaskFormPage`/`AdminPage`/`SearchBar`
  (thin containers/prop-delegation, already covered indirectly — section
  16). Caught and fixed two real issues empirically, not assumed: (1)
  `@testing-library/react`'s auto-cleanup silently doesn't run without
  `test.globals: true` (this project keeps globals off), which surfaced
  as cross-test DOM pollution in `RegisterPage.test.tsx` — fixed with an
  explicit `afterEach(cleanup)` in `setupTests.ts`; (2) `jsdom` 27's
  `ERR_REQUIRE_ESM` crash on any Node below `20.19.0`/`22.12.0` (ruled out
  `nvm`'s `20.17.0`, which had been fine for `npm run build`/`dev` up to
  this point — Node 24 is what actually ran the suite). Verified for
  real: `npm test` — **43/43 passing**; `npm run build` (`tsc -b` type-
  checks the new test files too, since they live under `src/`) and `npm
  run lint` (oxlint) both still pass clean, confirming the new test files
  don't regress either existing gate.
- **Phase 20 (Docker and deployment basics) — done.** The last phase on
  the original roadmap (section 19). Both apps are now containerized:
  `backend/Dockerfile` (multi-stage — `maven:3.9-eclipse-temurin-21-alpine`
  build, `eclipse-temurin:21-jre-alpine` run) and `frontend/Dockerfile`
  (multi-stage — `node:22-alpine` build, `nginx:alpine` serve, with
  `nginx.conf` reverse-proxying `/api` to the backend and falling back to
  `index.html` for client-side routes). A new root-level `docker-compose.yml`
  wires all three services (`postgres`, `backend`, `frontend`) together —
  distinct from and untouched by `backend/docker-compose.yml`'s existing
  local-dev-Postgres-only setup (section 16). `application.yml`'s
  `app.jwt.secret` gained an `${APP_JWT_SECRET:...}` env-var override,
  resolving the plaintext-committed-secret gap flagged since Phase 17
  (section 18); datasource credentials are overridden purely through
  Spring's existing environment-variable binding, no file change needed
  (section 16 explains the asymmetry). Verified for real, not assumed:
  `docker compose build` succeeded for both images; `docker compose up -d`
  brought up all three containers, with the Postgres healthcheck
  correctly gating backend startup; Flyway applied all five migrations
  automatically against the fresh containerized Postgres (confirmed via a
  real login as `alice` returning `role: "ADMIN"`); direct `curl` against
  the containerized backend (port 8080) and through the frontend's nginx
  proxy (port 8081) both worked identically; a real browser load of
  `http://localhost:8081` correctly redirected to `/login` (unauthenticated),
  and logging in as `alice` showed the task list with the "Admin" link —
  the whole app working end-to-end from nothing but `docker compose up
  --build`, no locally-run Postgres/Maven/npm involved at all. One real
  bug caught and fixed along the way: the Compose file's first JWT-secret
  placeholder was shorter than the 256-bit minimum any HMAC-SHA algorithm
  requires, and crashed the backend at startup (section 16,
  `WeakKeyException`). All 20 phases originally planned in section 19 are
  now done.

## 18. Known limitations

- No way to promote/demote a user's role, or for an admin to edit/delete
  another user's task, through the app itself — Phase 18 built read-only
  admin visibility across all users' data, not admin write capabilities
  (section 16). Today the only way to grant `ADMIN` is a direct migration
  or DB edit, which is how `alice` got it.
- A role change wouldn't take effect for an already-logged-in user until
  their next login (the JWT doesn't carry role — section 16) — no
  real-world impact yet since there's no way to change a role at runtime
  anyway (the limitation above), but worth remembering once one exists.
- A browser session logged in before Phase 18 shipped has no `role` in
  `localStorage` until its next login, so `isAdmin` reads `false` even for
  an admin account until they log in again (section 16) — a one-time,
  self-healing quirk of this specific migration, not an ongoing gap.
- No test coverage for `TaskListPage`/`TaskFormPage`/`AdminPage` as
  container components — a deliberate scope choice (section 16), since
  their own logic already lives in, and is covered by, `useTasks`/
  `TaskForm`'s tests, but it does mean a bug purely in how one of these
  pages *wires together* an already-tested hook/component (as opposed to
  a bug inside the hook/component itself) wouldn't be caught by the
  automated suite — only by the manual browser verification each phase
  already does.
- No end-to-end test tool (e.g. Playwright/Cypress) — the frontend's
  automated tests (Phase 19) are unit/component-level (Vitest + React
  Testing Library, against mocked API calls); real integration is still
  verified manually in a real browser against the real running backend
  each phase, not by an automated E2E suite. No phase in section 19 names
  one, and manual verification has caught every real end-to-end issue so
  far.
- No CI/CD — `docker compose build`/`up` (Phase 20) and `mvn test`/`npm
  test` are all run manually; nothing runs them automatically on a push
  or on a schedule. No phase in section 19 named this, and it's a natural
  next step beyond the original 20-phase roadmap, not a gap within it.
- No HTTPS/TLS termination anywhere in the Phase 20 setup — nginx serves
  plain HTTP on port 80/8081, and the backend's own embedded Tomcat serves
  plain HTTP on 8080. Fine for local `docker compose up` exploration, not
  acceptable for any real internet-facing deployment (which would
  typically terminate TLS at a load balancer/ingress in front of this
  same nginx container, not inside it).
- Single-host deployment only — one `docker compose up` on one machine,
  no orchestration (Kubernetes, Swarm), no horizontal scaling, no
  zero-downtime rolling deploys. Consistent with the phase's own "basics"
  framing (section 19) — a real production deployment would need at
  least one of these, but none was ever in scope here.
- The Docker Compose Postgres credentials default to the same
  `taskmanager`/`taskmanager` values as local dev unless `POSTGRES_PASSWORD`
  is set before `docker compose up` — nothing enforces that it's changed,
  and there's no `.env.example` file nudging a real deployment to set it
  (same underlying gap as the JWT secret bullet above, just for Postgres).
  Acceptable for local exploration (section 15's existing framing for
  demo credentials); a genuine deployment must set it explicitly.
- No image versioning/registry push — `docker compose build` always
  produces `:latest`-tagged local images; there's no tag scheme, no
  `docker push` to any registry, and so no way for a different machine to
  pull and run what was built here. Fine for local `docker compose up`,
  not sufficient for deploying to any other host.
- No frontend state-management library — acceptable at this app's size,
  would need revisiting if the app grew significantly.
- No per-field server-validation-error mapping in `TaskForm`/`LoginPage`/
  `RegisterPage` (section 16) — acceptable because the frontend's Yup
  schemas already mirror every backend constraint, making the gap
  practically unreachable through the UI, but worth knowing if backend
  validation ever adds a rule the frontend doesn't mirror.
- No token refresh — a JWT is valid for a fixed 1 hour
  (`app.jwt.expiration-ms`), then the user is logged out (via the global
  401 handler, section 16) and must log in again. No refresh-token flow
  exists; acceptable for a learning app, a real deployment would want one.
- No rate-limiting on `/api/auth/login` or `/api/auth/register` — nothing
  stops repeated login attempts or mass account creation. Out of scope for
  this project's learning goals but a real gap for anything internet-facing.
- No password reset / email verification — registration takes any
  username/password with no way to recover a forgotten password. Consistent
  with section 15's "fine for a learning project" framing for self-service
  registration.
- **(Partially resolved, Phase 20)** `application.yml`'s JWT secret is
  still a plaintext string committed to the repo, but it's now only the
  *local-dev fallback* — `app.jwt.secret: ${APP_JWT_SECRET:...}` means an
  `APP_JWT_SECRET` env var overrides it, and `docker-compose.yml` sets one
  (still a committed placeholder, not a secret store — same underlying
  gap as the Postgres-credentials bullet earlier in this section). A real
  deployment still needs to set its own `APP_JWT_SECRET` explicitly;
  nothing enforces that it does.

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
17. Authentication with Spring Security + JWT — done
18. Role-based authorization — done
19. Testing — done
20. Docker and deployment basics — done
