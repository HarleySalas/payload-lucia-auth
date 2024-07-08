import { User } from '@/payload-types'
import { fetchJson } from '@/utils/fetchJson'
import { Google, generateState, generateCodeVerifier } from 'arctic'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const callbackUrl = (provider: keyof typeof authProviders): string => {
  return process.env.NODE_ENV === 'production'
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/${provider}`
    : `http://redirectmeto.com/${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/${provider}`
}

const google = new Google(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  callbackUrl('google'),
)

export const authProviders = {
  google: {
    cookieName: 'google_oauth_state',
    createAuthorizationURL: async (options?: any) => {
      const state = generateState()
      const codeVerifier = generateCodeVerifier()
      const url = await google.createAuthorizationURL(state, codeVerifier, options)
      cookies().set(authProviders.google.cookieName, state, {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 60 * 10,
        sameSite: 'lax',
      })

      cookies().set('codeVerifier', codeVerifier, {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 60 * 10,
        sameSite: 'lax',
      })

      return url.toString()
    },
    exchangeCodeForUser: async (
      request: NextRequest,
    ): Promise<{
      data: Pick<User, 'provider' | 'providerAccountId' | 'metadata'>
      email: string
    }> => {
      const code = request.nextUrl.searchParams.get('code')
      if (!code) throw new Error('Authorization code not found.')
      const codeVerifier = cookies().get('codeVerifier')?.value ?? ''

      try {
        const tokens = await google.validateAuthorizationCode(code, codeVerifier)

        const googleUser = await fetchJson('https://openidconnect.googleapis.com/v1/userinfo', {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        })

        return {
          data: {
            provider: 'google',
            providerAccountId: String(googleUser.sub),
            metadata: googleUser,
          },
          email: googleUser.email,
        }
      } catch (error) {
        console.error(error)
        throw new Error('Failed to validate authorization code.')
      }
    },
  },
}
