import { COLLECTION_SLUG } from '@/config'
import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: COLLECTION_SLUG.MEDIA,
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: true,
}
