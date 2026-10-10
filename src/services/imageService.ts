// src/services/imageService.ts

export interface ImageCandidate {
  url: string;
  width?: number;
  height?: number;
}

export interface QuestionImageResult {
  url: string | null;
  candidateCount: number;
  hasAlternatives: boolean;
  noOtherImages: boolean;
  isTmdb: boolean;
}

export interface QuestionSpec {
  question: string;
  searchTerm?: string;
  answer: string;
  source?: string | null;
}

// 1. Candidate list per answer+source (not a single URL)
export const candidateCache = new Map<string, ImageCandidate[]>();
const inFlightCandidates = new Map<string, Promise<ImageCandidate[]>>();

// 2. Index per question
export const questionIndexMap = new Map<string, number>();

// 3. Last shown URL per question (ensures never returning the same URL twice in a row)
export const questionLastUrlMap = new Map<string, string>();

// 4. Broken URLs set (skipped on onError)
export const brokenUrls = new Set<string>();

function norm(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function buildCandidateCacheKey(answerOrTerm: string, source?: string | null): string {
  return `${norm(answerOrTerm)}:::${norm(source || '')}`;
}

export function buildQuestionKey(
  q: { question: string; answer: string; searchTerm?: string },
  categoryName?: string
): string {
  return `${categoryName || ''}:::${q.question}:::${q.answer}`;
}

/**
 * Fetches candidate list for an answer/searchTerm and source from /api/fetch-image
 * or browser fallback in development.
 */
export async function fetchCandidatesForQuestion(
  q: QuestionSpec,
  categoryName: string
): Promise<ImageCandidate[]> {
  const term = q.searchTerm || q.answer;
  if (!term) return [];
  const cacheKey = buildCandidateCacheKey(q.answer || term, q.source);

  if (candidateCache.has(cacheKey)) {
    return candidateCache.get(cacheKey)!;
  }
  if (inFlightCandidates.has(cacheKey)) {
    return inFlightCandidates.get(cacheKey)!;
  }

  const promise = (async (): Promise<ImageCandidate[]> => {
    // 1. Try /api/fetch-image (server-side TMDB, AniList + Jikan, or Wiki/Commons)
    try {
      const url = `/api/fetch-image?term=${encodeURIComponent(term)}&source=${encodeURIComponent(
        q.source || ''
      )}&category=${encodeURIComponent(categoryName || '')}&answer=${encodeURIComponent(q.answer || '')}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const rawCandidates: any[] = data.candidates || (data.url ? [{ url: data.url }] : []);
        const validCandidates: ImageCandidate[] = rawCandidates.filter(
          (c) => typeof c.url === 'string' && c.url.startsWith('https://')
        );
        if (validCandidates.length > 0) {
          candidateCache.set(cacheKey, validCandidates);
          return validCandidates;
        }
      }
    } catch (e) {
      console.warn('[imageService] fetch-image endpoint note:', e);
    }

    // 2. Direct browser fallback for offline / development
    try {
      const isAnime = /anime|manga/i.test(categoryName) || /anime|manga/i.test(q.source || '');
      if (isAnime) {
        const query = `query ($name: String) {
          Page {
            characters(search: $name) {
              image { large }
            }
          }
        }`;
        const res = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, variables: { name: term } }),
        });
        if (res.ok) {
          const json: any = await res.json();
          const chars: any[] = json?.data?.Page?.characters ?? [];
          const list: ImageCandidate[] = [];
          for (const c of chars) {
            if (c.image?.large) list.push({ url: c.image.large });
          }
          if (list.length > 0) {
            candidateCache.set(cacheKey, list);
            return list;
          }
        }
      }

      // Wikipedia / Commons search
      const searchRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
          term
        )}&gsrlimit=10&prop=pageimages|imageinfo&pithumbsize=1200&iiprop=url&iiurlwidth=1200&format=json&origin=*`
      );
      if (searchRes.ok) {
        const data: any = await searchRes.json();
        const pages = Object.values(data?.query?.pages ?? {}) as any[];
        const valid = pages
          .map((p) => ({
            url: p.thumbnail?.source || p.imageinfo?.[0]?.thumburl,
            width: p.thumbnail?.width || p.imageinfo?.[0]?.width,
            height: p.thumbnail?.height || p.imageinfo?.[0]?.height,
          }))
          .filter((c) => typeof c.url === 'string' && c.url.startsWith('https://'));
        if (valid.length > 0) {
          candidateCache.set(cacheKey, valid);
          return valid;
        }
      }
    } catch (e) {
      console.warn('[imageService] fallback search note:', e);
    }

    return [];
  })().finally(() => {
    inFlightCandidates.delete(cacheKey);
  });

  inFlightCandidates.set(cacheKey, promise);
  return promise;
}

/**
 * Resolves or advances the image for a specific question.
 * Tracks candidate list per answer+source and index per question.
 * Skips broken URLs and ensures no identical URL in a row.
 */
export async function resolveQuestionImage(
  q: QuestionSpec,
  categoryName: string,
  options?: { isReload?: boolean; failedUrl?: string }
): Promise<QuestionImageResult> {
  const qKey = buildQuestionKey(q, categoryName);

  if (options?.failedUrl) {
    brokenUrls.add(options.failedUrl);
  }

  const allCandidates = await fetchCandidatesForQuestion(q, categoryName);
  const usable = allCandidates.filter((c) => !brokenUrls.has(c.url));

  if (usable.length === 0) {
    return {
      url: null,
      candidateCount: 0,
      hasAlternatives: false,
      noOtherImages: true,
      isTmdb: false,
    };
  }

  if (usable.length === 1) {
    const single = usable[0];
    questionLastUrlMap.set(qKey, single.url);
    const originalIndex = allCandidates.findIndex((c) => c.url === single.url);
    questionIndexMap.set(qKey, originalIndex >= 0 ? originalIndex : 0);
    return {
      url: single.url,
      candidateCount: 1,
      hasAlternatives: false,
      noOtherImages: true,
      isTmdb: single.url.includes('image.tmdb.org'),
    };
  }

  // Multiple usable candidates available: advance sequentially through allCandidates
  const previousIndex = questionIndexMap.get(qKey) ?? -1;
  const lastUrl = questionLastUrlMap.get(qKey);

  let startingIndex = previousIndex;
  if (options?.failedUrl) {
    const failedIndex = allCandidates.findIndex((c) => c.url === options.failedUrl);
    if (failedIndex >= 0) startingIndex = failedIndex;
  } else if (!options?.isReload) {
    // Initial load: start from previousIndex - 1 so step 1 hits previousIndex (or 0)
    startingIndex = previousIndex >= 0 ? previousIndex - 1 : -1;
  }

  let chosenCandidate: ImageCandidate | null = null;
  let chosenIndex = 0;

  for (let step = 1; step <= allCandidates.length; step++) {
    const idx = (startingIndex + step + allCandidates.length) % allCandidates.length;
    const cand = allCandidates[idx];
    if (brokenUrls.has(cand.url)) continue;
    if (lastUrl && cand.url === lastUrl && usable.length > 1) continue;

    chosenCandidate = cand;
    chosenIndex = idx;
    break;
  }

  if (!chosenCandidate) {
    chosenCandidate = usable[0];
    chosenIndex = allCandidates.findIndex((c) => c.url === chosenCandidate!.url);
  }

  questionIndexMap.set(qKey, chosenIndex);
  questionLastUrlMap.set(qKey, chosenCandidate.url);

  return {
    url: chosenCandidate.url,
    candidateCount: usable.length,
    hasAlternatives: usable.length > 1,
    noOtherImages: usable.length <= 1,
    isTmdb: chosenCandidate.url.includes('image.tmdb.org'),
  };
}

/**
 * Convenience legacy wrapper for resolveImage
 */
export async function resolveImage(
  searchTerm: string,
  _strictLandscape: boolean = false,
  _retryOffset: number = 0
): Promise<string | null> {
  const result = await resolveQuestionImage(
    { question: '', answer: searchTerm, searchTerm },
    ''
  );
  return result.url;
}

export function prefetchBoardImages(board: any): void {
  for (const category of board ?? []) {
    for (const question of category.questions ?? []) {
      if (question.searchTerm) {
        fetchCandidatesForQuestion(question, category.category);
      }
    }
  }
}

export function clearImageCache(): void {
  candidateCache.clear();
  inFlightCandidates.clear();
  questionIndexMap.clear();
  questionLastUrlMap.clear();
  brokenUrls.clear();
}
