'use client'
import { Session, User } from 'lucia'
import React from 'react'
import { logout } from '../actions'

export const CurrentUser = ({ user, session }: { user: User; session: Session }) => {
  return (
    <div>
      <p>Current User:</p>
      <p>{JSON.stringify(user)}</p>
      <p>{JSON.stringify(session)}</p>
      <button onClick={() => logout()}>Logout</button>
    </div>
  )
}
