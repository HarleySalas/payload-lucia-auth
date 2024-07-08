'use client'
import React from 'react'
import { login } from '../actions'

export const Login = () => {
  return (
    <div>
      <p>Login</p>
      <button onClick={() => login({ provider: 'google' })}>Login with Google</button>
    </div>
  )
}
