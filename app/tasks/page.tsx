"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { api } from "@/lib/api";
import { Plus, Loader2, Search, ListTodo, Clock, CheckCircle2 } from "lucide-react";

import { Sidebar }      from "@/components/dashboard/Sidebar";
import { TopBar }       from "@/components/dashboard/TopBar";
import { TaskCard }     from "@/components/dashboard/TaskCard";
import { AddTaskModal } from "@/components/dashboard/AddTaskModal";
import { ChatWidget }   from "@/components/chat/ChatWidget";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const FILTERS = [
  { label: "All",       value: "all",       icon: ListTodo    },
  { label: "Pending",   value: "pending",   icon: Clock       },
  { label: "Completed", value: "completed", icon: CheckCircle2 },
];

function TasksContent() {
  const { session, isPending } = useAuth();
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [modalOpen, setModalOpen]     = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter]           = useState(searchParams?.get("filter") || "all");
  const [allTasks, setAllTasks]       = useState<Task[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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

  const pendingCount   = allTasks.filter((t) => t.status === "pending").length;
  const completedCount = allTasks.filter((t) => t.status === "completed").length;

  const counts: Record<string, number> = {
    all: allTasks.length,
    pending: pendingCount,
    completed: completedCount,
  };

  const filteredTasks = allTasks.filter((t) => {
    const matchFilter = filter === "all" || t.status === filter;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      {/* Animated grid */}
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

      <div className="main-offset">
        <TopBar searchQuery={searchQuery} onSearchChange={setSearchQuery} onMenuToggle={() => setMobileNavOpen((v) => !v)} />

        <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
          {/* Header */}
          <div
            className="page-header-row"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "24px",
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
                My Tasks
              </h1>
              <p style={{ fontFamily: "var(--font-rajdhani), sans-serif", fontSize: "13px", color: "var(--text3)" }}>
                {allTasks.length} total · {pendingCount} pending · {completedCount} completed
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

          {/* Filter tabs */}
          <div className="filter-tabs" style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
            {FILTERS.map(({ label, value, icon: Icon }) => {
              const active = filter === value;
              return (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "7px 14px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 500,
                    border: "1px solid",
                    cursor: "pointer",
                    transition: "background 0.15s, color 0.15s, border-color 0.15s",
                    background: active ? "var(--gold-dim)" : "var(--surface)",
                    borderColor: active ? "var(--gold)" : "var(--border)",
                    color: active ? "var(--gold)" : "var(--text2)",
                    fontFamily: "var(--font-rajdhani), sans-serif",
                  }}
                >
                  <Icon size={13} />
                  {label}
                  <span
                    style={{
                      padding: "1px 7px",
                      borderRadius: "99px",
                      fontSize: "11px",
                      fontWeight: 600,
                      background: active ? "rgba(201,168,76,0.2)" : "var(--surface2)",
                      color: active ? "var(--gold)" : "var(--text3)",
                    }}
                  >
                    {counts[value]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Task grid / states */}
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
          ) : filteredTasks.length === 0 ? (
            <div
              style={{
                padding: "48px 24px",
                textAlign: "center",
                borderRadius: "12px",
                border: "1px dashed var(--border2)",
                color: "var(--text3)",
              }}
            >
              {searchQuery ? (
                <>
                  <Search size={28} style={{ margin: "0 auto 10px", opacity: 0.3 }} />
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text2)" }}>No results</p>
                  <p style={{ fontSize: "13px", marginTop: "4px" }}>
                    No tasks match &ldquo;{searchQuery}&rdquo;
                  </p>
                </>
              ) : (
                <>
                  <ListTodo size={28} style={{ margin: "0 auto 10px", opacity: 0.3 }} />
                  <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text2)" }}>
                    No {filter !== "all" ? filter : ""} tasks
                  </p>
                  <p style={{ fontSize: "13px", marginTop: "4px" }}>
                    {filter === "all" ? "Create your first task or ask the AI assistant." : `No ${filter} tasks right now.`}
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="task-grid">
              {filteredTasks.map((task) => (
                <TaskCard key={task.id} task={task} onUpdated={refreshSilently} />
              ))}
            </div>
          )}
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

export default function TasksPage() {
  return (
    <Suspense>
      <TasksContent />
    </Suspense>
  );
}
