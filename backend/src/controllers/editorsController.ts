import type { Request, Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth'
import {
  createEditor,
  deleteEditorById,
  getEditorById,
  listEditorsByUser,
  getEditorStatus,
  heartbeatEditorPresence,
  listEditorPresence,
  updateEditorById,
} from '../services/editorsService'
import type { CreateEditorRequestBody, PresenceHeartbeatBody, UpdateEditorRequestBody } from '../types/editors'

export async function listEditorRecords(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest
  if (!authReq.authUser) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }
  const editors = await listEditorsByUser(authReq.authUser.id)
  res.json({ editors })
}

export async function createEditorRecord(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest
    if (!authReq.authUser) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }
    const body = req.body as CreateEditorRequestBody
    if (!body || typeof body !== 'object' || !('payload' in body)) {
      res.status(400).json({ error: 'payload is required' })
      return
    }

    const result = await createEditor({
      userId: authReq.authUser.id,
      name: body.name,
      payload: body.payload,
    })
    res.status(201).json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create editor'
    res.status(400).json({ error: message })
  }
}

export async function getEditorRecord(req: Request, res: Response): Promise<void> {
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

  const result = await getEditorById(editorId, authReq.authUser.id)
  if (!result) {
    res.status(404).json({ error: 'Editor not found' })
    return
  }

  res.json(result)
}

export async function updateEditorRecord(req: Request, res: Response): Promise<void> {
  try {
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

    const body = req.body as UpdateEditorRequestBody
    if (!body || typeof body !== 'object' || !('payload' in body)) {
      res.status(400).json({ error: 'payload is required' })
      return
    }

    const result = await updateEditorById({
      editorId,
      userId: authReq.authUser.id,
      payload: body.payload,
      name: body.name,
    })
    if (!result) {
      res.status(404).json({ error: 'Editor not found' })
      return
    }

    res.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update editor'
    res.status(400).json({ error: message })
  }
}

export async function deleteEditorRecord(req: Request, res: Response): Promise<void> {
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

  const deleted = await deleteEditorById(editorId, authReq.authUser.id)
  if (!deleted) {
    res.status(404).json({ error: 'Editor not found' })
    return
  }
  res.status(204).send()
}

export async function getEditorStatusRecord(req: Request, res: Response): Promise<void> {
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
  const status = await getEditorStatus(editorId, authReq.authUser.id)
  if (!status) {
    res.status(404).json({ error: 'Editor not found' })
    return
  }
  res.json(status)
}

export async function heartbeatEditorPresenceRecord(req: Request, res: Response): Promise<void> {
  try {
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
    const body = req.body as PresenceHeartbeatBody
    if (!body?.sessionId?.trim()) {
      res.status(400).json({ error: 'sessionId is required' })
      return
    }
    await heartbeatEditorPresence({
      editorId,
      userId: authReq.authUser.id,
      sessionId: body.sessionId.trim(),
      displayName: (body.displayName?.trim() || authReq.authUser.name || authReq.authUser.email).slice(0, 255),
    })
    res.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to heartbeat presence'
    res.status(400).json({ error: message })
  }
}

export async function listEditorPresenceRecord(req: Request, res: Response): Promise<void> {
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
  const rows = await listEditorPresence(editorId, authReq.authUser.id)
  if (!rows) {
    res.status(404).json({ error: 'Editor not found' })
    return
  }
  res.json({ users: rows })
}
