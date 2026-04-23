export interface CreateEditorRequestBody {
  name?: string
  payload: unknown
}

export interface UpdateEditorRequestBody {
  name?: string
  payload: unknown
}

export interface EditorResult {
  editorId: string
  name: string
  payload: unknown
  createdAt: string
  updatedAt: string
}

export interface EditorListItemResult {
  editorId: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface EditorStatusResult {
  editorId: string
  updatedAt: string
  viewerCount: number
}

export interface PresenceHeartbeatBody {
  sessionId: string
  displayName?: string
}

export interface EditorPresenceEntry {
  sessionId: string
  displayName: string
  isAuthenticated: boolean
  userId: string | null
  lastSeenAt: string
}
