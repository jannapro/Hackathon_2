import { type NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getUserId } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

// Idempotent table + index creation on cold start
async function ensureTaskTable() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS task (
      id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      title       TEXT        NOT NULL,
      description TEXT        NOT NULL DEFAULT '',
      status      TEXT        NOT NULL DEFAULT 'pending',
      user_id     TEXT        NOT NULL,
      created_at  TIMESTAMP   NOT NULL DEFAULT now(),
      updated_at  TIMESTAMP   NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS ix_task_user_id     ON task(user_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS ix_task_user_status ON task(user_id, status)`);
}

// ── GET /api/tasks ────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");
  const search = searchParams.get("search");

  const pool = getPool();
  const values: unknown[] = [userId];
  let query = `
    SELECT id, title, description, status, created_at, updated_at
    FROM task
    WHERE user_id = $1
  `;

  if (statusFilter === "pending" || statusFilter === "completed") {
    values.push(statusFilter);
    query += ` AND status = $${values.length}`;
  }

  if (search?.trim()) {
    const kw = `%${search.trim().toLowerCase()}%`;
    values.push(kw);
    query += ` AND (LOWER(title) LIKE $${values.length} OR LOWER(description) LIKE $${values.length})`;
  }

  query += " ORDER BY created_at DESC";

  try {
    const result = await pool.query(query, values);
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("[Tasks GET]", err);
    return NextResponse.json({ detail: "Failed to fetch tasks" }, { status: 500 });
  }
}

// ── POST /api/tasks ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  let body: { title?: string; description?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 });
  }

  const title = body.title?.trim() ?? "";
  const description = body.description?.trim() ?? "";

  if (!title) {
    return NextResponse.json({ detail: "Title is required" }, { status: 422 });
  }
  if (title.length > 200) {
    return NextResponse.json({ detail: "Title must be 200 characters or fewer" }, { status: 422 });
  }
  if (description.length > 1000) {
    return NextResponse.json({ detail: "Description must be 1000 characters or fewer" }, { status: 422 });
  }

  try {
    await ensureTaskTable();
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO task (title, description, status, user_id)
       VALUES ($1, $2, 'pending', $3)
       RETURNING id, title, description, status, created_at, updated_at`,
      [title, description, userId]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error("[Tasks POST]", err);
    return NextResponse.json({ detail: "Failed to create task" }, { status: 500 });
  }
}
