"use client";

import { useState } from "react";
import { Menu, Search, Bell, Sun, Moon } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

interface TopBarProps {
  onMenuClick: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function TopBar({ onMenuClick, searchQuery, onSearchChange }: TopBarProps) {
  const { session } = useAuth();
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const userName = session?.user?.name || session?.user?.email?.split("@")[0] || "User";
  const initials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }

  return (
    <header className="flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-900 sm:px-6">
      {/* Hamburger (mobile) */}
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Date (hidden on mobile) */}
      <div className="hidden text-sm text-gray-500 dark:text-gray-400 md:block">
        {today}
      </div>

      {/* Search */}
      <div className="relative ml-auto max-w-md flex-1 sm:flex-initial">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-indigo-400 dark:focus:bg-gray-800 sm:w-72"
        />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          aria-label="Toggle theme"
        >
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* Avatar */}
        <div className="ml-1 hidden h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300 sm:flex">
          {initials}
        </div>
      </div>
    </header>
  );
}
