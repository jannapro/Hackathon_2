"use client";

import { useEffect, useRef } from "react";
import { Search, Bell } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onMenuToggle?: () => void;
}

function getInitials(name?: string | null, email?: string | null) {
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return email ? email.slice(0, 2).toUpperCase() : "?";
}

export function TopBar({ searchQuery, onSearchChange, onMenuToggle }: TopBarProps) {
  const { session } = useAuth();
  const user = session?.user;
  const searchRef = useRef<HTMLInputElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const { dark, toggle } = useTheme();

  // "/" shortcut to focus search
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((document.activeElement as HTMLElement)?.tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  function handleToggle() {
    const btn = toggleRef.current;
    if (!btn) return;
    btn.classList.remove("toggle-spinning");
    void btn.offsetWidth;
    btn.classList.add("toggle-spinning");
    btn.addEventListener("animationend", () => btn.classList.remove("toggle-spinning"), { once: true });
    toggle();
  }

  return (
    <>
      {/* Inject spin animation once */}
      <style>{`
        .toggle-spinning { animation: toggleSpin 0.45s cubic-bezier(0.4,0,0.2,1) !important; }
      `}</style>

      <header
        style={{
          height: "58px",
          background: "var(--topbar-bg)",
          display: "flex", alignItems: "center",
          gap: "16px", padding: "0 24px",
          flexShrink: 0, zIndex: 20,
          position: "relative",
        }}
      >
        {/* Gold gradient bottom border */}
        <div
          style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: "2px",
            background: "linear-gradient(90deg, transparent 0%, var(--border-hover) 30%, var(--gold) 50%, var(--border-hover) 70%, transparent 100%)",
            transition: "background 0.4s ease",
          }}
        />

        {/* Hamburger — mobile only */}
        <button className="hamburger-btn" onClick={onMenuToggle} aria-label="Open menu">
          ☰
        </button>

        {/* Date — hidden on mobile */}
        <span
          className="topbar-date"
          style={{
            fontFamily: "var(--font-cinzel), serif",
            fontSize: "10px", letterSpacing: "1.5px",
            color: "var(--text3)", whiteSpace: "nowrap", flexShrink: 0,
          }}
        >
          {today}
        </span>

        {/* Search */}
        <div className="topbar-search" style={{ flex: 1, maxWidth: "380px", position: "relative" }}>
          <Search
            size={14}
            style={{
              position: "absolute", left: "14px", top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text3)", pointerEvents: "none",
            }}
          />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search tasks…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="input-base"
            style={{ paddingLeft: "38px", paddingRight: "44px", height: "36px", borderRadius: "100px", fontSize: "13px" }}
          />
          <span
            style={{
              position: "absolute", right: "12px", top: "50%",
              transform: "translateY(-50%)",
              fontFamily: "var(--font-rajdhani), sans-serif",
              fontSize: "9.5px", color: "var(--text3)",
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "4px", padding: "1px 5px",
            }}
          >
            /
          </span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {/* Theme toggle */}
          <button
            ref={toggleRef}
            onClick={handleToggle}
            aria-label="Toggle theme"
            style={{
              width: "36px", height: "36px", borderRadius: "8px",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "transparent", border: "1px solid transparent",
              color: "var(--text3)", cursor: "pointer",
              fontSize: "17px", lineHeight: 1,
              transition: "background 0.2s, color 0.2s, border-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--surface)";
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--gold)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "transparent";
              e.currentTarget.style.color = "var(--text3)";
            }}
          >
            {dark ? "☽" : "☀"}
          </button>

          {/* Bell */}
          <div style={{ position: "relative" }}>
            <button
              style={{
                width: "36px", height: "36px", borderRadius: "8px",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "transparent", border: "1px solid transparent",
                color: "var(--text3)", cursor: "pointer",
                transition: "background 0.2s, color 0.2s, border-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--surface)";
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--gold)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "transparent";
                e.currentTarget.style.color = "var(--text3)";
              }}
            >
              <Bell size={16} />
            </button>
            <span
              style={{
                position: "absolute", top: "7px", right: "7px",
                width: "7px", height: "7px", borderRadius: "50%",
                background: "var(--red)",
                border: "1.5px solid var(--topbar-bg)",
              }}
            />
          </div>

          {/* Avatar */}
          <div
            style={{
              width: "34px", height: "34px", borderRadius: "50%",
              background: "linear-gradient(135deg,#8a6010,#c9a84c,#f0d060)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-cinzel), serif",
              fontSize: "11px", fontWeight: 700, color: "#080810",
              border: "2px solid rgba(201,168,76,0.4)",
              marginLeft: "5px", cursor: "pointer",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--gold)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.4)"; }}
          >
            {getInitials(user?.name, user?.email)}
          </div>
        </div>
      </header>
    </>
  );
}
