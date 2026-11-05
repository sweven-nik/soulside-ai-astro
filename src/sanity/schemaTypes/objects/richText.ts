import {defineArrayMember, defineType} from 'sanity'

export const richText = defineType({
  name: 'richText',
  title: 'Rich text',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        {title: 'Normal', value: 'normal'},
        {title: 'H2', value: 'h2'},
        {title: 'H3', value: 'h3'},
        {title: 'H4', value: 'h4'},
        {title: 'H5', value: 'h5'},
        {title: 'H6', value: 'h6'},
        {title: 'Quote', value: 'blockquote'},
      ],
      marks: {
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [
              {name: 'href', type: 'url', validation: (rule) => rule.uri({allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel']})},
              {name: 'openInNewTab', type: 'boolean', initialValue: false},
            ],
          },
        ],
      },
    }),
    defineArrayMember({
      type: 'image',
      options: {hotspot: true},
      fields: [
        {name: 'alt', type: 'string', title: 'Alt text'},
        {name: 'caption', type: 'string'},
      ],
    }),
  ],
})
