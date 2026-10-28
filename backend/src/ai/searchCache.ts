// remembers the answer to a search question for a while, so the same question gives the same filters
// (a language model can answer slightly differently each time) and costs nothing the second time.
// kept in memory: gone after a restart, fine for one server.

export type CacheKeyParts = { query: string; lang: string; names: { projects: string[]; locations: string[] } };

// "Kun je alle  stalen materialen zoeken?" and "kun je alle stalen materialen zoeken" are the same question.
// the names are part of the key: a new project can change the right answer.
export function cacheKey({ query, lang, names }: CacheKeyParts): string {
  // old: const question = query.toLowerCase().replace(/[?!.]+$/, "").replace(/\s+/g, " ").trim();
  // (moved to normalizeQuestion, the narrow step needs the same)
  const question = normalizeQuestion(query);
  return JSON.stringify([lang, question, names.projects, names.locations]);
}

export function normalizeQuestion(query: string): string {
  return query
    .toLowerCase()
    .replace(/[?!.]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function createSearchCache<T>(ttlMs: number, maxEntries: number, now: () => number = Date.now) {
  const entries = new Map<string, { value: T; storedAt: number }>();

  function get(key: string): T | undefined {
    const entry = entries.get(key);
    if (!entry) return undefined;
    if (now() - entry.storedAt >= ttlMs) {
      entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  function set(key: string, value: T): void {
    // a map keeps the order things went in, so the first key is the oldest
    if (!entries.has(key) && entries.size >= maxEntries) {
      const oldest = entries.keys().next().value;
      if (oldest !== undefined) entries.delete(oldest);
    }
    entries.set(key, { value, storedAt: now() });
  }

  return { get, set, size: () => entries.size };
}

export type SearchCache<T> = ReturnType<typeof createSearchCache<T>>;
