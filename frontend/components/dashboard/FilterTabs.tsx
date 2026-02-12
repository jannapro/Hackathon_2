"use client";

import { ListTodo, Clock, CheckCircle2 } from "lucide-react";

interface FilterTabsProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  counts: { all: number; pending: number; completed: number };
}

export function FilterTabs({ activeFilter, onFilterChange, counts }: FilterTabsProps) {
  const filters = [
    { label: "All Tasks", value: "all", icon: ListTodo, count: counts.all },
    { label: "Pending", value: "pending", icon: Clock, count: counts.pending },
    { label: "Completed", value: "completed", icon: CheckCircle2, count: counts.completed },
  ];

  return (
    <div className="flex gap-2">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
            activeFilter === filter.value
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          <filter.icon className="h-4 w-4" />
          <span className="hidden sm:inline">{filter.label}</span>
          <span
            className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
              activeFilter === filter.value
                ? "bg-white/20 text-white"
                : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
            }`}
          >
            {filter.count}
          </span>
        </button>
      ))}
    </div>
  );
}
