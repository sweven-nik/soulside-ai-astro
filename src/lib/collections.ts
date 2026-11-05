import { getCollection, type CollectionKey } from 'astro:content';

/**
 * getCollection() doesn't guarantee order, and the exported components render entries
 * in whatever order they receive them. Sort by the editor-controlled `order` field
 * (logos, team, testimonials, categories) or newest first by publish date (resources).
 */
export async function getSortedCollection<C extends CollectionKey>(name: C) {
  const entries = await getCollection(name);
  const data = (entry: (typeof entries)[number]) => entry.data as Record<string, any>;
  return entries.sort((a, b) => {
    const [oa, ob] = [data(a).order, data(b).order];
    if (oa != null || ob != null) return (oa ?? Infinity) - (ob ?? Infinity);
    const [da, db] = [data(a)['publish-date'] ?? '', data(b)['publish-date'] ?? ''];
    if (da !== db) return da < db ? 1 : -1;
    return a.id.localeCompare(b.id);
  });
}
