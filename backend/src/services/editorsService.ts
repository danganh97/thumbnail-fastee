import crypto from 'crypto'
import { EditorPresenceRepository } from '../repositories/EditorPresenceRepository'
import { EditorRepository } from '../repositories/EditorRepository'
import { ensureSchema } from './schemaService'
import type { EditorListItemResult, EditorPresenceEntry, EditorResult, EditorStatusResult } from '../types/editors'

const PRESENCE_TTL_MS = 30_000

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validatePayload(payload: unknown): void {
  if (!isObject(payload)) throw new Error('Invalid payload')
  const encoded = JSON.stringify(payload)
  if (!encoded || encoded.length < 2) throw new Error('Payload cannot be empty')
  if (encoded.length > 2_000_000) throw new Error('Payload too large')
}

function normalizeName(name?: string): string {
  const trimmed = name?.trim()
  return (trimmed && trimmed.length > 0 ? trimmed : 'Untitled Editor').slice(0, 255)
}

function toEditorResult(editor: {
  id: string
  name: string | null
  payloadJson: string | null
  createdAt: Date
  updatedAt: Date
}): EditorResult {
  return {
    editorId: editor.id,
    name: editor.name ?? 'Untitled Editor',
    payload: editor.payloadJson ? JSON.parse(editor.payloadJson) : {},
    createdAt: new Date(editor.createdAt).toISOString(),
    updatedAt: new Date(editor.updatedAt).toISOString(),
  }
}

export async function createEditor(params: {
  userId: string
  name?: string
  payload: unknown
}): Promise<EditorResult> {
  validatePayload(params.payload)
  await ensureSchema()

  const created = await EditorRepository.create({
    id: crypto.randomUUID(),
    name: normalizeName(params.name),
    userId: params.userId,
    payloadJson: JSON.stringify(params.payload),
  })

  return toEditorResult(created)
}

export async function getEditorById(editorId: string, userId: string): Promise<EditorResult | null> {
  await ensureSchema()
  const editor = await EditorRepository.findByIdAndUser(editorId, userId)
  if (!editor) return null
  return toEditorResult(editor)
}

export async function updateEditorById(params: {
  editorId: string
  userId: string
  payload: unknown
  name?: string
}): Promise<EditorResult | null> {
  validatePayload(params.payload)
  await ensureSchema()

  const updated = await EditorRepository.updatePayload({
    editorId: params.editorId,
    userId: params.userId,
    payloadJson: JSON.stringify(params.payload),
    name: typeof params.name === 'string' ? normalizeName(params.name) : undefined,
  })
  if (!updated) return null

  const editor = await EditorRepository.findByIdAndUser(params.editorId, params.userId)
  if (!editor) return null
  return toEditorResult(editor)
}

export async function getEditorStatus(editorId: string, userId: string): Promise<EditorStatusResult | null> {
  await ensureSchema()
  const editor = await EditorRepository.findByIdAndUser(editorId, userId)
  if (!editor) return null
  await EditorPresenceRepository.pruneStale(editorId, PRESENCE_TTL_MS)
  const presence = await EditorPresenceRepository.listByEditor(editorId)
  return {
    editorId: editor.id,
    updatedAt: new Date(editor.updatedAt).toISOString(),
    viewerCount: presence.length,
  }
}

export async function heartbeatEditorPresence(params: {
  editorId: string
  userId: string
  sessionId: string
  displayName: string
}): Promise<void> {
  await ensureSchema()
  const editor = await EditorRepository.findByIdAndUser(params.editorId, params.userId)
  if (!editor) throw new Error('Editor not found')

  await EditorPresenceRepository.upsertPresence({
    editorId: params.editorId,
    sessionId: params.sessionId,
    userId: params.userId,
    displayName: params.displayName.trim() || 'Anonymous',
    lastSeenAt: new Date(),
  })
}

export async function listEditorPresence(editorId: string, userId: string): Promise<EditorPresenceEntry[] | null> {
  await ensureSchema()
  const editor = await EditorRepository.findByIdAndUser(editorId, userId)
  if (!editor) return null
  await EditorPresenceRepository.pruneStale(editorId, PRESENCE_TTL_MS)
  const rows = await EditorPresenceRepository.listByEditor(editorId)
  return rows.map(row => ({
    sessionId: row.sessionId,
    displayName: row.displayName,
    isAuthenticated: Boolean(row.userId),
    userId: row.userId,
    lastSeenAt: new Date(row.lastSeenAt).toISOString(),
  }))
}

export async function listEditorsByUser(userId: string): Promise<EditorListItemResult[]> {
  await ensureSchema()
  const rows = await EditorRepository.listByUser(userId, 30)
  return rows.map(row => ({
    editorId: row.id,
    name: row.name ?? 'Untitled Editor',
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  }))
}

export async function deleteEditorById(editorId: string, userId: string): Promise<boolean> {
  await ensureSchema()
  const deleted = await EditorRepository.deleteByIdAndUser(editorId, userId)
  return deleted > 0
}
