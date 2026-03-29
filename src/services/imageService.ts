/**
 * Simplified image fetching service for visual questions.
 * Using Wikipedia REST API to retrieve page thumbnails.
 */
export const fetchVisualImage = async (searchTerm: string): Promise<string | null> => {
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.thumbnail?.source || null;
  } catch (error) {
    console.error(`[ImageService] Wikipedia fetch failed for ${searchTerm}:`, error);
    return null;
  }
};
