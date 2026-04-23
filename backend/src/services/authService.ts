import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'
import type { Response } from 'express'
import { ensureSchema } from './schemaService'
import { UserRepository } from '../repositories/UserRepository'
import type { SessionUser } from '../types/auth'

const SESSION_COOKIE_NAME = 'fastee_session'
const SESSION_EXPIRES_SECONDS = 7 * 24 * 60 * 60

function jwtSecret(): string {
  return process.env.SESSION_SECRET ?? 'change-me-session-secret'
}

function googleClientId(): string {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID is required for Google One Tap login')
  return clientId
}

function sessionCookieSecure(): boolean {
  return process.env.COOKIE_SECURE === 'true'
}

const googleClient = new OAuth2Client()

interface SessionPayload {
  sub: string
  email: string
  name: string | null
}

function signSessionToken(user: SessionUser): string {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name } satisfies SessionPayload,
    jwtSecret(),
    { expiresIn: SESSION_EXPIRES_SECONDS },
  )
}

export function verifySessionToken(token: string): SessionUser | null {
  try {
    const payload = jwt.verify(token, jwtSecret()) as SessionPayload
    if (!payload?.sub || !payload?.email) return null
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name ?? null,
    }
  } catch {
    return null
  }
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: sessionCookieSecure(),
    sameSite: 'lax',
  })
}

export function attachSessionCookie(res: Response, user: SessionUser): void {
  const token = signSessionToken(user)
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: sessionCookieSecure(),
    sameSite: 'lax',
    maxAge: SESSION_EXPIRES_SECONDS * 1000,
  })
}

export function sessionCookieName(): string {
  return SESSION_COOKIE_NAME
}

export async function loginWithGoogleCredential(credential: string): Promise<SessionUser> {
  if (!credential) throw new Error('Missing Google credential')

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: googleClientId(),
  })
  const payload = ticket.getPayload()
  const email = payload?.email?.toLowerCase()
  if (!email) throw new Error('Google token missing email')
  const name = payload?.name ?? null

  await ensureSchema()
  const existingUser = await UserRepository.findByEmail(email)

  if (existingUser) {
    await UserRepository.updateName(existingUser.id, name)
    return { id: existingUser.id, email, name }
  }

  const id = crypto.randomUUID()
  await UserRepository.create({ id, name, email, passwordHash: null })

  return { id, email, name }
}
