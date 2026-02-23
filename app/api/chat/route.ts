import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/server-auth";
import { getPool } from "@/lib/db";
import OpenAI from "openai";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60s for multi-step agent loops

const SYSTEM_PROMPT =
  "You are a helpful task-management assistant called TaskFlow AI. " +
  "You help users manage their to-do list by using the available tools. " +
  "Always be concise and friendly. When listing tasks, format them clearly. " +
  "If the user asks about their tasks, fetch them first before answering.";

const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "list_tasks",
      description: "List all tasks for the user, optionally filtered by status.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["pending", "completed"],
            description: "Filter by task status. Omit to list all tasks.",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_task",
      description: "Create a new task for the user.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Task title (required, max 200 chars)." },
          description: { type: "string", description: "Optional task description." },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_task",
      description: "Update a task's title and optionally its description.",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string", description: "The UUID of the task to update." },
          title: { type: "string", description: "New title for the task." },
          description: { type: "string", description: "New description for the task." },
        },
        required: ["task_id", "title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_task",
      description: "Permanently delete a specific task.",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string", description: "The UUID of the task to delete." },
        },
        required: ["task_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "complete_task",
      description: "Mark a specific task as completed.",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string", description: "The UUID of the task to mark as completed." },
        },
        required: ["task_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_all_tasks",
      description: "Delete ALL tasks for the user. Use only when the user explicitly asks to clear or delete all tasks.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "complete_all_tasks",
      description: "Mark ALL pending tasks as completed for the user.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
];

async function executeTool(name: string, args: Record<string, unknown>, userId: string): Promise<string> {
  const pool = getPool();
  try {
    if (name === "list_tasks") {
      const status = args.status as string | undefined;
      const res = status
        ? await pool.query(
            "SELECT id, title, description, status, created_at FROM task WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC",
            [userId, status]
          )
        : await pool.query(
            "SELECT id, title, description, status, created_at FROM task WHERE user_id = $1 ORDER BY created_at DESC",
            [userId]
          );
      return JSON.stringify({ status: "ok", tasks: res.rows, count: res.rows.length });
    }

    if (name === "add_task") {
      const title = ((args.title as string) || "").trim();
      const description = ((args.description as string) || title).trim();
      if (!title) return JSON.stringify({ status: "error", message: "Title is required" });
      const res = await pool.query(
        "INSERT INTO task (title, description, status, user_id) VALUES ($1, $2, 'pending', $3) RETURNING id",
        [title, description, userId]
      );
      return JSON.stringify({ status: "created", task_id: res.rows[0].id, title });
    }

    if (name === "update_task") {
      const taskId = args.task_id as string;
      const title = ((args.title as string) || "").trim();
      const description = args.description as string | undefined;
      if (!title) return JSON.stringify({ status: "error", message: "Title is required" });
      const check = await pool.query("SELECT id FROM task WHERE id = $1 AND user_id = $2", [taskId, userId]);
      if (!check.rows.length) return JSON.stringify({ status: "error", message: "Task not found" });
      if (description !== undefined) {
        await pool.query("UPDATE task SET title = $1, description = $2, updated_at = now() WHERE id = $3 AND user_id = $4", [title, description, taskId, userId]);
      } else {
        await pool.query("UPDATE task SET title = $1, updated_at = now() WHERE id = $2 AND user_id = $3", [title, taskId, userId]);
      }
      return JSON.stringify({ status: "updated", task_id: taskId, title });
    }

    if (name === "delete_task") {
      const taskId = args.task_id as string;
      const res = await pool.query("DELETE FROM task WHERE id = $1 AND user_id = $2 RETURNING id", [taskId, userId]);
      if (!res.rows.length) return JSON.stringify({ status: "error", message: "Task not found" });
      return JSON.stringify({ status: "deleted", task_id: taskId });
    }

    if (name === "complete_task") {
      const taskId = args.task_id as string;
      const check = await pool.query("SELECT title FROM task WHERE id = $1 AND user_id = $2", [taskId, userId]);
      if (!check.rows.length) return JSON.stringify({ status: "error", message: "Task not found" });
      await pool.query("UPDATE task SET status = 'completed', updated_at = now() WHERE id = $1 AND user_id = $2", [taskId, userId]);
      return JSON.stringify({ status: "completed", task_id: taskId, title: check.rows[0].title });
    }

    if (name === "delete_all_tasks") {
      const res = await pool.query("DELETE FROM task WHERE user_id = $1", [userId]);
      return JSON.stringify({ status: "deleted_all", count: res.rowCount });
    }

    if (name === "complete_all_tasks") {
      const res = await pool.query("UPDATE task SET status = 'completed', updated_at = now() WHERE user_id = $1 AND status = 'pending'", [userId]);
      return JSON.stringify({ status: "completed_all", count: res.rowCount });
    }

    return JSON.stringify({ status: "error", message: `Unknown tool: ${name}` });
  } catch (err) {
    return JSON.stringify({ status: "error", message: String(err) });
  }
}

async function runAgent(userMessage: string, userId: string): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userMessage },
  ];

  for (let i = 0; i < 6; i++) {
    const resp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools: TOOLS,
      tool_choice: "auto",
    });
    const choice = resp.choices[0];

    if (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
      messages.push(choice.message);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const tc of choice.message.tool_calls as any[]) {
        const args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
        const result = await executeTool(tc.function.name, args, userId);
        messages.push({ role: "tool", tool_call_id: tc.id, content: result });
      }
    } else {
      return choice.message.content || "";
    }
  }
  return "I'm sorry, I couldn't complete that request. Please try again.";
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  let body: { message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON" }, { status: 400 });
  }

  const userMessage = (body.message || "").trim();
  if (!userMessage) {
    return NextResponse.json({ detail: "message is required" }, { status: 422 });
  }

  let assistantReply: string;
  try {
    assistantReply = await runAgent(userMessage, userId);
  } catch (err) {
    return NextResponse.json({ detail: `Agent error: ${err}` }, { status: 500 });
  }

  const pool = getPool();
  let convId = "";
  try {
    // Ensure tables exist (idempotent)
    await pool.query(`CREATE TABLE IF NOT EXISTS conversation (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS message (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      conversation_id UUID NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
      role VARCHAR(20) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    )`);
    await pool.query("CREATE INDEX IF NOT EXISTS ix_message_conv_id ON message(conversation_id)");

    const convRes = await pool.query(
      "SELECT id FROM conversation WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
      [userId]
    );
    if (convRes.rows.length > 0) {
      convId = convRes.rows[0].id as string;
    } else {
      const newConv = await pool.query(
        "INSERT INTO conversation (user_id) VALUES ($1) RETURNING id",
        [userId]
      );
      convId = newConv.rows[0].id as string;
    }

    await pool.query(
      "INSERT INTO message (conversation_id, role, content) VALUES ($1, $2, $3)",
      [convId, "user", userMessage]
    );
    await pool.query(
      "INSERT INTO message (conversation_id, role, content) VALUES ($1, $2, $3)",
      [convId, "assistant", assistantReply]
    );
  } catch (err) {
    console.error("[Chat] DB persist error:", err);
  }

  return NextResponse.json({ response: assistantReply, conversation_id: convId });
}
