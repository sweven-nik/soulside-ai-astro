/**
 * Convert Webflow-exported pages (src/pages/*.astro) into Sanity page builder documents.
 *
 *   npx sanity exec scripts/page-builder/convert-pages.ts --with-user-token -- contact who-we-are
 *   npx sanity exec scripts/page-builder/convert-pages.ts --with-user-token -- --dry-run index
 *
 * Each component becomes a block with the exact props the page passed; slot content becomes
 * the matching text / rich text / SVG / nested blocks field; raw HTML between components becomes
 * a Custom HTML block. Anything that can't be represented exactly is reported.
 * Document IDs are page-<slug>, so re-running replaces the page (and any Studio edits to it).
 */
import {parse} from '@astrojs/compiler'
import {htmlToBlocks} from '@portabletext/block-tools'
import {Schema} from '@sanity/schema'
import {randomUUID} from 'node:crypto'
import {createReadStream, existsSync, readFileSync} from 'node:fs'
import path from 'node:path'
import {JSDOM} from 'jsdom'
import {getCliClient} from 'sanity/cli'
import manifestJson from '../../src/page-builder/manifest.json'
import {slotField, type ManifestComponent, type ManifestSlot} from '../../src/page-builder/fields'
import {richText} from '../../src/sanity/schemaTypes/objects/richText'
import {inlineText} from '../../src/sanity/schemaTypes/pageBuilder'

const args = process.argv.slice(2).filter((a) => a !== '--')
const dryRun = args.includes('--dry-run')
const slugs = args.filter((a) => !a.startsWith('--'))
const client = getCliClient({apiVersion: '2026-11-01'})
const root = process.cwd()
const manifest = new Map((manifestJson.components as ManifestComponent[]).map((c) => [c.name, c]))
const warnings: string[] = []
const key = () => randomUUID().replace(/-/g, '').slice(0, 12)

// --- Portable Text conversion ---------------------------------------------------

const textOnly = (type: any) => ({...type, of: type.of.filter((m: any) => m.type === 'block')})
const compiled = Schema.compile({name: 'convert', types: [textOnly(richText), textOnly(inlineText)]})
const parseHtml = (html: string) => new JSDOM(html).window.document
const subSup = {
  deserialize(el: any, next: any) {
    const tag = el.tagName?.toLowerCase()
    return tag === 'sub' || tag === 'sup' ? ({_type: '__decorator', name: tag, children: next(el.childNodes)} as any) : undefined
  },
}
const toRich = (html: string) => htmlToBlocks(html, compiled.get('richText'), {parseHtml, rules: [subSup]})
function toInline(html: string) {
  // Keep edge whitespace (" | 0,000+ reviews") that HTML parsing would otherwise trim.
  const lead = /^\s/.test(html) ? ' ' : ''
  const trail = /\s$/.test(html) ? ' ' : ''
  const blocks = htmlToBlocks(`<p>${html.trim()}</p>`, compiled.get('inlineText'), {parseHtml, rules: [subSup]}) as any[]
  if (blocks.length > 1) warnings.push(`inline text split into ${blocks.length} paragraphs: ${html.slice(0, 60)}`)
  const block = blocks[0]
  if (!block) return undefined
  if (lead && block.children[0]) block.children[0].text = lead + block.children[0].text.replace(/^\s+/, '')
  if (trail && block.children.at(-1)) block.children.at(-1).text = block.children.at(-1).text.replace(/\s+$/, '') + trail
  return [block]
}
const decode = (html: string) => new JSDOM(`<p>${html}</p>`).window.document.body.textContent ?? ''

// --- assets -----------------------------------------------------------------------

const uploads = new Map<string, string>()
async function uploadAsset(importPath: string) {
  const file = path.join(root, 'src', importPath.replace(/^@\//, '').replace(/\?.*$/, ''))
  if (!existsSync(file)) throw new Error(`Missing asset ${importPath}`)
  if (!uploads.has(file)) {
    const filename = path.basename(file).replace(/^[0-9a-f]{24}_(?:[0-9a-f]{24}_)*/, '')
    const doc = dryRun
      ? {_id: `image-dry-run-${filename}`, url: `https://cdn.sanity.io/dry-run/${filename}`}
      : await client.assets.upload(/\.(svg|png|jpe?g|gif|webp|avif)$/i.test(file) ? 'image' : 'file', createReadStream(file), {filename})
    uploads.set(file, JSON.stringify({id: doc._id, url: doc.url}))
  }
  return JSON.parse(uploads.get(file)!) as {id: string; url: string}
}

// Webflow asset IDs ({"id": "6acf..."}) -> local file or Webflow CDN URL, from the exporter's urls.ts.
const urlsSource = readFileSync(path.join(root, 'src/lib/urls.ts'), 'utf8')
const urlVars = Object.fromEntries([...urlsSource.matchAll(/^import (\w+) from '(@\/assets\/[^']+)';$/gm)].map((m) => [m[1], m[2]]))
const assetIndex: Record<string, string> = {}
for (const m of urlsSource.matchAll(/"([^"]+)": (__lumosAsset\d+|"https:[^"]+")/g)) assetIndex[m[1]] = m[2].startsWith('"') ? JSON.parse(m[2]) : urlVars[m[2]]

async function uploadWebflowAsset(id: string) {
  const target = assetIndex[id]
  if (!target) return undefined
  if (target.startsWith('@/')) return uploadAsset(target)
  if (!uploads.has(target)) {
    const res = await fetch(target)
    if (!res.ok) throw new Error(`Download failed ${target}`)
    const filename = decodeURIComponent(path.basename(new URL(target).pathname)).replace(/^[0-9a-f]{24}_/, '')
    const doc = dryRun ? {_id: `image-dry-run-${filename}`, url: target} : await client.assets.upload('image', Buffer.from(await res.arrayBuffer()), {filename})
    uploads.set(target, JSON.stringify({id: doc._id, url: doc.url}))
  }
  return JSON.parse(uploads.get(target)!) as {id: string; url: string}
}

// --- expressions ------------------------------------------------------------------

type Ctx = {page: string; assets: Record<string, string>}

/** Evaluate a JSX attribute expression: literals, JSON, or an imported asset variable. */
async function evaluate(expr: string, ctx: Ctx): Promise<{value?: any; asset?: {id: string; url: string}; ok: boolean}> {
  const src = expr.trim()
  if (ctx.assets[src]) return {asset: await uploadAsset(ctx.assets[src]), ok: true}
  try {
    return {value: JSON.parse(src), ok: true}
  } catch {
    return {ok: false}
  }
}

// --- raw HTML ---------------------------------------------------------------------

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'])

async function serialize(node: any, ctx: Ctx): Promise<string> {
  switch (node.type) {
    case 'text':
      return node.value
    case 'comment':
      return ''
    case 'expression': {
      const src = (node.children ?? []).map((c: any) => c.value).join('')
      try {
        const literal = JSON.parse(src)
        if (typeof literal === 'string') return literal
      } catch {}
    }
      warnings.push(`${ctx.page}: expression inside raw HTML dropped: {${node.children?.map((c: any) => c.value).join('').slice(0, 60)}}`)
      return ''
    case 'element':
    case 'fragment': {
      let attrs = ''
      for (const a of node.attributes ?? []) {
        if (a.name === 'slot' || /^(is|set):/.test(a.name)) continue // Astro directives, not HTML
        if (a.kind === 'empty') attrs += ` ${a.name}`
        else if (a.kind === 'expression') {
          const r = await evaluate(a.value, ctx)
          if (r.asset) attrs += ` ${a.name}="${r.asset.url}"`
          else if (r.ok && r.value !== false && r.value != null) attrs += ` ${a.name}="${String(r.value)}"`
          else if (!r.ok) warnings.push(`${ctx.page}: <${node.name} ${a.name}={${a.value}}> dropped`)
        } else attrs += ` ${a.name}="${a.value}"`
      }
      const inner = (await Promise.all((node.children ?? []).map((c: any) => serialize(c, ctx)))).join('')
      if (node.type === 'fragment' || node.name === 'Fragment') return inner
      return VOID.has(node.name) ? `<${node.name}${attrs} />` : `<${node.name}${attrs}>${inner}</${node.name}>`
    }
    case 'component':
      if (node.name === 'Fragment') return (await Promise.all(node.children.map((c: any) => serialize(c, ctx)))).join('')
      warnings.push(`${ctx.page}: component <${node.name}> inside raw HTML dropped`)
      return ''
    default:
      return ''
  }
}

const hasComponent = (node: any): boolean => node.type === 'component' ? node.name !== 'Fragment' || node.children?.some(hasComponent) : (node.children ?? []).some(hasComponent)

// --- components -> blocks ---------------------------------------------------------

const slotOf = (node: any) => node.attributes?.find((a: any) => a.name === 'slot')?.value ?? 'default'
const isBlank = (node: any) => (node.type === 'text' && !node.value.trim()) || node.type === 'comment'

async function convertChildren(nodes: any[], ctx: Ctx): Promise<any[]> {
  const blocks: any[] = []
  let raw: any[] = []
  const flush = async () => {
    const html = (await Promise.all(raw.map((n) => serialize(n, ctx)))).join('').trim()
    if (html) blocks.push({_type: 'htmlEmbed', _key: key(), code: html})
    raw = []
  }
  for (const node of nodes) {
    if (isBlank(node)) continue
    if (node.type === 'component' && node.name !== 'Fragment' && manifest.has(node.name)) {
      await flush()
      blocks.push(await convertComponent(node, ctx))
    } else if (node.type === 'component' && node.name === 'Fragment') {
      await flush()
      blocks.push(...(await convertChildren(node.children, ctx)))
    } else if (node.type === 'element' && hasComponent(node)) {
      await flush()
      const attributes = []
      let className: string | undefined
      for (const a of node.attributes ?? []) {
        if (a.name === 'slot') continue
        let value = a.kind === 'empty' ? '' : a.value
        if (a.kind === 'expression') {
          const r = await evaluate(a.value, ctx)
          if (!r.ok) {
            warnings.push(`${ctx.page}: <${node.name} ${a.name}={${a.value}}> dropped`)
            continue
          }
          value = r.asset ? r.asset.url : String(r.value)
        }
        if (a.name === 'class') className = value
        else attributes.push({_type: 'attribute', _key: key(), name: a.name, value})
      }
      blocks.push({_type: 'htmlWrapper', _key: key(), tag: node.name, className, attributes, children: await convertChildren(node.children, ctx)})
    } else {
      if (node.type === 'component') warnings.push(`${ctx.page}: unknown component <${node.name}> kept as HTML`)
      raw.push(node)
    }
  }
  await flush()
  return blocks
}

async function slotValue(slot: ManifestSlot, nodes: any[], ctx: Ctx, where: string) {
  // A child element/fragment carrying slot="x" contributes itself (element) or its children (Fragment).
  const content = nodes.flatMap((n) => (n.type === 'component' && n.name === 'Fragment') || n.type === 'fragment' ? n.children ?? [] : [n])
  const html = async () => (await Promise.all(content.map((n) => serialize(n, ctx)))).join('')
  switch (slot.kind) {
    case 'blocks':
      return convertChildren(content, ctx)
    case 'string': {
      const text = decode(await html()).trim()
      if (/<(?!br)[a-z]/i.test(await html())) warnings.push(`${where}: markup in plain-text slot "${slot.name}" removed`)
      // An explicitly blank slot ({" "}) hides the component's placeholder text; keep it as a single space.
      return text || ' '
    }
    case 'inline':
      return toInline(await html())
    case 'rich':
      return toRich(await html())
    case 'svg':
      return (await html()).trim() || undefined
  }
}

async function convertComponent(node: any, ctx: Ctx) {
  const def = manifest.get(node.name)!
  const where = `${ctx.page} <${node.name}>`
  const block: Record<string, any> = {_type: def.name, _key: key()}

  for (const attr of node.attributes) {
    if (attr.name === 'slot') continue
    const prop = def.props.find((p) => p.name === attr.name)
    if (!prop) {
      warnings.push(`${where}: attribute "${attr.name}" isn't a prop, dropped`)
      continue
    }
    let value: any
    if (attr.kind === 'quoted') value = attr.value
    else if (attr.kind === 'empty') value = true
    else {
      const r = await evaluate(attr.value, ctx)
      if (!r.ok) {
        warnings.push(`${where}: ${attr.name}={${attr.value.slice(0, 50)}} can't be stored, dropped`)
        continue
      }
      value = r.asset ? {_type: 'image', asset: {_type: 'reference', _ref: r.asset.id}} : r.value
    }
    if (prop.kind === 'image' && typeof value === 'object' && value?.id && !value._type) {
      const uploaded = await uploadWebflowAsset(value.id)
      if (!uploaded) {
        warnings.push(`${where}: ${attr.name} uses unknown Webflow asset id ${value.id}, dropped (component default applies)`)
        continue
      }
      value = {_type: 'image', asset: {_type: 'reference', _ref: uploaded.id}, ...(value.alt ? {alt: value.alt} : {})}
    }
    if (prop.kind === 'enum' && typeof value === 'string' && !prop.options!.includes(value)) {
      const fixed = value.trim().toLowerCase().replace(/;$/, '')
      if (prop.options!.includes(fixed)) {
        warnings.push(`${where}: ${attr.name}="${value}" normalized to "${fixed}"`)
        value = fixed
      } else warnings.push(`${where}: ${attr.name}="${value}" isn't one of the component's options`)
    }
    if (prop.kind === 'boolean' && typeof value === 'string') value = value === 'true'
    if (prop.kind === 'number' && typeof value === 'string') value = Number(value)
    block[prop.name] = value
  }

  const groups = new Map<string, any[]>()
  for (const child of node.children ?? []) {
    if (isBlank(child)) continue
    const name = slotOf(child)
    groups.set(name, [...(groups.get(name) ?? []), child])
  }
  for (const [name, nodes] of groups) {
    const slot = def.slots.find((s) => s.name === name)
    if (!slot) {
      warnings.push(`${where}: content for slot "${name}" but the component has no such slot, dropped`)
      continue
    }
    const value = await slotValue(slot, nodes, ctx, where)
    if (value != null && !(Array.isArray(value) && !value.length)) block[slotField(name)] = value
  }
  return block
}

// --- pages ------------------------------------------------------------------------

const find = (node: any, test: (n: any) => boolean): any => {
  if (test(node)) return node
  for (const c of node.children ?? []) {
    const hit = find(c, test)
    if (hit) return hit
  }
}
const attr = (node: any, name: string) => node?.attributes?.find((a: any) => a.name === name)

async function convertPage(slug: string) {
  const file = path.join(root, 'src/pages', `${slug}.astro`)
  const source = readFileSync(file, 'utf8')
  const frontmatter = source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? ''
  const assets = Object.fromEntries([...frontmatter.matchAll(/^import (\w+) from '(@\/assets\/[^']+)';$/gm)].map((m) => [m[1], m[2]]))
  const ctx: Ctx = {page: slug, assets}
  const {ast} = await parse(source)

  const layout = find(ast, (n) => n.type === 'component' && n.name === 'Layout')
  const main = find(layout, (n) => n.type === 'element' && /\bmain-wrapper\b/.test(attr(n, 'class')?.value ?? ''))
  if (!main) throw new Error(`${slug}: no main-wrapper element`)
  const navbar = find(layout, (n) => n.name === 'GlobalNavbar')
  if (find(main, (n) => n.type === 'expression' && !/^\s*"[^"]*"\s*$/.test((n.children ?? []).map((c: any) => c.value).join('')))) warnings.push(`${slug}: page contains code expressions (collection lists); those parts need dedicated blocks`)

  const known = new Set(['GlobalEmbeds', 'GlobalAnnouncementBar', 'GlobalNavbar', 'GlobalFooter'])
  const wrapper = main && layout.children.find((n: any) => n.type === 'element')
  for (const n of wrapper?.children ?? []) {
    if (isBlank(n) || n === main || known.has(n.name)) continue
    if (n.type === 'element' && /container-xlarge/.test(attr(n, 'class')?.value ?? '') && !n.children?.length) continue
    warnings.push(`${slug}: <${n.name}> outside main isn't carried over`)
  }

  return {
    _id: `page-${slug}`,
    _type: 'page',
    title: attr(layout, 'pageTitle')?.value?.replace(/\s*\|\s*Soulside(?: AI)?$/, '') || slug,
    slug: {_type: 'slug', current: slug},
    seoTitle: attr(layout, 'pageTitle')?.value?.replace(/&amp;/g, '&'),
    seoDescription: attr(layout, 'pageDescription')?.value?.replace(/&amp;/g, '&') || undefined,
    webflowPageId: attr(layout, 'webflowPageId')?.value,
    showAnnouncementBar: Boolean(find(layout, (n) => n.name === 'GlobalAnnouncementBar')),
    navbarDemoPopup: attr(navbar, 'enableDemoPopup')?.value?.trim() !== 'false',
    backgroundLines: Boolean(find(layout, (n) => n.type === 'element' && /\bbg-lines\b/.test(attr(n, 'class')?.value ?? ''))),
    sections: await convertChildren(main.children, ctx),
  }
}

// --- run --------------------------------------------------------------------------

if (!slugs.length) throw new Error('Pass page slugs, e.g. -- contact who-we-are')
const docs = []
for (const slug of slugs) docs.push(await convertPage(slug))

const count = (blocks: any[]): number => blocks.reduce((n, b) => n + 1 + Object.values(b).filter(Array.isArray).reduce((m: number, v: any[]) => m + (v[0]?._type && v[0]._type !== 'block' ? count(v) : 0), 0), 0)
for (const doc of docs) console.log(`${doc.slug.current}: ${doc.sections.length} sections, ${count(doc.sections)} blocks`)
console.log(`${uploads.size} assets${dryRun ? ' (dry run, not uploaded)' : ''}`)
if (warnings.length) console.log(`\n${warnings.length} notes:\n- ` + [...new Set(warnings)].join('\n- '))

if (dryRun) {
  if (args.includes('--json')) console.log(JSON.stringify(docs, null, 2))
} else {
  const tx = client.transaction()
  for (const doc of docs) tx.createOrReplace(JSON.parse(JSON.stringify(doc)))
  await tx.commit({visibility: 'sync'})
  console.log('\nSaved and published.')
}
