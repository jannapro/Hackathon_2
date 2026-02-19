"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { api } from "@/lib/api";
import { Plus, Loader2 } from "lucide-react";

import { Sidebar }        from "@/components/dashboard/Sidebar";
import { TopBar }         from "@/components/dashboard/TopBar";
import { StatsCards }     from "@/components/dashboard/StatsCards";
import { TaskCard }       from "@/components/dashboard/TaskCard";
import { AddTaskModal }   from "@/components/dashboard/AddTaskModal";
import { AnalyticsPanel } from "@/components/dashboard/AnalyticsPanel";
import { ChatWidget }     from "@/components/chat/ChatWidget";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function DashboardPage() {
  const { session, isPending } = useAuth();
  const router = useRouter();

  const [modalOpen, setModalOpen]     = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [allTasks, setAllTasks]       = useState<Task[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Redirect if unauthenticated
  useEffect(() => {
    if (!isPending && !session?.user) router.push("/");
  }, [isPending, session, router]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/tasks/");
      if (!res.ok) {
        setError(res.status === 401 ? "Session expired. Please log in again." : "Failed to load tasks");
        return;
      }
      setAllTasks(await res.json());
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSilently = useCallback(async () => {
    try {
      const res = await api.get("/api/tasks/");
      if (res.ok) setAllTasks(await res.json());
    } catch { /* silently ignore */ }
  }, []);

  useEffect(() => {
    if (session?.user) fetchTasks();
  }, [session, fetchTasks]);

  // ── Loading state ──────────────────────────────────────────────
  if (isPending) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "var(--bg)",
          gap: "12px",
          color: "var(--text3)",
        }}
      >
        <Loader2 size={20} className="animate-spin" />
        <span style={{ fontSize: "14px" }}>Loading…</span>
      </div>
    );
  }

  if (!session?.user) return null;

  // ── Derived data ───────────────────────────────────────────────
  const completedTasks = allTasks.filter((t) => t.status === "completed");
  const pendingTasks   = allTasks.filter((t) => t.status === "pending");

  const filteredTasks = allTasks.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    return !q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
  });

  const recentPending   = filteredTasks.filter((t) => t.status === "pending").slice(0, 6);
  const recentCompleted = filteredTasks.filter((t) => t.status === "completed").slice(0, 4);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const userName = session.user.name || session.user.email?.split("@")[0] || "User";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      {/* ── Animated grid background ── */}
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden",
          backgroundImage: `
            linear-gradient(var(--grid-line) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)
          `,
          backgroundSize: "52px 52px",
          animation: "gridDrift 24s linear infinite",
        }}
      />
      {/* ── Aurora radial glow ── */}
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
          background: `
            radial-gradient(ellipse 60% 40% at 50% -10%, var(--aurora-gold) 0%, transparent 60%),
            radial-gradient(ellipse 40% 50% at 100% 30%,  var(--aurora-cyan) 0%, transparent 55%),
            radial-gradient(ellipse 35% 45% at 0%   70%,  var(--aurora-rose) 0%, transparent 55%)
          `,
          animation: "auroraPulse 12s ease-in-out infinite",
        }}
      />

      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Main content — offset for fixed sidebar */}
      <div className="main-offset">
        <TopBar searchQuery={searchQuery} onSearchChange={setSearchQuery} onMenuToggle={() => setMobileNavOpen((v) => !v)} />

        <main style={{ flex: 1, overflowY: "auto" }}>
        <div className="two-col-layout">
        {/* ── Left: main content ─────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Page header */}
          <div
            className="page-header-row"
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: "28px",
              gap: "12px",
            }}
          >
            <div>
              <h1
                style={{
                  fontFamily: "var(--font-cinzel), serif",
                  fontSize: "20px", fontWeight: 700,
                  letterSpacing: "1px",
                  color: "var(--text)", marginBottom: "5px",
                }}
              >
                {greeting}, {userName}
              </h1>
              <p style={{ fontFamily: "var(--font-rajdhani), sans-serif", fontSize: "13px", color: "var(--text3)" }}>
                {allTasks.length === 0
                  ? "You have no tasks yet. Create one to get started."
                  : `${pendingTasks.length} pending · ${completedTasks.length} completed`}
              </p>
            </div>

            <button
              onClick={() => setModalOpen(true)}
              className="btn-gold font-display"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "10px 20px",
                borderRadius: "9px",
                fontSize: "9px",
                letterSpacing: "1.5px",
              }}
            >
              <Plus size={14} />
              New Task
            </button>
          </div>

          {/* Stats */}
          <StatsCards
            totalTasks={allTasks.length}
            completedTasks={completedTasks.length}
            pendingTasks={pendingTasks.length}
          />

          {/* Task content */}
          <div style={{ marginTop: "32px" }}>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
                <Loader2 size={22} className="animate-spin" style={{ color: "var(--text3)" }} />
              </div>
            ) : error ? (
              <div
                style={{
                  padding: "20px",
                  borderRadius: "12px",
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "#EF4444",
                  fontSize: "13px",
                  textAlign: "center",
                }}
              >
                {error}
              </div>
            ) : allTasks.length === 0 ? (
              <div
                style={{
                  padding: "48px 24px",
                  textAlign: "center",
                  borderRadius: "12px",
                  border: "1px dashed var(--border2)",
                  color: "var(--text3)",
                }}
              >
                <p style={{ fontSize: "14px", fontWeight: 500, marginBottom: "6px", color: "var(--text2)" }}>
                  No tasks yet
                </p>
                <p style={{ fontSize: "13px" }}>
                  Create your first task or ask the AI assistant.
                </p>
              </div>
            ) : (
              <>
                {/* Pending section */}
                {recentPending.length > 0 && (
                  <section style={{ marginBottom: "32px" }}>
                    <h2
                      style={{
                        fontFamily: "var(--font-cinzel), serif",
                        fontSize: "8px", letterSpacing: "3px",
                        textTransform: "uppercase",
                        color: "var(--gold)", marginBottom: "14px",
                      }}
                    >
                      Pending · {pendingTasks.length}
                    </h2>
                    <div className="task-grid">
                      {recentPending.map((task, i) => (
                        <TaskCard key={task.id} task={task} onUpdated={refreshSilently} animDelay={i * 60} />
                      ))}
                    </div>
                    {pendingTasks.length > 6 && (
                      <button
                        onClick={() => router.push("/tasks")}
                        style={{
                          marginTop: "12px",
                          fontFamily: "var(--font-rajdhani), sans-serif",
                          fontSize: "12px",
                          color: "var(--gold)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontWeight: 500,
                        }}
                      >
                        View all {pendingTasks.length} pending tasks →
                      </button>
                    )}
                  </section>
                )}

                {/* Recently completed */}
                {recentCompleted.length > 0 && (
                  <section>
                    <h2
                      style={{
                        fontFamily: "var(--font-cinzel), serif",
                        fontSize: "8px", letterSpacing: "3px",
                        textTransform: "uppercase",
                        color: "var(--green)", marginBottom: "14px",
                      }}
                    >
                      Recently completed · {completedTasks.length}
                    </h2>
                    <div className="task-grid">
                      {recentCompleted.map((task, i) => (
                        <TaskCard key={task.id} task={task} onUpdated={refreshSilently} animDelay={i * 60} />
                      ))}
                    </div>
                    {completedTasks.length > 4 && (
                      <button
                        onClick={() => router.push("/tasks?filter=completed")}
                        style={{
                          marginTop: "12px",
                          fontFamily: "var(--font-rajdhani), sans-serif",
                          fontSize: "12px",
                          color: "var(--green)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontWeight: 500,
                        }}
                      >
                        View all {completedTasks.length} completed tasks →
                      </button>
                    )}
                  </section>
                )}
              </>
            )}
          </div>
        </div>{/* end left column */}

        {/* ── Right: analytics sidebar ───────────────── */}
        <div className="analytics-col">
          <AnalyticsPanel tasks={allTasks} />
        </div>

        </div>{/* end two-col flex */}
        </main>
      </div>

      {/* Floating AI chat */}
      <ChatWidget onTaskMutated={refreshSilently} />

      {/* Add task modal */}
      <AddTaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onTaskCreated={fetchTasks}
      />
    </div>
  );
}
