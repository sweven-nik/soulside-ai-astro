/**
 * Compare page builder output with the exported pages, element by element.
 *   PAGE_BUILDER_PREFIX=_pb npm run build && node scripts/page-builder/compare-pages.mjs index contact ...
 * Ignores formatting-only differences: whitespace, entity encoding, attribute order, and image URLs
 * (local build assets vs Sanity CDN).
 */
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const IMG = /^(\/_astro\/|https:\/\/cdn\.sanity\.io\/)/;
function lines(file) {
  const doc = new JSDOM(fs.readFileSync(file, 'utf8')).window.document;
  const out = [];
  (function walk(node, depth) {
    for (const n of node.childNodes) {
      if (n.nodeType === 3) {
        const t = n.textContent.replace(/[\s‍]+/g, ' ').trim();
        if (t) out.push(`${'  '.repeat(depth)}"${t}"`);
      } else if (n.nodeType === 1) {
        // Rich text and inline text are stored as Portable Text, which doesn't keep Webflow's per-element ids.
        const richTag = /^(P|UL|OL|LI|STRONG|EM|A|H[1-6]|BLOCKQUOTE|BR|SUB|SUP)$/.test(n.tagName);
        const attrs = [...n.attributes].filter((a) => !(richTag && a.name === 'data-w-id'))
          .map((a) => [a.name, IMG.test(a.value) ? 'IMG' : a.value.replace(/\s+/g, ' ').trim()])
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => `${k}="${v}"`)
          .join(' ');
        out.push(`${'  '.repeat(depth)}<${n.tagName.toLowerCase()}${attrs ? ' ' + attrs : ''}>`);
        walk(n.tagName === 'TEMPLATE' ? n.content : n, depth + 1);
      }
    }
  })(doc.body, 0);
  return out;
}

let failures = 0;
for (const slug of process.argv.slice(2)) {
  const original = `dist/${slug}.html`;
  const built = slug === 'index' ? 'dist/_pb.html' : `dist/_pb/${slug}.html`;
  const a = lines(original), b = lines(built);
  // LCS-free quick diff: walk both, report first mismatches with context.
  const diffs = [];
  let i = 0, j = 0;
  while (i < a.length || j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    const ahead = b.indexOf(a[i], j), back = a.indexOf(b[j], i);
    if (ahead !== -1 && (back === -1 || ahead - j <= back - i)) { while (j < ahead) diffs.push(`+ ${b[j++].trim()}`); }
    else if (back !== -1) { while (i < back) diffs.push(`- ${a[i++].trim()}`); }
    else { if (i < a.length) diffs.push(`- ${a[i++].trim()}`); if (j < b.length) diffs.push(`+ ${b[j++].trim()}`); }
  }
  if (diffs.length) failures++;
  console.log(`${diffs.length ? '✗' : '✓'} ${slug} (${a.length} nodes)${diffs.length ? `: ${diffs.length} differing lines` : ''}`);
  for (const d of diffs.slice(0, Number(process.env.SHOW ?? 12))) console.log('    ' + d.slice(0, 220));
}
process.exit(failures ? 1 : 0);
