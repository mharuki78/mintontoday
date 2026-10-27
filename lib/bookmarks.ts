export type BookmarkEntry = { id: string; title?: string; category?: string };
export const bookmarkKey = "minton-bookmark-details";
export function readBookmarks(idsText: string | null, detailsText: string | null): BookmarkEntry[] {
  let ids: unknown = [], details: unknown = [];
  try { ids = JSON.parse(idsText || "[]"); } catch {}
  try { details = JSON.parse(detailsText || "[]"); } catch {}
  if (!Array.isArray(ids)) return [];
  const metadata = Array.isArray(details) ? details : [];
  return [...new Set(ids.filter((id): id is string => typeof id === "string" && /^[a-z0-9-]{1,150}$/.test(id)))].map(id => {
    const item = metadata.find(v => v && typeof v === "object" && v.id === id);
    return { id, ...(typeof item?.title === "string" ? { title: item.title.slice(0,300) } : {}), ...(typeof item?.category === "string" ? {category: item.category.slice(0,50)} : {}) };
  });
}
