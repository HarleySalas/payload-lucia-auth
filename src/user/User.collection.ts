import { COLLECTION_SLUG } from '@/config'
import type { CollectionConfig } from 'payload'

export const User: CollectionConfig = {
  slug: COLLECTION_SLUG.USER,
  admin: {
    useAsTitle: 'email',
  },
  auth: {},
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'firstName',
      type: 'text',
      saveToJWT: true,
    },
    {
      name: 'lastName',
      type: 'text',
    },
    {
      name: 'imageUrl',
      type: 'text',
    },
    {
      name: 'provider',
      type: 'text',
    },
    {
      name: 'providerAccountId',
      type: 'text',
    },
    {
      name: 'metadata',
      type: 'json',
    },
  ],
}
