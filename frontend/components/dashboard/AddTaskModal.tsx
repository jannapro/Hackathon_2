"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
}

export function AddTaskModal({ isOpen, onClose, onTaskCreated }: AddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();

    if (!trimmedTitle) {
      setError("Title is required");
      return;
    }
    if (trimmedTitle.length > 200) {
      setError("Title must be 200 characters or fewer");
      return;
    }
    if (!trimmedDesc) {
      setError("Description is required");
      return;
    }
    if (trimmedDesc.length > 1000) {
      setError("Description must be 1000 characters or fewer");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/tasks/", {
        title: trimmedTitle,
        description: trimmedDesc,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(
          data.detail?.[0]?.message || data.detail || "Failed to create task"
        );
        return;
      }

      setTitle("");
      setDescription("");
      onTaskCreated();
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 mx-4 w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Create New Task
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Title
            </label>
            <input
              type="text"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              autoFocus
              className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 dark:focus:border-indigo-400"
            />
            <p className="mt-1 text-right text-xs text-gray-400">
              {title.length}/200
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              placeholder="Add details about this task..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={4}
              className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:placeholder-gray-500 dark:focus:border-indigo-400"
            />
            <p className="mt-1 text-right text-xs text-gray-400">
              {description.length}/1000
            </p>
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
