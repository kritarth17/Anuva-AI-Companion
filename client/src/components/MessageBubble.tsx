import React from 'react';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  text: string;
}

export default function MessageBubble({ role, text }: MessageBubbleProps) {
  const isUser = role === 'user';
  return (
    <div
      style={{
        marginBottom: 10,
        padding: '10px 14px',
        borderRadius: 18,
        background: isUser
          ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
          : '#ffffff',
        color: isUser ? '#fff' : '#111827',
        maxWidth: '75%',
        marginLeft: isUser ? 'auto' : 0,
        boxShadow: isUser
          ? '0 6px 16px rgba(99,102,241,0.35)'
          : '0 4px 12px rgba(0,0,0,0.08)',
        fontSize: 14,
        lineHeight: 1.45,
        animation: 'fadeInUp 0.2s ease-out',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
      }}
    >
      {text}
    </div>
  );
}