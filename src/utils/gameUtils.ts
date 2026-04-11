/**
 * Cleans category names by stripping technical suffixes used for AI generation.
 * -v: Visual category (images)
 * -a: Audio category (music)
 */
export const cleanCategoryName = (name: string): string => {
  if (!name) return '';
  return name
    .replace(/\s*-[v|a]\s*$/i, '')
    .trim();
};
