import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── STEP 1: Category Classification ───────────────────────────────────────
type CategoryType = 'person' | 'anime_game' | 'place_concept' | 'general';

function classifyCategory(category: string): CategoryType {
  const lower = category.toLowerCase();

  const personWords = ['person', 'people', 'athlete', 'politician', 'scientist', 'actor', 'celebrity', 'leader', 'player'];
  if (personWords.some(w => lower.includes(w))) return 'person';

  const animeWords = ['anime', 'manga', 'game', 'cartoon', 'character', 'pokemon', 'fictional'];
  if (animeWords.some(w => lower.includes(w))) return 'anime_game';

  const placeWords = ['place', 'country', 'city', 'landmark', 'geography', 'science', 'history', 'concept', 'food'];
  if (placeWords.some(w => lower.includes(w))) return 'place_concept';

  return 'general';
}

// ─── STEP 2: Smart Query Generation ────────────────────────────────────────
function buildSmartQuery(searchTerm: string, type: CategoryType): string {
  switch (type) {
    case 'person': return `${searchTerm} portrait photograph`;
    case 'anime_game': return `${searchTerm} official artwork`;
    case 'place_concept': return `${searchTerm} photograph`;
    default: return searchTerm;
  }
}

// ─── STEP 4: URL Filtering ─────────────────────────────────────────────────
const BLOCKED_FRAGMENTS = ['logo', 'icon', 'banner', 'flag', 'svg', 'apple-touch', 'placeholder', 'default'];

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

// ─── STEP 3: Source Fetchers ───────────────────────────────────────────────
async function fetchWikipediaSummary(searchTerm: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`
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

async function fetchWikimediaPageImage(searchTerm: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(searchTerm)}&prop=pageimages&format=json&pithumbsize=500`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return null;
    const firstKey = Object.keys(pages)[0];
    const url = pages[firstKey]?.thumbnail?.source;
    if (isValidImageUrl(url)) return url;
    return null;
  } catch {
    return null;
  }
}

async function fetchUnsplash(smartQuery: string): Promise<string | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(smartQuery)}&per_page=5&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${key}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    for (const result of (data.results || [])) {
      const w = result.width;
      const h = result.height;
      const url = result.urls?.regular;
      if (isValidImageUrl(url, w, h) && (typeof w !== 'number' || w > 400)) return url;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── STEP 5: DuckDuckGo Fallback ──────────────────────────────────────────
async function fetchDuckDuckGoFallback(smartQuery: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://duckduckgo.com/?q=${encodeURIComponent(smartQuery)}&iax=images&ia=images`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JepartyBot/1.0)' } }
    );
    if (!res.ok) return null;
    const html = await res.text();
    const regex = /"image":"(https?:\/\/[^"]+)"/g;
    let match;
    let count = 0;
    while ((match = regex.exec(html)) !== null && count < 5) {
      const url = match[1];
      if (isValidImageUrl(url)) return url;
      count++;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── HANDLER ───────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { searchTerm, category } = req.body || {};
  if (!searchTerm || typeof searchTerm !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid searchTerm' });
  }

  const cat = typeof category === 'string' ? category : '';
  const type = classifyCategory(cat);
  const smartQuery = buildSmartQuery(searchTerm, type);

  let imageUrl: string | null = null;
  let source = '';

  // ─── STEP 3: Primary source by type ──────────────────────────────────
  if (type === 'person' || type === 'place_concept') {
    imageUrl = await fetchWikipediaSummary(searchTerm);
    if (imageUrl) source = 'wikipedia';
  }

  if (!imageUrl && type === 'anime_game') {
    imageUrl = await fetchWikimediaPageImage(searchTerm);
    if (imageUrl) source = 'wikimedia';
  }

  // Secondary: Unsplash for place_concept and general
  if (!imageUrl && (type === 'place_concept' || type === 'general')) {
    imageUrl = await fetchUnsplash(smartQuery);
    if (imageUrl) source = 'unsplash';
  }

  // Also try Wikipedia summary as a generic fallback for anime_game
  if (!imageUrl && type === 'anime_game') {
    imageUrl = await fetchWikipediaSummary(searchTerm);
    if (imageUrl) source = 'wikipedia';
  }

  // ─── STEP 5: DuckDuckGo fallback ────────────────────────────────────
  if (!imageUrl) {
    imageUrl = await fetchDuckDuckGoFallback(smartQuery);
    if (imageUrl) source = 'duckduckgo';
  }

  // ─── STEP 6: Response ───────────────────────────────────────────────
  if (imageUrl) {
    return res.status(200).json({ imageUrl, source });
  }
  return res.status(200).json({ imageUrl: null });
}
