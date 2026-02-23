import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/server-auth";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const pool = getPool();
  try {
    const convRes = await pool.query(
      "SELECT id FROM conversation WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
      [userId]
    );
    if (convRes.rows.length === 0) {
      return NextResponse.json({ conversation_id: "", messages: [] });
    }
    const convId = convRes.rows[0].id as string;

    const msgRes = await pool.query(
      "SELECT id, role, content, created_at FROM message WHERE conversation_id = $1 ORDER BY created_at ASC",
      [convId]
    );
    const messages = msgRes.rows.map((r) => ({
      id: r.id,
      role: r.role,
      content: r.content,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : "",
    }));

    return NextResponse.json({ conversation_id: convId, messages });
  } catch (err) {
    return NextResponse.json(
      { detail: `Failed to load history: ${err}` },
      { status: 500 }
    );
  }
}
