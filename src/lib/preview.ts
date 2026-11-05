/**
 * Visual Editing preview (server only). Pages under /preview render drafts on demand for
 * editors in Sanity's Presentation tool; the public site stays prerendered.
 *
 * Access: the Presentation tool calls /api/draft-mode/enable with a one-time secret, which is
 * checked against Sanity with the read token. On success a cookie is set whose value is derived
 * from the token, so it can't be forged without it.
 */
import { createClient, type StegaConfig } from '@sanity/client';
import { env } from 'cloudflare:workers';
import { apiVersion, dataset, projectId } from '@/sanity/env';

export const PREVIEW_COOKIE = 'sanity-preview';
export const PREVIEW_PREFIX = '/preview';

export const configuredToken = () => (env as Record<string, string | undefined>).SANITY_API_READ_TOKEN;

/**
 * `astro dev` without a token (no .dev.vars) previews *published* content with the overlays,
 * so the preview can be worked on locally. Never in a production build.
 */
const devWithoutToken = () => import.meta.env.DEV && !configuredToken();

export function readToken(): string {
  const token = configuredToken();
  if (!token) throw new Error('SANITY_API_READ_TOKEN is not set (Cloudflare secret, or .dev.vars locally).');
  return token;
}

export async function previewCookieValue(token = readToken()) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`soulside-preview:${token}`));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function isPreviewRequest(cookie: string | undefined) {
  if (devWithoutToken()) return true;
  if (!cookie || !configuredToken()) return false;
  return cookie === (await previewCookieValue());
}

/**
 * Stega (the invisible markers that make text clickable) only on text editors see: slot text and
 * Portable Text spans, and button labels. Never on prop values like "lightest", which the
 * components compare against, or on HTML, SVG, classes and URLs.
 */
const stegaFilter: StegaConfig['filter'] = ({ sourcePath, filterDefault, ...rest }) => {
  const last = sourcePath.at(-1);
  const inCode = sourcePath.some((seg) => typeof seg === 'string' && (seg === 'code' || seg === 'attributes' || seg === 'className' || /svg/.test(seg)));
  if (inCode) return false;
  const isText = last === 'text' || (typeof last === 'string' && last.startsWith('slot_'));
  return isText && filterDefault({ sourcePath, ...rest });
};

export function previewClient() {
  const local = devWithoutToken();
  return createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    ...(local ? {} : { token: readToken() }),
    perspective: local ? 'published' : 'drafts',
    stega: { enabled: true, studioUrl: '/admin', filter: stegaFilter },
  });
}

/** "/preview/contact" -> "contact", "/preview" -> "index". */
export const slugFromPreviewPath = (path?: string) => (path ? path.replace(/^\/+|\/+$/g, '') : '') || 'index';
