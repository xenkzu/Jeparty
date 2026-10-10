import type { VercelRequest, VercelResponse } from '@vercel/node';
import { lookupTmdbBackdrops } from './generate-board.js';

const BLOCKED_FRAGMENTS = [
  'logo',
  'icon',
  'banner',
  'Flag_of',
  '.svg',
  'apple-touch',
  'placeholder',
  'no-image',
  'questionmark',
];
const USER_AGENT = 'Jeparty/1.0 (https://github.com/xenkzu/jeparty; yashkaul777@gmail.com)';

export interface ImageCandidate {
  url: string;
  width?: number;
  height?: number;
}

function isValidImageUrl(
  url: unknown,
  width?: number,
  height?: number,
  strictLandscape: boolean = false
): url is string {
  if (typeof url !== 'string' || !url.startsWith('https://')) return false;
  const lower = url.toLowerCase();
  if (BLOCKED_FRAGMENTS.some((frag) => lower.includes(frag))) return false;

  if (typeof width === 'number' && width < 200) return false;

  if (typeof width === 'number' && typeof height === 'number') {
    if (strictLandscape && height >= width) return false;
    if (height > width * 1.8) return false;
  }
  return true;
}

// 1. Anime: AniList image then Jikan /characters/{id}/pictures
async function fetchAnimeCandidates(term: string): Promise<ImageCandidate[]> {
  const candidates: ImageCandidate[] = [];
  const seenUrls = new Set<string>();

  // AniList
  try {
    const query = `query ($name: String) {
      Page {
        characters(search: $name) {
          image { large }
        }
      }
    }`;
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query, variables: { name: term } }),
    });
    if (res.ok) {
      const json: any = await res.json();
      const chars: any[] = json?.data?.Page?.characters ?? [];
      for (const c of chars) {
        const u = c.image?.large;
        if (u && !seenUrls.has(u)) {
          seenUrls.add(u);
          candidates.push({ url: u });
        }
      }
    }
  } catch (e) {
    console.warn('[fetch-image] AniList error:', e);
  }

  // Jikan character search -> /characters/{id}/pictures
  try {
    const res = await fetch(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(term)}`);
    if (res.ok) {
      const json: any = await res.json();
      const chars: any[] = json?.data ?? [];
      const match = chars[0];
      if (match?.mal_id) {
        const picRes = await fetch(`https://api.jikan.moe/v4/characters/${match.mal_id}/pictures`);
        if (picRes.ok) {
          const picJson: any = await picRes.json();
          const pics: any[] = picJson?.data ?? [];
          for (const p of pics) {
            const u = p.jpg?.large_image_url || p.jpg?.image_url;
            if (u && !u.includes('questionmark') && !seenUrls.has(u)) {
              seenUrls.add(u);
              candidates.push({ url: u });
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('[fetch-image] Jikan error:', e);
  }

  return candidates;
}

// 2. Wikipedia and Commons images (other visuals)
async function fetchWikiAndCommonsCandidates(
  term: string,
  strictLandscape: boolean = false
): Promise<ImageCandidate[]> {
  const candidates: ImageCandidate[] = [];
  const seenUrls = new Set<string>();

  // Wikipedia Summary
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`,
      { headers: { 'User-Agent': USER_AGENT } }
    );
    if (res.ok) {
      const data: any = await res.json();
      const url = data.thumbnail?.source;
      const w = data.thumbnail?.width;
      const h = data.thumbnail?.height;
      if (isValidImageUrl(url, w, h, strictLandscape) && !seenUrls.has(url)) {
        seenUrls.add(url);
        candidates.push({ url, width: w, height: h });
      }
    }
  } catch (e) {
    console.warn('[fetch-image] Wiki error:', e);
  }

  // Wikimedia Commons Search
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(
      term
    )}&gsrlimit=12&prop=imageinfo&iiprop=url|size&iiurlwidth=1200&format=json&origin=*`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (res.ok) {
      const data: any = await res.json();
      const pages: any[] = Object.values(data?.query?.pages ?? {});
      for (const page of pages) {
        const info = page.imageinfo?.[0];
        const u = info?.thumburl || info?.url;
        const w = info?.width;
        const h = info?.height;
        if (isValidImageUrl(u, w, h, strictLandscape) && !seenUrls.has(u)) {
          seenUrls.add(u);
          candidates.push({ url: u, width: w, height: h });
        }
      }
    }
  } catch (e) {
    console.warn('[fetch-image] Commons error:', e);
  }

  // DuckDuckGo fallback if still empty
  if (candidates.length === 0) {
    try {
      const initRes = await fetch(
        `https://duckduckgo.com/?q=${encodeURIComponent(term)}&iax=images&ia=images`,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        }
      );
      if (initRes.ok) {
        const html = await initRes.text();
        const vqdMatch = html.match(/vqd=([\d-]+)/);
        if (vqdMatch) {
          const vqd = vqdMatch[1];
          const imgRes = await fetch(
            `https://duckduckgo.com/i.js?q=${encodeURIComponent(term)}&vqd=${vqd}&f=,,,,,&p=1`,
            {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                Referer: 'https://duckduckgo.com/',
              },
            }
          );
          if (imgRes.ok) {
            const data: any = await imgRes.json();
            const results: any[] = data?.results ?? [];
            for (const r of results) {
              if (r?.image && !seenUrls.has(r.image)) {
                seenUrls.add(r.image);
                candidates.push({ url: r.image, width: r.width, height: r.height });
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('[fetch-image] DDG error:', e);
    }
  }

  return candidates;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const term = (req.query.term || req.body?.searchTerm || req.query.query) as string;
  const source = (req.query.source || req.body?.source || '') as string;
  const category = (req.query.category || req.body?.category || '') as string;
  const landscape = req.query.landscape === 'true';

  if (!term) {
    return res.status(400).json({ error: 'Missing search term' });
  }

  // 1. Movie / TV Scene Mode: TMDB only (NEVER Wikipedia or web search, NEVER posters)
  const isMovieOrTv =
    /\b(movie|movies|film|films|cinema|tv|show|shows|series)\b/i.test(category) ||
    /^\d{4}\s+(movie|tv)$/i.test(source) ||
    req.query.scene === 'true';

  if (isMovieOrTv) {
    const tmdbRes = await lookupTmdbBackdrops(term, source);
    if (tmdbRes.ok && tmdbRes.candidates.length > 0) {
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
      return res.status(200).json({
        candidates: tmdbRes.candidates,
        url: tmdbRes.candidates[0].url,
        source: 'tmdb',
      });
    }

    // Fail if no match or < 1 usable backdrop
    return res.status(404).json({ error: tmdbRes.reason || 'No TMDB backdrops found' });
  }

  // 2. Anime: AniList then Jikan
  const isAnime =
    /anime|manga/i.test(category) || /anime|manga/i.test(source) || req.query.anime === 'true';
  let candidates: ImageCandidate[] = [];

  if (isAnime) {
    candidates = await fetchAnimeCandidates(term);
    if (candidates.length === 0) {
      candidates = await fetchWikiAndCommonsCandidates(term, landscape);
    }
  } else {
    // 3. Other visuals: Wikipedia + Commons
    candidates = await fetchWikiAndCommonsCandidates(term, landscape);
  }

  if (candidates.length === 0) {
    return res.status(404).json({ error: 'No image found from any source' });
  }

  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');
  return res.status(200).json({
    candidates,
    url: candidates[0].url,
  });
}
