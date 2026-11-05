import {defineField} from 'sanity'

/** Webflow item ID, kept so the import script can update documents instead of duplicating them. */
export const webflowIdField = defineField({
  name: 'webflowId',
  title: 'Webflow ID',
  type: 'string',
  readOnly: true,
  hidden: true,
})

export const slugField = (source = 'name') =>
  defineField({
    name: 'slug',
    type: 'slug',
    options: {source, maxLength: 96},
    validation: (rule) => rule.required(),
  })

export const orderField = defineField({
  name: 'order',
  type: 'number',
  description: 'Lower numbers appear first.',
})

export const imageWithAlt = (name: string, title?: string) =>
  defineField({
    name,
    title,
    type: 'image',
    options: {hotspot: true},
    fields: [defineField({name: 'alt', title: 'Alt text', type: 'string'})],
  })
