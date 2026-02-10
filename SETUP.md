# AI Companion — Full Setup Guide

## Overview

A supportive, non-romantic AI companion with text chat, voice I/O (STT/TTS), short-term and long-term memory, and safety guardrails. 

**Features:**
- ✅ Text chat via Next.js UI
- ✅ Speech-to-text (browser Web Speech API)
- ✅ Text-to-speech (ElevenLabs proxy)
- ✅ Short-term memory (Redis or in-memory)
- ✅ Long-term memory stubs (ready for vector DB integration)
- ✅ Pre/post safety filters (non-romantic, no harm)
- ✅ Personality injection (supportive, reflective, curious)

---

## Quick Start

### 1. Clone / Setup Environment

```bash
cd /Users/kritarth/Projects/VibeCoding/web

# Copy env template to server
cp server/.env.example server/.env
```

### 2. Configure `server/.env`

Edit `server/.env` and add:

```
OPENAI_API_KEY=your-openai-key
ELEVENLABS_API_KEY=your-elevenlabs-key
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM  # or your preferred voice
REDIS_URL=                                  # optional; leave blank for in-memory
PORT=4000
```

**Get API keys:**
- **OpenAI:** https://platform.openai.com/api-keys
- **ElevenLabs:** https://elevenlabs.io/app/speech-synthesis (free tier available)

### 3. Install Dependencies

```bash
# Root workspace install (optional, both client and server auto-install)
pnpm install

# Or install individually:
cd client && pnpm install
cd ../server && pnpm install
```

### 4. Start Server

```bash
cd server
pnpm dev
```

You should see:
```
Server listening on 4000
[ioredis] REDIS_URL not set — using in-memory store
```

### 5. Start Client (new terminal)

```bash
cd client
pnpm dev
```

You should see:
```
> next dev
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### 6. Open UI

Navigate to: **http://localhost:3000**

---

## Usage

### Text Chat
1. Type a message in the input field.
2. Press Enter or click "Send".
3. Wait for the AI response (should appear in the chat bubble).
4. Assistant's reply will auto-play as audio (if TTS is configured).

### Voice Input
1. Click the **🎙️** button (left of input).
2. Speak clearly into your microphone.
3. Your speech is transcribed and inserted into the input field.
4. Press Enter to send.

### Audio Playback
1. Click the **🔊** button to replay the last assistant message as audio.

---

## Architecture

```
/web
├── client/                  # Next.js React app
│   ├── src/
│   │   ├── pages/
│   │   │   ├── _app.tsx     # Root app
│   │   │   └── index.tsx    # Chat page
│   │   ├── components/
│   │   │   ├── ChatWindow.tsx   # Main UI
│   │   │   └── MessageBubble.tsx
│   │   ├── services/
│   │   │   ├── api.ts       # HTTP wrapper
│   │   │   ├── tts.ts       # TTS client
│   │   │   └── stt.ts       # STT client
│   │   ├── stores/
│   │   │   └── useChatStore.ts  # Zustand state
│   │   └── styles/globals.css
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.js
│
├── server/                  # Express.js backend
│   ├── src/
│   │   ├── index.ts         # Server entry
│   │   ├── routes/
│   │   │   ├── chat.ts      # /api/chat endpoint
│   │   │   └── tts.ts       # /api/tts endpoint (proxy)
│   │   └── lib/
│   │       ├── llm.ts       # Prompt builder & pre-filter
│   │       ├── safety.ts    # Post-filter & sanitize
│   │       ├── memory.ts    # Short-term (Redis/in-mem)
│   │       ├── longterm.ts  # Long-term (stubs)
│   │       └── fetcher.ts   # Dynamic fetch helper
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                 # (created from .env.example)
│   └── .env.example
│
└── package.json             # Root workspace
```

---

## API Endpoints

### POST `/api/chat`

Request:
```json
{
  "sessionId": "demo-session",
  "userId": "demo-user",
  "input": "Hello, how are you?",
  "useTTS": true
}
```

Response:
```json
{
  "text": "I'm doing well, thanks for asking! How can I support you today?"
}
```

**Pre-filters:** Input checked for harmful content (suicide, violence, romantic requests).  
**Post-filters:** LLM response checked and sanitized if unsafe.

### POST `/api/tts`

Request:
```json
{
  "text": "Hello world",
  "voiceId": "21m00Tcm4TlvDq8ikWAM"
}
```

Response: Binary MP3 audio (CORS-enabled).

---

## Memory Systems

### Short-Term Memory
- **Storage:** Redis (if `REDIS_URL` set) or in-memory map.
- **Capacity:** Last 30 messages per session (auto-expires after 7 days in Redis).
- **Used for:** Context injection into LLM prompt.

### Long-Term Memory
- **Current:** In-memory key-value store (for demo).
- **Schema:** `{ userId, key, value, embedding?, createdAt }`.
- **Future:** PostgreSQL + vector DB (Pinecone/Weaviate) for semantic search.
- **API:** `saveFact(userId, key, value)`, `searchFacts(userId, query)`, `getFacts(userId)`.

---

## Safety & Personality

### Pre-Filter (User Input)
Blocks requests about:
- Suicide, self-harm, violence
- Romantic/sexual content
- Exclusive relationships

### Post-Filter (LLM Response)
Flags and sanitizes AI responses:
- `i love you` → `I care about you`
- `romantic` → `supportive`
- Removes sexual references

### System Prompt (Personality)
The AI is instructed to be:
- **Supportive** and non-judgmental
- **Calm** and reflective
- **Curious** about user goals
- **Never romantic** or creating emotional exclusivity
- Encourages real-world interaction

---

## Extending the System

### Add Vector DB (Long-Term Memory)
1. Install client: `npm install pinecone-client` (or Weaviate/FAISS).
2. In `server/src/lib/longterm.ts`:
   - Implement `generateEmbedding(text)` using OpenAI Embeddings API.
   - Upsert facts + embeddings to Pinecone.
   - Update `searchFacts()` to use vector similarity search.

### Switch TTS Provider
1. Edit `server/src/routes/tts.ts`.
2. Replace ElevenLabs URL/headers with Google TTS or Azure Speech.
3. Update env vars in `.env`.

### Add STT Backend (Server-Side)
1. Create `server/src/routes/stt.ts` (POST endpoint).
2. Proxy to Whisper API or Google Speech-to-Text.
3. Update `client/src/services/stt.ts` to call server endpoint instead of browser API.

### Database Schema (When Ready)

PostgreSQL:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_facts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  key TEXT,
  value TEXT,
  embedding_id TEXT,  -- Pinecone vector ID
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP
);

CREATE TABLE messages (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES sessions(id),
  role TEXT,
  text TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Troubleshooting

### Server won't start: "REDIS_URL not set"
- This is normal! Server uses in-memory storage by default.
- To use persistent Redis: install locally (`brew install redis && brew services start redis`) or set `REDIS_URL` in `.env`.

### TTS not playing
- Check `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` in `server/.env`.
- Test endpoint: `curl -X POST http://localhost:4000/api/tts -H 'Content-Type: application/json' -d '{"text":"hello"}'`.

### STT not recognizing speech
- Browser must support Web Speech API (Chrome, Edge, Safari).
- Check microphone permissions in browser.
- Console logs will show `[STT] listening...` when active.

### LLM responses seem off
- Ensure `OPENAI_API_KEY` is valid and has quota.
- Check `server/src/lib/llm.ts` system prompt — tweak personality traits.

---

## Next Steps

- [ ] Integrate vector DB for semantic fact retrieval.
- [ ] Add user authentication & multi-user sessions.
- [ ] Implement journaling prompts & mood tracking.
- [ ] Add daily reminders / proactive messaging.
- [ ] Deploy to production (Vercel + Cloud Run / Railway).
- [ ] Add unit & integration tests.
- [ ] Mobile app (React Native / Flutter).

---

**Happy building!** 🚀

