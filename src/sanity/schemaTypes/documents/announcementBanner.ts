import {BellIcon} from "@sanity/icons/Bell"
import {defineField, defineType} from 'sanity'
import {webflowIdField} from '../objects/fields'

export const announcementBanner = defineType({
  name: 'announcementBanner',
  title: 'Announcement banner',
  type: 'document',
  icon: BellIcon,
  fields: [
    defineField({name: 'name', title: 'Internal name', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'message', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'link', type: 'url', validation: (rule) => rule.uri({allowRelative: true})}),
    webflowIdField,
  ],
  preview: {select: {title: 'message', subtitle: 'name'}},
})
