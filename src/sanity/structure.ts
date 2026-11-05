import type {StructureResolver} from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Resources')
        .child(
          S.list()
            .title('Resources')
            .items([S.documentTypeListItem('resource').title('All resources'), S.documentTypeListItem('resourceCategory').title('Categories')]),
        ),
      S.divider(),
      S.documentTypeListItem('testimonial').title('Testimonials'),
      S.documentTypeListItem('teamMember').title('Team'),
      S.listItem()
        .title('Logos')
        .child(
          S.list()
            .title('Logos')
            .items([S.documentTypeListItem('trustedByLogo').title('Trusted by'), S.documentTypeListItem('ehrLogo').title('EHR integrations')]),
        ),
      S.divider(),
      S.documentTypeListItem('announcementBanner').title('Announcement banners'),
      S.documentTypeListItem('legalPage').title('Legal pages'),
    ])
