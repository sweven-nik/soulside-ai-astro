import {DocumentTextIcon} from "@sanity/icons/DocumentText"
import {defineField, defineType} from 'sanity'
import {slugField, webflowIdField} from '../objects/fields'

export const legalPage = defineType({
  name: 'legalPage',
  title: 'Legal page',
  type: 'document',
  icon: DocumentTextIcon,
  fields: [
    defineField({name: 'name', title: 'Title', type: 'string', validation: (rule) => rule.required()}),
    slugField(),
    defineField({name: 'body', type: 'richText'}),
    webflowIdField,
  ],
  preview: {select: {title: 'name', subtitle: 'slug.current'}},
})
