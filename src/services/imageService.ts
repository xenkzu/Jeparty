// src/services/imageService.ts

const imageCache = new Map<string, string>();
const inFlight = new Map<string, Promise<string | null>>();

const BLOCKED_FRAGMENTS = ['logo', 'icon', 'banner', 'Flag_of', '.svg', 'apple-touch', 'placeholder', 'no-image', 'questionmark'];

function isValidImageUrl(url: unknown, width?: number, height?: number): url is string {
  if (typeof url !== 'string' || !url.startsWith('https://')) return false;
  const lower = url.toLowerCase();
  if (BLOCKED_FRAGMENTS.some(frag => lower.includes(frag))) return false;
  if (typeof width === 'number' && width < 200) return false;
  if (typeof width === 'number' && typeof height === 'number' && height > width * 1.5) return false;
  return true;
}

// SOURCE 1: Wikipedia REST API — works fine from browser (has CORS headers)
async function fetchFromWikipedia(term: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const url = data.thumbnail?.source;
    const w = data.thumbnail?.width;
    const h = data.thumbnail?.height;
    return isValidImageUrl(url, w, h) ? url : null;
  } catch { return null; }
}

// SOURCE 2: Wikimedia Commons — has CORS headers, works from browser
async function fetchFromWikimediaCommons(term: string): Promise<string | null> {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(term)}&gsrlimit=3&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const pages = Object.values(data?.query?.pages ?? {}) as any[];
    // Filter for valid images, skip SVGs and icons
    for (const page of pages) {
      const thumbUrl = page?.imageinfo?.[0]?.thumburl;
      if (isValidImageUrl(thumbUrl)) return thumbUrl;
    }
    return null;
  } catch { return null; }
}

// SOURCE 3: Wikipedia search fallback — if exact title fails, search for best match
async function fetchFromWikipediaSearch(term: string): Promise<string | null> {
  try {
    // Search for the most relevant Wikipedia article title first
    const searchRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(term)}&srlimit=1&format=json&origin=*`
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const topResult = searchData?.query?.search?.[0]?.title;
    if (!topResult) return null;

    // Now fetch the summary for that article title
    const summaryRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topResult)}`
    );
    if (!summaryRes.ok) return null;
    const data = await summaryRes.json();
    const url = data.thumbnail?.source;
    const w = data.thumbnail?.width;
    const h = data.thumbnail?.height;
    return isValidImageUrl(url, w, h) ? url : null;
  } catch { return null; }
}

// Core resolver — tries all sources in parallel, returns first valid result
async function resolveImageDirect(term: string): Promise<string | null> {
  const [wikiResult, commonsResult, searchResult] = await Promise.allSettled([
    fetchFromWikipedia(term),
    fetchFromWikimediaCommons(term),
    fetchFromWikipediaSearch(term),
  ]);

  return (
    (wikiResult.status === 'fulfilled' && wikiResult.value) ||
    (commonsResult.status === 'fulfilled' && commonsResult.value) ||
    (searchResult.status === 'fulfilled' && searchResult.value) ||
    null
  );
}

// In production, still route through the Vercel API function
async function resolveImageViaApi(term: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/fetch-image?term=${encodeURIComponent(term)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.url ?? null;
  } catch { return null; }
}

export async function resolveImage(searchTerm: string): Promise<string | null> {
  if (imageCache.has(searchTerm)) return imageCache.get(searchTerm)!;
  if (inFlight.has(searchTerm)) return inFlight.get(searchTerm)!;

  // In dev: call APIs directly from browser (no proxy needed)
  // In prod: route through Vercel serverless function
  const isDev = import.meta.env.DEV;

  const promise = (isDev ? resolveImageDirect(searchTerm) : resolveImageViaApi(searchTerm))
    .then(url => {
      if (url) imageCache.set(searchTerm, url);
      inFlight.delete(searchTerm);
      return url;
    })
    .catch(() => { inFlight.delete(searchTerm); return null; });

  inFlight.set(searchTerm, promise);
  return promise;
}

export function prefetchBoardImages(board: any): void {
  for (const category of board ?? []) {
    for (const question of category.questions ?? []) {
      if (question.searchTerm) resolveImage(question.searchTerm);
    }
  }
}
