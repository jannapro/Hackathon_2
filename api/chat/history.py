"""
GET /api/chat/history — Vercel Python serverless handler.

Returns the latest conversation and its messages for the authenticated user.
Response: { conversation_id: string, messages: [{ id, role, content, created_at }] }
"""

from http.server import BaseHTTPRequestHandler
import json
import os
from datetime import datetime

import psycopg2

DATABASE_URL = os.environ.get("DATABASE_URL", "")


def get_conn():
    return psycopg2.connect(DATABASE_URL)


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


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
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

        try:
            conn = get_conn()
            with conn.cursor() as cur:
                # Get latest conversation
                cur.execute(
                    "SELECT id FROM conversation WHERE user_id = %s "
                    "ORDER BY created_at DESC LIMIT 1",
                    (user_id,),
                )
                row = cur.fetchone()
                if not row:
                    self._json({"conversation_id": "", "messages": []})
                    conn.close()
                    return

                conv_id = str(row[0])

                # Get messages for this conversation
                cur.execute(
                    "SELECT id, role, content, created_at FROM message "
                    "WHERE conversation_id = %s ORDER BY created_at ASC",
                    (conv_id,),
                )
                messages = [
                    {
                        "id": str(r[0]),
                        "role": r[1],
                        "content": r[2],
                        "created_at": r[3].isoformat() if r[3] else "",
                    }
                    for r in cur.fetchall()
                ]
            conn.close()
            self._json({"conversation_id": conv_id, "messages": messages})
        except Exception as exc:
            self._json({"detail": f"Failed to load history: {exc}"}, 500)

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
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def log_message(self, format, *args):
        pass  # suppress default stderr logging
