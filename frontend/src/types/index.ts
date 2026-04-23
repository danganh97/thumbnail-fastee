// ── Platform ──────────────────────────────────────────────────────────────────
export type PlatformId = 'youtube' | 'tiktok' | 'facebook' | 'instagram'

export interface Platform {
  id: PlatformId
  label: string
  icon: string
  description: string
}

// ── Image Type ────────────────────────────────────────────────────────────────
export type ImageTypeId =
  | 'youtube_video'    // 1280×720
  | 'youtube_short'    // 1080×1920
  | 'tiktok_video'     // 1080×1920
  | 'tiktok_live'      // 1080×1920
  | 'facebook_post'    // 1200×628
  | 'facebook_cover'   // 851×315
  | 'facebook_story'   // 1080×1920
  | 'facebook_reel'    // 1080×1920
  | 'facebook_avatar'  // 800×800
  | 'instagram_post'   // 1080×1080
  | 'instagram_reel'   // 1080×1920
  | 'instagram_story'  // 1080×1920

export interface ImageType {
  id: ImageTypeId
  platform: PlatformId
  label: string
  width: number
  height: number
  description: string
}

// ── Element Types ─────────────────────────────────────────────────────────────
export type ElementType = 'text' | 'image' | 'rect' | 'icon'

export type GradientStop = [number, string]

export interface SolidPaint {
  kind: 'solid'
  color: string
}

export interface LinearGradientPaint {
  kind: 'linear'
  startX: number
  startY: number
  endX: number
  endY: number
  colorStops: GradientStop[]
}

export interface RadialGradientPaint {
  kind: 'radial'
  startX: number
  startY: number
  startRadius: number
  endX: number
  endY: number
  endRadius: number
  colorStops: GradientStop[]
}

export type PaintStyle = SolidPaint | LinearGradientPaint | RadialGradientPaint

export interface BaseElement {
  id: string
  type: ElementType
  x: number
  y: number
  draggable: boolean
  visible: boolean
  opacity: number
  rotation?: number   // degrees, 0 by default
}

export interface TextElement extends BaseElement {
  type: 'text'
  text: string
  fontSize: number
  fontFamily: string
  color: string
  stroke: string
  strokeWidth: number
  fontStyle: string
  textDecoration?: 'none' | 'underline'
  align: 'left' | 'center' | 'right'
  width?: number
}

export interface ImageElement extends BaseElement {
  type: 'image'
  src: string
  width: number
  height: number
  sourceWidth?: number
  sourceHeight?: number
  flipX?: boolean
  flipY?: boolean
  isBackground?: boolean
}

export interface RectElement extends BaseElement {
  type: 'rect'
  width: number
  height: number
  fill: string | PaintStyle
  fillEnabled?: boolean
  stroke?: string | PaintStyle
  strokeWidth?: number
  cornerRadius: number
}

export interface IconElement extends BaseElement {
  type: 'icon'
  library: 'bootstrap' | 'fontawesome'
  icon: string
  size: number
  width: number
  height: number
  fill: string | PaintStyle
  fillEnabled?: boolean
  stroke?: string | PaintStyle
  strokeWidth?: number
}

export type TemplateElement = TextElement | ImageElement | RectElement | IconElement

// ── Template ──────────────────────────────────────────────────────────────────
export interface Template {
  id: string
  name: string
  platform: PlatformId
  imageType: ImageTypeId
  width: number
  height: number
  background: string
  mainTextId?: string
  previewUrl?: string
  elements: TemplateElement[]
}

export interface ShareEditorPayload {
  template: Template
  elements: TemplateElement[]
  selectedId?: string | null
}

export interface CreateShareResponse {
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

export interface ResolveShareResponse {
  snapshotId: string
  editorId: string
  name: string
  payload: ShareEditorPayload
  createdAt: string
  accessMode: 'anyone' | 'specific_users'
  permissionMode: 'view' | 'edit'
  allowedEmails: string[]
}

export interface ShareEditorConfigResponse {
  snapshotId: string
  editorId: string
  code: string
  shareUrl: string
  expiresAt: string | null
  accessMode: 'anyone' | 'specific_users'
  permissionMode: 'view' | 'edit'
  allowedEmails: string[]
}

export interface EditorRecordResponse {
  editorId: string
  name: string
  payload: ShareEditorPayload
  createdAt: string
  updatedAt: string
}

export interface EditorListItemResponse {
  editorId: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface EditorStatusResponse {
  editorId: string
  updatedAt: string
  viewerCount: number
  permissionMode?: 'view' | 'edit'
}

export interface PresenceUser {
  sessionId: string
  displayName: string
  isAuthenticated: boolean
  userId: string | null
  lastSeenAt: string
}

export interface PresenceResponse {
  users: PresenceUser[]
}

export interface CreateEditorRequest {
  name?: string
  payload: ShareEditorPayload
}

export interface AuthUser {
  id: string
  email: string
  name: string | null
}

export interface EditorState {
  currentPlatform: Platform | null
  currentImageType: ImageType | null
  currentTemplate: Template | null
  elements: TemplateElement[]
  selectedId: string | null
  history: TemplateElement[][]
  historyIndex: number
  isDirty: boolean
  exportFormat: 'png' | 'jpeg'
}

export interface AppConfig {
  version: string
  fonts: string[]
  platforms: Platform[]
}

// ── Constants ─────────────────────────────────────────────────────────────────
export const PLATFORMS: Record<PlatformId, Platform> = {
  youtube:   { id: 'youtube',   label: 'YouTube',   icon: '▶', description: 'Video thumbnails & Shorts covers' },
  tiktok:    { id: 'tiktok',    label: 'TikTok',    icon: '♪', description: 'Video covers & Live banners' },
  facebook:  { id: 'facebook',  label: 'Facebook',  icon: 'f', description: 'Posts, covers, stories & reels' },
  instagram: { id: 'instagram', label: 'Instagram', icon: '◈', description: 'Posts, reels & stories' },
}

export const IMAGE_TYPES: Record<ImageTypeId, ImageType> = {
  youtube_video:   { id: 'youtube_video',   platform: 'youtube',   label: 'Video Thumbnail', width: 1280, height: 720,  description: 'Standard YouTube video thumbnail' },
  youtube_short:   { id: 'youtube_short',   platform: 'youtube',   label: 'Shorts Cover',    width: 1080, height: 1920, description: 'YouTube Shorts cover image' },
  tiktok_video:    { id: 'tiktok_video',    platform: 'tiktok',    label: 'Video Cover',     width: 1080, height: 1920, description: 'TikTok video cover thumbnail' },
  tiktok_live:     { id: 'tiktok_live',     platform: 'tiktok',    label: 'Live Cover',      width: 1080, height: 1920, description: 'TikTok LIVE cover image' },
  facebook_post:   { id: 'facebook_post',   platform: 'facebook',  label: 'Post / Link',     width: 1200, height: 628,  description: 'Facebook news feed post image' },
  facebook_cover:  { id: 'facebook_cover',  platform: 'facebook',  label: 'Cover Photo',     width: 851,  height: 315,  description: 'Facebook profile or page cover' },
  facebook_story:  { id: 'facebook_story',  platform: 'facebook',  label: 'Story',           width: 1080, height: 1920, description: 'Facebook Story image' },
  facebook_reel:   { id: 'facebook_reel',   platform: 'facebook',  label: 'Reel Cover',      width: 1080, height: 1920, description: 'Facebook Reels cover thumbnail' },
  facebook_avatar: { id: 'facebook_avatar', platform: 'facebook',  label: 'Profile Avatar',  width: 800,  height: 800,  description: 'Facebook profile picture' },
  instagram_post:  { id: 'instagram_post',  platform: 'instagram', label: 'Post',            width: 1080, height: 1080, description: 'Instagram square feed post' },
  instagram_reel:  { id: 'instagram_reel',  platform: 'instagram', label: 'Reel Cover',      width: 1080, height: 1920, description: 'Instagram Reels cover thumbnail' },
  instagram_story: { id: 'instagram_story', platform: 'instagram', label: 'Story',           width: 1080, height: 1920, description: 'Instagram Story image' },
}

export const PLATFORM_IMAGE_TYPES: Record<PlatformId, ImageTypeId[]> = {
  youtube:   ['youtube_video', 'youtube_short'],
  tiktok:    ['tiktok_video', 'tiktok_live'],
  facebook:  ['facebook_post', 'facebook_cover', 'facebook_story', 'facebook_reel', 'facebook_avatar'],
  instagram: ['instagram_post', 'instagram_reel', 'instagram_story'],
}

export const FONTS = [
  'Inter',
  'Poppins',
  'Bebas Neue',
  'Roboto',
  'Montserrat',
  'Oswald',
  'Anton',
  'Open Sans',
  'Lato',
  'Raleway',
  'Nunito',
  'Playfair Display',
  'Arial',
  'Georgia',
]

export const FONT_SIZES = [24, 32, 40, 48, 56, 64, 72, 80, 96, 120]
