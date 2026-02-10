import React, { useState, useRef, useEffect } from "react";
import { useChatStore } from "../stores/useChatStore";
import api from "../services/api";
import { fetchTTS } from "../services/tts";
import { startSTT } from "../services/stt";
import MessageBubble from "./MessageBubble";

export default function ChatWindow() {
  const messages = useChatStore((s) => s.messages);
  const addMessage = useChatStore((s) => s.addMessage);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const [lastAudioUrl, setLastAudioUrl] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scroller.current?.scrollTo({
      top: scroller.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, typing]);

  async function send() {
    if (!input.trim()) return;
    const userMsg = {
      id: Date.now().toString(),
      role: "user" as const,
      text: input,
      ts: Date.now(),
    };
    addMessage(userMsg);
    setInput("");
    setTyping(true);

    try {
      const res = await api.post("/api/chat", {
        sessionId: "demo-session",
        userId: "demo-user",
        input: userMsg.text,
      });
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        text: res.text ?? res?.message ?? "...",
        ts: Date.now(),
      };
      addMessage(assistantMsg);
      // request TTS for assistant reply (best-effort)
      try {
        const blob = await fetchTTS(assistantMsg.text);
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.play().catch(() => {});
        setLastAudioUrl(url);
      } catch (e) {
        console.warn("TTS request failed", e);
      }
    } catch (err: any) {
      const errMsg = {
        id: (Date.now() + 2).toString(),
        role: "assistant" as const,
        text: `Error: ${err?.message ?? "Server error"}`,
        ts: Date.now(),
      };
      addMessage(errMsg);
    } finally {
      setTyping(false);
    }
  }

  async function handleVoiceRecord() {
    if (recording) return;
    setRecording(true);
    try {
      const transcript = await startSTT();
      setInput(transcript);
    } catch (err: any) {
      console.error("STT failed:", err?.message);
      const msg = {
        id: Date.now().toString(),
        role: "assistant" as const,
        text: `Voice input not available: ${err?.message}`,
        ts: Date.now(),
      };
      addMessage(msg);
    } finally {
      setRecording(false);
    }
  }

  function handlePlayLast() {
    if (!lastAudioUrl) return;
    const audio = new Audio(lastAudioUrl);
    audio.play().catch(() => {});
  }

  return (
    <div
      style={{
        width: 560,
        borderRadius: 16,
        background: "linear-gradient(180deg, #f9fafb, #ffffff)",
        boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
        border: "1px solid rgba(0,0,0,0.05)",
        overflow: "hidden",
        fontFamily: "Inter, system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
      aria-label="Anuva AI Companion chat"
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          background: "linear-gradient(90deg, #4f46e5, #c7d2fe)",
          color: "#fff",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 16,
        }}
      >
        🤖 Anuva
        <span style={{ fontSize: 12, opacity: 0.85 }}>online</span>
      </div>

      {/* Messages */}
      <div
        ref={scroller}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 16,
          background: "#f3f4f6",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            role={m.role}
            text={m.text}
            isUser={m.role === "user"}
          />
        ))}

        {typing && (
          <div
            style={{
              fontStyle: "italic",
              color: "#6b7280",
              marginTop: 6,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            ✨ Anuva is thinking
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                background: "#6366f1",
                borderRadius: "50%",
                animation: "bounce 0.6s infinite alternate",
              }}
            />
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                background: "#6366f1",
                borderRadius: "50%",
                animation: "bounce 0.6s infinite alternate 0.2s",
              }}
            />
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                background: "#6366f1",
                borderRadius: "50%",
                animation: "bounce 0.6s infinite alternate 0.4s",
              }}
            />
          </div>
        )}

        {recording && (
          <div style={{ fontStyle: "italic", color: "#ef4444", marginTop: 6 }}>
            🎙️ Listening…
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div
        style={{
          padding: 12,
          background: "#fff",
          display: "flex",
          gap: 10,
          alignItems: "center",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        {/* Voice Button */}
        <button
          onClick={handleVoiceRecord}
          disabled={recording}
          title="Speak"
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: "none",
            background: recording ? "#fee2e2" : "#eef2ff",
            cursor: recording ? "not-allowed" : "pointer",
            fontSize: 20,
          }}
        >
          {recording ? "🎙️" : "🎤"}
        </button>

        {/* Play Button */}
        <button
          onClick={handlePlayLast}
          disabled={!lastAudioUrl}
          title="Play last response"
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: "none",
            background: lastAudioUrl ? "#ecfeff" : "#f3f4f6",
            cursor: lastAudioUrl ? "pointer" : "not-allowed",
            opacity: lastAudioUrl ? 1 : 0.4,
            fontSize: 18,
          }}
        >
          🔊
        </button>

        {/* Text Input */}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !typing) send();
          }}
          placeholder="Type or speak…"
          style={{
            flex: 1,
            padding: "10px 16px",
            borderRadius: 999,
            border: "1px solid #d1d5db",
            outline: "none",
            fontSize: 14,
            fontWeight: 500,
          }}
        />

        {/* Send */}
        <button
          onClick={send}
          disabled={typing || !input.trim()}
          style={{
            padding: "10px 16px",
            borderRadius: 999,
            border: "none",
            background:
              typing || !input.trim()
                ? "#e5e7eb"
                : "linear-gradient(90deg, #4f46e5, #c7d2fe)",
            color: "#fff",
            cursor: typing || !input.trim() ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          Send
        </button>
      </div>

      {/* Typing animation keyframes */}
      <style>{`
    @keyframes bounce {
      from { transform: translateY(0); opacity: 0.6; }
      to { transform: translateY(-6px); opacity: 1; }
    }
  `}</style>
    </div>
  );
}
