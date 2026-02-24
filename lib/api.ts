// All API routes are on the same origin — always use relative URLs.
const API_BASE = "";

async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Fetch the session from Better Auth to get the token
  try {
    const res = await fetch("/api/auth/get-session", {
      method: "GET",
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      console.log("[API] Session response:", JSON.stringify(data, null, 2));

      // Better Auth returns { session: { token: ... }, user: { ... } }
      const token = data?.session?.token;
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        console.log("[API] Token attached:", token.substring(0, 20) + "...");
      } else {
        console.warn("[API] No token found in session response");
      }
    } else {
      console.warn("[API] get-session returned:", res.status);
    }
  } catch (err) {
    console.error("[API] Failed to get session:", err);
  }

  return headers;
}

export async function apiClient(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = await getAuthHeaders();

  const url = `${API_BASE}${path}`;
  console.log("[API] Request:", options.method || "GET", url);

  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
}

// Convenience methods
export const api = {
  get: (path: string) => apiClient(path, { method: "GET" }),

  post: (path: string, body: unknown) =>
    apiClient(path, { method: "POST", body: JSON.stringify(body) }),

  patch: (path: string, body: unknown) =>
    apiClient(path, { method: "PATCH", body: JSON.stringify(body) }),

  delete: (path: string) => apiClient(path, { method: "DELETE" }),
};

// ---------- Chat API ----------

export interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ChatHistoryResponse {
  conversation_id: string;
  messages: ChatMessageItem[];
}

export interface ChatSendResponse {
  response: string;
  conversation_id: string;
}

export async function fetchChatHistory(): Promise<ChatHistoryResponse> {
  const res = await apiClient("/api/chat/history", { method: "GET" });
  if (!res.ok) throw new Error(`Failed to load chat history: ${res.status}`);
  return res.json();
}

export async function sendChatMessage(message: string): Promise<ChatSendResponse> {
  const res = await apiClient("/api/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail ?? `Chat request failed: ${res.status}`);
  }
  return res.json();
}
