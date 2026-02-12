"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Settings,
  LogOut,
  X,
  ChevronLeft,
} from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Tasks", href: "/dashboard", icon: CheckSquare },
  { label: "Calendar", href: "/dashboard", icon: Calendar, disabled: true },
  { label: "Settings", href: "/dashboard", icon: Settings, disabled: true },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { session } = useAuth();

  const userName = session?.user?.name || session?.user?.email?.split("@")[0] || "User";
  const userEmail = session?.user?.email || "";
  const initials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleLogout() {
    await signOut();
    router.push("/");
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#1e1b4b] text-white transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
              <CheckSquare className="h-4.5 w-4.5" />
            </div>
            <span className="text-lg font-bold tracking-tight">TaskFlow</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-white/10 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4 flex-1 space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href && !item.disabled;
            return (
              <Link
                key={item.label}
                href={item.disabled ? "#" : item.href}
                onClick={(e) => {
                  if (item.disabled) e.preventDefault();
                  else onClose();
                }}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : item.disabled
                      ? "cursor-not-allowed text-indigo-300/50"
                      : "text-indigo-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.label}
                {item.disabled && (
                  <span className="ml-auto rounded bg-indigo-400/20 px-1.5 py-0.5 text-[10px] font-medium text-indigo-300">
                    Soon
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-sm font-bold">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{userName}</p>
              <p className="truncate text-xs text-indigo-300">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-indigo-200 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
