"use client";

import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        flexDirection: isUser ? "row-reverse" : "row",
        alignItems: "flex-end",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: "26px",
          height: "26px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: isUser
            ? "linear-gradient(135deg,#10B981,#059669)"
            : "var(--surface3)",
          color: isUser ? "#fff" : "var(--text2)",
        }}
      >
        {isUser ? <User size={12} /> : <Bot size={12} />}
      </div>

      {/* Bubble */}
      <div
        style={{
          maxWidth: "78%",
          padding: "9px 13px",
          borderRadius: "12px",
          borderBottomLeftRadius: isUser ? "12px" : "2px",
          borderBottomRightRadius: isUser ? "2px" : "12px",
          fontSize: "13px",
          lineHeight: 1.55,
          background: isUser ? "#10B981" : "var(--surface2)",
          color: isUser ? "#fff" : "var(--text)",
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
        }}
      >
        {content}
      </div>
    </div>
  );
}
