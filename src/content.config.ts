import { sanityLoader } from '@sanity/astro/loader';
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { sanityClient } from 'sanity:client';
import { portableTextToHtml } from '@/lib/portable-text';

/*
 * Collections are loaded from Sanity at build time. Each query projects the
 * Sanity document into the field names the Webflow-exported components already
 * use ("testimonial-text", "post-body", ...), so the components didn't need to change.
 * Images come through as { url, alt }, which imageUrl() and the image components accept.
 */

// Fields every exported component expects on an entry.
const base = `_id, name, "isDraft": false, "isArchived": false, "created-on": _createdAt, "updated-on": _updatedAt, "published-on": _updatedAt`;
const img = (field: string, as = field) => `"${as}": ${field}{ "url": asset->url, alt }`;

const image = z.object({ url: z.string(), alt: z.string().nullish() }).nullish();
const richTextHtml = z.array(z.any()).nullish().transform((blocks) => portableTextToHtml(blocks));
const entry = {
  _id: z.string(),
  name: z.string(),
  isDraft: z.boolean(),
  isArchived: z.boolean(),
  order: z.number().nullish(),
  'created-on': z.string().nullish(),
  'updated-on': z.string().nullish(),
  'published-on': z.string().nullish(),
};

const bySlug = (doc: { _id: string; slug?: string | null }) => doc.slug || doc._id;

const collection = <S extends z.ZodRawShape>(query: string, fields: S, id?: (doc: any) => string) =>
  defineCollection({
    loader: sanityLoader({ client: sanityClient, query, ...(id ? { id } : {}) }),
    schema: z.object({ ...entry, ...fields }).passthrough(),
  });

export const collections = {
  'announcement-banners': collection(
    `*[_type == "announcementBanner"]{ ${base}, message, link }`,
    { message: z.string().nullish(), link: z.string().nullish() },
  ),
  'ehr-logos': collection(
    `*[_type == "ehrLogo"] | order(order asc){ ${base}, order, ${img('logo')} }`,
    { logo: image },
  ),
  'trusted-by-logos': collection(
    `*[_type == "trustedByLogo"] | order(order asc){ ${base}, order, ${img('logo')} }`,
    { logo: image },
  ),
  testimonials: collection(
    `*[_type == "testimonial"] | order(order asc){
      ${base}, order,
      "case-study-if-applicable": caseStudy._ref,
      "stat-number": statNumber,
      "stat-description": statDescription,
      "testimonial-text": quote,
      "testimonial-name": personName,
      "testimonial-title-attribution": attribution,
      ${img('image')}
    }`,
    {
      'case-study-if-applicable': z.string().nullish(),
      'stat-number': z.string().nullish(),
      'stat-description': z.string().nullish(),
      'testimonial-text': z.string().nullish(),
      'testimonial-name': z.string().nullish(),
      'testimonial-title-attribution': z.string().nullish(),
      image,
    },
  ),
  legal: collection(
    `*[_type == "legalPage"]{ ${base}, "slug": slug.current, body }`,
    { slug: z.string(), body: richTextHtml },
    bySlug,
  ),
  'resource-categories': collection(
    `*[_type == "resourceCategory"] | order(order asc){ ${base}, order, "slug": slug.current }`,
    { slug: z.string().nullish() },
    bySlug,
  ),
  team: collection(
    `*[_type == "teamMember"] | order(order asc){
      ${base}, order, title,
      "slug": slug.current,
      ${img('headshot')},
      "linkedin-url": linkedinUrl,
      "sort-order": order,
      "is-advisor": isAdvisor,
      "short-bio": shortBio
    }`,
    {
      slug: z.string().nullish(),
      title: z.string().nullish(),
      headshot: image,
      'linkedin-url': z.string().nullish(),
      'sort-order': z.number().nullish(),
      'is-advisor': z.boolean().nullish(),
      'short-bio': z.string().nullish(),
    },
    bySlug,
  ),
  resource: collection(
    `*[_type == "resource"] | order(publishDate desc){
      ${base},
      "slug": slug.current,
      "publish-date": publishDate,
      "resource-type-2": category._ref,
      "post-body": body,
      "post-summary": summary,
      ${img('mainImage', 'main-image')},
      ${img('thumbnailImage', 'thumbnail-image')},
      featured
    }`,
    {
      slug: z.string(),
      'publish-date': z.string().nullish(),
      'resource-type-2': z.string().nullish(),
      'post-body': richTextHtml,
      'post-summary': z.string().nullish(),
      'main-image': image,
      'thumbnail-image': image,
      featured: z.boolean().nullish(),
    },
    bySlug,
  ),
};
