import { Router } from 'express';
import { getFetch } from '../lib/fetcher';

const router = Router();

// POST /api/tts
// body: { text: string, voiceId?: string }
// Proxies ElevenLabs TTS and returns audio/mpeg
router.post('/', async (req, res) => {
  const { text, voiceId } = req.body as { text?: string; voiceId?: string };
  if (!text) return res.status(400).json({ error: 'missing text' });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const vid = voiceId || process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey || !vid) return res.status(500).json({ error: 'TTS not configured (ELEVENLABS_API_KEY or VOICE_ID missing)' });

  try {
    const fetch = await getFetch();
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(vid)}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({ text })
    });

    if (!r.ok) {
      const txt = await r.text();
      return res.status(502).json({ error: 'tts_provider_error', detail: txt });
    }

    const arrayBuffer = await r.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length.toString());
    return res.send(buffer);
  } catch (err: any) {
    console.error('TTS proxy error', err?.message ?? err);
    return res.status(500).json({ error: 'tts_error' });
  }
});

export default router;
