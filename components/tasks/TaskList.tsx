"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { TaskItem } from "./TaskItem";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface TaskListProps {
  statusFilter?: string;
  searchQuery?: string;
  refreshTrigger: number;
}

export function TaskList({ statusFilter, searchQuery, refreshTrigger }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (searchQuery && searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }

      const queryStr = params.toString();
      const url = `/api/tasks${queryStr ? `?${queryStr}` : ""}`;
      const res = await api.get(url);

      if (!res.ok) {
        if (res.status === 401) {
          setError("Session expired. Please log in again.");
          return;
        }
        setError("Failed to load tasks");
        return;
      }

      const data: Task[] = await res.json();
      setTasks(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, refreshTrigger]);

  if (loading) {
    return <p className="py-8 text-center text-gray-500">Loading tasks...</p>;
  }

  if (error) {
    return <p className="py-8 text-center text-red-600 dark:text-red-400">{error}</p>;
  }

  if (tasks.length === 0) {
    return (
      <p className="py-8 text-center text-gray-500 dark:text-gray-400">
        {searchQuery || statusFilter ? "No matching tasks" : "No tasks yet. Add one above!"}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} onUpdated={fetchTasks} />
      ))}
    </div>
  );
}
