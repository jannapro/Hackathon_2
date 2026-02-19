"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { CheckCircle2, XCircle, AlertCircle, Info, X } from "lucide-react";

/* ─── Types ────────────────────────────────────────────── */

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  exiting?: boolean;
}

interface ToastContextType {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
  };
}

/* ─── Context ──────────────────────────────────────────── */

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

/* ─── Config ───────────────────────────────────────────── */

const ICONS: Record<ToastType, React.ElementType> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const ACCENT: Record<ToastType, string> = {
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
};

const DURATION = 4000;

/* ─── Provider ─────────────────────────────────────────── */

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Auto-remove after DURATION
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      const oldest = toasts[0];
      if (!oldest.exiting) {
        setToasts((prev) =>
          prev.map((t) => (t.id === oldest.id ? { ...t, exiting: true } : t))
        );
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== oldest.id));
        }, 300); // exit animation duration
      }
    }, DURATION);
    return () => clearTimeout(timer);
  }, [toasts]);

  const add = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev.slice(-4), { id, type, message }]);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const toast = {
    success: (message: string) => add("success", message),
    error: (message: string) => add("error", message),
    warning: (message: string) => add("warning", message),
    info: (message: string) => add("info", message),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast stack — fixed top-right */}
      {toasts.length > 0 && (
        <div
          style={{
            position: "fixed",
            top: "16px",
            right: "16px",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            maxWidth: "360px",
            width: "calc(100vw - 32px)",
            pointerEvents: "none",
          }}
        >
          {toasts.map((t) => {
            const Icon = ICONS[t.type];
            const accent = ACCENT[t.type];
            return (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: "var(--surface)",
                  border: `1px solid ${accent}40`,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  animation: t.exiting
                    ? "toastOut 0.3s ease forwards"
                    : "toastIn 0.3s ease",
                  pointerEvents: "all",
                }}
              >
                <Icon
                  size={16}
                  style={{ flexShrink: 0, marginTop: "1px", color: accent }}
                />
                <p
                  style={{
                    flex: 1,
                    fontSize: "13px",
                    color: "var(--text)",
                    lineHeight: 1.45,
                  }}
                >
                  {t.message}
                </p>
                <button
                  onClick={() => remove(t.id)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text3)",
                    padding: 0,
                    display: "flex",
                    flexShrink: 0,
                    marginTop: "1px",
                  }}
                >
                  <X size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Keyframes injected once */}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(16px); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
