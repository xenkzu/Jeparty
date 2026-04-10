import type { VercelRequest, VercelResponse } from '@vercel/node';

const BLOCKED_FRAGMENTS = ['logo', 'icon', 'banner', 'Flag_of', '.svg', 'apple-touch', 'placeholder', 'no-image', 'questionmark'];

function isValidImageUrl(
  url: unknown,
  width?: number,
  height?: number
): url is string {
  if (typeof url !== 'string' || !url.startsWith('https://')) return false;
  const lower = url.toLowerCase();
  if (BLOCKED_FRAGMENTS.some(frag => lower.includes(frag))) return false;
  if (typeof width === 'number' && width < 200) return false;
  if (typeof width === 'number' && typeof height === 'number' && height > width * 1.5) return false;
  return true;
}

// SOURCE 1: Your existing Wikipedia logic — keep verbatim, just wrap it here
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
    if (isValidImageUrl(url, w, h) && (typeof w !== 'number' || w >= 200)) return url;
    return null;
  } catch {
    return null;
  }
}

// SOURCE 2: Wikimedia Commons image search (free, no key)
async function fetchFromWikimediaCommons(term: string): Promise<string | null> {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(term)}&gsrlimit=1&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const pages = Object.values(data?.query?.pages ?? {}) as any[];
    return pages[0]?.imageinfo?.[0]?.thumburl ?? null;
  } catch {
    return null;
  }
}

// SOURCE 3: DuckDuckGo unofficial image vqd scrape (free, no key)
// DDG requires a two-step fetch: first get the vqd token, then hit the image API
async function fetchFromDuckDuckGo(term: string): Promise<string | null> {
  try {
    // Step 1: Get vqd token from DDG HTML
    const initRes = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(term)}&iax=images&ia=images`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Jeparty/1.0)' }
    });
    if (!initRes.ok) return null;
    const html = await initRes.text();
    const vqdMatch = html.match(/vqd=([\d-]+)/);
    if (!vqdMatch) return null;
    const vqd = vqdMatch[1];

    // Step 2: Hit DDG image API with the vqd token
    const imgRes = await fetch(
      `https://duckduckgo.com/i.js?q=${encodeURIComponent(term)}&vqd=${vqd}&f=,,,,,&p=1`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Jeparty/1.0)', 'Referer': 'https://duckduckgo.com/' } }
    );
    if (!imgRes.ok) return null;
    const data = await imgRes.json();
    return data?.results?.[0]?.image ?? null;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Support both query param (new approach) and body payload (old approach)
  const term = req.query.term || req.body?.searchTerm;
  
  if (!term || typeof term !== 'string') {
    return res.status(400).json({ error: 'Missing search term' });
  }

  const [wikiResult, commonsResult, ddgResult] = await Promise.allSettled([
    fetchFromWikipedia(term),
    fetchFromWikimediaCommons(term),
    fetchFromDuckDuckGo(term),
  ]);

  const imageUrl =
    (wikiResult.status === 'fulfilled' && wikiResult.value) ||
    (commonsResult.status === 'fulfilled' && commonsResult.value) ||
    (ddgResult.status === 'fulfilled' && ddgResult.value) ||
    null;

  if (!imageUrl) {
    return res.status(404).json({ error: 'No image found from any source' });
  }

  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
  return res.status(200).json({ url: imageUrl });
}
