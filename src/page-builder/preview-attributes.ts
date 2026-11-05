import { createDataAttribute } from '@sanity/visual-editing/create-data-attribute';
import { dataset, projectId } from '@/sanity/env';

/** Which document and array a list of blocks belongs to, for Visual Editing overlays. */
export interface PreviewContext {
  id: string;
  type: string;
  /** Path to the blocks array inside the document, e.g. `sections` or `sections[_key=="a1"].slot_default`. */
  path?: string;
}

/** The data-sanity attribute for one block, which lets Presentation select and drag it. */
export function blockAttribute(preview: PreviewContext, path: string) {
  return createDataAttribute({ projectId, dataset, baseUrl: '/admin', id: preview.id, type: preview.type, path }).toString();
}
