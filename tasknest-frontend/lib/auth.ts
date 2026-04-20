'use server'

import { cookies } from 'next/headers'

export async function getAccessToken(): Promise<string | null> {
  const cookieStore = cookies()
  return cookieStore.get('accessToken')?.value ?? null
}

export async function setAccessToken(token: string) {
  const cookieStore = cookies()
  cookieStore.set('accessToken', token, {
    httpOnly: false, // must be readable by middleware
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 15, // 15 minutes
    path: '/',
  })
}

export async function clearAccessToken() {
  const cookieStore = cookies()
  cookieStore.delete('accessToken')
}
