import type { APIRoute } from 'astro';
import { createClient } from '@sanity/client';
import { validatePreviewUrl } from '@sanity/preview-url-secret';
import { PREVIEW_COOKIE, PREVIEW_PREFIX, configuredToken, devWithoutToken, previewCookieValue } from '@/lib/preview';
import { apiVersion, dataset, projectId } from '@/sanity/env';

export const prerender = false;

const toPreviewPath = (path: string) => (path.startsWith(PREVIEW_PREFIX) ? path : PREVIEW_PREFIX + (path === '/' ? '' : path));

/** Called by the Presentation tool with a one-time secret; sets the preview cookie. */
export const GET: APIRoute = async ({ request, cookies, redirect, url }) => {
  // `astro dev` without a token previews published content, so there's no secret to check.
  if (devWithoutToken()) return redirect(toPreviewPath(url.searchParams.get('sanity-preview-pathname') ?? PREVIEW_PREFIX), 307);

  const token = configuredToken();
  if (!token) return new Response('Preview is not configured: set the SANITY_API_READ_TOKEN secret on the Worker.', { status: 503 });
  const client = createClient({ projectId, dataset, apiVersion, useCdn: false, token });
  const { isValid, redirectTo = PREVIEW_PREFIX } = await validatePreviewUrl(client, request.url);
  if (!isValid) return new Response('Invalid preview secret', { status: 401 });

  cookies.set(PREVIEW_COOKIE, await previewCookieValue(token), {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax', // the Studio and the preview are on the same site
    maxAge: 60 * 60 * 8,
  });
  return redirect(toPreviewPath(redirectTo), 307);
};
