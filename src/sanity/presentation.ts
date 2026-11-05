import {defineDocuments, defineLocations, presentationTool} from 'sanity/presentation'

const pagePath = (slug?: string) => (!slug || slug === 'index' ? '/' : `/${slug}`)
const previewHref = (slug?: string) => `/preview${pagePath(slug) === '/' ? '' : pagePath(slug)}`

// Collection content shown inside page builder blocks. The preview renders these from the last
// build (published content), so their edits appear after publishing.
const collectionLocations = (pages: {title: string; slug: string}[]) =>
  defineLocations({
    select: {title: 'name'},
    resolve: () => ({
      message: 'Shown on these pages. Changes appear in the preview after publishing.',
      tone: 'caution',
      locations: pages.map((page) => ({title: page.title, href: previewHref(page.slug)})),
    }),
  })
const HOME = {title: 'Home', slug: 'index'}

/** Visual Editing: the site preview inside the Studio, with click-to-edit and drag and drop. */
export const presentation = presentationTool({
  title: 'Visual Editor',
  previewUrl: {
    initial: '/preview',
    previewMode: {enable: '/api/draft-mode/enable', disable: '/api/draft-mode/disable'},
  },
  resolve: {
    // Which document a preview URL is editing.
    mainDocuments: defineDocuments([
      {route: '/preview', filter: `_type == "page" && slug.current == "index"`},
      {route: '/preview/:slug', filter: `_type == "page" && slug.current == $slug`},
    ]),
    // "Used on" links shown on each document.
    locations: {
      page: defineLocations({
        select: {title: 'title', slug: 'slug.current'},
        resolve: (doc) => ({locations: [{title: doc?.title || 'Untitled', href: previewHref(doc?.slug)}]}),
      }),
      testimonial: collectionLocations([HOME, {title: 'Clinical Documentation', slug: 'clinical-documentation'}, {title: 'Groups AI', slug: 'groups-ai'}]),
      trustedByLogo: collectionLocations([HOME]),
      ehrLogo: collectionLocations([HOME]),
      teamMember: collectionLocations([{title: 'Who We Are', slug: 'who-we-are'}]),
      resource: collectionLocations([{title: 'Resource Center', slug: 'resource-center'}]),
      resourceCategory: collectionLocations([{title: 'Resource Center', slug: 'resource-center'}]),
      announcementBanner: collectionLocations([HOME]),
    },
  },
})
