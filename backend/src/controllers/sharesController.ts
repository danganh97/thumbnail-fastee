import type { Request, Response } from 'express'
import {
  createShareSnapshot,
  deleteShareSnapshot,
  getShareAccessModeByCode,
  getShareConfigByEditorId,
  getShareEditorStatusByCode,
  heartbeatSharePresenceByCode,
  listSharePresenceByCode,
  resolveShareByCode,
  updateSharedEditorByCode,
} from '../services/sharesService'
import type { CreateShareRequestBody } from '../types/shares'
import type { AuthenticatedRequest } from '../middleware/auth'
import type { PresenceHeartbeatBody } from '../types/editors'

export async function createShare(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest
    if (!authReq.authUser) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }
    const body = req.body as CreateShareRequestBody
    if (!body || typeof body !== 'object' || !body.editorId?.trim()) {
      res.status(400).json({ error: 'editorId is required' })
      return
    }
    if (body.accessMode === 'specific_users' && (!Array.isArray(body.allowedEmails) || body.allowedEmails.length === 0)) {
      res.status(400).json({ error: 'allowedEmails is required when accessMode is specific_users' })
      return
    }
    const result = await createShareSnapshot({
      userId: authReq.authUser.id,
      name: body.name,
      editorId: body.editorId.trim(),
      accessMode: body.accessMode,
      permissionMode: body.permissionMode,
      allowedEmails: body.allowedEmails,
      expiresInSeconds: body.expiresInSeconds,
    })
    res.status(201).json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create share'
    res.status(400).json({ error: message })
  }
}

export async function getShareForEditor(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest
  if (!authReq.authUser) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }
  const editorId = req.params.editorId?.trim()
  if (!editorId) {
    res.status(400).json({ error: 'editorId is required' })
    return
  }
  const result = await getShareConfigByEditorId(editorId, authReq.authUser.id)
  if (!result) {
    res.status(404).json({ error: 'Share not found' })
    return
  }
  res.json(result)
}

export async function getShare(req: Request, res: Response): Promise<void> {
  const code = req.params.code?.trim()
  if (!code) {
    res.status(400).json({ error: 'code is required' })
    return
  }

  const authReq = req as AuthenticatedRequest
  const viewerEmail = authReq.authUser?.email ?? null
  const result = await resolveShareByCode(code, viewerEmail)
  if (!result) {
    if (!authReq.authUser) {
      const accessMode = await getShareAccessModeByCode(code)
      if (accessMode === 'specific_users') {
        res.status(401).json({ error: 'Please login with an authorized account to access this shared editor' })
        return
      }
    }
    res.status(404).json({ error: 'Share link is invalid, expired, or not allowed for this account' })
    return
  }
  res.json(result)
}

export async function removeShare(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest
  if (!authReq.authUser) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }
  const snapshotId = req.params.snapshotId?.trim()
  if (!snapshotId) {
    res.status(400).json({ error: 'snapshotId is required' })
    return
  }

  const result = await deleteShareSnapshot(snapshotId, authReq.authUser.id)
  if (result === 'not_found') {
    res.status(404).json({ error: 'Share not found' })
    return
  }
  if (result === 'forbidden') {
    res.status(403).json({ error: 'You do not own this share' })
    return
  }
  res.json({ success: true })
}

export async function getShareStatus(req: Request, res: Response): Promise<void> {
  const code = req.params.code?.trim()
  if (!code) {
    res.status(400).json({ error: 'code is required' })
    return
  }
  const authReq = req as AuthenticatedRequest
  const status = await getShareEditorStatusByCode(code, authReq.authUser?.email ?? null)
  if (!status) {
    res.status(404).json({ error: 'Share link is invalid, expired, or not allowed for this account' })
    return
  }
  res.json(status)
}

export async function heartbeatSharePresence(req: Request, res: Response): Promise<void> {
  const code = req.params.code?.trim()
  if (!code) {
    res.status(400).json({ error: 'code is required' })
    return
  }
  const body = req.body as PresenceHeartbeatBody
  if (!body?.sessionId?.trim()) {
    res.status(400).json({ error: 'sessionId is required' })
    return
  }
  const authReq = req as AuthenticatedRequest
  const ok = await heartbeatSharePresenceByCode({
    code,
    sessionId: body.sessionId.trim(),
    displayName: (body.displayName?.trim() || authReq.authUser?.name || authReq.authUser?.email || 'Anonymous').slice(0, 255),
    viewerEmail: authReq.authUser?.email ?? null,
    viewerUserId: authReq.authUser?.id ?? null,
  })
  if (!ok) {
    res.status(404).json({ error: 'Share link is invalid, expired, or not allowed for this account' })
    return
  }
  res.json({ success: true })
}

export async function listSharePresence(req: Request, res: Response): Promise<void> {
  const code = req.params.code?.trim()
  if (!code) {
    res.status(400).json({ error: 'code is required' })
    return
  }
  const authReq = req as AuthenticatedRequest
  const result = await listSharePresenceByCode(code, authReq.authUser?.email ?? null)
  if (!result) {
    res.status(404).json({ error: 'Share link is invalid, expired, or not allowed for this account' })
    return
  }
  res.json(result)
}

export async function updateSharedEditor(req: Request, res: Response): Promise<void> {
  try {
    const code = req.params.code?.trim()
    if (!code) {
      res.status(400).json({ error: 'code is required' })
      return
    }
    const body = req.body as { payload?: unknown; name?: string }
    if (!body || typeof body !== 'object' || !('payload' in body)) {
      res.status(400).json({ error: 'payload is required' })
      return
    }
    const authReq = req as AuthenticatedRequest
    const result = await updateSharedEditorByCode({
      code,
      payload: body.payload,
      name: body.name,
      viewerEmail: authReq.authUser?.email ?? null,
    })
    if (result === 'readonly') {
      res.status(403).json({ error: 'This shared editor is view-only' })
      return
    }
    if (result === 'not_found_or_forbidden') {
      res.status(404).json({ error: 'Share link is invalid, expired, or not allowed for this account' })
      return
    }
    res.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update shared editor'
    res.status(400).json({ error: message })
  }
}
