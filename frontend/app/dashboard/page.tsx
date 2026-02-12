"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { api } from "@/lib/api";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { Welcome } from "@/components/dashboard/Welcome";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { FilterTabs } from "@/components/dashboard/FilterTabs";
import { TaskCard } from "@/components/dashboard/TaskCard";
import { ProgressRing } from "@/components/dashboard/ProgressRing";
import { AddTaskModal } from "@/components/dashboard/AddTaskModal";

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

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Initialize theme on mount
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (
      stored === "dark" ||
      (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/");
    }
  }, [isPending, session, router]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/tasks/");
      if (!res.ok) {
        if (res.status === 401) {
          setError("Session expired. Please log in again.");
          return;
        }
        setError("Failed to load tasks");
        return;
      }
      const data: Task[] = await res.json();
      setAllTasks(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchTasks();
    }
  }, [session, fetchTasks]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          <span className="text-gray-500 dark:text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  // Derived stats from all tasks
  const completedTasks = allTasks.filter((t) => t.status === "completed");
  const pendingTasks = allTasks.filter((t) => t.status === "pending");

  // Filter + search for display
  const filteredTasks = allTasks.filter((task) => {
    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Separate pending and completed for display
  const displayPending = filteredTasks.filter((t) => t.status === "pending");
  const displayCompleted = filteredTasks.filter(
    (t) => t.status === "completed"
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col lg:ml-64">
        {/* TopBar */}
        <TopBar
          onMenuClick={() => setSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Welcome section */}
          <Welcome
            totalTasks={allTasks.length}
            completedTasks={completedTasks.length}
            onAddTask={() => setModalOpen(true)}
          />

          {/* Stats cards */}
          <div className="mt-6">
            <StatsCards
              totalTasks={allTasks.length}
              completedTasks={completedTasks.length}
              pendingTasks={pendingTasks.length}
            />
          </div>

          {/* Progress overview */}
          {allTasks.length > 0 && (
            <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Task Progress
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-8 sm:justify-start">
                <ProgressRing
                  label="Completed"
                  value={completedTasks.length}
                  total={allTasks.length}
                  color="#10b981"
                  bgColor="#d1fae5"
                />
                <ProgressRing
                  label="Pending"
                  value={pendingTasks.length}
                  total={allTasks.length}
                  color="#f59e0b"
                  bgColor="#fef3c7"
                />
              </div>
            </div>
          )}

          {/* Filter tabs */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <FilterTabs
              activeFilter={statusFilter}
              onFilterChange={setStatusFilter}
              counts={{
                all: allTasks.length,
                pending: pendingTasks.length,
                completed: completedTasks.length,
              }}
            />
          </div>

          {/* Task content */}
          <div className="mt-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/20">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="rounded-xl border border-gray-100 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
                <p className="text-gray-400 dark:text-gray-500">
                  {searchQuery || statusFilter !== "all"
                    ? "No matching tasks found"
                    : "No tasks yet. Click \"Add Task\" to get started!"}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Pending tasks */}
                {displayPending.length > 0 && (
                  <div>
                    {statusFilter === "all" && (
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        Pending ({displayPending.length})
                      </h3>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {displayPending.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onUpdated={fetchTasks}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed tasks */}
                {displayCompleted.length > 0 && (
                  <div>
                    {statusFilter === "all" && (
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        Completed ({displayCompleted.length})
                      </h3>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {displayCompleted.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onUpdated={fetchTasks}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onTaskCreated={fetchTasks}
      />
    </div>
  );
}
