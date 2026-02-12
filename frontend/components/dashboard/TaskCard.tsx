"use client";

import { useState, useRef, useEffect } from "react";
import {
  MoreVertical,
  Edit3,
  Trash2,
  CheckCircle,
  Clock,
  Calendar,
} from "lucide-react";
import { api } from "@/lib/api";

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
}

export function TaskCard({ task, onUpdated }: TaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isPending = task.status === "pending";
  const createdDate = new Date(task.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleComplete() {
    setLoading(true);
    try {
      await api.patch(`/api/tasks/${task.id}`, { status: "completed" });
      onUpdated();
    } finally {
      setLoading(false);
      setMenuOpen(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this task permanently?")) return;
    setLoading(true);
    try {
      await api.delete(`/api/tasks/${task.id}`);
      onUpdated();
    } finally {
      setLoading(false);
      setMenuOpen(false);
    }
  }

  async function handleSaveEdit() {
    if (!title.trim() || !description.trim()) return;
    setLoading(true);
    try {
      await api.patch(`/api/tasks/${task.id}`, {
        title: title.trim(),
        description: description.trim(),
      });
      setIsEditing(false);
      onUpdated();
    } finally {
      setLoading(false);
    }
  }

  if (isEditing) {
    return (
      <div className="rounded-xl border border-indigo-200 bg-white p-5 shadow-sm dark:border-indigo-800 dark:bg-gray-800">
        <div className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="Task title"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            rows={3}
            className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
            placeholder="Task description"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={loading || !title.trim() || !description.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setTitle(task.title);
                setDescription(task.description);
              }}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-gray-800 ${
        isPending
          ? "border-gray-100 dark:border-gray-700"
          : "border-emerald-100 dark:border-emerald-900/50"
      }`}
    >
      {/* Top row: status badge + menu */}
      <div className="mb-3 flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            isPending
              ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          }`}
        >
          {isPending ? (
            <Clock className="h-3 w-3" />
          ) : (
            <CheckCircle className="h-3 w-3" />
          )}
          {isPending ? "Pending" : "Completed"}
        </span>

        {/* 3-dot menu */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-1.5 text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-10 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800">
              <button
                onClick={() => {
                  setIsEditing(true);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Edit3 className="h-4 w-4" />
                Edit
              </button>
              {isPending && (
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                >
                  <CheckCircle className="h-4 w-4" />
                  Complete
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/30"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h3
        className={`text-base font-semibold ${
          isPending
            ? "text-gray-900 dark:text-white"
            : "text-gray-400 line-through dark:text-gray-500"
        }`}
      >
        {task.title}
      </h3>

      {/* Description */}
      <p className="mt-1.5 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
        {task.description}
      </p>

      {/* Footer: date */}
      <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
        <Calendar className="h-3.5 w-3.5" />
        {createdDate}
      </div>
    </div>
  );
}
