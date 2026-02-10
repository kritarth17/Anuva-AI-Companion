import create from 'zustand'

export type Message = { id: string; role: 'user' | 'assistant'; text: string; ts: number };

type ChatState = {
  messages: Message[];
  addMessage: (m: Message) => void;
  clear: () => void;
};

export const useChatStore = create<ChatState>(set => ({
  messages: [],
  addMessage: (m) => set(s => ({ messages: [...s.messages, m] })),
  clear: () => set({ messages: [] })
}));
