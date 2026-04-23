import axios from 'axios'
import type { AuthUser } from '@/types'

const DEFAULT_API_URL = 'http://localhost:3000'
const apiUrl = (
  (import.meta.env.VITE_API_URL as string | undefined)?.trim()
  || DEFAULT_API_URL
).replace(/\/$/, '')

export async function loginWithGoogleOneTap(credential: string): Promise<AuthUser> {
  const { data } = await axios.post<{ user: AuthUser }>(
    `${apiUrl}/auth/google/onetap`,
    { credential },
    { withCredentials: true },
  )
  return data.user
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data } = await axios.get<{ user: AuthUser }>(`${apiUrl}/auth/me`, {
      withCredentials: true,
    })
    return data.user
  } catch {
    return null
  }
}

export async function logoutCurrentUser(): Promise<void> {
  await axios.post(`${apiUrl}/auth/logout`, {}, { withCredentials: true })
}
