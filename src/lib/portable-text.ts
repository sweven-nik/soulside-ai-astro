import {escapeHTML, toHTML, uriLooksSafe, type PortableTextHtmlComponents} from '@portabletext/to-html'

const components: Partial<PortableTextHtmlComponents> = {
  marks: {
    sub: ({children}) => `<sub>${children}</sub>`,
    sup: ({children}) => `<sup>${children}</sup>`,
    underline: ({children}) => `<u>${children}</u>`,
    'strike-through': ({children}) => `<s>${children}</s>`,
    link: ({children, value}) => {
      const href = value?.href ?? ''
      if (!uriLooksSafe(href)) return children
      const target = value?.openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : ''
      return `<a href="${escapeHTML(href)}"${target}>${children}</a>`
    },
  },
  types: {
    image: ({value}) => (value?.url ? `<figure><img src="${escapeHTML(value.url)}" alt="${escapeHTML(value.alt ?? '')}" loading="lazy" />${value.caption ? `<figcaption>${escapeHTML(value.caption)}</figcaption>` : ''}</figure>` : ''),
  },
}

/** Render Portable Text to the same HTML the Webflow rich text fields produced. */
export function portableTextToHtml(blocks: unknown): string {
  return Array.isArray(blocks) && blocks.length ? toHTML(blocks as any, {components}) : ''
}

/** Render inline text (a single paragraph) without the wrapping <p>, for text slots. */
export function portableTextToInlineHtml(blocks: unknown): string {
  if (!Array.isArray(blocks) || !blocks.length) return ''
  return toHTML(blocks as any, {components: {...components, block: {normal: ({children}) => children ?? ''}}})
}
