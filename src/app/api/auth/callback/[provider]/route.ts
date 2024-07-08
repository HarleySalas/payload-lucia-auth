import { authProviders } from '@/auth/providers'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import config from '@payload-config'
import { COLLECTION_SLUG } from '@/config'
import { lucia } from '@/lib/lucia'
import { User } from '@/payload-types'
import { OAuth2RequestError } from 'arctic'
import { AUTH_REDIRECT_COOKIE } from '@/auth/constants'

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: keyof typeof authProviders } },
): Promise<Response> {
  const url = new URL(request.url)
  const provider = String(params?.provider) as keyof typeof authProviders
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const storedState = cookies().get(authProviders[provider].cookieName)?.value ?? null
  const providerConfig = authProviders[provider] ?? null

  if (!code || !state || !storedState || state !== storedState) {
    return new Response(null, { status: 400, statusText: 'Invalid OAuth State...' })
  }

  try {
    const payload = await getPayloadHMR({ config })
    const { data, email } = await providerConfig.exchangeCodeForUser(request)
    let user

    const { docs } = await payload.find({
      collection: COLLECTION_SLUG.USER,
      where: {
        and: [
          {
            provider: {
              equals: data.provider,
            },
          },
          {
            providerAccountId: {
              equals: data.providerAccountId,
            },
          },
        ],
      },
    })

    user = docs?.at(0) || null

    if (user) {
      const updatedUser = await payload.update({
        collection: COLLECTION_SLUG.USER,
        id: user.id,
        data: {
          email: email,
          /** @ts-ignore */
          metadata: data.metadata,
        },
      })

      user = updatedUser
    } else {
      user = await payload.create({
        collection: COLLECTION_SLUG.USER,
        data: {
          email: email,
          password: 'testing123',
          provider: data.provider,
          providerAccountId: data.providerAccountId,
          metadata: data.metadata,
        },
      })
    }

    if (!user) {
      throw new Error('Failed to create or update user...')
    }

    //ignored, because payload incorrectly types the update operation as a bulk update, even when it's a single update
    /** @ts-ignore */
    const session = await lucia.createSession(user.id, {})
    const sessionCookie = lucia.createSessionCookie(session.id)
    cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)

    const redirectTo = cookies().get(AUTH_REDIRECT_COOKIE)?.value ?? null
    cookies().delete(AUTH_REDIRECT_COOKIE)

    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectTo ? decodeURIComponent(redirectTo) : '/',
      },
    })
  } catch (error) {
    console.error(error)
    if (error instanceof OAuth2RequestError) {
      return new Response(null, {
        status: 400,
      })
    }
    return new Response(null, {
      status: 500,
    })
  }
}
