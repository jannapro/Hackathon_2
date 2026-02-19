"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const NAV = [
  { label: "Dashboard", icon: "⬡", href: "/dashboard" },
  { label: "All Tasks",  icon: "✦", href: "/tasks" },
  { label: "AI Agent",   icon: "◈", href: null, soon: false, disabled: true },
  { label: "Calendar",   icon: "△", href: null, soon: true },
  { label: "Settings",   icon: "◇", href: null, soon: true },
];

function getInitials(name?: string | null, email?: string | null) {
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return email ? email.slice(0, 2).toUpperCase() : "?";
}

// Sidebar always uses dark palette regardless of app theme
const S = {
  bg:        "#080810",
  border:    "rgba(201,168,76,0.28)",
  gold:      "#c9a84c",
  goldDim:   "rgba(201,168,76,0.11)",
  goldBdr:   "rgba(201,168,76,0.25)",
  text:      "#7a6a55",
  textMuted: "#4a4030",
  textGold:  "#c9a84c",
};

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { session } = useAuth();
  const router = useRouter();
  const user = session?.user;

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}
    <aside
      className={`sidebar-responsive${mobileOpen ? " sidebar-open" : ""}`}
      style={{
        width: "260px",
        flexShrink: 0,
        height: "100vh",
        position: "fixed",
        top: 0, left: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--sidebar-bg)",
        borderRight: `1px solid ${S.border}`,
        zIndex: 40,
        overflow: "hidden",
      }}
    >
      {/* Scan line */}
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0,
          height: "2px", overflow: "hidden", zIndex: 20,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute", top: 0,
            width: "60%", height: "100%",
            background: "linear-gradient(90deg, transparent, #c9a84c, transparent)",
            animation: "scanLine 5s ease-in-out infinite",
            left: 0,
          }}
        />
      </div>

      {/* Logo */}
      <div
        style={{
          padding: "22px 18px 18px",
          display: "flex", alignItems: "center", gap: "13px",
          borderBottom: "1px solid rgba(201,168,76,0.14)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "46px", height: "46px",
            borderRadius: "12px",
            background: "linear-gradient(135deg,#8a6010,#c9a84c,#f0d060,#c9a84c,#8a6010)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "23px", flexShrink: 0,
            animation: "logoPulse 3.5s ease-in-out infinite",
            cursor: "pointer",
          }}
        >
          ⚡
        </div>
        <div style={{ overflow: "hidden" }}>
          <div
            style={{
              fontFamily: "var(--font-cinzel), serif",
              fontSize: "15px", fontWeight: 700, letterSpacing: "2px",
              background: "linear-gradient(135deg,#f5df80,#c9a84c,#edd060,#c9a84c,#f5df80)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              lineHeight: 1.1, whiteSpace: "nowrap",
            }}
          >
            TaskFlow
          </div>
          <div
            style={{
              fontFamily: "var(--font-rajdhani), sans-serif",
              fontSize: "9px", letterSpacing: "2.5px",
              textTransform: "uppercase", color: "#4a4030",
              marginTop: "3px",
            }}
          >
            Command Your Day
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "14px 10px", display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto" }}>
        <div
          style={{
            fontFamily: "var(--font-cinzel), serif",
            fontSize: "7px", letterSpacing: "3px", color: "#302820",
            textTransform: "uppercase", padding: "10px 10px 4px",
          }}
        >
          Workspace
        </div>

        {NAV.map(({ label, icon, href, soon, disabled }) => {
          const active = href ? pathname.startsWith(href) : false;

          if (href) {
            return (
              <Link key={label} href={href} className={`nav-item ${active ? "active" : ""}`}>
                {/* Hover sweep */}
                <span
                  style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(90deg,transparent,rgba(201,168,76,0.11),transparent)",
                    transform: "translateX(-100%)",
                    pointerEvents: "none", zIndex: 1,
                  }}
                  className="nav-sweep-inner"
                />
                <span style={{ fontSize: "15px", width: "20px", textAlign: "center", flexShrink: 0, position: "relative", zIndex: 3 }}>{icon}</span>
                <span
                  style={{
                    fontFamily: "var(--font-cinzel), serif",
                    fontSize: "9px", letterSpacing: "2px", textTransform: "uppercase",
                    color: active ? S.gold : S.text,
                    flex: 1, position: "relative", zIndex: 3,
                    transition: "color 0.2s",
                  }}
                >
                  {label}
                </span>
              </Link>
            );
          }

          return (
            <button
              key={label}
              className="nav-item"
              disabled
              style={{ opacity: soon ? 0.55 : 0.45, cursor: "default" }}
            >
              <span style={{ fontSize: "15px", width: "20px", textAlign: "center", flexShrink: 0 }}>{icon}</span>
              <span
                style={{
                  fontFamily: "var(--font-cinzel), serif",
                  fontSize: "9px", letterSpacing: "2px", textTransform: "uppercase",
                  color: S.text, flex: 1,
                }}
              >
                {label}
              </span>
              {soon && (
                <span
                  style={{
                    fontFamily: "var(--font-rajdhani), sans-serif",
                    fontSize: "7.5px", letterSpacing: "1px", textTransform: "uppercase",
                    color: "#4a4030",
                    border: "1px solid rgba(201,168,76,0.25)",
                    borderRadius: "4px", padding: "1px 5px",
                  }}
                >
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User card */}
      <div style={{ padding: "8px 10px 4px", borderTop: "1px solid rgba(201,168,76,0.12)" }}>
        <div
          style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "10px 11px", borderRadius: "10px",
            border: "1px solid rgba(201,168,76,0.14)",
            cursor: "pointer",
            transition: "background 0.2s, border-color 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,0.07)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.35)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.14)";
          }}
        >
          <div
            style={{
              width: "34px", height: "34px", borderRadius: "50%",
              background: "linear-gradient(135deg,#8a6010,#c9a84c,#f0d060)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-cinzel), serif",
              fontSize: "11px", fontWeight: 700, color: "#08080f",
              border: "2px solid rgba(201,168,76,0.4)",
              flexShrink: 0,
            }}
          >
            {getInitials(user?.name, user?.email)}
          </div>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <div
              style={{
                fontFamily: "var(--font-cinzel), serif",
                fontSize: "9.5px", letterSpacing: "0.8px",
                color: S.gold, whiteSpace: "nowrap",
                overflow: "hidden", textOverflow: "ellipsis",
              }}
            >
              {user?.name || "User"}
            </div>
            <div
              style={{
                fontFamily: "var(--font-rajdhani), sans-serif",
                fontSize: "10px", color: "#4a4030",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}
            >
              {user?.email}
            </div>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "7px 13px", margin: "4px 0 12px",
            borderRadius: "8px", cursor: "pointer",
            border: "none", background: "transparent",
            color: "#4a4030",
            fontFamily: "var(--font-cinzel), serif",
            fontSize: "8px", letterSpacing: "1.5px", textTransform: "uppercase",
            width: "100%",
            transition: "background 0.2s, color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,58,92,0.12)";
            e.currentTarget.style.color = "#ff3a5c";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#4a4030";
          }}
        >
          <span>↩</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
    </>
  );
}
