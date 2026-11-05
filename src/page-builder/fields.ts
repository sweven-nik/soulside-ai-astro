/** Naming shared by the Sanity schema, the renderer and the page converter. */
export const slotField = (slot: string) => `slot_${slot.replace(/-/g, '_')}`;

export const humanize = (value: string) =>
  value
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (c) => c.toUpperCase());

/** "ElementContentGroup" -> "Content Group", "SectionTestimonials" -> "Testimonials Section". */
export function componentTitle(name: string) {
  if (name === 'Section') return 'Section';
  const m = name.match(/^(Element|Section|Layout|Button|Global|Nest|Utility|Icon)(.+)$/);
  if (!m) return humanize(name).replace(/(\S)\s(\S)/g, '$1 $2');
  const rest = humanize(m[2]);
  return m[1] === 'Section' ? `${rest} Section` : m[1] === 'Layout' ? `${rest} Layout` : rest;
}

export interface ManifestProp {
  name: string;
  label: string | null;
  kind: 'enum' | 'boolean' | 'number' | 'string' | 'image' | 'unsupported';
  options?: string[];
  default?: string | number | boolean;
}
export interface ManifestSlot {
  name: string;
  kind: 'string' | 'inline' | 'rich' | 'svg' | 'blocks';
}
export interface ManifestComponent {
  name: string;
  path: string;
  category: string;
  props: ManifestProp[];
  slots: ManifestSlot[];
}
