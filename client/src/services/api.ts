const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

async function post(path: string, body: any) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || 'network error');
  }
  return res.json();
}

export default { post };
