import type { Request, Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth'
import { attachSessionCookie, clearSessionCookie, loginWithGoogleCredential } from '../services/authService'
import type { GoogleOneTapBody } from '../types/auth'

export async function googleOneTapLogin(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as GoogleOneTapBody
    if (!body?.credential) {
      res.status(400).json({ error: 'credential is required' })
      return
    }
    const user = await loginWithGoogleCredential(body.credential)
    attachSessionCookie(res, user)
    res.json({ user })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Google login failed'
    res.status(401).json({ error: message })
  }
}

export function getCurrentUser(req: Request, res: Response): void {
  const authReq = req as AuthenticatedRequest
  if (!authReq.authUser) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }
  res.json({ user: authReq.authUser })
}

export function logout(req: Request, res: Response): void {
  clearSessionCookie(res)
  res.json({ success: true })
}
