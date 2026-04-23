import axios from 'axios'
import type {
  CreateShareResponse,
  EditorStatusResponse,
  PresenceResponse,
  ResolveShareResponse,
  ShareEditorConfigResponse,
  ShareEditorPayload,
} from '@/types'

const DEFAULT_API_URL = 'http://localhost:3000'
const apiUrl = (
  (import.meta.env.VITE_API_URL as string | undefined)?.trim()
  || DEFAULT_API_URL
).replace(/\/$/, '')

function requireApiUrl(): string {
  return apiUrl
}

export async function createShare(payload: {
  name?: string
  editorId: string
  accessMode?: 'anyone' | 'specific_users'
  permissionMode?: 'view' | 'edit'
  allowedEmails?: string[]
  expiresInSeconds?: number | null
}): Promise<CreateShareResponse> {
  const { data } = await axios.post<CreateShareResponse>(`${requireApiUrl()}/shares`, payload, {
    withCredentials: true,
  })
  return data
}

export async function getShareByCode(code: string): Promise<ResolveShareResponse> {
  const { data } = await axios.get<ResolveShareResponse>(`${requireApiUrl()}/shares/${encodeURIComponent(code)}`, {
    withCredentials: true,
  })
  return data
}

export async function deleteShare(snapshotId: string): Promise<void> {
  await axios.delete(`${requireApiUrl()}/shares/${encodeURIComponent(snapshotId)}`, {
    withCredentials: true,
  })
}

export async function getShareStatusByCode(code: string): Promise<EditorStatusResponse> {
  const { data } = await axios.get<EditorStatusResponse>(
    `${requireApiUrl()}/shares/${encodeURIComponent(code)}/status`,
    { withCredentials: true },
  )
  return data
}

export async function getSharePresenceByCode(code: string): Promise<PresenceResponse> {
  const { data } = await axios.get<PresenceResponse>(
    `${requireApiUrl()}/shares/${encodeURIComponent(code)}/presence`,
    { withCredentials: true },
  )
  return data
}

export async function heartbeatSharePresenceByCode(code: string, payload: {
  sessionId: string
  displayName?: string
}): Promise<void> {
  await axios.post(
    `${requireApiUrl()}/shares/${encodeURIComponent(code)}/presence/heartbeat`,
    payload,
    { withCredentials: true },
  )
}

export async function getShareByEditorId(editorId: string): Promise<ShareEditorConfigResponse> {
  const { data } = await axios.get<ShareEditorConfigResponse>(
    `${requireApiUrl()}/shares/editor/${encodeURIComponent(editorId)}`,
    { withCredentials: true },
  )
  return data
}

export async function updateSharedEditorByCode(code: string, payload: {
  name?: string
  payload: ShareEditorPayload
}): Promise<{ editorId: string; updatedAt: string }> {
  const { data } = await axios.patch<{ editorId: string; updatedAt: string }>(
    `${requireApiUrl()}/shares/${encodeURIComponent(code)}/editor`,
    payload,
    { withCredentials: true },
  )
  return data
}
