import type { NextFunction, Request, Response } from 'express'
import type { SessionUser } from '../types/auth'
import { sessionCookieName, verifySessionToken } from '../services/authService'

export interface AuthenticatedRequest extends Request {
  authUser?: SessionUser
}

export function attachAuthUser(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[sessionCookieName()]
  if (typeof token === 'string' && token) {
    const user = verifySessionToken(token)
    if (user) {
      ;(req as AuthenticatedRequest).authUser = user
    }
  }
  next()
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthenticatedRequest
  if (!authReq.authUser) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }
  next()
}
