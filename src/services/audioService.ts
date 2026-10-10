export interface ResolvedAudioData {
  previewUrl: string | null;
  albumArt: string;
  artist: string;
  trackName: string;
}

const DEFAULT_ALBUM_ART =
  'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=80';

const audioCache = new Map<string, string | null>();
const audioDataCache = new Map<string, ResolvedAudioData>();
const inFlight = new Map<string, Promise<ResolvedAudioData>>();

async function fetchFromItunes(term: string): Promise<ResolvedAudioData> {
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&limit=5&entity=song`
    );
    if (!res.ok) {
      return { previewUrl: null, albumArt: DEFAULT_ALBUM_ART, artist: '', trackName: '' };
    }
    const data = await res.json();
    const track = (data.results ?? []).find((r: any) => r.previewUrl);
    if (!track) {
      return { previewUrl: null, albumArt: DEFAULT_ALBUM_ART, artist: '', trackName: '' };
    }

    const rawArt = track.artworkUrl100 || track.artworkUrl60;
    const highResArt = rawArt ? rawArt.replace(/\/\d+x\d+bb\./, '/600x600bb.') : DEFAULT_ALBUM_ART;

    return {
      previewUrl: track.previewUrl ?? null,
      albumArt: highResArt,
      artist: track.artistName || '',
      trackName: track.trackName || '',
    };
  } catch {
    return { previewUrl: null, albumArt: DEFAULT_ALBUM_ART, artist: '', trackName: '' };
  }
}

export async function resolveAudioData(searchTerm: string): Promise<ResolvedAudioData> {
  if (audioDataCache.has(searchTerm)) return audioDataCache.get(searchTerm)!;
  if (inFlight.has(searchTerm)) return inFlight.get(searchTerm)!;

  const promise = fetchFromItunes(searchTerm)
    .then((data) => {
      audioDataCache.set(searchTerm, data);
      audioCache.set(searchTerm, data.previewUrl);
      inFlight.delete(searchTerm);
      return data;
    })
    .catch(() => {
      inFlight.delete(searchTerm);
      const fallback = { previewUrl: null, albumArt: DEFAULT_ALBUM_ART, artist: '', trackName: '' };
      return fallback;
    });

  inFlight.set(searchTerm, promise);
  return promise;
}

export async function resolveAudio(searchTerm: string): Promise<string | null> {
  if (audioCache.has(searchTerm)) return audioCache.get(searchTerm)!;
  const data = await resolveAudioData(searchTerm);
  return data.previewUrl;
}

export function prefetchBoardAudio(board: any): void {
  for (const category of board ?? []) {
    for (const question of category.questions ?? []) {
      if (question.searchTermAudio) resolveAudioData(question.searchTermAudio);
    }
  }
}

export function clearAudioCache(searchTerm: string): void {
  audioCache.delete(searchTerm);
  audioDataCache.delete(searchTerm);
  inFlight.delete(searchTerm);
}
