/**
 * Page builder block types, generated at runtime from src/page-builder/manifest.json
 * (which is generated from the Astro components). One Sanity object type per component:
 * its props become settings fields with the component's own options and defaults, and
 * its slots become content fields.
 */
import {BlockElementIcon} from '@sanity/icons/BlockElement'
import {CodeIcon} from '@sanity/icons/Code'
import {ComponentIcon} from '@sanity/icons/Component'
import {DashboardIcon} from '@sanity/icons/Dashboard'
import {LinkIcon} from '@sanity/icons/Link'
import {SparklesIcon} from '@sanity/icons/Sparkles'
import {StackIcon} from '@sanity/icons/Stack'
import {ThLargeIcon} from '@sanity/icons/ThLarge'
import {UsersIcon} from '@sanity/icons/Users'
import {WrenchIcon} from '@sanity/icons/Wrench'
import {defineArrayMember, defineField, defineType} from 'sanity'
import manifestJson from '../../page-builder/manifest.json'
import {componentTitle, humanize, slotField, type ManifestComponent, type ManifestProp, type ManifestSlot} from '../../page-builder/fields'

const components = manifestJson.components as ManifestComponent[]
export const blockTypeNames = [...components.map((c) => c.name), 'htmlWrapper', 'htmlEmbed']

const CATEGORY_ORDER = ['Sections', 'Layouts', 'Elements', 'Buttons', 'Interactive', 'Collections', 'Globals', 'Utilities', 'Icons']

/** Array of page builder blocks, with the insert menu grouped like the components folder. */
export const blocksArray = (name: string, title: string, extra: Record<string, unknown> = {}) =>
  defineField({
    name,
    title,
    type: 'array',
    of: blockTypeNames.map((type) => defineArrayMember({type})),
    options: {
      insertMenu: {
        filter: true,
        groups: [
          ...CATEGORY_ORDER.map((category) => ({
            name: category.toLowerCase(),
            title: category,
            of: components.filter((c) => c.category === category).map((c) => c.name),
          })).filter((g) => g.of.length),
          {name: 'custom', title: 'Custom', of: ['htmlWrapper', 'htmlEmbed']},
        ],
        views: [{name: 'list'}],
      },
    },
    ...extra,
  })

// --- props --------------------------------------------------------------------

const optionTitle = (value: string) => humanize(value.replace(/---/g, ' – '))

function propField(prop: ManifestProp) {
  const [group, label] = prop.label?.includes('/') ? prop.label.split('/') : [null, prop.label]
  const base = {
    name: prop.name,
    title: label ?? humanize(prop.name),
    fieldset: group ? `fs_${group.replace(/\W+/g, '_')}` : undefined,
    description: prop.default !== undefined && prop.default !== '' ? `Default: ${prop.kind === 'enum' ? optionTitle(String(prop.default)) : String(prop.default)}` : undefined,
    group: 'settings',
  }
  switch (prop.kind) {
    case 'enum':
      return defineField({
        ...base,
        type: 'string',
        options: {list: prop.options!.map((value) => ({title: optionTitle(value), value})), layout: prop.options!.length <= 3 ? 'radio' : 'dropdown', direction: 'horizontal'},
        initialValue: prop.default as string | undefined,
      })
    case 'boolean':
      return defineField({...base, type: 'boolean', initialValue: prop.default as boolean | undefined})
    case 'number':
      return defineField({...base, type: 'number', initialValue: prop.default as number | undefined})
    case 'image':
      return defineField({...base, type: 'image', options: {hotspot: true}, fields: [defineField({name: 'alt', title: 'Alt text', type: 'string'})]})
    case 'string':
      return defineField({...base, type: 'string', initialValue: (prop.default as string) || undefined})
    default:
      return null
  }
}

// --- slots --------------------------------------------------------------------

const slotTitle = (slot: ManifestSlot) =>
  slot.name === 'default' ? (slot.kind === 'blocks' ? 'Content' : 'Text') : humanize(slot.name.replace(/(text|plaintext|richtext)$/, ' $1').replace(/richtext/, 'rich text').replace(/plaintext/, 'plain text'))

function slotFieldDef(slot: ManifestSlot) {
  const base = {name: slotField(slot.name), title: slotTitle(slot), group: 'content'}
  switch (slot.kind) {
    case 'string':
      return defineField({...base, type: 'string'})
    case 'inline':
      return defineField({...base, type: 'inlineText'})
    case 'rich':
      return defineField({...base, type: 'richText'})
    case 'svg':
      return defineField({...base, type: 'text', rows: 4, description: 'Inline SVG markup'})
    default:
      return {...blocksArray(base.name, base.title), group: 'content'}
  }
}

// --- types --------------------------------------------------------------------

const CATEGORY_ICON: Record<string, any> = {
  Sections: StackIcon,
  Layouts: ThLargeIcon,
  Elements: BlockElementIcon,
  Buttons: LinkIcon,
  Interactive: SparklesIcon,
  Collections: UsersIcon,
  Globals: DashboardIcon,
  Utilities: WrenchIcon,
  Icons: ComponentIcon,
}

/** Plain text of a string or Portable Text value. */
const textOf = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value.trim() || undefined
  if (Array.isArray(value) && value[0]?._type === 'block') return value.flatMap((b: any) => b?.children?.map((c: any) => c.text) ?? []).join('').trim() || undefined
  return undefined
}

// Fields that read as a block's title, best first. IDs and classes only as a last resort.
const TITLE_FIELDS = ['slot_headingtext', 'slot_heading', 'slot_name', 'slot_stat', 'slot_label1', 'text', 'linkText', 'slot_taglinetext', 'slot_default', 'slot_text', 'slot_testimonialbody', 'slot_bodyrichtext', 'label']
const FALLBACK_FIELDS = ['sectionId', 'className']
const typeTitle = (type: string) => (components.some((c) => c.name === type) ? componentTitle(type) : undefined)
const nestedBlocks = (value: any): any[] =>
  Object.values(value).flatMap((child) => (Array.isArray(child) && child[0]?._type && child[0]._type !== 'block' ? child : []))

/** First readable text in a block, searching nested blocks (a Section shows its first heading). */
function findText(value: any, depth = 0): string | undefined {
  if (!value || typeof value !== 'object' || depth > 6) return undefined
  for (const field of TITLE_FIELDS) {
    const text = textOf(value[field])
    if (text) return text
  }
  for (const item of nestedBlocks(value)) {
    const text = findText(item, depth + 1)
    if (text) return text
  }
  return undefined
}

/** Title for a block: its first text, else an anchor id/class, else the first nested component's name. */
function findTitle(value: any): string | undefined {
  if (!value || typeof value !== 'object') return undefined
  const text = findText(value)
  if (text) return text
  for (const field of FALLBACK_FIELDS) {
    const id = textOf(value[field])
    if (id) return field === 'sectionId' ? `#${id}` : `.${id.split(' ')[0]}`
  }
  const first = nestedBlocks(value)[0]
  return first ? (typeTitle(first._type) ?? findTitle(first)) : undefined
}

function blockType(component: ManifestComponent) {
  const fields = [...component.slots.map(slotFieldDef), ...component.props.map(propField).filter(Boolean)] as ReturnType<typeof defineField>[]
  const fieldsets = [...new Set(component.props.map((p) => (p.label?.includes('/') ? p.label.split('/')[0] : null)).filter(Boolean))].map((group) => ({
    name: `fs_${group!.replace(/\W+/g, '_')}`,
    title: group!,
    options: {collapsible: true, collapsed: true},
  }))
  const title = componentTitle(component.name)
  // Select every slot plus title-like props; Sanity returns nested blocks inline, so prepare()
  // can find the first heading inside a Section or Layout.
  const select = Object.fromEntries(
    [...component.slots.map((s) => slotField(s.name)), ...component.props.filter((p) => /^(text|linkText|sectionId|variant|style|layout|sectionColorScheme)$/.test(p.name)).map((p) => p.name)].map((f) => [f, f]),
  )
  return defineType({
    name: component.name,
    title,
    type: 'object',
    icon: CATEGORY_ICON[component.category] ?? BlockElementIcon,
    groups: [
      ...(component.slots.length ? [{name: 'content', title: 'Content', default: true}] : []),
      ...(component.props.length ? [{name: 'settings', title: 'Settings', default: !component.slots.length}] : []),
    ],
    fieldsets,
    fields: fields.length ? fields : [defineField({name: 'note', type: 'string', readOnly: true, hidden: true})],
    preview: {
      select,
      prepare: (values: Record<string, any>) => {
        const found = findTitle(values)
        const detail = [values.sectionColorScheme, values.layout, values.variant, values.style].filter((v) => typeof v === 'string' && v).join(' · ')
        return {
          title: found ? (found.length > 70 ? `${found.slice(0, 70)}…` : found) : title,
          subtitle: [title, detail].filter(Boolean).join(' — '),
          media: CATEGORY_ICON[component.category] ?? BlockElementIcon,
        }
      },
    },
  })
}

export const inlineText = defineType({
  name: 'inlineText',
  title: 'Text',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [{title: 'Normal', value: 'normal'}],
      lists: [],
      marks: {
        decorators: [
          {title: 'Bold', value: 'strong'},
          {title: 'Italic', value: 'em'},
          {title: 'Underline', value: 'underline'},
          {title: 'Subscript', value: 'sub'},
          {title: 'Superscript', value: 'sup'},
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [
              {name: 'href', type: 'string', title: 'URL'},
              {name: 'openInNewTab', type: 'boolean', initialValue: false},
            ],
          },
        ],
      },
    }),
  ],
})

export const htmlEmbed = defineType({
  name: 'htmlEmbed',
  title: 'Custom HTML',
  type: 'object',
  icon: CodeIcon,
  fields: [
    defineField({name: 'label', type: 'string', description: 'Only shown in the Studio'}),
    defineField({name: 'code', type: 'text', rows: 8, validation: (rule) => rule.required()}),
  ],
  preview: {select: {title: 'label', code: 'code'}, prepare: ({title, code}) => ({title: title || 'Custom HTML', subtitle: code?.replace(/\s+/g, ' ').slice(0, 80)})},
})

export const htmlWrapper = defineType({
  name: 'htmlWrapper',
  title: 'Wrapper',
  type: 'object',
  icon: ThLargeIcon,
  description: 'A plain HTML element with classes, wrapping other blocks.',
  fields: [
    defineField({name: 'label', type: 'string', description: 'Only shown in the Studio'}),
    defineField({name: 'tag', type: 'string', initialValue: 'div', options: {list: ['div', 'section', 'article', 'aside', 'header', 'footer', 'ul', 'ol', 'li', 'span']}}),
    defineField({name: 'className', title: 'Classes', type: 'string'}),
    defineField({
      name: 'attributes',
      type: 'array',
      of: [defineArrayMember({type: 'object', name: 'attribute', fields: [defineField({name: 'name', type: 'string'}), defineField({name: 'value', type: 'string'})], preview: {select: {title: 'name', subtitle: 'value'}}})],
      options: {collapsible: true, collapsed: true} as any,
    }),
    blocksArray('children', 'Content'),
  ],
  preview: {
    select: {label: 'label', tag: 'tag', className: 'className', children: 'children'},
    prepare: ({label, tag, className, children}) => ({
      title: label || findTitle({children, className}) || 'Wrapper',
      subtitle: `Wrapper — <${tag || 'div'}${className ? ` class="${className}"` : ''}>`,
      media: ThLargeIcon,
    }),
  },
})

export const pageBuilderTypes = [inlineText, htmlEmbed, htmlWrapper, ...components.map(blockType)]
