'use server'
import { cookies } from 'next/headers'
import { authProviders } from './providers'
import { AUTH_REDIRECT_COOKIE } from './constants'
import { redirect } from 'next/navigation'
import { lucia, validateRequest } from '@/lib/lucia'

interface LoginOptions {
  provider: keyof typeof authProviders
  redirectTo?: string
}

export const login = async ({ provider, redirectTo }: LoginOptions) => {
  if (!provider || !(provider in authProviders)) {
    throw new Error('Invalid OAuth Provider')
  }

  if (redirectTo) {
    cookies().set(AUTH_REDIRECT_COOKIE, redirectTo, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 60 * 10,
      sameSite: 'lax',
    })
  }

  const url = await authProviders[provider].createAuthorizationURL({
    //add more provider scopes here as needed
    scopes: provider === 'google' ? ['profile', 'email'] : undefined,
  })

  redirect(url)
}

export const logout = async (): Promise<ActionResult> => {
  const { session } = await validateRequest()
  if (!session) {
    return {
      error: 'Unauthorized',
    }
  }

  await lucia.invalidateSession(session.id)

  const sessionCookie = lucia.createBlankSessionCookie()
  cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
  return {
    error: null,
  }
}

interface ActionResult {
  error: string | null
}
