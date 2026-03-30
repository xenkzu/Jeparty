/**
 * Fetches a visual image for a question.
 * In production: calls /api/fetch-image serverless function.
 * In dev: calls Wikipedia directly to avoid 404 on missing serverless routes.
 */
export const fetchVisualImage = async (
  searchTerm: string, 
  category: string
): Promise<string | null> => {
  try {
    if (import.meta.env.DEV) {
      // ─── DEV MODE: Call Wikipedia directly ─────────────────────────
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`
      );
      if (!res.ok) return null;
      const data = await res.json();
      return data.thumbnail?.source || null;
    }

    // ─── PROD MODE: Call Vercel serverless function ──────────────────
    const res = await fetch('/api/fetch-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ searchTerm, category })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.imageUrl ?? null;
  } catch {
    return null;
  }
};
