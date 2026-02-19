import { type NextRequest } from "next/server";
import { getPool } from "./db";

/**
 * Extracts and verifies the Bearer token from the Authorization header.
 * Looks up the token in Better Auth's "session" table and checks expiry.
 * Returns the userId string, or null if the token is missing/invalid/expired.
 */
export async function getUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const pool = getPool();
  try {
    const result = await pool.query(
      `SELECT "userId", "expiresAt" FROM "session" WHERE "token" = $1 LIMIT 1`,
      [token]
    );
    const row = result.rows[0];
    if (!row) return null;

    const expiresAt = new Date(row.expiresAt);
    if (expiresAt < new Date()) return null;

    return row.userId as string;
  } catch {
    return null;
  }
}
