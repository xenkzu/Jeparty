const audioCache = new Map<string, string | null>();
const inFlight = new Map<string, Promise<string | null>>();

async function fetchFromItunes(term: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&limit=5&entity=song`
    );
    if (!res.ok) return null;
    const data = await res.json();
    // Find first result that has a previewUrl
    const track = (data.results ?? []).find((r: any) => r.previewUrl);
    return track?.previewUrl ?? null;
  } catch {
    return null;
  }
}

export async function resolveAudio(searchTerm: string): Promise<string | null> {
  if (audioCache.has(searchTerm)) return audioCache.get(searchTerm)!;
  if (inFlight.has(searchTerm)) return inFlight.get(searchTerm)!;

  const promise = fetchFromItunes(searchTerm).then(url => {
    audioCache.set(searchTerm, url);
    inFlight.delete(searchTerm);
    return url;
  }).catch(() => {
    inFlight.delete(searchTerm);
    return null;
  });

  inFlight.set(searchTerm, promise);
  return promise;
}

export function prefetchBoardAudio(board: any): void {
  for (const category of board ?? []) {
    for (const question of category.questions ?? []) {
      if (question.searchTermAudio) resolveAudio(question.searchTermAudio);
    }
  }
}
