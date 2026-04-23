import crypto from 'crypto'
import { EditorPresenceRepository } from '../repositories/EditorPresenceRepository'
import { getRedis } from '../lib/redis'
import { ensureSchema } from './schemaService'
import { Editor } from '../models'
import { EditorRepository } from '../repositories/EditorRepository'
import { ShareAllowedUserRepository } from '../repositories/ShareAllowedUserRepository'
import { ShareSnapshotRepository } from '../repositories/ShareSnapshotRepository'
import type { ShareCreateResult, ShareEditorConfigResult, ShareResolveResult } from '../types/shares'

const DEFAULT_TTL_SECONDS = 7 * 24 * 60 * 60
const MIN_TTL_SECONDS = 60
const MAX_TTL_SECONDS = 60 * 24 * 60 * 60
const PRESENCE_TTL_MS = 30_000

function appBaseUrl(): string {
  return process.env.FRONTEND_BASE_URL ?? 'http://localhost:5173'
}

function ttlFromInput(input?: number | null): number | null {
  if (input === null) return null
  if (typeof input !== 'number' || !Number.isFinite(input)) return DEFAULT_TTL_SECONDS
  const rounded = Math.floor(input)
  return Math.max(MIN_TTL_SECONDS, Math.min(MAX_TTL_SECONDS, rounded))
}

function randomCode(): string {
  return crypto.randomBytes(9).toString('base64url')
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validatePayload(payload: unknown): void {
  if (!isObject(payload)) throw new Error('Invalid payload')
  const encoded = JSON.stringify(payload)
  if (!encoded || encoded.length < 2) throw new Error('Payload cannot be empty')
  if (encoded.length > 2_000_000) throw new Error('Payload too large')
}

async function syncRedisShareLink(code: string, snapshotId: string, ttlSeconds: number | null): Promise<void> {
  const redis = getRedis()
  if (ttlSeconds === null) {
    await redis.set(`share:link:${code}`, snapshotId)
  } else {
    await redis.set(`share:link:${code}`, snapshotId, 'EX', ttlSeconds)
  }
  await redis.sadd(`share:snapshot:links:${snapshotId}`, code)
  if (ttlSeconds === null) {
    await redis.persist(`share:snapshot:links:${snapshotId}`)
  } else {
    await redis.expire(`share:snapshot:links:${snapshotId}`, ttlSeconds)
  }
}

function buildShareUrl(code: string): string {
  return `${appBaseUrl().replace(/\/$/, '')}/#/share/${code}`
}

export async function createShareSnapshot(params: {
  userId: string
  name?: string
  editorId: string
  accessMode?: 'anyone' | 'specific_users'
  permissionMode?: 'view' | 'edit'
  allowedEmails?: string[]
  expiresInSeconds?: number | null
}): Promise<ShareCreateResult> {
  await ensureSchema()

  const editorId = params.editorId.trim()
  if (!editorId) throw new Error('editorId is required')
  const safeName = params.name?.trim()
  const accessMode = params.accessMode === 'specific_users' ? 'specific_users' : 'anyone'
  const permissionMode = params.permissionMode === 'view' ? 'view' : 'edit'
  const allowedEmails = (params.allowedEmails ?? [])
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)
  const defaultTtl = Number(process.env.SHARE_LINK_TTL_SECONDS ?? DEFAULT_TTL_SECONDS)
  const ttlInput = params.expiresInSeconds === undefined ? defaultTtl : params.expiresInSeconds
  const ttlSeconds = ttlFromInput(ttlInput)
  const expiresAt = ttlSeconds === null
    ? null
    : new Date(Date.now() + ttlSeconds * 1000)

  const existing = await EditorRepository.findByIdAndUser(editorId, params.userId)
  if (!existing) {
    throw new Error('Editor not found')
  }
  if (safeName && safeName.length > 0) {
    await EditorRepository.updatePayload({
      editorId,
      userId: params.userId,
      payloadJson: existing.payloadJson ?? '{}',
      name: safeName.slice(0, 255),
    })
  }

  const existingShare = await ShareSnapshotRepository.findLatestByEditorAndUser(editorId, params.userId)
  let snapshotId = existingShare?.id ?? crypto.randomUUID()
  let code = existingShare?.shortUrl ?? randomCode()
  if (existingShare) {
    await ShareSnapshotRepository.updateConfigById({
      snapshotId,
      accessMode,
      permissionMode,
      expiresAt,
    })
  } else {
    await ShareSnapshotRepository.create({
      id: snapshotId,
      userId: params.userId,
      shortUrl: code,
      editorId,
      accessMode,
      permissionMode,
      expiresAt,
    })
  }
  await ShareAllowedUserRepository.replaceAllForSnapshot(snapshotId, accessMode === 'specific_users' ? allowedEmails : [])
  await syncRedisShareLink(code, snapshotId, ttlSeconds)
  const shareUrl = buildShareUrl(code)

  return {
    snapshotId,
    editorId,
    code,
    shareUrl,
    qrPayload: shareUrl,
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
    accessMode,
    permissionMode,
    allowedEmails: accessMode === 'specific_users' ? allowedEmails : [],
  }
}

export async function resolveShareByCode(code: string, viewerEmail?: string | null): Promise<ShareResolveResult | null> {
  await ensureSchema()
  const redis = getRedis()

  const snapshotId = await redis.get(`share:link:${code}`)
  if (!snapshotId) return null

  const snapshot = await ShareSnapshotRepository.findWithEditorByCode(snapshotId, code)
  if (!snapshot) return null

  const editor = snapshot.get('Editor') as Editor | null
  if (!editor?.payloadJson) return null
  if (snapshot.expiresAt && new Date(snapshot.expiresAt).getTime() < Date.now()) return null
  if (snapshot.accessMode === 'specific_users') {
    if (!viewerEmail) return null
    const allowed = await ShareAllowedUserRepository.isEmailAllowed(snapshot.id, viewerEmail)
    if (!allowed) return null
  }

  return {
    snapshotId: snapshot.id,
    editorId: snapshot.editorId,
    name: editor.name ?? 'Shared Design',
    payload: JSON.parse(editor.payloadJson),
    createdAt: new Date(snapshot.createdAt).toISOString(),
    accessMode: snapshot.accessMode,
    permissionMode: snapshot.permissionMode,
    allowedEmails: snapshot.accessMode === 'specific_users'
      ? await ShareAllowedUserRepository.listEmails(snapshot.id)
      : [],
  }
}

export async function getShareConfigByEditorId(editorId: string, userId: string): Promise<ShareEditorConfigResult | null> {
  await ensureSchema()
  const snapshot = await ShareSnapshotRepository.findLatestByEditorAndUser(editorId, userId)
  if (!snapshot) return null
  if (snapshot.expiresAt && new Date(snapshot.expiresAt).getTime() < Date.now()) return null
  const allowedEmails = snapshot.accessMode === 'specific_users'
    ? await ShareAllowedUserRepository.listEmails(snapshot.id)
    : []
  const shareUrl = buildShareUrl(snapshot.shortUrl)
  return {
    snapshotId: snapshot.id,
    editorId: snapshot.editorId,
    code: snapshot.shortUrl,
    shareUrl,
    expiresAt: snapshot.expiresAt ? new Date(snapshot.expiresAt).toISOString() : null,
    accessMode: snapshot.accessMode,
    permissionMode: snapshot.permissionMode,
    allowedEmails,
  }
}

export async function getShareAccessModeByCode(code: string): Promise<'anyone' | 'specific_users' | null> {
  await ensureSchema()
  const redis = getRedis()
  const snapshotId = await redis.get(`share:link:${code}`)
  if (!snapshotId) return null
  const snapshot = await ShareSnapshotRepository.findWithEditorByCode(snapshotId, code)
  if (!snapshot) return null
  if (snapshot.expiresAt && new Date(snapshot.expiresAt).getTime() < Date.now()) return null
  return snapshot.accessMode
}

async function resolveSnapshotByCodeWithAccess(code: string, viewerEmail?: string | null) {
  const snapshot = await ShareSnapshotRepository.findByCode(code)
  if (!snapshot) return null
  if (snapshot.expiresAt && new Date(snapshot.expiresAt).getTime() < Date.now()) return null
  if (snapshot.accessMode === 'specific_users') {
    if (!viewerEmail) return null
    const allowed = await ShareAllowedUserRepository.isEmailAllowed(snapshot.id, viewerEmail)
    if (!allowed) return null
  }
  return snapshot
}

export async function getShareEditorStatusByCode(code: string, viewerEmail?: string | null): Promise<{
  editorId: string
  updatedAt: string
  viewerCount: number
  permissionMode: 'view' | 'edit'
} | null> {
  await ensureSchema()
  const snapshot = await resolveSnapshotByCodeWithAccess(code, viewerEmail)
  if (!snapshot) return null
  const editor = snapshot.get('Editor') as Editor | null
  if (!editor) return null
  await EditorPresenceRepository.pruneStale(editor.id, PRESENCE_TTL_MS)
  const presence = await EditorPresenceRepository.listByEditor(editor.id)
  return {
    editorId: editor.id,
    updatedAt: new Date(editor.updatedAt).toISOString(),
    viewerCount: presence.length,
    permissionMode: snapshot.permissionMode,
  }
}

export async function heartbeatSharePresenceByCode(params: {
  code: string
  sessionId: string
  displayName: string
  viewerEmail?: string | null
  viewerUserId?: string | null
}): Promise<boolean> {
  await ensureSchema()
  const snapshot = await resolveSnapshotByCodeWithAccess(params.code, params.viewerEmail)
  if (!snapshot) return false
  const editor = snapshot.get('Editor') as Editor | null
  if (!editor) return false
  await EditorPresenceRepository.upsertPresence({
    editorId: editor.id,
    sessionId: params.sessionId,
    userId: params.viewerUserId ?? null,
    displayName: params.displayName.trim() || 'Anonymous',
    lastSeenAt: new Date(),
  })
  return true
}

export async function listSharePresenceByCode(code: string, viewerEmail?: string | null): Promise<{
  users: Array<{
    sessionId: string
    displayName: string
    isAuthenticated: boolean
    userId: string | null
    lastSeenAt: string
  }>
} | null> {
  await ensureSchema()
  const snapshot = await resolveSnapshotByCodeWithAccess(code, viewerEmail)
  if (!snapshot) return null
  const editor = snapshot.get('Editor') as Editor | null
  if (!editor) return null
  await EditorPresenceRepository.pruneStale(editor.id, PRESENCE_TTL_MS)
  const rows = await EditorPresenceRepository.listByEditor(editor.id)
  return {
    users: rows.map(row => ({
      sessionId: row.sessionId,
      displayName: row.displayName,
      isAuthenticated: Boolean(row.userId),
      userId: row.userId,
      lastSeenAt: new Date(row.lastSeenAt).toISOString(),
    })),
  }
}

export type UpdateSharedEditorResult = 'updated' | 'readonly' | 'not_found_or_forbidden'

export async function updateSharedEditorByCode(params: {
  code: string
  payload: unknown
  name?: string
  viewerEmail?: string | null
}): Promise<{ editorId: string; updatedAt: string } | UpdateSharedEditorResult> {
  validatePayload(params.payload)
  await ensureSchema()
  const snapshot = await resolveSnapshotByCodeWithAccess(params.code, params.viewerEmail)
  if (!snapshot) return 'not_found_or_forbidden'
  if (snapshot.permissionMode !== 'edit') return 'readonly'
  const editor = snapshot.get('Editor') as Editor | null
  if (!editor) return 'not_found_or_forbidden'
  const safeName = params.name?.trim()
  await editor.update({
    payloadJson: JSON.stringify(params.payload),
    ...(safeName ? { name: safeName.slice(0, 255) } : {}),
  })
  return {
    editorId: editor.id,
    updatedAt: new Date(editor.updatedAt).toISOString(),
  }
}

export type DeleteShareResult = 'deleted' | 'not_found' | 'forbidden'

export async function deleteShareSnapshot(snapshotId: string, userId: string): Promise<DeleteShareResult> {
  await ensureSchema()
  const redis = getRedis()

  const snapshot = await ShareSnapshotRepository.findById(snapshotId)
  if (!snapshot) return 'not_found'
  if (!snapshot.userId || snapshot.userId !== userId) return 'forbidden'

  await ShareSnapshotRepository.deleteById(snapshotId)

  const linksKey = `share:snapshot:links:${snapshotId}`
  const codes = await redis.smembers(linksKey)
  if (codes.length > 0) {
    const keys = codes.map(value => `share:link:${value}`)
    await redis.del(...keys)
  } else {
    await redis.del(`share:link:${snapshot.shortUrl}`)
  }
  await redis.del(linksKey)

  return 'deleted'
}
