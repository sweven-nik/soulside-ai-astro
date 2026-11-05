import {BookIcon} from "@sanity/icons/Book"
import {TagIcon} from "@sanity/icons/Tag"
import {defineField, defineType} from 'sanity'
import {imageWithAlt, orderField, slugField, webflowIdField} from '../objects/fields'

export const resourceCategory = defineType({
  name: 'resourceCategory',
  title: 'Resource category',
  type: 'document',
  icon: TagIcon,
  fields: [
    defineField({name: 'name', type: 'string', validation: (rule) => rule.required()}),
    slugField(),
    orderField,
    webflowIdField,
  ],
  orderings: [{title: "Display order", name: "orderAsc", by: [{field: "order", direction: "asc"}]}],
})

export const resource = defineType({
  name: 'resource',
  title: 'Resource',
  type: 'document',
  icon: BookIcon,
  fields: [
    defineField({name: 'name', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
    slugField(),
    defineField({name: 'category', type: 'reference', to: [{type: 'resourceCategory'}]}),
    defineField({name: 'publishDate', type: 'date'}),
    defineField({name: 'featured', type: 'boolean', initialValue: false}),
    defineField({name: 'summary', type: 'text', rows: 3}),
    imageWithAlt('mainImage', 'Main image'),
    imageWithAlt('thumbnailImage', 'Thumbnail image'),
    defineField({name: 'body', type: 'richText'}),
    webflowIdField,
  ],
  orderings: [{title: 'Publish date, newest', name: 'publishDateDesc', by: [{field: 'publishDate', direction: 'desc'}]}],
  preview: {select: {title: 'name', subtitle: 'category.name', media: 'thumbnailImage'}},
})
