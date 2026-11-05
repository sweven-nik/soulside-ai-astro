import type { APIRoute } from 'astro';
import { PREVIEW_COOKIE } from '@/lib/preview';

export const prerender = false;

export const GET: APIRoute = ({ cookies, redirect, url }) => {
  cookies.delete(PREVIEW_COOKIE, { path: '/' });
  const to = url.searchParams.get('redirect') ?? '/';
  return redirect(to.startsWith('/') ? to : '/', 307);
};
