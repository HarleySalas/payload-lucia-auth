import { COLLECTION_SLUG } from '@/config'
import { buildCachedPayload } from '@payload-enchants/cached-local-api'
import { revalidateTag, unstable_cache } from 'next/cache'

export const { cachedPayloadPlugin, getCachedPayload } = buildCachedPayload({
  // collections list to cache
  collections: [
    {
      slug: COLLECTION_SLUG.USER,
      findOneFields: ['id'],
    },
    {
      slug: COLLECTION_SLUG.SESSION,
      findOneFields: ['id'],
    },
  ],
  // Log when revalidation runs or operation cache HIT / SKIP
  loggerDebug: true,
  //   globals: [{ slug: 'header' }],
  revalidateTag,
  options: {},
  unstable_cache,
})
