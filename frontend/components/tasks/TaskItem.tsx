"use client";

import { useState } from "react";
import { api } from "@/lib/api";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface TaskItemProps {
  task: Task;
  onUpdated: () => void;
}

export function TaskItem({ task, onUpdated }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [loading, setLoading] = useState(false);

  async function handleComplete() {
    setLoading(true);
    try {
      await api.patch(`/api/tasks/${task.id}`, { status: "completed" });
      onUpdated();
    } finally {
      setLoading(false);
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
    }
  }

  async function handleSaveEdit() {
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

  const isPending = task.status === "pending";

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      {isEditing ? (
        <div className="space-y-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            className="block w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            rows={2}
            className="block w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={loading}
              className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setTitle(task.title);
                setDescription(task.description);
              }}
              className="rounded bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className={`font-semibold ${task.status === "completed" ? "text-gray-400 line-through" : "text-gray-900 dark:text-white"}`}>
                {task.title}
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {task.description}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isPending
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              }`}
            >
              {isPending ? "Pending" : "Done"}
            </span>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="rounded bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Edit
            </button>
            {isPending && (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="rounded bg-green-100 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"
              >
                Complete
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={loading}
              className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-50 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
