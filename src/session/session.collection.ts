import { COLLECTION_SLUG } from '@/config'
import { CollectionConfig } from 'payload'

export const Session: CollectionConfig = {
  slug: COLLECTION_SLUG.SESSION,
  fields: [
    {
      name: 'id',
      type: 'text',
      required: true,
      index: true,
      unique: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: COLLECTION_SLUG.USER,
      required: true,
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
    },
  ],
}
