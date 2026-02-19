"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/providers/ToastProvider";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
}

export function AddTaskModal({ isOpen, onClose, onTaskCreated }: AddTaskModalProps) {
  const { toast } = useToast();
  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const t = title.trim();
    const d = description.trim();

    if (!t) { setError("Title is required"); return; }
    if (t.length > 200) { setError("Title must be 200 characters or fewer"); return; }
    if (!d) { setError("Description is required"); return; }
    if (d.length > 1000) { setError("Description must be 1000 characters or fewer"); return; }

    setLoading(true);
    try {
      const res = await api.post("/api/tasks/", { title: t, description: d });
      if (!res.ok) {
        const data = await res.json();
        setError(data.detail?.[0]?.message || data.detail || "Failed to create task");
        return;
      }
      setTitle("");
      setDescription("");
      toast.success("Task created!");
      onTaskCreated();
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Modal */}
      <div
        className="animate-fade-in"
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: "480px",
          margin: "0 16px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 32px 64px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "var(--gold-dim)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "15px",
              }}
            >
              ✦
            </div>
            <h2
              style={{
                fontFamily: "var(--font-cinzel), serif",
                fontSize: "13px", letterSpacing: "2px",
                textTransform: "uppercase",
                color: "var(--gold)",
              }}
            >
              New Task
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "28px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "6px",
              background: "transparent",
              border: "none",
              color: "var(--text3)",
              cursor: "pointer",
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Title */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--text2)",
                marginBottom: "6px",
              }}
            >
              Title
            </label>
            <input
              type="text"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              autoFocus
              className="input-base"
              style={{ fontSize: "13px" }}
            />
            <p style={{ marginTop: "4px", textAlign: "right", fontSize: "11px", color: "var(--text3)" }}>
              {title.length}/200
            </p>
          </div>

          {/* Description */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--text2)",
                marginBottom: "6px",
              }}
            >
              Description
            </label>
            <textarea
              placeholder="Add details about this task…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={4}
              className="input-base"
              style={{ fontSize: "13px", resize: "none" }}
            />
            <p style={{ marginTop: "4px", textAlign: "right", fontSize: "11px", color: "var(--text3)" }}>
              {description.length}/1000
            </p>
          </div>

          {/* Error */}
          {error && (
            <p
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.2)",
                fontSize: "13px",
                color: "#EF4444",
              }}
            >
              {error}
            </p>
          )}

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "4px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "9px 18px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--text2)",
                background: "var(--surface2)",
                border: "none",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-gold font-display"
              style={{
                padding: "9px 20px",
                borderRadius: "8px",
                fontSize: "9px",
                letterSpacing: "1.5px",
              }}
            >
              {loading ? "Creating…" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
