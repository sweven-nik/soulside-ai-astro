// Round-trip check: Webflow HTML -> Portable Text -> HTML must keep the same text and tags.
import {readFileSync} from 'node:fs'
import {htmlToBlocks} from '@portabletext/block-tools'
import {Schema} from '@sanity/schema'
import {JSDOM} from 'jsdom'
import {portableTextToHtml} from '../src/lib/portable-text'
import {richText} from '../src/sanity/schemaTypes/objects/richText'

const textOnly = {...richText, of: richText.of.filter((m) => m.type === 'block')}
const type = Schema.compile({name: 'v', types: [textOnly]}).get('richText')
const rules = [{deserialize(el: any, next: any) { const t = el.tagName?.toLowerCase(); return t === 'sub' || t === 'sup' ? ({_type: '__decorator', name: t, children: next(el.childNodes)} as any) : undefined }}]
const doc = (h: string) => new JSDOM(h).window.document
const tags = (h: string) => { const c: Record<string, number> = {}; for (const m of h.matchAll(/<([a-z0-9]+)[\s/>]/g)) c[m[1]] = (c[m[1]] ?? 0) + 1; return c }
const text = (h: string) => doc(h).body.textContent!.replace(/\s+/g, ' ').trim()

for (const [file, field] of [['legal', 'body'], ['resource', 'post-body']]) {
  for (const item of JSON.parse(readFileSync(`src/data/${file}.json`, 'utf8'))) {
    const html = item[field]
    const out = portableTextToHtml(htmlToBlocks(html.replace(/<(sub|sup)>(\s*)<\/\1>/g, " "), type, {parseHtml: doc, rules}))
    const same = text(html) === text(out)
    console.log(`${file}/${item.id}: text ${same ? 'identical' : 'DIFFERENT'}`)
    console.log('  before', JSON.stringify(tags(html)))
    console.log('  after ', JSON.stringify(tags(out)))
    if (!same) { const a = text(html), b = text(out); let i = 0; while (a[i] === b[i]) i++; console.log('  first diff:', JSON.stringify(a.slice(i - 40, i + 40)), '\n           vs', JSON.stringify(b.slice(i - 40, i + 40))) }
  }
}
