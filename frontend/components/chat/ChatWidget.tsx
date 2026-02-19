"use client";

import { useState, useEffect, useRef } from "react";
import { X, Minimize2, MessageCircle } from "lucide-react";
import { fetchChatHistory, sendChatMessage } from "@/lib/api";
import { useTheme } from "@/components/providers/ThemeProvider";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatWidgetProps {
  onTaskMutated: () => void;
}

export function ChatWidget({ onTaskMutated }: ChatWidgetProps) {
  const { dark } = useTheme();
  const [open, setOpen]                   = useState(false);
  const [messages, setMessages]           = useState<Message[]>([]);
  const [sending, setSending]             = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [inputVal, setInputVal]           = useState("");
  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && !historyLoaded) {
      fetchChatHistory()
        .then((data) => {
          setMessages(data.messages.map((m: { id: string; role: string; content: string }) => ({
            id: m.id, role: m.role as "user" | "assistant", content: m.content,
          })));
        })
        .catch(() => {})
        .finally(() => setHistoryLoaded(true));
    }
  }, [open, historyLoaded]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending, open]);

  const handleSend = async (text?: string) => {
    const t = (text ?? inputVal).trim();
    if (!t || sending) return;
    setInputVal("");
    if (textareaRef.current) { textareaRef.current.style.height = "auto"; }
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: t }]);
    setSending(true);
    try {
      const data = await sendChatMessage(t);
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: "assistant", content: data.response }]);
      onTaskMutated();
    } catch {
      setMessages((prev) => [...prev, { id: `e-${Date.now()}`, role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setSending(false);
    }
  };

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 100) + "px";
  }

  return (
    <>
      <style>{`
        @keyframes dotBounce {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-5px); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Panel ── */}
      {open && (
        <div className="chat-panel">
          {/* Header */}
          <div
            style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "14px 16px",
              borderBottom: "1px solid var(--border)",
              background: "var(--surface2)", flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "34px", height: "34px", borderRadius: "50%",
                background: "linear-gradient(135deg,#c9a84c,#f0d060)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "16px", flexShrink: 0,
                boxShadow: "0 0 10px rgba(201,168,76,0.4)",
              }}
            >
              ⚡
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <p
                style={{
                  fontFamily: "var(--font-cinzel), serif",
                  fontSize: "11px", letterSpacing: "1.5px",
                  color: "var(--text)",
                }}
              >
                TaskFlow Assistant
              </p>
              <p style={{ fontFamily: "var(--font-rajdhani), sans-serif", fontSize: "10px", color: "var(--green)", marginTop: "1px" }}>
                ● Online · Powered by AI
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                width: "28px", height: "28px",
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: "6px", background: "transparent", border: "none",
                color: "var(--text3)", cursor: "pointer",
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface3)"; e.currentTarget.style.color = "var(--red)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text3)"; }}
            >
              <Minimize2 size={14} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {!historyLoaded ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid var(--border2)", borderTopColor: "var(--gold)", animation: "spin 0.8s linear infinite" }} />
              </div>
            ) : messages.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", padding: "28px 16px", textAlign: "center", flex: 1 }}>
                <div
                  style={{
                    width: "52px", height: "52px", borderRadius: "50%",
                    background: "var(--gold-dim)", border: "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "22px", marginBottom: "4px",
                  }}
                >
                  ⚡
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-cinzel), serif",
                    fontSize: "11px", letterSpacing: "1.5px",
                    color: "var(--text2)",
                  }}
                >
                  TaskFlow Assistant
                </p>
                <p style={{ fontFamily: "var(--font-rajdhani), sans-serif", fontSize: "12px", color: "var(--text3)", lineHeight: 1.5 }}>
                  Ask me to add, complete, delete,<br />or list your tasks naturally.
                </p>
                {/* Quick-send chips */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center", marginTop: "8px" }}>
                  {["List my tasks", "Show stats", "Help"].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleSend(chip)}
                      style={{
                        fontFamily: "var(--font-rajdhani), sans-serif",
                        fontSize: "11px", color: "var(--gold)",
                        border: "1px solid var(--border)",
                        borderRadius: "100px", padding: "4px 10px",
                        cursor: "pointer", background: "var(--gold-dim)",
                        transition: "border-color 0.2s, background 0.2s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.background = "rgba(201,168,76,0.18)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--gold-dim)"; }}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((m) => {
                  const isUser = m.role === "user";
                  return (
                    <div key={m.id} style={{ display: "flex", gap: "8px", alignItems: "flex-end", flexDirection: isUser ? "row-reverse" : "row" }}>
                      {/* Avatar */}
                      <div
                        style={{
                          width: "26px", height: "26px", borderRadius: "50%",
                          flexShrink: 0,
                          background: isUser ? "linear-gradient(135deg,#c9a84c,#00d4ff)" : "linear-gradient(135deg,#c9a84c,#f0d060)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "var(--font-cinzel), serif",
                          fontSize: isUser ? "9px" : "12px",
                          color: "#08080f",
                          fontWeight: 700,
                        }}
                      >
                        {isUser ? (
                          <span style={{ fontSize: "9px" }}>ME</span>
                        ) : "⚡"}
                      </div>
                      {/* Bubble */}
                      <div
                        style={{
                          maxWidth: "78%",
                          padding: "9px 13px",
                          fontFamily: "var(--font-rajdhani), sans-serif",
                          fontSize: "13px", lineHeight: 1.5,
                          whiteSpace: "pre-wrap", wordBreak: "break-word",
                          borderRadius: "14px",
                          borderBottomLeftRadius: isUser ? "14px" : "3px",
                          borderBottomRightRadius: isUser ? "3px" : "14px",
                          background: isUser
                            ? "linear-gradient(135deg,#8a6010,#c9a84c)"
                            : "var(--surface2)",
                          color: isUser ? "#080810" : "var(--text)",
                          border: isUser ? "none" : "1px solid var(--border)",
                        }}
                      >
                        {m.content}
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {sending && (
                  <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
                    <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "linear-gradient(135deg,#c9a84c,#f0d060)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0 }}>⚡</div>
                    <div style={{ padding: "10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "14px", borderBottomLeftRadius: "3px", display: "flex", gap: "4px", alignItems: "center" }}>
                      {[0, 160, 320].map((delay) => (
                        <span key={delay} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--text3)", display: "inline-block", animation: `dotBounce 1s ease-in-out ${delay}ms infinite` }} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: "12px 14px",
              borderTop: "1px solid var(--border)",
              display: "flex", gap: "8px", alignItems: "flex-end",
              flexShrink: 0, background: "var(--surface2)",
            }}
          >
            <textarea
              ref={textareaRef}
              value={inputVal}
              onChange={(e) => { setInputVal(e.target.value); autoResize(e.target); }}
              onKeyDown={handleKeyDown}
              placeholder="Ask me to manage your tasks…"
              rows={1}
              style={{
                flex: 1, minHeight: "36px", maxHeight: "100px",
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "10px", padding: "8px 12px",
                fontFamily: "var(--font-rajdhani), sans-serif",
                fontSize: "13px", color: "var(--text)",
                resize: "none", outline: "none", lineHeight: 1.5,
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.boxShadow = "0 0 0 2px var(--gold-dim)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
            />
            <button
              onClick={() => handleSend()}
              disabled={sending || !inputVal.trim()}
              style={{
                width: "36px", height: "36px", borderRadius: "9px", flexShrink: 0,
                background: "linear-gradient(135deg,#8a6010,#c9a84c,#f0d060)",
                border: "none", cursor: "pointer", fontSize: "15px",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 10px rgba(201,168,76,0.3)",
                transition: "transform 0.15s, box-shadow 0.15s, opacity 0.15s",
                opacity: (sending || !inputVal.trim()) ? 0.45 : 1,
              }}
              onMouseEnter={(e) => { if (!sending) { e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(201,168,76,0.5)"; } }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(201,168,76,0.3)"; }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* ── FAB ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`chat-fab${open ? " open" : ""}`}
        aria-label={open ? "Close chat" : "Open AI assistant"}
      >
        {open ? <X size={20} color={dark ? "#08080f" : "#fff"} /> : <MessageCircle size={22} color={dark ? "#08080f" : "#fff"} />}
      </button>
    </>
  );
}
