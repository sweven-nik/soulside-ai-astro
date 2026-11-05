import {defineDocuments, defineLocations, presentationTool} from 'sanity/presentation'

const pagePath = (slug?: string) => (!slug || slug === 'index' ? '/' : `/${slug}`)

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
        resolve: (doc) => ({locations: [{title: doc?.title || 'Untitled', href: `/preview${pagePath(doc?.slug) === '/' ? '' : pagePath(doc?.slug)}`}]}),
      }),
    },
  },
})
