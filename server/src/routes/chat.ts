import { Router } from 'express';
import { getFetch } from '../lib/fetcher';
import { getShortTerm, pushShortTerm } from '../lib/memory';
import { buildPrompt, enforceSafety } from '../lib/llm';
import { enforceSafetyPost, sanitizeResponse } from '../lib/safety';
import { searchFacts } from '../lib/longterm';

const router = Router();

// Mock conversation for testing/fallback (realistic multi-turn dialogue)
const mockConversation = [
  { "role": "user", "text": "Hey Anuva, I feel stuck today.", "ts": 1676021010000 },
  { "role": "assistant", "text": "I hear you. Can you tell me a little more about what's making you feel stuck?", "ts": 1676021025000 },
  { "role": "user", "text": "I've been trying to focus on work, but I keep getting distracted.", "ts": 1676021050000 },
  { "role": "assistant", "text": "Distractions are tough. Sometimes breaking tasks into really small steps helps. What's the next small thing you could do right now?", "ts": 1676021065000 },
  { "role": "user", "text": "Maybe just start by organizing my desk.", "ts": 1676021090000 },
  { "role": "assistant", "text": "Perfect! Organizing your space can clear mental clutter too. How long will you spend on it?", "ts": 1676021105000 },
  { "role": "user", "text": "I'll try 10 minutes.", "ts": 1676021120000 },
  { "role": "assistant", "text": "Great! Small wins add up. After that, maybe reward yourself with a short break or a stretch.", "ts": 1676021135000 },
  { "role": "user", "text": "That sounds doable.", "ts": 1676021150000 },
  { "role": "assistant", "text": "Exactly! Sometimes the trick is just starting. How have you been sleeping lately?", "ts": 1676021165000 },
  { "role": "user", "text": "Not great, maybe 5–6 hours.", "ts": 1676021180000 },
  { "role": "assistant", "text": "Sleep really affects focus. Maybe a short wind-down routine before bed could help. Would you like some ideas?", "ts": 1676021195000 },
  { "role": "user", "text": "Yes, please.", "ts": 1676021210000 },
  { "role": "assistant", "text": "Try this: 1) dim lights 30 min before sleep, 2) avoid screens, 3) jot down 3 things you're grateful for, 4) breathe deeply for 2–3 minutes.", "ts": 1676021225000 },
  { "role": "user", "text": "I like that, it feels simple enough.", "ts": 1676021240000 },
  { "role": "assistant", "text": "Exactly — small changes are often the most sustainable. How's your mood today on a scale of 1–10?", "ts": 1676021255000 },
  { "role": "user", "text": "Around 6, I guess.", "ts": 1676021270000 },
  { "role": "assistant", "text": "That's fair. Even acknowledging your feelings is progress. Have you done anything recently that made you happy?", "ts": 1676021285000 },
  { "role": "user", "text": "I went for a short walk this morning.", "ts": 1676021300000 },
  { "role": "assistant", "text": "Nice! Walking is a great reset. Did you notice anything interesting outside?", "ts": 1676021315000 },
  { "role": "user", "text": "Some birds and flowers, it was peaceful.", "ts": 1676021330000 },
  { "role": "assistant", "text": "Beautiful — those little moments can really boost your mood. Maybe you could do a 5-min walk break later today too.", "ts": 1676021345000 },
  { "role": "user", "text": "I will try that.", "ts": 1676021360000 },
  { "role": "assistant", "text": "Perfect! Remember, progress is about consistency, not perfection. How about we set a small goal for the next hour?", "ts": 1676021375000 },
  { "role": "user", "text": "I'll finish the first draft of my notes.", "ts": 1676021390000 },
  { "role": "assistant", "text": "Great! That's specific and achievable. I'll be here if you want to reflect afterward.", "ts": 1676021405000 }
];

// Track mock conversation index per session to provide realistic flow (only assistant messages)
const mockSessionIndex: { [key: string]: number } = {};

function getMockResponse(sessionId: string): string {
  if (!mockSessionIndex[sessionId]) {
    mockSessionIndex[sessionId] = 1; // Start at first assistant response (index 1)
  }
  
  const idx = mockSessionIndex[sessionId];
  if (idx < mockConversation.length) {
    const msg = mockConversation[idx].text;
    mockSessionIndex[sessionId] += 2; // Skip to next assistant message (skip user messages)
    return msg;
  }
  
  // Cycle back to beginning if we run out
  mockSessionIndex[sessionId] = 3; // Next assistant after first one
  return mockConversation[1].text;
}

router.post('/', async (req, res) => {
  const { sessionId, userId, input, useTTS } = req.body as { sessionId: string; userId: string; input: string; useTTS?: boolean };
  if (!sessionId || !userId || !input) return res.status(400).json({ error: 'missing parameters' });

  // Save user input to short-term memory
  await pushShortTerm(sessionId, { role: 'user', text: input, ts: Date.now() });
  
  // Retrieve short-term messages and long-term facts
  const short = await getShortTerm(sessionId, 30);
  const facts = await searchFacts(userId, input, 3);
  const longFacts = facts.map(f => `${f.key}: ${f.value}`);
  
  // Build prompt with personality, safety, and memory
  const { system, messages } = buildPrompt({ short, longFacts, userId, input });

  // Pre-filter: check user input for unsafe content
  if (enforceSafety(input)) {
    const safeReply = "I appreciate you reaching out. I'm here to support your growth and well-being. Let's focus on something constructive.";
    await pushShortTerm(sessionId, { role: 'assistant', text: safeReply, ts: Date.now() });
    return res.status(200).json({ text: safeReply });
  }

  // If no API key, use mock mode
  if (!process.env.OPENAI_API_KEY) {
    console.log('[MOCK] No OPENAI_API_KEY set — using mock response');
    const mockReply = getMockResponse(sessionId);
    await pushShortTerm(sessionId, { role: 'assistant', text: mockReply, ts: Date.now() });
    return res.status(200).json({ text: mockReply });
  }

  try {
    const fetch = await getFetch();
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'system', content: system }, ...messages],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('OpenAI API error:', errText);
      
      // Fallback: use mock response on any API error
      console.log('[MOCK] OpenAI API failed — using mock response');
      const mockReply = getMockResponse(sessionId);
      await pushShortTerm(sessionId, { role: 'assistant', text: mockReply, ts: Date.now() });
      return res.status(200).json({ text: mockReply });
    }

    const data = await resp.json();
    let assistantText = data?.choices?.[0]?.message?.content ?? 'Sorry, something went wrong.';

    // Post-filter: enforce safety on LLM response
    if (enforceSafetyPost(assistantText)) {
      console.warn('[safety] flagged LLM response, sanitizing');
      assistantText = sanitizeResponse(assistantText);
    }

    // Save assistant reply to short-term memory
    await pushShortTerm(sessionId, { role: 'assistant', text: assistantText, ts: Date.now() });

    return res.status(200).json({ text: assistantText });
  } catch (err: any) {
    console.error('LLM call failed', err?.message ?? err);
    
    // Fallback: use mock response on any error
    console.log('[MOCK] LLM call failed — using mock response');
    const mockReply = getMockResponse(sessionId);
    await pushShortTerm(sessionId, { role: 'assistant', text: mockReply, ts: Date.now() });
    return res.status(200).json({ text: mockReply });
  }
});

export default router;
