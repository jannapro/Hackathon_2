"use client";

import { CheckCircle2, Clock, ListTodo, TrendingUp } from "lucide-react";

interface StatsCardsProps {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
}

export function StatsCards({ totalTasks, completedTasks, pendingTasks }: StatsCardsProps) {
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const stats = [
    {
      label: "Total Tasks",
      value: totalTasks,
      icon: ListTodo,
      bg: "bg-blue-50 dark:bg-blue-900/30",
      iconBg: "bg-blue-100 dark:bg-blue-900",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Completed",
      value: completedTasks,
      icon: CheckCircle2,
      bg: "bg-emerald-50 dark:bg-emerald-900/30",
      iconBg: "bg-emerald-100 dark:bg-emerald-900",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Pending",
      value: pendingTasks,
      icon: Clock,
      bg: "bg-amber-50 dark:bg-amber-900/30",
      iconBg: "bg-amber-100 dark:bg-amber-900",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Completion Rate",
      value: `${completionRate}%`,
      icon: TrendingUp,
      bg: "bg-purple-50 dark:bg-purple-900/30",
      iconBg: "bg-purple-100 dark:bg-purple-900",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`rounded-xl border border-gray-100 ${stat.bg} p-4 dark:border-gray-700`}
        >
          <div className="flex items-center gap-3">
            <div className={`rounded-lg ${stat.iconBg} p-2`}>
              <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {stat.label}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
