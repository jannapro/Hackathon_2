const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
