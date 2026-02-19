"use client";

interface Task {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

interface AnalyticsPanelProps {
  tasks: Task[];
}

/* ── Progress ring (SVG) ─────────────────────────────── */
function Ring({
  pct,
  color,
  size = 80,
  stroke = 7,
  label,
  sub,
}: {
  pct: number;
  color: string;
  size?: number;
  stroke?: number;
  label: string;
  sub: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const cx = size / 2;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--surface2)" strokeWidth={stroke} />
          <circle
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            className="font-heading"
            style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}
          >
            {pct}%
          </span>
        </div>
      </div>
      <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text2)" }}>{label}</p>
      <p style={{ fontSize: "11px", color: "var(--text3)" }}>{sub}</p>
    </div>
  );
}

/* ── Weekly bar chart ────────────────────────────────── */
function WeeklyBars({ tasks }: { tasks: Task[] }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Build counts per day-of-week for the last 7 days
  const counts = new Array(7).fill(0);
  const now = new Date();
  tasks.forEach((t) => {
    const d = new Date(t.created_at);
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diff >= 0 && diff < 7) {
      const dayIndex = (d.getDay() + 6) % 7; // Mon=0 ... Sun=6
      counts[dayIndex]++;
    }
  });

  const max = Math.max(...counts, 1);

  return (
    <div>
      <p
        style={{
          fontSize: "11px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          color: "var(--text3)",
          marginBottom: "12px",
        }}
      >
        Tasks added this week
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "8px",
          height: "60px",
        }}
      >
        {days.map((day, i) => {
          const pct = counts[i] / max;
          const isToday = (new Date().getDay() + 6) % 7 === i;
          return (
            <div
              key={day}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <div
                title={`${counts[i]} task${counts[i] !== 1 ? "s" : ""}`}
                style={{
                  width: "100%",
                  height: `${Math.max(pct * 48, 4)}px`,
                  borderRadius: "4px 4px 0 0",
                  background: isToday
                    ? "linear-gradient(180deg,var(--gold),#8a6010)"
                    : "var(--surface2)",
                  transition: "height 0.4s ease",
                }}
              />
              <span
                style={{
                  fontSize: "10px",
                  color: isToday ? "var(--gold)" : "var(--text3)",
                  fontWeight: isToday ? 600 : 400,
                }}
              >
                {day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Status distribution ─────────────────────────────── */
function StatusDistribution({ total, pending, completed }: { total: number; pending: number; completed: number }) {
  if (total === 0) return null;

  const segments = [
    { label: "Completed", count: completed, color: "var(--green)" },
    { label: "Pending",   count: pending,   color: "var(--gold)"  },
  ];

  let cumulativePct = 0;

  return (
    <div>
      <p
        style={{
          fontSize: "11px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          color: "var(--text3)",
          marginBottom: "12px",
        }}
      >
        Status distribution
      </p>

      {/* Bar */}
      <div
        style={{
          height: "8px",
          borderRadius: "99px",
          background: "var(--surface2)",
          overflow: "hidden",
          display: "flex",
          marginBottom: "12px",
        }}
      >
        {segments.map(({ label, count, color }) => {
          const pct = (count / total) * 100;
          const bar = (
            <div
              key={label}
              style={{
                width: `${pct}%`,
                background: color,
                transition: "width 0.5s ease",
              }}
            />
          );
          cumulativePct += pct;
          return bar;
        })}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {segments.map(({ label, count, color }) => (
          <div
            key={label}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: "12px", color: "var(--text2)" }}>{label}</span>
            </div>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)" }}>
              {count} <span style={{ fontWeight: 400, color: "var(--text3)" }}>/ {total}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────── */
export function AnalyticsPanel({ tasks }: AnalyticsPanelProps) {
  const total     = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const pending   = tasks.filter((t) => t.status === "pending").length;

  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const pendingPct    = total > 0 ? Math.round((pending   / total) * 100) : 0;

  return (
    <div
      className="card"
      style={{ padding: "20px 24px" }}
    >
      <h2
        style={{
          fontFamily: "var(--font-cinzel), serif",
          fontSize: "9px", letterSpacing: "3px",
          textTransform: "uppercase",
          color: "var(--gold)",
          marginBottom: "20px",
        }}
      >
        Analytics
      </h2>

      {total === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--text3)", textAlign: "center", padding: "16px 0" }}>
          No tasks yet — create one to see analytics.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Progress rings */}
          <div style={{ display: "flex", justifyContent: "space-around" }}>
            <Ring
              pct={completionPct}
              color="var(--green)"
              label="Completed"
              sub={`${completed} of ${total}`}
            />
            <Ring
              pct={pendingPct}
              color="var(--gold)"
              label="Pending"
              sub={`${pending} of ${total}`}
            />
          </div>

          {/* Status distribution */}
          <StatusDistribution total={total} pending={pending} completed={completed} />

          {/* Weekly bar chart */}
          <WeeklyBars tasks={tasks} />
        </div>
      )}
    </div>
  );
}
