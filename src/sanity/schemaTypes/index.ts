import {announcementBanner} from './documents/announcementBanner'
import {legalPage} from './documents/legalPage'
import {ehrLogo, trustedByLogo} from './documents/logos'
import {resource, resourceCategory} from './documents/resource'
import {teamMember} from './documents/teamMember'
import {testimonial} from './documents/testimonial'
import {richText} from './objects/richText'
import {page} from './documents/page'
import {pageBuilderTypes} from './pageBuilder'

export const schemaTypes = [
  // objects
  richText,
  ...pageBuilderTypes,
  // documents
  page,
  resource,
  resourceCategory,
  testimonial,
  teamMember,
  ehrLogo,
  trustedByLogo,
  announcementBanner,
  legalPage,
]
