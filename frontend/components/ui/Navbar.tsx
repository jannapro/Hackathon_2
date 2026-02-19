"use client";

import { AuthButton } from "@/components/auth/AuthButton";
import { Logo } from "@/components/ui/Logo";
import { ThemeButton } from "@/components/ui/ThemeButton";

export function Navbar() {
  return (
    <nav className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <a href="/">
          <Logo />
        </a>
        <div className="flex items-center gap-3">
          <ThemeButton />
          <AuthButton />
        </div>
      </div>
    </nav>
  );
}
