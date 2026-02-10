// Long-term memory: stores user facts, preferences, and learning goals.
// Currently uses in-memory store; integrate with PostgreSQL + vector DB (Pinecone/Weaviate) later.

export type UserFact = { id: string; userId: string; key: string; value: string; embedding?: number[]; createdAt: Date };

// In-memory storage (replace with PostgreSQL + vector DB in production)
const factsStore = new Map<string, UserFact[]>();

export async function saveFact(userId: string, key: string, value: string): Promise<UserFact> {
  const fact: UserFact = { id: `fact_${Date.now()}`, userId, key, value, createdAt: new Date() };
  if (!factsStore.has(userId)) factsStore.set(userId, []);
  factsStore.get(userId)!.push(fact);
  // TODO: generate embedding and store in vector DB
  console.log(`[long-term] saved fact: ${key}=${value}`);
  return fact;
}

export async function getFacts(userId: string): Promise<UserFact[]> {
  return factsStore.get(userId) || [];
}

export async function searchFacts(userId: string, query: string, limit = 5): Promise<UserFact[]> {
  const facts = factsStore.get(userId) || [];
  // Simple keyword matching (replace with vector similarity search in production)
  return facts
    .filter(f => f.key.includes(query) || f.value.includes(query))
    .slice(0, limit);
}

export async function clearFacts(userId: string): Promise<void> {
  factsStore.delete(userId);
  console.log(`[long-term] cleared facts for ${userId}`);
}
