import { CurrentUser } from '@/auth/components/CurrentUser'
import { Login } from '@/auth/components/Login'
import { validateRequest } from '@/lib/lucia'
import React from 'react'

const Homepage = async () => {
  const { user, session } = await validateRequest()
  return (
    <div>
      <h1>Homepage</h1>
      {user ? <CurrentUser user={user} session={session} /> : <Login />}
    </div>
  )
}

export default Homepage
