"use client";

import { useRef, KeyboardEvent } from "react";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const value = textareaRef.current?.value.trim() ?? "";
    if (!value || disabled) return;
    onSend(value);
    if (textareaRef.current) {
      textareaRef.current.value = "";
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: "8px",
        padding: "12px 14px",
        borderTop: "1px solid var(--border)",
        background: "var(--surface)",
        flexShrink: 0,
      }}
    >
      <textarea
        ref={textareaRef}
        rows={1}
        placeholder="Ask me anything about your tasks…"
        disabled={disabled}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        style={{
          flex: 1,
          resize: "none",
          minHeight: "36px",
          maxHeight: "120px",
          padding: "8px 12px",
          borderRadius: "10px",
          background: "var(--surface2)",
          border: "1px solid var(--border)",
          color: "var(--text)",
          fontSize: "13px",
          fontFamily: "var(--font-dmsans), system-ui, sans-serif",
          outline: "none",
          transition: "border-color 0.15s",
          opacity: disabled ? 0.5 : 1,
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = "#10B981"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
      />
      <button
        onClick={handleSend}
        disabled={disabled}
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "9px",
          background: "linear-gradient(135deg,#10B981,#059669)",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
          flexShrink: 0,
          transition: "opacity 0.15s",
        }}
        aria-label="Send message"
      >
        {disabled ? (
          <Loader2 size={13} color="#fff" className="animate-spin" />
        ) : (
          <Send size={13} color="#fff" />
        )}
      </button>
    </div>
  );
}
