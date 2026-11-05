/**
 * One-off import of the Webflow CMS export (src/data/*.json) into Sanity.
 *
 *   npx sanity exec scripts/import-webflow.ts --with-user-token
 *   npx sanity exec scripts/import-webflow.ts --with-user-token -- --dry-run
 *
 * Safe to re-run: document IDs are derived from the Webflow item ID, so a second
 * run replaces documents instead of duplicating them. Re-running overwrites any
 * edits made in the Studio, so stop using it once editors start working in Sanity.
 */
import {createReadStream, existsSync, readFileSync} from 'node:fs'
import path from 'node:path'
import {htmlToBlocks} from '@portabletext/block-tools'
import {Schema} from '@sanity/schema'
import {JSDOM} from 'jsdom'
import {getCliClient} from 'sanity/cli'
import {richText} from '../src/sanity/schemaTypes/objects/richText'

const dryRun = process.argv.includes('--dry-run')
const client = getCliClient({apiVersion: '2026-11-01'})
const root = process.cwd()

type WebflowItem = Record<string, any> & {_id: string; id: string; name: string; isDraft: boolean; isArchived: boolean}

const load = (name: string): WebflowItem[] =>
  JSON.parse(readFileSync(path.join(root, 'src/data', `${name}.json`), 'utf8')).filter(
    (item: WebflowItem) => !item.isDraft && !item.isArchived,
  )

const docId = (webflowId: string) => `wf-${webflowId}`
const ref = (webflowId?: string | null) => (webflowId ? {_type: 'reference', _ref: docId(webflowId)} : undefined)
const slug = (current: string) => ({_type: 'slug', current})
const date = (iso?: string | null) => (iso ? iso.slice(0, 10) : undefined)

// --- images -----------------------------------------------------------------

const uploaded = new Map<string, string>()

async function image(exportPath?: string | null, alt?: string) {
  if (!exportPath) return undefined
  const file = path.join(root, 'src/data', exportPath) // "../assets/x.png" is relative to src/data
  if (!existsSync(file)) throw new Error(`Missing image ${exportPath}`)
  let assetId = uploaded.get(file)
  if (!assetId) {
    // Strip Webflow's "6abc..._" ID prefix so filenames in the media library are readable.
    const filename = path.basename(file).replace(/^[0-9a-f]{24}_(?:[0-9a-f]{24}_)*/, '')
    assetId = dryRun ? `image-dry-run-${filename}` : (await client.assets.upload('image', createReadStream(file), {filename}))._id
    uploaded.set(file, assetId)
  }
  return {_type: 'image', asset: {_type: 'reference', _ref: assetId}, ...(alt ? {alt} : {})}
}

// --- rich text --------------------------------------------------------------

// Compile only the text-block member: the Webflow HTML has no inline images, and the image
// member needs Sanity's built-in types, which a standalone Schema.compile doesn't have.
const textOnly = {...richText, of: richText.of.filter((member) => member.type === 'block')}
const blockContentType = Schema.compile({name: 'import', types: [textOnly]}).get('richText')

function portableText(html?: string | null) {
  if (!html) return undefined
  // Webflow wraps some plain spaces in empty <sub> tags ("A.<sub> </sub>Personal"); keep just the space.
  html = html.replace(/<(sub|sup)>(\s*)<\/\1>/g, " ")
  return htmlToBlocks(html, blockContentType, {
    parseHtml: (input) => new JSDOM(input).window.document,
    rules: [
      // <sub>/<sup> aren't mapped by default; keep them as decorators.
      {
        deserialize(el, next) {
          const tag = (el as Element).tagName?.toLowerCase()
          if (tag !== 'sub' && tag !== 'sup') return undefined
          return {_type: '__decorator', name: tag, children: next(el.childNodes)} as any
        },
      },
    ],
  })
}

// --- documents --------------------------------------------------------------

async function buildDocuments() {
  const docs: Record<string, any>[] = []
  const alt = (item: WebflowItem, field: string) => item._imageAlts?.[field] ?? undefined

  load('resource-categories').forEach((item, index) =>
    docs.push({_id: docId(item._id), _type: 'resourceCategory', webflowId: item._id, name: item.name, slug: slug(item.id), order: index + 1}),
  )

  for (const item of load('resource')) {
    docs.push({
      _id: docId(item._id),
      _type: 'resource',
      webflowId: item._id,
      name: item.name,
      slug: slug(item.id),
      category: ref(item['resource-type-2']),
      publishDate: date(item['publish-date']),
      featured: Boolean(item.featured),
      summary: item['post-summary'] ?? undefined,
      mainImage: await image(item['main-image'], alt(item, 'main-image')),
      thumbnailImage: await image(item['thumbnail-image'], alt(item, 'thumbnail-image')),
      body: portableText(item['post-body']),
    })
  }

  // Order fields follow the order the items appear in the export, which is the order the live site shows.
  for (const [index, item] of load('testimonials').entries()) {
    docs.push({
      _id: docId(item._id),
      _type: 'testimonial',
      webflowId: item._id,
      name: item.name,
      quote: item['testimonial-text'],
      personName: item['testimonial-name'] ?? undefined,
      attribution: item['testimonial-title-attribution'] ?? undefined,
      image: await image(item.image, alt(item, 'image')),
      statNumber: item['stat-number'] ?? undefined,
      statDescription: item['stat-description'] ?? undefined,
      caseStudy: ref(item['case-study-if-applicable']),
      order: index + 1,
    })
  }

  for (const [index, item] of load('team').entries()) {
    docs.push({
      _id: docId(item._id),
      _type: 'teamMember',
      webflowId: item._id,
      name: item.name,
      slug: slug(item.id),
      title: item.title ?? undefined,
      headshot: await image(item.headshot, alt(item, 'headshot')),
      linkedinUrl: item['linkedin-url'] ?? undefined,
      isAdvisor: Boolean(item['is-advisor']),
      shortBio: item['short-bio'] ?? undefined,
      order: item['sort-order'] ?? index + 1, // the team page sorts by Webflow's sort-order
    })
  }

  for (const [collection, type] of [
    ['ehr-logos', 'ehrLogo'],
    ['trusted-by-logos', 'trustedByLogo'],
  ] as const) {
    for (const [index, item] of load(collection).entries()) {
      docs.push({
        _id: docId(item._id),
        _type: type,
        webflowId: item._id,
        name: item.name,
        logo: await image(item.logo, alt(item, 'logo') ?? item.name),
        order: index + 1,
      })
    }
  }

  load('announcement-banners').forEach((item) =>
    docs.push({
      _id: docId(item._id),
      _type: 'announcementBanner',
      webflowId: item._id,
      name: item.name,
      message: item.message,
      link: item.link ?? undefined,
    }),
  )

  load('legal').forEach((item) =>
    docs.push({_id: docId(item._id), _type: 'legalPage', webflowId: item._id, name: item.name, slug: slug(item.id), body: portableText(item.body)}),
  )

  return docs
}

// --- run --------------------------------------------------------------------

const docs = await buildDocuments()
const strip = (doc: Record<string, any>) => Object.fromEntries(Object.entries(doc).filter(([, value]) => value !== undefined))
const counts = docs.reduce<Record<string, number>>((acc, doc) => ({...acc, [doc._type]: (acc[doc._type] ?? 0) + 1}), {})
console.log(`${docs.length} documents, ${uploaded.size} images`, counts)

if (dryRun) {
  console.log(JSON.stringify(docs.find((doc) => doc._type === 'legalPage')?.body?.slice(0, 3), null, 2))
} else {
  const tx = client.transaction()
  docs.forEach((doc) => tx.createOrReplace(strip(doc) as any))
  await tx.commit({visibility: 'sync'})
  console.log('Imported and published.')
}
