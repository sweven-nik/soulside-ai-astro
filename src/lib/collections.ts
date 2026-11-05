import { getCollection, type CollectionKey } from 'astro:content';

// Astro 7's file() loader no longer returns entries in source-file order, which the
// Webflow export relied on. Keep the order the items appear in src/data/<name>.json.
const sources = import.meta.glob<Array<{ id?: string; slug?: string }>>('/src/data/*.json', { eager: true, import: 'default' });

export async function getCollectionInSourceOrder<C extends CollectionKey>(name: C) {
  const source = sources[`/src/data/${name}.json`] ?? [];
  const position = new Map(source.map((entry, index) => [entry.id ?? entry.slug, index]));
  const entries = await getCollection(name);
  return entries.sort((a, b) => (position.get(a.id) ?? Infinity) - (position.get(b.id) ?? Infinity));
}
