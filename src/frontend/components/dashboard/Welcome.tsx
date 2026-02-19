"use client";

import { Plus } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

interface WelcomeProps {
  totalTasks: number;
  completedTasks: number;
  onAddTask: () => void;
}

export function Welcome({ totalTasks, completedTasks, onAddTask }: WelcomeProps) {
  const { session } = useAuth();
  const userName = session?.user?.name || session?.user?.email?.split("@")[0] || "User";
  const pendingTasks = totalTasks - completedTasks;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {greeting}, {userName}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {totalTasks === 0
            ? "You have no tasks yet. Create one to get started!"
            : `You have ${pendingTasks} pending task${pendingTasks !== 1 ? "s" : ""} and ${completedTasks} completed.`}
        </p>
      </div>
      <button
        onClick={onAddTask}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      >
        <Plus className="h-4 w-4" />
        Add Task
      </button>
    </div>
  );
}
