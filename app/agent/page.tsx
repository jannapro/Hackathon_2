"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { fetchChatHistory, sendChatMessage } from "@/lib/api";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const CHIPS = [
  "List my tasks",
  "Add task: Review project",
  "Complete all tasks",
  "Delete completed tasks",
  "How many tasks are pending?",
];

export default function AgentPage() {
  const { session, isPending } = useAuth();
  const router = useRouter();
  const [messages, setMessages]     = useState<Message[]>([]);
  const [inputVal, setInputVal]     = useState("");
  const [sending, setSending]       = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isPending && !session?.user) router.push("/");
  }, [isPending, session, router]);

  useEffect(() => {
    if (!session?.user) return;
    fetchChatHistory()
      .then((data) => {
        setMessages(
          data.messages.map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
          }))
        );
      })
      .catch(() => {})
      .finally(() => setHistoryLoaded(true));
  }, [session]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = async (text?: string) => {
    const t = (text ?? inputVal).trim();
    if (!t || sending) return;
    setInputVal("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: t }]);
    setSending(true);
    try {
      const data = await sendChatMessage(t);
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", content: data.response },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setSending(false);
    }
  };

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  if (isPending) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg)", gap: "12px", color: "var(--text3)" }}>
        <Loader2 size={20} className="animate-spin" />
        <span style={{ fontSize: "14px" }}>Loading…</span>
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      {/* Background grid */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden", backgroundImage: `linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)`, backgroundSize: "52px 52px", animation: "gridDrift 24s linear infinite" }} />
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", background: `radial-gradient(ellipse 60% 40% at 50% -10%, var(--aurora-gold) 0%, transparent 60%), radial-gradient(ellipse 40% 50% at 100% 30%, var(--aurora-cyan) 0%, transparent 55%), radial-gradient(ellipse 35% 45% at 0% 70%, var(--aurora-rose) 0%, transparent 55%)`, animation: "auroraPulse 12s ease-in-out infinite" }} />

      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div className="main-offset" style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        <TopBar searchQuery="" onSearchChange={() => {}} onMenuToggle={() => setMobileNavOpen((v) => !v)} />

        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "28px 32px 28px" }}>
          {/* Page header */}
          <div style={{ marginBottom: "20px", flexShrink: 0 }}>
            <h1 style={{ fontFamily: "var(--font-cinzel), serif", fontSize: "20px", fontWeight: 700, letterSpacing: "1px", color: "var(--text)", marginBottom: "5px" }}>
              AI Agent
            </h1>
            <p style={{ fontFamily: "var(--font-rajdhani), sans-serif", fontSize: "13px", color: "var(--text3)" }}>
              Manage your tasks with natural language — powered by TaskFlow AI
            </p>
          </div>

          {/* Chat card */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRadius: "16px", border: "1px solid var(--border)", background: "var(--surface)", overflow: "hidden", position: "relative", zIndex: 1, minHeight: 0 }}>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "14px", minHeight: 0 }}>
              {!historyLoaded ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", border: "2px solid var(--border2)", borderTopColor: "var(--gold)", animation: "agentSpin 0.8s linear infinite" }} />
                </div>
              ) : messages.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "12px", textAlign: "center" }}>
                  <div style={{ width: "68px", height: "68px", borderRadius: "50%", background: "var(--gold-dim)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "30px", boxShadow: "0 0 24px rgba(201,168,76,0.2)" }}>
                    ⚡
                  </div>
                  <p style={{ fontFamily: "var(--font-cinzel), serif", fontSize: "13px", letterSpacing: "2px", color: "var(--text2)", textTransform: "uppercase" }}>
                    TaskFlow Assistant
                  </p>
                  <p style={{ fontFamily: "var(--font-rajdhani), sans-serif", fontSize: "14px", color: "var(--text3)", lineHeight: 1.6, maxWidth: "380px" }}>
                    Ask me to add, complete, delete, or list your tasks — I understand plain English.
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", marginTop: "10px" }}>
                    {CHIPS.map((chip) => (
                      <button
                        key={chip}
                        onClick={() => handleSend(chip)}
                        style={{ fontFamily: "var(--font-rajdhani), sans-serif", fontSize: "12px", color: "var(--gold)", border: "1px solid var(--border)", borderRadius: "100px", padding: "5px 14px", cursor: "pointer", background: "var(--gold-dim)", transition: "border-color 0.2s, background 0.2s" }}
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
                      <div key={m.id} style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexDirection: isUser ? "row-reverse" : "row" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0, background: isUser ? "linear-gradient(135deg,#c9a84c,#00d4ff)" : "linear-gradient(135deg,#c9a84c,#f0d060)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-cinzel), serif", fontSize: isUser ? "8px" : "15px", color: "#08080f", fontWeight: 700 }}>
                          {isUser ? "ME" : "⚡"}
                        </div>
                        <div style={{ maxWidth: "70%", padding: "11px 16px", fontFamily: "var(--font-rajdhani), sans-serif", fontSize: "14px", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word", borderRadius: "16px", borderBottomLeftRadius: isUser ? "16px" : "4px", borderBottomRightRadius: isUser ? "4px" : "16px", background: isUser ? "linear-gradient(135deg,#8a6010,#c9a84c)" : "var(--surface2)", color: isUser ? "#080810" : "var(--text)", border: isUser ? "none" : "1px solid var(--border)" }}>
                          {m.content}
                        </div>
                      </div>
                    );
                  })}

                  {sending && (
                    <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg,#c9a84c,#f0d060)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", flexShrink: 0 }}>⚡</div>
                      <div style={{ padding: "12px 16px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "16px", borderBottomLeftRadius: "4px", display: "flex", gap: "5px", alignItems: "center" }}>
                        {[0, 160, 320].map((delay) => (
                          <span key={delay} style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--text3)", display: "inline-block", animation: `agentDotBounce 1s ease-in-out ${delay}ms infinite` }} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)", display: "flex", gap: "10px", alignItems: "flex-end", flexShrink: 0, background: "var(--surface2)" }}>
              <textarea
                ref={textareaRef}
                value={inputVal}
                onChange={(e) => { setInputVal(e.target.value); autoResize(e.target); }}
                onKeyDown={handleKeyDown}
                placeholder="Ask me to manage your tasks… (Enter to send, Shift+Enter for new line)"
                rows={1}
                style={{ flex: 1, minHeight: "42px", maxHeight: "120px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "10px 14px", fontFamily: "var(--font-rajdhani), sans-serif", fontSize: "14px", color: "var(--text)", resize: "none", outline: "none", lineHeight: 1.5, transition: "border-color 0.2s, box-shadow 0.2s" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.boxShadow = "0 0 0 2px var(--gold-dim)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
              />
              <button
                onClick={() => handleSend()}
                disabled={sending || !inputVal.trim()}
                style={{ width: "42px", height: "42px", borderRadius: "11px", flexShrink: 0, background: "linear-gradient(135deg,#8a6010,#c9a84c,#f0d060)", border: "none", cursor: "pointer", fontSize: "17px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 12px rgba(201,168,76,0.3)", transition: "transform 0.15s, box-shadow 0.15s, opacity 0.15s", opacity: (sending || !inputVal.trim()) ? 0.4 : 1 }}
                onMouseEnter={(e) => { if (!sending && inputVal.trim()) { e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = "0 4px 18px rgba(201,168,76,0.5)"; } }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(201,168,76,0.3)"; }}
              >
                ➤
              </button>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        @keyframes agentDotBounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes agentSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
