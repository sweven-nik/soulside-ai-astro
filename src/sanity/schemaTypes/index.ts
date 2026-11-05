import {announcementBanner} from './documents/announcementBanner'
import {legalPage} from './documents/legalPage'
import {ehrLogo, trustedByLogo} from './documents/logos'
import {resource, resourceCategory} from './documents/resource'
import {teamMember} from './documents/teamMember'
import {testimonial} from './documents/testimonial'
import {richText} from './objects/richText'

export const schemaTypes = [
  // objects
  richText,
  // documents
  resource,
  resourceCategory,
  testimonial,
  teamMember,
  ehrLogo,
  trustedByLogo,
  announcementBanner,
  legalPage,
]
