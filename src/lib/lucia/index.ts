import 'server-only'
import { Lucia, User, Session } from 'lucia'
import { PayloadAdapter } from './payloadAdapter'
import { cache } from 'react'
import { cookies } from 'next/headers'
// import { getFieldsToSign } from 'payload'
// import { User as UserCollection } from '@/user/User.collection'
// import { User as UserType } from '@/payload-types'
// import { COLLECTION_SLUG } from '@/config'

const adapter = PayloadAdapter.create()

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === 'production',
    },
  },
  getUserAttributes: (attributes) => {
    return {
      email: attributes.email,
      name: attributes?.name,
      firstName: attributes?.firstName,
      lastName: attributes?.lastName,
      updatedAt: attributes?.updatedAt,
    }
    //You could do this, but then you have to manually assign types, if you want it to be accurate
    // const userData: Omit<
    //   Partial<UserType>,
    //   'hash' | 'salt' | 'loginAttempts' | 'lockUntil' | 'salt'
    // > = getFieldsToSign({
    //   collectionConfig: UserCollection,
    //   email: attributes?.email ?? '',
    //   user: { collection: COLLECTION_SLUG.USER, ...attributes } as UserType & {
    //     collection: 'user'
    //   },
    // })

    // return userData
  },
})

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia
    DatabaseUserAttributes: DatabaseUserAttributes
  }
}

interface DatabaseUserAttributes {
  email: string
  name?: string
  firstName?: string
  lastName?: string
  updatedAt?: string
}

export const validateRequest = cache(
  async (): Promise<{ user: User; session: Session } | { user: null; session: null }> => {
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null

    if (!sessionId) {
      return {
        user: null,
        session: null,
      }
    }

    const result = await lucia.validateSession(sessionId)

    try {
      if (result.session && result.session.fresh) {
        const sessionCookie = lucia.createSessionCookie(result.session.id)
        cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
      }
      if (!result.session) {
        const sessionCookie = lucia.createBlankSessionCookie()
        cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
      }
    } catch {}
    return result
  },
)
