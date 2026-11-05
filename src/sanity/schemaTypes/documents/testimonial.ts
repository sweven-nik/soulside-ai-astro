import {CommentIcon} from "@sanity/icons/Comment"
import {defineField, defineType} from 'sanity'
import {imageWithAlt, orderField, webflowIdField} from '../objects/fields'

export const testimonial = defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  icon: CommentIcon,
  fields: [
    defineField({name: 'name', title: 'Internal name', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'quote', type: 'text', rows: 4, validation: (rule) => rule.required()}),
    defineField({name: 'personName', title: 'Person', type: 'string'}),
    defineField({name: 'attribution', title: 'Title / organization', type: 'string'}),
    imageWithAlt('image'),
    defineField({name: 'statNumber', title: 'Stat', type: 'string', description: 'For example "42%"'}),
    defineField({name: 'statDescription', title: 'Stat description', type: 'string'}),
    defineField({name: 'caseStudy', title: 'Case study', type: 'reference', to: [{type: 'resource'}]}),
    orderField,
    webflowIdField,
  ],
  orderings: [{title: 'Display order', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'personName', subtitle: 'attribution', media: 'image'}},
})
