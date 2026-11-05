import {UsersIcon} from "@sanity/icons/Users"
import {defineField, defineType} from 'sanity'
import {imageWithAlt, orderField, slugField, webflowIdField} from '../objects/fields'

export const teamMember = defineType({
  name: 'teamMember',
  title: 'Team member',
  type: 'document',
  icon: UsersIcon,
  fields: [
    defineField({name: 'name', type: 'string', validation: (rule) => rule.required()}),
    slugField(),
    defineField({name: 'title', type: 'string'}),
    imageWithAlt('headshot'),
    defineField({name: 'linkedinUrl', title: 'LinkedIn URL', type: 'url'}),
    defineField({name: 'isAdvisor', title: 'Advisor', type: 'boolean', initialValue: false}),
    defineField({name: 'shortBio', type: 'text', rows: 3}),
    orderField,
    webflowIdField,
  ],
  orderings: [{title: 'Display order', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]}],
  preview: {
    select: {title: 'name', subtitle: 'title', media: 'headshot', isAdvisor: 'isAdvisor'},
    prepare: ({title, subtitle, media, isAdvisor}) => ({title, subtitle: isAdvisor ? `Advisor · ${subtitle ?? ''}` : subtitle, media}),
  },
})
