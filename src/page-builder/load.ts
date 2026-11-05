import type { SanityClient } from '@sanity/client';
import { sanityClient } from 'sanity:client';

export const PAGES_QUERY = `*[_type == "page" && defined(slug.current)]`;

/**
 * Replace every Sanity image ({_type: 'image', asset: {_ref}}) with the { url, alt } shape the
 * components take. Blocks nest to any depth, so this walks the documents instead of
 * dereferencing images in GROQ.
 */
export async function resolveImages<T>(docs: T, client: SanityClient = sanityClient): Promise<T> {
  const refs = new Set<string>();
  const collect = (value: any) => {
    if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === 'object') {
      if (value._type === 'image' && value.asset?._ref) refs.add(value.asset._ref);
      Object.values(value).forEach(collect);
    }
  };
  collect(docs);
  const assets: { _id: string; url: string }[] = refs.size
    ? await client.fetch(`*[_id in $ids]{_id, url}`, { ids: [...refs] }, { stega: false })
    : [];
  const urls = new Map(assets.map((a) => [a._id, a.url]));
  const resolve = (value: any): any => {
    if (Array.isArray(value)) return value.map(resolve);
    if (value && typeof value === 'object') {
      if (value._type === 'image' && value.asset?._ref) return { url: urls.get(value.asset._ref) ?? '', alt: value.alt ?? '' };
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v)]));
    }
    return value;
  };
  return resolve(docs);
}

/** Published pages, for the static build. */
export async function getPages() {
  return resolveImages(await sanityClient.fetch<any[]>(PAGES_QUERY));
}
