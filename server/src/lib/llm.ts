export type ShortMsg = {
  role: string;
  text: string;
  ts?: number;
};

export function buildPrompt({ short, longFacts, userId, input }: any) {
  
  // Updated system prompt
  const system = `
You are Anuva, a thoughtful, supportive AI companion.
- Be reflective, curious, and engaging.
- Respond naturally to the user input; avoid repeating generic sentences.
- Reference user's previous messages or facts when relevant.
- Ask follow-up questions to keep the conversation flowing.
- Keep responses concise, clear, and helpful.
- Never simulate romantic or exclusive relationships.
- Encourage real-world action, learning, and safety.
`;

  const memorySnippet = (longFacts || [])
    .slice(0, 5)
    .map((f: any) => `- ${f}`)
    .join('\n');

  const messages = [
    {
      role: 'system',
      content: system + (memorySnippet ? `\nUser facts:\n${memorySnippet}` : ''),
    },
    ...(short || []).map((m: ShortMsg) => ({ role: m.role, content: m.text })),
    { role: 'user', content: input },
  ];

  return { system, messages };
}

export function enforceSafety(text: string): boolean {
  if (!text) return false;
  const bannedPatterns = [ /suicid/i, /self[- ]harm/i, /kill/i, /romanc/i, /exclusive relationship/i, /sex/i ];
  return bannedPatterns.some(rx => rx.test(text));
}
