import { defineMiddleware } from 'astro:middleware';

// Paths that stay as-is inside the preview (assets, the Studio, API routes, files).
const KEEP = /^\/(preview|admin|api|_astro|assets)(\/|$)|\.[a-z0-9]+$/i;

/**
 * In the Visual Editing preview, keep site links inside /preview so editors can click around
 * the site in the Presentation tool and stay on drafts.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  if (!context.url.pathname.startsWith('/preview') || !response.headers.get('content-type')?.includes('text/html')) return response;
  const html = (await response.text()).replace(/href="(\/[^"]*)"/g, (match, href: string) =>
    KEEP.test(href.split(/[?#]/)[0]) ? match : `href="/preview${href === '/' ? '' : href}"`,
  );
  return new Response(html, { status: response.status, headers: response.headers });
});
