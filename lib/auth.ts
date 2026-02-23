import { betterAuth } from "better-auth";
import { getPool } from "./db";

const pool = getPool();

// Ensure Better Auth schema tables exist in Neon on cold start.
// Uses CREATE TABLE IF NOT EXISTS so it is safe to run on every startup.
async function initSchema() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS "user" (
      "id"            text      NOT NULL PRIMARY KEY,
      "name"          text      NOT NULL,
      "email"         text      NOT NULL UNIQUE,
      "emailVerified" boolean   NOT NULL DEFAULT false,
      "image"         text,
      "createdAt"     timestamp NOT NULL DEFAULT now(),
      "updatedAt"     timestamp NOT NULL DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS "session" (
      "id"          text      NOT NULL PRIMARY KEY,
      "expiresAt"   timestamp NOT NULL,
      "token"       text      NOT NULL UNIQUE,
      "createdAt"   timestamp NOT NULL DEFAULT now(),
      "updatedAt"   timestamp NOT NULL DEFAULT now(),
      "ipAddress"   text,
      "userAgent"   text,
      "userId"      text      NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "account" (
      "id"                     text      NOT NULL PRIMARY KEY,
      "accountId"              text      NOT NULL,
      "providerId"             text      NOT NULL,
      "userId"                 text      NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "accessToken"            text,
      "refreshToken"           text,
      "idToken"                text,
      "accessTokenExpiresAt"   timestamp,
      "refreshTokenExpiresAt"  timestamp,
      "scope"                  text,
      "password"               text,
      "createdAt"              timestamp NOT NULL DEFAULT now(),
      "updatedAt"              timestamp NOT NULL DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS "verification" (
      "id"         text      NOT NULL PRIMARY KEY,
      "identifier" text      NOT NULL,
      "value"      text      NOT NULL,
      "expiresAt"  timestamp NOT NULL,
      "createdAt"  timestamp,
      "updatedAt"  timestamp
    )`,
    // Task table — managed by Next.js API routes, no separate backend needed
    `CREATE TABLE IF NOT EXISTS task (
      id          UUID      NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      title       TEXT      NOT NULL,
      description TEXT      NOT NULL DEFAULT '',
      status      TEXT      NOT NULL DEFAULT 'pending',
      user_id     TEXT      NOT NULL,
      created_at  TIMESTAMP NOT NULL DEFAULT now(),
      updated_at  TIMESTAMP NOT NULL DEFAULT now()
    )`,
    `CREATE INDEX IF NOT EXISTS ix_task_user_id     ON task(user_id)`,
    `CREATE INDEX IF NOT EXISTS ix_task_user_status ON task(user_id, status)`,
    // Chat tables — managed by Next.js API routes and Python serverless functions
    `CREATE TABLE IF NOT EXISTS conversation (
      id          UUID      NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id     TEXT      NOT NULL,
      created_at  TIMESTAMP NOT NULL DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS message (
      id              UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      conversation_id UUID         NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
      role            VARCHAR(20)  NOT NULL,
      content         TEXT         NOT NULL,
      created_at      TIMESTAMP    NOT NULL DEFAULT now()
    )`,
    `CREATE INDEX IF NOT EXISTS ix_message_conv_id ON message(conversation_id)`,
  ];

  for (const sql of statements) {
    await pool.query(sql);
  }
  console.log("[DB] Better Auth schema ready");
}

initSchema().catch((err) => console.error("[DB] Schema init failed:", err));

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  database: pool,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
});
