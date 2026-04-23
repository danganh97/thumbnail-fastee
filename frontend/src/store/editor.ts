import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuid } from 'uuid'
import type {
  Platform, ImageType, Template, TemplateElement,
  TextElement, ImageElement, RectElement, IconElement, PaintStyle, PlatformId, ImageTypeId, ShareEditorPayload,
} from '@/types'
import { PLATFORMS, IMAGE_TYPES, PLATFORM_IMAGE_TYPES } from '@/types'

const MAX_HISTORY = 50
const TEXT_ICON_DEFAULT_COLOR_KEY = 'fastee-text-icon-default-color'
const LEGACY_TEXT_ICON_COLOR_MODE_KEY = 'fastee-text-icon-color-mode'

const ICON_LIBRARY_ENTRIES: Record<'bootstrap' | 'fontawesome', string[]> = {
  bootstrap: ['heart-fill', 'star-fill', 'lightning-fill', 'camera-fill', 'megaphone-fill'],
  fontawesome: [
    'fa-heart',
    'fa-star',
    'fa-bolt',
    'fa-camera',
    'fa-bell',
    'fa-comment',
    'fa-envelope',
    'fa-phone',
    'fa-house',
    'fa-gear',
    'fa-fire',
    'fa-music',
    'fa-image',
    'fa-video',
    'fa-trophy',
    'fa-bookmark',
    'fa-circle-check',
    'fa-circle-xmark',
    'fa-user',
    'fa-play',
    'fa-pause',
  ],
}

interface PersistedSession {
  templateId: string | null
}

interface PersistedDraft {
  templateId: string
  elements: TemplateElement[]
}

export const useEditorStore = defineStore('editor', () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const currentPlatform  = ref<Platform | null>(null)
  const currentImageType = ref<ImageType | null>(null)
  const currentTemplate  = ref<Template | null>(null)
  const elements         = ref<TemplateElement[]>([])
  const selectedId       = ref<string | null>(null)
  const history          = ref<TemplateElement[][]>([])
  const historyIndex     = ref(-1)
  const allTemplates     = ref<Template[]>([])
  const isDirty          = ref(false)
  const exportFormat     = ref<'png' | 'jpeg'>('png')
  const exportQuality    = ref(0.92)
  const textIconDefaultColor = ref<string>(initialTextIconDefaultColor())
  const activeEditorId = ref<string | null>(null)
  const editorLoadSource = ref<'local' | 'remote' | 'share'>('local')
  const readOnly = ref(false)

  // ── Computed ───────────────────────────────────────────────────────────────
  const selectedElement = computed(() =>
    elements.value.find(el => el.id === selectedId.value) ?? null,
  )

  const templatesForCurrentType = computed(() => {
    if (!currentPlatform.value) return []
    if (!currentImageType.value)
      return allTemplates.value.filter(t => t.platform === currentPlatform.value!.id)
    return allTemplates.value.filter(
      t => t.platform === currentPlatform.value!.id && t.imageType === currentImageType.value!.id,
    )
  })

  const templatesForPlatform = templatesForCurrentType

  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

  const canvasSize = computed(() =>
    currentTemplate.value
      ? { width: currentTemplate.value.width, height: currentTemplate.value.height }
      : currentImageType.value
        ? { width: currentImageType.value.width, height: currentImageType.value.height }
        : { width: 1280, height: 720 },
  )

  function isLegacyFullCanvasRect(el: TemplateElement): el is RectElement {
    if (el.type !== 'rect') return false
    const size = canvasSize.value
    return el.x === 0 && el.y === 0 && el.width === size.width && el.height === size.height
  }

  function sanitizeElementsForEditor(rawElements: TemplateElement[]): TemplateElement[] {
    return rawElements.map(raw => {
      if (raw.type === 'image' && (raw as ImageElement).isBackground) {
        const { isBackground, ...rest } = raw as ImageElement
        return { ...rest, draggable: true } as ImageElement
      }
      if (isLegacyFullCanvasRect(raw) && !raw.draggable) {
        return { ...raw, draggable: true }
      }
      return raw
    })
  }

  function moveElement(fromIndex: number, toIndex: number): void {
    if (readOnly.value) return
    if (fromIndex === toIndex) return
    const [moved] = elements.value.splice(fromIndex, 1)
    elements.value.splice(toIndex, 0, moved)
  }

  function commitLayerReorderIfChanged(beforeOrder: string[]): void {
    if (readOnly.value) return
    const afterOrder = elements.value.map(el => el.id)
    const changed = beforeOrder.length !== afterOrder.length
      || beforeOrder.some((id, i) => id !== afterOrder[i])
    if (!changed) return
    isDirty.value = true
    snapshot()
  }

  function initialTextIconDefaultColor(): string {
    const modern = localStorage.getItem(TEXT_ICON_DEFAULT_COLOR_KEY)?.trim()
    if (isValidHexColor(modern)) return modern.toLowerCase()

    const legacyMode = localStorage.getItem(LEGACY_TEXT_ICON_COLOR_MODE_KEY)
    if (legacyMode === 'light') return '#ffffff'
    return '#000000'
  }

  function isValidHexColor(value: string | null | undefined): value is string {
    return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)
  }

  function defaultTextIconColor(): string {
    return textIconDefaultColor.value
  }

  function setTextIconDefaultColor(color: string): void {
    const normalized = color.trim().toLowerCase()
    if (!isValidHexColor(normalized)) return
    textIconDefaultColor.value = normalized
    localStorage.setItem(TEXT_ICON_DEFAULT_COLOR_KEY, normalized)
  }

  // ── History ────────────────────────────────────────────────────────────────
  function snapshot(): void {
    const slice = JSON.parse(JSON.stringify(elements.value)) as TemplateElement[]
    history.value = history.value.slice(0, historyIndex.value + 1)
    history.value.push(slice)
    if (history.value.length > MAX_HISTORY) {
      history.value.shift()
    } else {
      historyIndex.value++
    }
  }

  // ── Persistence ────────────────────────────────────────────────────────────
  function storageKey(): string | null {
    const p = currentPlatform.value?.id
    const t = currentImageType.value?.id
    if (!p || !t) return null
    return `fastee-${p}-${t}`
  }

  function sessionKey(): string | null {
    const p = currentPlatform.value?.id
    const t = currentImageType.value?.id
    if (!p || !t) return null
    return `fastee-session-${p}-${t}`
  }

  function draftKey(templateId: string): string {
    return `fastee-draft-${templateId}`
  }

  function saveSessionSelection(templateId: string | null = currentTemplate.value?.id ?? null): void {
    const key = sessionKey()
    if (!key) return
    const session: PersistedSession = { templateId }
    localStorage.setItem(key, JSON.stringify(session))
  }

  function saveDraftForCurrentTemplate(): void {
    const templateId = currentTemplate.value?.id
    if (!templateId) return
    const payload: PersistedDraft = {
      templateId,
      elements: JSON.parse(JSON.stringify(elements.value)),
    }
    localStorage.setItem(draftKey(templateId), JSON.stringify(payload))
    saveSessionSelection(templateId)
  }

  function restoreDraftForTemplate(templateId: string): boolean {
    const raw = localStorage.getItem(draftKey(templateId))
    if (!raw) return false
    try {
      const draft = JSON.parse(raw) as PersistedDraft
      if (draft.templateId !== templateId || !draft.elements?.length) return false
      elements.value = sanitizeElementsForEditor(draft.elements)
      history.value = [JSON.parse(JSON.stringify(elements.value))]
      historyIndex.value = 0
      selectedId.value = currentTemplate.value?.mainTextId
        ?? elements.value.find(el => el.type === 'text' && el.draggable)?.id
        ?? null
      isDirty.value = false
      return true
    } catch {
      return false
    }
  }

  function migrateLegacySession(): void {
    const legacyKey = storageKey()
    if (!legacyKey) return
    const raw = localStorage.getItem(legacyKey)
    if (!raw) return
    try {
      const session = JSON.parse(raw) as { templateId?: string | null; elements?: TemplateElement[] }
      if (!session.templateId || !session.elements?.length) {
        localStorage.removeItem(legacyKey)
        return
      }
      const legacyDraft: PersistedDraft = {
        templateId: session.templateId,
        elements: session.elements,
      }
      localStorage.setItem(draftKey(session.templateId), JSON.stringify(legacyDraft))
      saveSessionSelection(session.templateId)
      localStorage.removeItem(legacyKey)
    } catch {
      localStorage.removeItem(legacyKey)
    }
  }

  function saveToLocalStorage(): void {
    saveDraftForCurrentTemplate()
    isDirty.value = false
  }

  function restoreFromLocalStorage(): boolean {
    migrateLegacySession()
    const sKey = sessionKey()
    if (!sKey) return false

    const targetTemplateId = currentTemplate.value?.id
      ?? (() => {
        const raw = localStorage.getItem(sKey)
        if (!raw) return null
        try {
          const session = JSON.parse(raw) as PersistedSession
          return session.templateId ?? null
        } catch {
          return null
        }
      })()

    if (!targetTemplateId) return false

    if (allTemplates.value.length > 0) {
      const tpl = allTemplates.value.find(t => t.id === targetTemplateId)
      if (tpl) currentTemplate.value = tpl
    }

    const restored = restoreDraftForTemplate(targetTemplateId)
    if (restored) {
      saveSessionSelection(targetTemplateId)
      return true
    }

    saveSessionSelection(targetTemplateId)
    return false
  }

  function restoreDraftForCurrentTemplate(): boolean {
    const templateId = currentTemplate.value?.id
    if (!templateId) return false
    return restoreDraftForTemplate(templateId)
  }

  function restoreDraftByTemplateId(templateId: string): boolean {
    if (allTemplates.value.length > 0) {
      const tpl = allTemplates.value.find(t => t.id === templateId)
      if (tpl) currentTemplate.value = tpl
    }
    const restored = restoreDraftForTemplate(templateId)
    if (restored) saveSessionSelection(templateId)
    return restored
  }

  function clearSessionSelection(): void {
    const key = sessionKey()
    if (!key) return
    const session: PersistedSession = { templateId: null }
    localStorage.setItem(key, JSON.stringify(session))
  }

  function markTemplateSelection(templateId: string | null): void {
    saveSessionSelection(templateId)
  }

  function restoreSessionTemplateId(): string | null {
    migrateLegacySession()
    const key = sessionKey()
    if (!key) return null
    const raw = localStorage.getItem(key)
    if (!raw) return null
    try {
      const session = JSON.parse(raw) as PersistedSession
      return session.templateId ?? null
    } catch {
      return null
    }
  }

  function markClean(): void {
    isDirty.value = false
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  function setTemplates(templates: Template[]): void {
    allTemplates.value = templates
  }

  function selectPlatform(platformId: PlatformId): void {
    if (currentPlatform.value?.id === platformId) return
    currentPlatform.value  = PLATFORMS[platformId]
    currentImageType.value = null
    currentTemplate.value  = null
    elements.value         = []
    selectedId.value       = null
    isDirty.value          = false
    activeEditorId.value   = null
    editorLoadSource.value = 'local'
    readOnly.value = false
  }

  function selectImageType(imageTypeId: ImageTypeId): void {
    if (currentImageType.value?.id === imageTypeId) return
    currentImageType.value = IMAGE_TYPES[imageTypeId]
    currentTemplate.value  = null
    elements.value         = []
    selectedId.value       = null
    isDirty.value          = false
    activeEditorId.value   = null
    editorLoadSource.value = 'local'
    readOnly.value = false
  }

  function loadTemplate(template: Template): void {
    const wasCurrentTemplate = currentTemplate.value?.id === template.id
    if (wasCurrentTemplate) {
      markTemplateSelection(template.id)
      return
    }
    currentTemplate.value  = template
    currentPlatform.value  = PLATFORMS[template.platform]
    currentImageType.value = IMAGE_TYPES[template.imageType]
    elements.value         = sanitizeElementsForEditor(
      JSON.parse(JSON.stringify(template.elements)) as TemplateElement[],
    )
    isDirty.value          = false
    history.value          = []
    historyIndex.value     = -1
    snapshot()

    // Auto-focus: prefer mainTextId, fallback to first draggable text
    const focusId =
      template.mainTextId ??
      elements.value.find(el => el.type === 'text' && el.draggable)?.id ??
      null
    selectedId.value = focusId
    markTemplateSelection(template.id)
    activeEditorId.value = null
    editorLoadSource.value = 'local'
    readOnly.value = false
  }

  function createCustomTemplate(width: number, height: number, name = 'Custom Canvas'): Template {
    const fallbackPlatformId: PlatformId = currentPlatform.value?.id ?? 'youtube'
    const defaultTypeForPlatform = PLATFORM_IMAGE_TYPES[fallbackPlatformId]?.[0] ?? 'youtube_video'
    const fallbackImageTypeId: ImageTypeId = currentImageType.value?.id ?? defaultTypeForPlatform

    const template: Template = {
      id: `custom_${width}x${height}`,
      name: `${name} (${width}x${height})`,
      platform: fallbackPlatformId,
      imageType: fallbackImageTypeId,
      width,
      height,
      background: '#ffffff',
      elements: [],
    }

    currentTemplate.value = template
    currentPlatform.value = PLATFORMS[fallbackPlatformId]
    currentImageType.value = IMAGE_TYPES[fallbackImageTypeId]
    elements.value = []
    history.value = []
    historyIndex.value = -1
    snapshot()
    selectedId.value = null
    isDirty.value = false
    markTemplateSelection(template.id)
    activeEditorId.value = null
    editorLoadSource.value = 'local'
    readOnly.value = false
    return template
  }

  function selectElement(id: string | null): void {
    selectedId.value = id
  }

  function updateElement(id: string, patch: Partial<TemplateElement>): void {
    if (readOnly.value) return
    const idx = elements.value.findIndex(el => el.id === id)
    if (idx === -1) return
    const merged = { ...elements.value[idx], ...patch } as TemplateElement
    elements.value[idx] = merged
  }

  function commitElementUpdate(id: string, patch: Partial<TemplateElement>): void {
    if (readOnly.value) return
    updateElement(id, patch)
    isDirty.value = true
    snapshot()
  }

  function pushElementAndCommit(el: TemplateElement): void {
    if (readOnly.value) return
    elements.value.push(el)
    selectedId.value = el.id
    isDirty.value    = true
    snapshot()
  }

  function solid(color: string): PaintStyle {
    return { kind: 'solid', color }
  }

  function addTextElement(initialText?: string): void {
    const size = canvasSize.value
    const el: TextElement = {
      id:          uuid(),
      type:        'text',
      x:           size.width  / 2 - 150,
      y:           size.height / 2 - 40,
      text:        initialText ?? 'New Text',
      fontSize:    48,
      fontFamily:  'Inter',
      color:       defaultTextIconColor(),
      stroke:      '',
      strokeWidth: 0,
      fontStyle:   'normal',
      textDecoration: 'none',
      align:       'center',
      width:       300,
      draggable:   true,
      visible:     true,
      opacity:     1,
    }
    pushElementAndCommit(el)
  }

  function addTitleElement(): void {
    const size = canvasSize.value
    const el: TextElement = {
      id:          uuid(),
      type:        'text',
      x:           size.width  / 2 - 320,
      y:           size.height / 2 - 60,
      text:        'YOUR TITLE HERE',
      fontSize:    80,
      fontFamily:  'Bebas Neue',
      color:       defaultTextIconColor(),
      stroke:      '',
      strokeWidth: 0,
      fontStyle:   'bold',
      textDecoration: 'none',
      align:       'center',
      width:       640,
      draggable:   true,
      visible:     true,
      opacity:     1,
    }
    pushElementAndCommit(el)
  }

  function addSubtitleElement(): void {
    const size = canvasSize.value
    const el: TextElement = {
      id:          uuid(),
      type:        'text',
      x:           size.width  / 2 - 260,
      y:           size.height / 2 + 40,
      text:        'Your subtitle goes here',
      fontSize:    40,
      fontFamily:  'Inter',
      color:       defaultTextIconColor(),
      stroke:      '',
      strokeWidth: 0,
      fontStyle:   'normal',
      textDecoration: 'none',
      align:       'center',
      width:       520,
      draggable:   true,
      visible:     true,
      opacity:     1,
    }
    pushElementAndCommit(el)
  }

  function addRectangleElement(): void {
    const size = canvasSize.value
    const el: RectElement = {
      id:           uuid(),
      type:         'rect',
      x:            Math.round(size.width / 2 - 160),
      y:            Math.round(size.height / 2 - 90),
      width:        320,
      height:       180,
      fill:         solid(defaultTextIconColor()),
      fillEnabled:  true,
      stroke:       solid('#ffffff'),
      strokeWidth:  0,
      cornerRadius: 16,
      draggable:    true,
      visible:      true,
      opacity:      1,
    }
    pushElementAndCommit(el)
  }

  function addCircleElement(): void {
    const size = canvasSize.value
    const diameter = 220
    const el: RectElement = {
      id:           uuid(),
      type:         'rect',
      x:            Math.round(size.width / 2 - diameter / 2),
      y:            Math.round(size.height / 2 - diameter / 2),
      width:        diameter,
      height:       diameter,
      fill:         solid(defaultTextIconColor()),
      fillEnabled:  true,
      stroke:       solid('#ffffff'),
      strokeWidth:  0,
      cornerRadius: diameter / 2,
      draggable:    true,
      visible:      true,
      opacity:      1,
    }
    pushElementAndCommit(el)
  }

  function addIconElement(icon: string, library: 'bootstrap' | 'fontawesome' = 'bootstrap'): void {
    if (!ICON_LIBRARY_ENTRIES[library].includes(icon)) return
    const size = canvasSize.value
    const el: IconElement = {
      id:          uuid(),
      type:        'icon',
      library,
      icon,
      x:           Math.round(size.width / 2 - 48),
      y:           Math.round(size.height / 2 - 48),
      size:        96,
      width:       96,
      height:      96,
      fill:        solid(defaultTextIconColor()),
      fillEnabled: true,
      stroke:      solid('#000000'),
      strokeWidth: 0,
      draggable:   true,
      visible:     true,
      opacity:     1,
    }
    pushElementAndCommit(el)
  }

  function addSocialButtonPreset(kind: 'like' | 'subscribe' | 'share'): void {
    const size = canvasSize.value
    const config = {
      like:      { library: 'bootstrap' as const, icon: 'hand-thumbs-up-fill', color: defaultTextIconColor() },
      subscribe: { library: 'fontawesome' as const, icon: 'fa-bell', color: defaultTextIconColor() },
      share:     { library: 'bootstrap' as const, icon: 'share-fill', color: defaultTextIconColor() },
    }[kind]
    const iconSize = 112
    const el: IconElement = {
      id:          uuid(),
      type:        'icon',
      library:     config.library,
      icon:        config.icon,
      x:           Math.round(size.width / 2 - iconSize / 2),
      y:           Math.round(size.height / 2 - iconSize / 2),
      size:        iconSize,
      width:       iconSize,
      height:      iconSize,
      fill:        solid(config.color),
      fillEnabled: true,
      stroke:      solid('#ffffff'),
      strokeWidth: 0,
      draggable:   true,
      visible:     true,
      opacity:     1,
    }
    pushElementAndCommit(el)
  }

  function resetToTemplateDefaults(): void {
    if (readOnly.value) return
    if (!currentTemplate.value) return
    const template = currentTemplate.value
    elements.value = sanitizeElementsForEditor(
      JSON.parse(JSON.stringify(template.elements)) as TemplateElement[],
    )
    history.value      = []
    historyIndex.value = -1
    snapshot()
    selectedId.value = template.mainTextId
      ?? elements.value.find(el => el.type === 'text' && el.draggable)?.id
      ?? null
    isDirty.value = false
  }

  function duplicateElement(id: string): void {
    if (readOnly.value) return
    const idx = elements.value.findIndex(el => el.id === id)
    if (idx === -1) return
    const clone = {
      ...JSON.parse(JSON.stringify(elements.value[idx])),
      id: uuid(),
      x: elements.value[idx].x + 20,
      y: elements.value[idx].y + 20,
    } as TemplateElement
    elements.value.splice(idx + 1, 0, clone)
    selectedId.value = clone.id
    isDirty.value    = true
    snapshot()
  }

  function reorderElement(id: string, toIndex: number): void {
    if (readOnly.value) return
    const fromIndex = elements.value.findIndex(el => el.id === id)
    if (fromIndex === -1) return

    const beforeOrder = elements.value.map(el => el.id)
    const safeTo = Math.max(0, Math.min(elements.value.length - 1, toIndex))

    moveElement(fromIndex, safeTo)
    commitLayerReorderIfChanged(beforeOrder)
  }

  function bringToFront(id: string): void {
    const idx = elements.value.findIndex(el => el.id === id)
    if (idx === -1) return
    reorderElement(id, elements.value.length - 1)
  }

  function sendToBack(id: string): void {
    const idx = elements.value.findIndex(el => el.id === id)
    if (idx === -1) return
    reorderElement(id, 0)
  }

  function bringForward(id: string): void {
    const idx = elements.value.findIndex(el => el.id === id)
    if (idx === -1) return
    reorderElement(id, idx + 1)
  }

  function sendBackward(id: string): void {
    const idx = elements.value.findIndex(el => el.id === id)
    if (idx === -1) return
    reorderElement(id, idx - 1)
  }

  function setElementOrder(orderIdsBottomToTop: string[]): void {
    if (readOnly.value) return
    const beforeOrder = elements.value.map(el => el.id)
    const byId        = new Map(elements.value.map(el => [el.id, el] as const))
    const next: TemplateElement[] = []

    for (const id of orderIdsBottomToTop) {
      const el = byId.get(id)
      if (!el) continue
      next.push(el)
      byId.delete(id)
    }

    // Preserve unknown IDs in their previous order (safety for stale UI state).
    for (const el of elements.value) {
      if (byId.has(el.id)) next.push(el)
    }

    elements.value = next
    commitLayerReorderIfChanged(beforeOrder)
  }

  /**
   * Unified image insertion — used by upload panel, paste, and drag-drop.
   */
  function addImageElement(src: string): void {
    if (readOnly.value) return
    const size = canvasSize.value
    const img  = new window.Image()
    img.onload = () => {
      const maxW  = size.width  * 0.6
      const maxH  = size.height * 0.6
      const ratio = Math.min(maxW / img.width, maxH / img.height, 1)

      const el: ImageElement = {
        id:           uuid(),
        type:         'image',
        src,
        x:            Math.round((size.width  - img.width  * ratio) / 2),
        y:            Math.round((size.height - img.height * ratio) / 2),
        width:        Math.round(img.width  * ratio),
        height:       Math.round(img.height * ratio),
        sourceWidth:  img.width,
        sourceHeight: img.height,
        draggable:    true,
        visible:      true,
        opacity:      1,
      }
      elements.value.push(el)

      selectedId.value = el.id
      isDirty.value    = true
      snapshot()
    }
    img.src = src
  }

  function removeElement(id: string): void {
    if (readOnly.value) return
    elements.value = elements.value.filter(el => el.id !== id)
    if (selectedId.value === id) selectedId.value = null
    isDirty.value = true
    snapshot()
  }

  function undo(): void {
    if (readOnly.value) return
    if (!canUndo.value) return
    historyIndex.value--
    elements.value   = JSON.parse(JSON.stringify(history.value[historyIndex.value])) as TemplateElement[]
    selectedId.value = null
  }

  function redo(): void {
    if (readOnly.value) return
    if (!canRedo.value) return
    historyIndex.value++
    elements.value   = JSON.parse(JSON.stringify(history.value[historyIndex.value])) as TemplateElement[]
    selectedId.value = null
  }

  function clearSelection(): void {
    selectedId.value = null
  }

  function loadSharedSnapshot(payload: ShareEditorPayload, options?: { permissionMode?: 'view' | 'edit' }): void {
    const template = payload.template
    currentTemplate.value = template
    currentPlatform.value = PLATFORMS[template.platform]
    currentImageType.value = IMAGE_TYPES[template.imageType]
    elements.value = sanitizeElementsForEditor(
      JSON.parse(JSON.stringify(payload.elements ?? template.elements)) as TemplateElement[],
    )
    selectedId.value = payload.selectedId ?? null
    history.value = []
    historyIndex.value = -1
    snapshot()
    isDirty.value = false
    markTemplateSelection(template.id)
    activeEditorId.value = null
    editorLoadSource.value = 'share'
    readOnly.value = options?.permissionMode === 'view'
  }

  function loadRemoteEditorSnapshot(editorId: string, payload: ShareEditorPayload): void {
    const template = payload.template
    currentTemplate.value = template
    currentPlatform.value = PLATFORMS[template.platform]
    currentImageType.value = IMAGE_TYPES[template.imageType]
    elements.value = sanitizeElementsForEditor(
      JSON.parse(JSON.stringify(payload.elements ?? template.elements)) as TemplateElement[],
    )
    selectedId.value = payload.selectedId ?? null
    history.value = []
    historyIndex.value = -1
    snapshot()
    isDirty.value = false
    markTemplateSelection(template.id)
    activeEditorId.value = editorId
    editorLoadSource.value = 'remote'
    readOnly.value = false
  }

  function setActiveEditorId(editorId: string | null): void {
    activeEditorId.value = editorId
  }

  function setEditorLoadSource(source: 'local' | 'remote' | 'share'): void {
    editorLoadSource.value = source
  }

  function setReadOnly(value: boolean): void {
    readOnly.value = value
  }

  function setCurrentTemplateName(name: string): void {
    if (!currentTemplate.value) return
    const normalized = name.trim()
    if (!normalized) return
    if (currentTemplate.value.name === normalized) return
    currentTemplate.value = {
      ...currentTemplate.value,
      name: normalized.slice(0, 255),
    }
    isDirty.value = true
  }

  return {
    // state
    currentPlatform, currentImageType, currentTemplate,
    elements, selectedId, allTemplates,
    isDirty, exportFormat, exportQuality, textIconDefaultColor, activeEditorId, editorLoadSource, readOnly,
    // computed
    selectedElement, templatesForPlatform, templatesForCurrentType,
    canUndo, canRedo, canvasSize,
    // actions
    setTemplates, selectPlatform, selectImageType,
    loadTemplate, createCustomTemplate, selectElement, updateElement, commitElementUpdate,
    addTextElement, addTitleElement, addSubtitleElement, duplicateElement,
    addRectangleElement, addCircleElement, addIconElement, addSocialButtonPreset, resetToTemplateDefaults,
    addImageElement, removeElement, setTextIconDefaultColor,
    reorderElement, setElementOrder, bringToFront, sendToBack, bringForward, sendBackward,
    undo, redo, clearSelection,
    loadSharedSnapshot, loadRemoteEditorSnapshot, setActiveEditorId, setEditorLoadSource, setReadOnly,
    setCurrentTemplateName,
    saveToLocalStorage, restoreFromLocalStorage, saveDraftForCurrentTemplate, restoreDraftForCurrentTemplate,
    restoreDraftByTemplateId, restoreSessionTemplateId, markTemplateSelection, clearSessionSelection, markClean,
  }
})
