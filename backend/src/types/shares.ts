export interface CreateShareRequestBody {
  name?: string
  editorId: string
  accessMode?: 'anyone' | 'specific_users'
  permissionMode?: 'view' | 'edit'
  allowedEmails?: string[]
  expiresInSeconds?: number | null
}

export interface ShareCreateResult {
  snapshotId: string
  editorId: string
  code: string
  shareUrl: string
  qrPayload: string
  expiresAt: string | null
  accessMode: 'anyone' | 'specific_users'
  permissionMode: 'view' | 'edit'
  allowedEmails: string[]
}

export interface ShareResolveResult {
  snapshotId: string
  editorId: string
  name: string
  payload: unknown
  createdAt: string
  accessMode: 'anyone' | 'specific_users'
  permissionMode: 'view' | 'edit'
  allowedEmails: string[]
}

export interface ShareEditorConfigResult {
  snapshotId: string
  editorId: string
  code: string
  shareUrl: string
  expiresAt: string | null
  accessMode: 'anyone' | 'specific_users'
  permissionMode: 'view' | 'edit'
  allowedEmails: string[]
}
