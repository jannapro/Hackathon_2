"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical, Edit3, Trash2, CheckCircle, Calendar } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/providers/ToastProvider";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface TaskCardProps {
  task: Task;
  onUpdated: () => void;
  animDelay?: number;
}

export function TaskCard({ task, onUpdated, animDelay = 0 }: TaskCardProps) {
  const { toast } = useToast();
  const [menuOpen, setMenuOpen]       = useState(false);
  const [isEditing, setIsEditing]     = useState(false);
  const [title, setTitle]             = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [loading, setLoading]         = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isPending = task.status === "pending";
  const createdDate = new Date(task.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleComplete() {
    setLoading(true);
    try {
      const res = await api.patch(`/api/tasks/${task.id}`, { status: "completed" });
      if (res.ok) { toast.success("Task marked as completed!"); onUpdated(); }
      else toast.error("Failed to complete task");
    } catch { toast.error("Network error"); }
    finally { setLoading(false); setMenuOpen(false); }
  }

  async function handleDelete() {
    if (!confirm("Delete this task permanently?")) return;
    setLoading(true);
    try {
      const res = await api.delete(`/api/tasks/${task.id}`);
      if (res.ok) { toast.warning("Task deleted"); onUpdated(); }
      else toast.error("Failed to delete task");
    } catch { toast.error("Network error"); }
    finally { setLoading(false); setMenuOpen(false); }
  }

  async function handleSaveEdit() {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await api.patch(`/api/tasks/${task.id}`, { title: title.trim(), description: description.trim() });
      if (res.ok) { toast.success("Task updated"); setIsEditing(false); onUpdated(); }
      else toast.error("Failed to update task");
    } catch { toast.error("Network error"); }
    finally { setLoading(false); }
  }

  /* ── Edit mode ─────────────────────────────────────── */
  if (isEditing) {
    return (
      <div
        className="card"
        style={{
          padding: "16px",
          borderColor: "var(--gold)",
          boxShadow: "0 0 0 3px var(--gold-dim)",
          opacity: 0,
          animation: `cardIn 0.4s ease ${animDelay}ms forwards`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input
            type="text" value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200} className="input-base"
            placeholder="Task title" style={{ fontSize: "13px" }}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000} rows={3} className="input-base"
            placeholder="Task description"
            style={{ fontSize: "13px", resize: "none" }}
          />
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleSaveEdit}
              disabled={loading || !title.trim()}
              className="btn-gold font-display"
              style={{ padding: "7px 16px", borderRadius: "8px", fontSize: "9px", letterSpacing: "1.5px" }}
            >
              {loading ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => { setIsEditing(false); setTitle(task.title); setDescription(task.description); }}
              style={{
                padding: "7px 16px", borderRadius: "8px", fontSize: "13px",
                background: "var(--surface2)", color: "var(--text2)", border: "none", cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Card view ─────────────────────────────────────── */
  return (
    <div
      className="card"
      style={{
        padding: "13px 14px 13px 18px",
        display: "flex", alignItems: "flex-start", gap: "12px",
        cursor: "default", position: "relative",
        opacity: 0,
        animation: `cardIn 0.4s ease ${animDelay}ms forwards`,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
    >
      {/* Status bar */}
      <div
        style={{
          position: "absolute", left: 0, top: "20%", bottom: "20%",
          width: "3px", borderRadius: "0 2px 2px 0",
          background: isPending ? "var(--gold)" : "var(--green)",
          boxShadow: isPending ? "0 0 8px var(--gold-glow)" : "0 0 8px rgba(0,232,150,0.35)",
        }}
      />

      {/* Check circle */}
      <div
        style={{
          width: "20px", height: "20px", borderRadius: "6px",
          border: `2px solid ${isPending ? "rgba(201,168,76,0.35)" : "var(--green)"}`,
          background: isPending ? "transparent" : "var(--green-dim)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, marginTop: "1px", fontSize: "11px",
          color: isPending ? "transparent" : "var(--green)",
        }}
      >
        {!isPending && "✓"}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--font-rajdhani), sans-serif",
            fontSize: "14px", fontWeight: 600,
            color: isPending ? "var(--text)" : "var(--text3)",
            textDecoration: isPending ? "none" : "line-through",
            lineHeight: 1.4,
          }}
        >
          {task.title}
        </div>
        {task.description && (
          <div
            style={{
              fontFamily: "var(--font-rajdhani), sans-serif",
              fontSize: "12px", color: "var(--text3)",
              marginTop: "2px", lineHeight: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {task.description}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "7px", marginTop: "8px", flexWrap: "wrap" }}>
          {/* Status pill */}
          <span
            style={{
              fontFamily: "var(--font-rajdhani), sans-serif",
              fontSize: "10px", fontWeight: 600, letterSpacing: "0.3px",
              borderRadius: "100px", padding: "2px 8px", border: "1px solid",
              background: isPending ? "var(--gold-dim)" : "var(--green-dim)",
              color: isPending ? "var(--gold)" : "var(--green)",
              borderColor: isPending ? "rgba(201,168,76,0.28)" : "rgba(0,232,150,0.28)",
            }}
          >
            {isPending ? "Pending" : "Completed"}
          </span>
          {/* Date */}
          <span
            style={{
              display: "flex", alignItems: "center", gap: "4px",
              fontFamily: "var(--font-rajdhani), sans-serif",
              fontSize: "10px", color: "var(--text3)",
            }}
          >
            <Calendar size={10} />
            {createdDate}
          </span>
        </div>
      </div>

      {/* 3-dot menu */}
      <div ref={menuRef} style={{ position: "relative", alignSelf: "center" }}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            width: "28px", height: "28px",
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: "6px", background: "transparent", border: "none",
            color: "var(--text3)", cursor: "pointer",
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface2)"; e.currentTarget.style.color = "var(--gold)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text3)"; }}
        >
          <MoreVertical size={14} />
        </button>

        {menuOpen && (
          <div
            style={{
              position: "absolute", right: 0, top: "32px", zIndex: 50,
              minWidth: "148px",
              background: "var(--surface2)", border: "1px solid var(--border)",
              borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
              overflow: "hidden",
            }}
          >
            {[
              { label: "Edit",     color: "var(--text2)", hoverBg: "var(--surface3)",          action: () => { setIsEditing(true); setMenuOpen(false); } },
              ...(isPending ? [{ label: "Complete", color: "var(--green)", hoverBg: "var(--green-dim)", action: handleComplete }] : []),
              { label: "Delete",   color: "var(--red)",   hoverBg: "var(--red-dim)",            action: handleDelete },
            ].map(({ label, color, hoverBg, action }) => (
              <button
                key={label} onClick={action} disabled={loading}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  width: "100%", padding: "9px 14px",
                  fontFamily: "var(--font-rajdhani), sans-serif",
                  fontSize: "13px", fontWeight: 500, color,
                  background: "transparent", border: "none",
                  cursor: "pointer", textAlign: "left",
                  opacity: loading ? 0.5 : 1,
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = hoverBg; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                {label === "Edit" && <Edit3 size={13} />}
                {label === "Complete" && <CheckCircle size={13} />}
                {label === "Delete" && <Trash2 size={13} />}
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
