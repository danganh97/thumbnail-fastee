import axios from 'axios'
import type {
  CreateEditorRequest,
  EditorListItemResponse,
  EditorRecordResponse,
  EditorStatusResponse,
  PresenceResponse,
  ShareEditorPayload,
} from '@/types'

const DEFAULT_API_URL = 'http://localhost:3000'
const apiUrl = (
  (import.meta.env.VITE_API_URL as string | undefined)?.trim()
  || DEFAULT_API_URL
).replace(/\/$/, '')

export async function createEditor(payload: CreateEditorRequest): Promise<EditorRecordResponse> {
  const { data } = await axios.post<EditorRecordResponse>(`${apiUrl}/editors`, payload, {
    withCredentials: true,
  })
  return data
}

export async function getEditorById(editorId: string): Promise<EditorRecordResponse> {
  const { data } = await axios.get<EditorRecordResponse>(`${apiUrl}/editors/${encodeURIComponent(editorId)}`, {
    withCredentials: true,
  })
  return data
}

export async function updateEditor(editorId: string, payload: {
  name?: string
  payload: ShareEditorPayload
}): Promise<EditorRecordResponse> {
  const { data } = await axios.patch<EditorRecordResponse>(
    `${apiUrl}/editors/${encodeURIComponent(editorId)}`,
    payload,
    { withCredentials: true },
  )
  return data
}

export async function getEditorStatus(editorId: string): Promise<EditorStatusResponse> {
  const { data } = await axios.get<EditorStatusResponse>(
    `${apiUrl}/editors/${encodeURIComponent(editorId)}/status`,
    { withCredentials: true },
  )
  return data
}

export async function getEditorPresence(editorId: string): Promise<PresenceResponse> {
  const { data } = await axios.get<PresenceResponse>(
    `${apiUrl}/editors/${encodeURIComponent(editorId)}/presence`,
    { withCredentials: true },
  )
  return data
}

export async function heartbeatEditorPresence(editorId: string, payload: {
  sessionId: string
  displayName?: string
}): Promise<void> {
  await axios.post(
    `${apiUrl}/editors/${encodeURIComponent(editorId)}/presence/heartbeat`,
    payload,
    { withCredentials: true },
  )
}

export async function listEditors(): Promise<EditorListItemResponse[]> {
  const { data } = await axios.get<{ editors: EditorListItemResponse[] }>(
    `${apiUrl}/editors`,
    { withCredentials: true },
  )
  return data.editors
}

export async function deleteEditor(editorId: string): Promise<void> {
  await axios.delete(`${apiUrl}/editors/${encodeURIComponent(editorId)}`, {
    withCredentials: true,
  })
}
