import { type NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getUserId } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

// ── PATCH /api/tasks/[id] ─────────────────────────────────────────────────────
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  let body: { title?: string; description?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 });
  }

  const pool = getPool();

  // Verify the task belongs to this user
  const existing = await pool.query(
    `SELECT id, status FROM task WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  if (existing.rows.length === 0) {
    return NextResponse.json({ detail: "Task not found" }, { status: 404 });
  }

  const setClauses: string[] = [];
  const values: unknown[] = [];

  if (body.title !== undefined) {
    const t = body.title.trim();
    if (!t) return NextResponse.json({ detail: "Title is required" }, { status: 422 });
    if (t.length > 200) return NextResponse.json({ detail: "Title too long" }, { status: 422 });
    values.push(t);
    setClauses.push(`title = $${values.length}`);
  }

  if (body.description !== undefined) {
    const d = body.description.trim();
    if (d.length > 1000) return NextResponse.json({ detail: "Description too long" }, { status: 422 });
    values.push(d);
    setClauses.push(`description = $${values.length}`);
  }

  if (body.status !== undefined) {
    if (body.status !== "completed") {
      return NextResponse.json({ detail: "Status can only be set to 'completed'" }, { status: 422 });
    }
    values.push(body.status);
    setClauses.push(`status = $${values.length}`);
  }

  if (setClauses.length === 0) {
    return NextResponse.json({ detail: "No fields to update" }, { status: 422 });
  }

  setClauses.push(`updated_at = now()`);
  values.push(id, userId);

  try {
    const result = await pool.query(
      `UPDATE task
       SET ${setClauses.join(", ")}
       WHERE id = $${values.length - 1} AND user_id = $${values.length}
       RETURNING id, title, description, status, created_at, updated_at`,
      values
    );
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error("[Tasks PATCH]", err);
    return NextResponse.json({ detail: "Failed to update task" }, { status: 500 });
  }
}

// ── DELETE /api/tasks/[id] ────────────────────────────────────────────────────
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const pool = getPool();

  try {
    const result = await pool.query(
      `DELETE FROM task WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ detail: "Task not found" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[Tasks DELETE]", err);
    return NextResponse.json({ detail: "Failed to delete task" }, { status: 500 });
  }
}
