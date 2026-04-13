# Todo Slice B Design

## Scope

This document fixes the first implementation slice for the Simple Todo App.

Included in this slice:

- DB schema for `todos`
- `TodoRepository`
- `GET /api/todos`
- `POST /api/todos`
- top page list view
- create form

Excluded from this slice:

- `GET /api/todos/:id`
- `PUT /api/todos/:id`
- `DELETE /api/todos/:id`
- edit page
- status toggle from list
- filter and search UI

## Goal

Deliver the smallest vertical slice that persists todos in Neon, returns them through the API, and lets the user see and create todos from the top page.

After this slice, stop for:

- manual check
- light code review
- decision before continuing to CRUD

## Architecture

Adopt an API-first flow.

- UI calls `GET /api/todos` to render the list.
- UI calls `POST /api/todos` to create a todo.
- Route Handlers delegate DB access to `TodoRepository`.
- Repository is the only layer that knows SQL and snake_case columns.
- JSON uses camelCase. DB uses snake_case.

## Files

- `app/api/todos/route.ts`
- `app/page.tsx`
- `components/todo-app.tsx`
- `components/todo-form.tsx`
- `lib/db.ts`
- `lib/todo-repository.ts`
- `lib/todo-validation.ts`
- `types/todo.ts`
- `vitest.config.ts`
- test files under `tests/`

## Data Model

Table: `todos`

- `id`: UUID primary key
- `title`: varchar(200) not null
- `description`: varchar(1000) nullable
- `status`: varchar(20) not null, allowed values `todo`, `doing`, `done`
- `priority`: varchar(20) not null, allowed values `low`, `medium`, `high`
- `due_date`: date nullable
- `created_at`: timestamptz not null default now()
- `updated_at`: timestamptz not null default now()

For this slice, `POST /api/todos` always stores `status = 'todo'`.

## Ordering

`GET /api/todos` returns all rows ordered by:

1. unfinished first (`todo`, `doing`)
2. due date ascending with `NULLS LAST`
3. `created_at` descending

## API Contract

### GET `/api/todos`

- success: `200`
- body: `Todo[]`
- failure: `500 { "error": "Internal server error" }`

### POST `/api/todos`

Request body:

- `title`: required
- `description`: optional
- `dueDate`: optional
- `priority`: optional, default `medium`

Validation:

- `title`: 1 to 200 chars
- `description`: 0 to 1000 chars
- `dueDate`: valid date string if provided
- `priority`: one of `low`, `medium`, `high`

Response:

- success: `201` with created `Todo`
- validation error: `400 { "error": "Validation failed", "fieldErrors": { ... } }`
- failure: `500 { "error": "Internal server error" }`

## UI

Top page contains:

- title
- create form
- todo list

Minimal behavior:

- initial load fetches `GET /api/todos`
- empty state shows a short message
- submit success clears the form and refreshes the list
- submit failure shows a compact error message
- list rows show at least title, description, due date, priority, status, created date

Styling stays minimal in this slice. Correctness and testability take priority.

## Testing Strategy

TDD order:

1. validation unit tests
2. repository unit tests with mocked DB layer
3. `GET /api/todos` route tests
4. `POST /api/todos` route tests
5. minimal UI tests for list rendering and create flow

Focus test cases:

- default `priority = medium`
- default `status = todo`
- invalid title rejected
- invalid due date rejected
- GET ordering matches spec
- empty list view
- create success updates visible list

## Manual Check After Slice

- create one todo with only title
- create one todo with all fields
- reload page and confirm persistence
- confirm ordering with mixed due dates and statuses
- confirm invalid input is blocked

## Risks

- Neon connection setup may differ between local test and runtime
- Route tests should avoid real DB dependency in this slice
- Server and client date formatting can drift; keep formatting simple for now
