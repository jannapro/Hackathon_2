"""
POST /api/chat — Vercel Python serverless handler.

Accepts { message: string }, runs an OpenAI function-calling loop with 7 task-management
tools, persists the exchange to the conversation/message tables, and returns
{ response: string, conversation_id: string }.
"""

from http.server import BaseHTTPRequestHandler
import json
import os
import uuid
from datetime import datetime

import psycopg2
from openai import OpenAI

DATABASE_URL = os.environ.get("DATABASE_URL", "")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

SYSTEM_PROMPT = (
    "You are a helpful task-management assistant called TaskFlow AI. "
    "You help users manage their to-do list by using the available tools. "
    "Always be concise and friendly. When listing tasks, format them clearly. "
    "If the user asks about their tasks, fetch them first before answering."
)

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "list_tasks",
            "description": "List all tasks for the user, optionally filtered by status.",
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "enum": ["pending", "completed"],
                        "description": "Filter by task status. Omit to list all tasks.",
                    }
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "add_task",
            "description": "Create a new task for the user.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "Task title (required, max 200 chars).",
                    },
                    "description": {
                        "type": "string",
                        "description": "Optional task description (max 1000 chars).",
                    },
                },
                "required": ["title"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "update_task",
            "description": "Update a task's title and optionally its description.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "string",
                        "description": "The UUID of the task to update.",
                    },
                    "title": {"type": "string", "description": "New title for the task."},
                    "description": {
                        "type": "string",
                        "description": "New description for the task.",
                    },
                },
                "required": ["task_id", "title"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_task",
            "description": "Permanently delete a specific task.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "string",
                        "description": "The UUID of the task to delete.",
                    }
                },
                "required": ["task_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "complete_task",
            "description": "Mark a specific task as completed.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "string",
                        "description": "The UUID of the task to mark as completed.",
                    }
                },
                "required": ["task_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_all_tasks",
            "description": "Delete ALL tasks for the user. Use only when the user explicitly asks to clear or delete all tasks.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "complete_all_tasks",
            "description": "Mark ALL pending tasks as completed for the user.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
]


# ── DB helpers ────────────────────────────────────────────────────────────────

def get_conn():
    return psycopg2.connect(DATABASE_URL)


def ensure_tables(cur):
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS conversation (
            id          UUID      NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id     TEXT      NOT NULL,
            created_at  TIMESTAMP NOT NULL DEFAULT now()
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS message (
            id              UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            conversation_id UUID         NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
            role            VARCHAR(20)  NOT NULL,
            content         TEXT         NOT NULL,
            created_at      TIMESTAMP    NOT NULL DEFAULT now()
        )
        """
    )
    cur.execute(
        "CREATE INDEX IF NOT EXISTS ix_message_conv_id ON message(conversation_id)"
    )


def verify_token(token: str):
    """Return user_id string or None."""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                'SELECT "userId", "expiresAt" FROM session WHERE token = %s LIMIT 1',
                (token,),
            )
            row = cur.fetchone()
        if not row:
            return None
        user_id, expires_at = row
        if expires_at < datetime.utcnow():
            return None
        return user_id
    finally:
        conn.close()


def get_or_create_conversation(cur, user_id: str) -> str:
    cur.execute(
        "SELECT id FROM conversation WHERE user_id = %s ORDER BY created_at DESC LIMIT 1",
        (user_id,),
    )
    row = cur.fetchone()
    if row:
        return str(row[0])
    conv_id = str(uuid.uuid4())
    cur.execute(
        "INSERT INTO conversation (id, user_id) VALUES (%s, %s)",
        (conv_id, user_id),
    )
    return conv_id


def save_message(cur, conversation_id: str, role: str, content: str) -> str:
    msg_id = str(uuid.uuid4())
    cur.execute(
        "INSERT INTO message (id, conversation_id, role, content) VALUES (%s, %s, %s, %s)",
        (msg_id, conversation_id, role, content),
    )
    return msg_id


# ── Tool execution ────────────────────────────────────────────────────────────

def execute_tool(name: str, arguments: dict, user_id: str) -> str:
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            if name == "list_tasks":
                status = arguments.get("status")
                if status in ("pending", "completed"):
                    cur.execute(
                        "SELECT id, title, description, status, created_at "
                        "FROM task WHERE user_id = %s AND status = %s ORDER BY created_at DESC",
                        (user_id, status),
                    )
                else:
                    cur.execute(
                        "SELECT id, title, description, status, created_at "
                        "FROM task WHERE user_id = %s ORDER BY created_at DESC",
                        (user_id,),
                    )
                rows = cur.fetchall()
                tasks = [
                    {
                        "task_id": str(r[0]),
                        "title": r[1],
                        "description": r[2],
                        "status": r[3],
                        "created_at": r[4].isoformat() if r[4] else None,
                    }
                    for r in rows
                ]
                return json.dumps({"status": "ok", "tasks": tasks, "count": len(tasks)})

            elif name == "add_task":
                title = (arguments.get("title") or "").strip()
                description = (arguments.get("description") or title).strip()
                if not title:
                    return json.dumps({"status": "error", "message": "Title is required"})
                task_id = str(uuid.uuid4())
                now = datetime.utcnow()
                cur.execute(
                    "INSERT INTO task (id, title, description, status, user_id, created_at, updated_at) "
                    "VALUES (%s, %s, %s, 'pending', %s, %s, %s)",
                    (task_id, title, description, user_id, now, now),
                )
                conn.commit()
                return json.dumps({"status": "created", "task_id": task_id, "title": title})

            elif name == "update_task":
                task_id = arguments.get("task_id", "")
                title = (arguments.get("title") or "").strip()
                description = arguments.get("description")
                if not title:
                    return json.dumps({"status": "error", "message": "Title is required"})
                cur.execute(
                    "SELECT id FROM task WHERE id = %s AND user_id = %s",
                    (task_id, user_id),
                )
                if not cur.fetchone():
                    return json.dumps({"status": "error", "message": "Task not found"})
                if description is not None:
                    cur.execute(
                        "UPDATE task SET title = %s, description = %s, updated_at = %s "
                        "WHERE id = %s AND user_id = %s",
                        (title, description.strip(), datetime.utcnow(), task_id, user_id),
                    )
                else:
                    cur.execute(
                        "UPDATE task SET title = %s, updated_at = %s "
                        "WHERE id = %s AND user_id = %s",
                        (title, datetime.utcnow(), task_id, user_id),
                    )
                conn.commit()
                return json.dumps({"status": "updated", "task_id": task_id, "title": title})

            elif name == "delete_task":
                task_id = arguments.get("task_id", "")
                cur.execute(
                    "DELETE FROM task WHERE id = %s AND user_id = %s RETURNING id",
                    (task_id, user_id),
                )
                if not cur.fetchone():
                    return json.dumps({"status": "error", "message": "Task not found"})
                conn.commit()
                return json.dumps({"status": "deleted", "task_id": task_id})

            elif name == "complete_task":
                task_id = arguments.get("task_id", "")
                cur.execute(
                    "SELECT title FROM task WHERE id = %s AND user_id = %s",
                    (task_id, user_id),
                )
                row = cur.fetchone()
                if not row:
                    return json.dumps({"status": "error", "message": "Task not found"})
                cur.execute(
                    "UPDATE task SET status = 'completed', updated_at = %s "
                    "WHERE id = %s AND user_id = %s",
                    (datetime.utcnow(), task_id, user_id),
                )
                conn.commit()
                return json.dumps({"status": "completed", "task_id": task_id, "title": row[0]})

            elif name == "delete_all_tasks":
                cur.execute("DELETE FROM task WHERE user_id = %s", (user_id,))
                count = cur.rowcount
                conn.commit()
                return json.dumps({"status": "deleted_all", "count": count})

            elif name == "complete_all_tasks":
                cur.execute(
                    "UPDATE task SET status = 'completed', updated_at = %s "
                    "WHERE user_id = %s AND status = 'pending'",
                    (datetime.utcnow(), user_id),
                )
                count = cur.rowcount
                conn.commit()
                return json.dumps({"status": "completed_all", "count": count})

            else:
                return json.dumps({"status": "error", "message": f"Unknown tool: {name}"})
    except Exception as exc:
        conn.rollback()
        return json.dumps({"status": "error", "message": str(exc)})
    finally:
        conn.close()


# ── OpenAI agentic loop ───────────────────────────────────────────────────────

def run_agent(user_message: str, user_id: str) -> str:
    client = OpenAI(api_key=OPENAI_API_KEY)
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ]

    for _ in range(10):
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
        )
        choice = resp.choices[0]

        if choice.finish_reason == "tool_calls":
            assistant_msg = choice.message
            messages.append(assistant_msg.model_dump(exclude_none=True))
            for tc in assistant_msg.tool_calls:
                args = json.loads(tc.function.arguments)
                result = execute_tool(tc.function.name, args, user_id)
                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tc.id,
                        "content": result,
                    }
                )
        else:
            return choice.message.content or ""

    return "I'm sorry, I couldn't complete that request. Please try again."


# ── HTTP handler ──────────────────────────────────────────────────────────────

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_POST(self):
        # Auth
        auth_header = self.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            self._json({"detail": "Unauthorized"}, 401)
            return
        token = auth_header[7:].strip()
        user_id = verify_token(token)
        if not user_id:
            self._json({"detail": "Unauthorized"}, 401)
            return

        # Parse body
        length = int(self.headers.get("Content-Length", 0))
        try:
            body = json.loads(self.rfile.read(length))
        except Exception:
            self._json({"detail": "Invalid JSON"}, 400)
            return

        user_message = (body.get("message") or "").strip()
        if not user_message:
            self._json({"detail": "message is required"}, 422)
            return

        # Run agent
        try:
            assistant_reply = run_agent(user_message, user_id)
        except Exception as exc:
            self._json({"detail": f"Agent error: {exc}"}, 500)
            return

        # Persist to DB
        try:
            conn = get_conn()
            with conn:
                with conn.cursor() as cur:
                    ensure_tables(cur)
                    conv_id = get_or_create_conversation(cur, user_id)
                    save_message(cur, conv_id, "user", user_message)
                    save_message(cur, conv_id, "assistant", assistant_reply)
        except Exception as exc:
            # Non-fatal — still return the response
            print(f"[Chat] DB persist error: {exc}")
            conv_id = ""
        finally:
            try:
                conn.close()
            except Exception:
                pass

        self._json({"response": assistant_reply, "conversation_id": conv_id})

    def _json(self, data: dict, status: int = 200):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def log_message(self, format, *args):
        pass  # suppress default stderr logging
