import {ImageIcon} from "@sanity/icons/Image"
import {defineField, defineType} from 'sanity'
import {imageWithAlt, orderField, webflowIdField} from '../objects/fields'

const logoFields = [
  defineField({name: 'name', type: 'string', validation: (rule) => rule.required()}),
  {...imageWithAlt('logo'), validation: (rule: any) => rule.required()},
  orderField,
  webflowIdField,
]

const orderings = [{title: 'Display order', name: 'orderAsc', by: [{field: 'order', direction: 'asc' as const}]}]

export const ehrLogo = defineType({
  name: 'ehrLogo',
  title: 'EHR logo',
  type: 'document',
  icon: ImageIcon,
  fields: logoFields,
  orderings,
  preview: {select: {title: 'name', media: 'logo'}},
})

export const trustedByLogo = defineType({
  name: 'trustedByLogo',
  title: 'Trusted-by logo',
  type: 'document',
  icon: ImageIcon,
  fields: logoFields,
  orderings,
  preview: {select: {title: 'name', media: 'logo'}},
})
