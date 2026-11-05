import {DocumentsIcon} from '@sanity/icons/Documents'
import {defineField, defineType} from 'sanity'
import {blocksArray} from '../pageBuilder'

export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  icon: DocumentsIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'seo', title: 'SEO'},
    {name: 'settings', title: 'Page settings'},
  ],
  fields: [
    defineField({name: 'title', type: 'string', group: 'content', validation: (rule) => rule.required()}),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'content',
      description: 'Use "index" for the homepage.',
      options: {source: 'title', maxLength: 96},
      validation: (rule) => rule.required(),
    }),
    blocksArray('sections', 'Sections', {group: 'content'}),

    defineField({name: 'seoTitle', title: 'Page title', type: 'string', group: 'seo', description: 'Browser tab and search results. Falls back to the page title.'}),
    defineField({name: 'seoDescription', title: 'Meta description', type: 'text', rows: 3, group: 'seo'}),
    defineField({name: 'ogImage', title: 'Social share image', type: 'image', group: 'seo', description: 'Defaults to the site share image.'}),

    defineField({name: 'showAnnouncementBar', title: 'Show announcement bar', type: 'boolean', initialValue: true, group: 'settings'}),
    defineField({name: 'navbarDemoPopup', title: 'Navbar "Book a demo" opens popup', type: 'boolean', initialValue: true, group: 'settings'}),
    defineField({name: 'backgroundLines', title: 'Show background lines', type: 'boolean', initialValue: false, group: 'settings'}),
    defineField({
      name: 'webflowPageId',
      type: 'string',
      group: 'settings',
      readOnly: true,
      hidden: ({value}) => !value,
      description: 'Links the page to its Webflow interactions. Set by the import.',
    }),
  ],
  preview: {
    select: {title: 'title', slug: 'slug.current'},
    prepare: ({title, slug}) => ({title, subtitle: slug === 'index' ? '/' : `/${slug ?? ''}`}),
  },
})
