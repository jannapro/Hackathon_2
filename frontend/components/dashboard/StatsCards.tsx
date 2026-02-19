"use client";

import { useEffect, useRef } from "react";

interface StatsCardsProps {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
}

interface StatConfig {
  id: string;
  label: string;
  value: number;
  suffix?: string;
  icon: string;
  color: string;
  bg: string;
  delay: number;
}

function useCountUp(target: number, duration = 1200) {
  const ref = useRef<HTMLSpanElement>(null);
  const prevTarget = useRef<number>(-1);

  useEffect(() => {
    if (!ref.current || prevTarget.current === target) return;
    prevTarget.current = target;

    const el = ref.current;
    const start = performance.now();
    const from = 0;

    function frame(now: number) {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3); // ease-out cubic
      el.textContent = String(Math.round(from + (target - from) * ease));
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }, [target, duration]);

  return ref;
}

function StatCard({ stat, index }: { stat: StatConfig; index: number }) {
  const numRef = useCountUp(stat.value);

  return (
    <div
      className="card"
      style={{
        padding: "20px 18px 18px",
        cursor: "pointer",
        opacity: 0,
        animation: `cardIn 0.45s ease ${stat.delay}ms forwards`,
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {/* Icon box */}
      <div
        style={{
          width: "42px", height: "42px", borderRadius: "11px",
          background: stat.bg,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "19px", marginBottom: "14px",
        }}
      >
        <span style={{ color: stat.color }}>{stat.icon}</span>
      </div>

      {/* Number */}
      <div
        style={{
          fontFamily: "var(--font-rajdhani), sans-serif",
          fontSize: "52px", fontWeight: 700,
          lineHeight: 1, letterSpacing: "-1px",
          color: stat.color,
        }}
      >
        <span ref={numRef}>0</span>
        {stat.suffix && (
          <span style={{ fontSize: "32px", marginLeft: "2px" }}>{stat.suffix}</span>
        )}
      </div>

      {/* Label */}
      <div
        style={{
          fontFamily: "var(--font-cinzel), serif",
          fontSize: "8px", letterSpacing: "2.5px",
          textTransform: "uppercase",
          color: "var(--text3)", marginTop: "8px",
        }}
      >
        {stat.label}
      </div>
    </div>
  );
}

export function StatsCards({ totalTasks, completedTasks, pendingTasks }: StatsCardsProps) {
  const rate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const stats: StatConfig[] = [
    { id: "total",     label: "Total Tasks",      value: totalTasks,     icon: "✦", color: "var(--text)", bg: "var(--gold-dim)", delay: 80  },
    { id: "completed", label: "Completed",         value: completedTasks, icon: "✓", color: "var(--text)", bg: "var(--gold-dim)", delay: 180 },
    { id: "pending",   label: "Pending",           value: pendingTasks,   icon: "◷", color: "var(--text)", bg: "var(--gold-dim)", delay: 280 },
    { id: "rate",      label: "Completion Rate",   value: rate, suffix: "%", icon: "◎", color: "var(--text)", bg: "var(--gold-dim)", delay: 380 },
  ];

  return (
    <div className="stats-grid">
      {stats.map((stat, i) => (
        <StatCard key={stat.id} stat={stat} index={i} />
      ))}
    </div>
  );
}
