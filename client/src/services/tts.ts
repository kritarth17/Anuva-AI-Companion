const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

export async function fetchTTS(text: string) {
  const res = await fetch(`${API_BASE}/api/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || 'tts error');
  }
  const blob = await res.blob();
  return blob;
}
