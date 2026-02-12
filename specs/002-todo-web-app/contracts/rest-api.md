# REST API Contract: Todo Web App

**Feature**: 002-todo-web-app
**Date**: 2026-02-09
**Base URL**: `http://localhost:8000`

## Authentication

All endpoints require a valid JWT Bearer token in the `Authorization`
header:

```
Authorization: Bearer <jwt_token>
```

The backend verifies the JWT using a shared secret and extracts
`user_id` from the token payload. All queries are scoped to this
`user_id`.

### Error Responses (Auth)

| Status | Body | When |
|--------|------|------|
| 401 | `{"detail": "Missing authorization header"}` | No Authorization header |
| 401 | `{"detail": "Invalid token"}` | Malformed or expired JWT |

---

## Endpoints

### 1. List Tasks

```
GET /api/tasks
```

**Description**: Retrieve all tasks belonging to the authenticated user.
Supports optional filtering by status and keyword search.

**Query Parameters**:

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | No | Filter by status: `"pending"` or `"completed"` |
| `search` | string | No | Case-insensitive keyword search in title and description |

**Success Response**:

```
200 OK
Content-Type: application/json
```

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "status": "pending",
    "created_at": "2026-02-09T10:30:00Z",
    "updated_at": "2026-02-09T10:30:00Z"
  }
]
```

**Notes**:
- Returns empty array `[]` if no tasks match.
- `user_id` is NOT included in response (implicit from auth).
- Results are not paginated (all tasks returned).

---

### 2. Create Task

```
POST /api/tasks
```

**Description**: Create a new task for the authenticated user.

**Request Body**:

```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `title` | string | Yes | 1–200 chars, non-empty after trim |
| `description` | string | Yes | 1–1000 chars, non-empty after trim |

**Success Response**:

```
201 Created
Content-Type: application/json
```

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "status": "pending",
  "created_at": "2026-02-09T10:30:00Z",
  "updated_at": "2026-02-09T10:30:00Z"
}
```

**Error Responses**:

| Status | Body | When |
|--------|------|------|
| 422 | `{"detail": [{"field": "title", "message": "Title is required"}]}` | Missing or empty title |
| 422 | `{"detail": [{"field": "title", "message": "Title must be 200 characters or fewer"}]}` | Title too long |
| 422 | `{"detail": [{"field": "description", "message": "Description is required"}]}` | Missing or empty description |
| 422 | `{"detail": [{"field": "description", "message": "Description must be 1000 characters or fewer"}]}` | Description too long |

---

### 3. Update Task

```
PATCH /api/tasks/{id}
```

**Description**: Update fields of an existing task belonging to the
authenticated user. Supports partial updates.

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `id` | UUID | Task ID |

**Request Body** (all fields optional, at least one required):

```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "completed"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `title` | string | No | 1–200 chars, non-empty after trim |
| `description` | string | No | 1–1000 chars, non-empty after trim |
| `status` | string | No | Only `"completed"` allowed (one-way transition from `"pending"`) |

**Success Response**:

```
200 OK
Content-Type: application/json
```

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Updated title",
  "description": "Updated description",
  "status": "completed",
  "created_at": "2026-02-09T10:30:00Z",
  "updated_at": "2026-02-09T11:00:00Z"
}
```

**Error Responses**:

| Status | Body | When |
|--------|------|------|
| 404 | `{"detail": "Task not found"}` | Task does not exist or belongs to another user |
| 422 | `{"detail": [{"field": "status", "message": "Can only transition from pending to completed"}]}` | Invalid status transition |
| 422 | `{"detail": [{"field": "title", "message": "Title must be 200 characters or fewer"}]}` | Title too long |

**Notes**:
- Returns 404 for tasks belonging to other users (never reveals
  existence).
- Title and description can be updated in any status.
- Status can only change from `"pending"` to `"completed"`.

---

### 4. Delete Task

```
DELETE /api/tasks/{id}
```

**Description**: Permanently delete a task belonging to the
authenticated user.

**Path Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `id` | UUID | Task ID |

**Success Response**:

```
204 No Content
```

**Error Responses**:

| Status | Body | When |
|--------|------|------|
| 404 | `{"detail": "Task not found"}` | Task does not exist or belongs to another user |

**Notes**:
- Hard delete — task is permanently removed.
- Returns 404 for tasks belonging to other users (never reveals
  existence).

---

## Common Response Headers

All responses include:

```
Content-Type: application/json
Access-Control-Allow-Origin: <frontend_origin>
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS
```

## Error Format

All errors follow a consistent format:

```json
{
  "detail": "Human-readable error message"
}
```

Or for validation errors (422):

```json
{
  "detail": [
    {
      "field": "field_name",
      "message": "Human-readable validation message"
    }
  ]
}
```
