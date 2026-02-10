// Dynamic fetch provider: uses global fetch if available, otherwise dynamically imports undici.
let _fetchImpl: any = null;
export async function getFetch(): Promise<any> {
  if (_fetchImpl) return _fetchImpl;
  if (typeof globalThis.fetch === 'function') {
    _fetchImpl = globalThis.fetch.bind(globalThis);
    return _fetchImpl;
  }
  try {
    const undici = await import('undici');
    _fetchImpl = undici.fetch;
    return _fetchImpl;
  } catch (err) {
    throw new Error('No fetch available. Install `undici` or use Node 18+ with global fetch.');
  }
}
