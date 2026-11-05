import { sanityClient } from 'sanity:client';

/**
 * Fetch page builder pages and replace every Sanity image ({_type: 'image', asset: {_ref}})
 * with the { url, alt } shape the components take. Blocks nest to any depth, so this walks
 * the documents instead of dereferencing images in GROQ.
 */
export async function getPages() {
  const pages: any[] = await sanityClient.fetch(`*[_type == "page" && defined(slug.current)]`);
  const refs = new Set<string>();
  const collect = (value: any) => {
    if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === 'object') {
      if (value._type === 'image' && value.asset?._ref) refs.add(value.asset._ref);
      Object.values(value).forEach(collect);
    }
  };
  collect(pages);
  const assets: { _id: string; url: string }[] = refs.size ? await sanityClient.fetch(`*[_id in $ids]{_id, url}`, { ids: [...refs] }) : [];
  const urls = new Map(assets.map((a) => [a._id, a.url]));
  const resolve = (value: any): any => {
    if (Array.isArray(value)) return value.map(resolve);
    if (value && typeof value === 'object') {
      if (value._type === 'image' && value.asset?._ref) return { url: urls.get(value.asset._ref) ?? '', alt: value.alt ?? '' };
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v)]));
    }
    return value;
  };
  return pages.map(resolve);
}
