import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuid } from 'uuid'
import type {
  Platform, ImageType, Template, TemplateElement,
  TextElement, ImageElement, PlatformId, ImageTypeId,
} from '@/types'
import { PLATFORMS, IMAGE_TYPES } from '@/types'

const MAX_HISTORY = 50

interface PersistedSession {
  templateId: string | null
  elements:   TemplateElement[]
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

  // ── Derived background image (backward-compat with components/useCanvas) ──
  const backgroundImage = computed<string | null>(() => {
    const bgEl = elements.value.find(
      el => el.type === 'image' && (el as ImageElement).isBackground,
    )
    return bgEl ? (bgEl as ImageElement).src : null
  })

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

  function saveToLocalStorage(): void {
    const key = storageKey()
    if (!key) return
    const session: PersistedSession = {
      templateId: currentTemplate.value?.id ?? null,
      elements:   JSON.parse(JSON.stringify(elements.value)),
    }
    localStorage.setItem(key, JSON.stringify(session))
    isDirty.value = false
  }

  function restoreFromLocalStorage(): void {
    const key = storageKey()
    if (!key) return
    const raw = localStorage.getItem(key)
    if (!raw) return
    try {
      const session = JSON.parse(raw) as PersistedSession
      if (session.templateId && allTemplates.value.length > 0) {
        const tpl = allTemplates.value.find(t => t.id === session.templateId)
        if (tpl) currentTemplate.value = tpl
      }
      if (session.elements?.length) {
        elements.value     = session.elements
        history.value      = [JSON.parse(JSON.stringify(elements.value))]
        historyIndex.value = 0
      }
      isDirty.value = false
    } catch {
      // silently ignore malformed stored data
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
    currentPlatform.value  = PLATFORMS[platformId]
    currentImageType.value = null
    currentTemplate.value  = null
    elements.value         = []
    selectedId.value       = null
    isDirty.value          = false
  }

  function selectImageType(imageTypeId: ImageTypeId): void {
    currentImageType.value = IMAGE_TYPES[imageTypeId]
    currentTemplate.value  = null
    elements.value         = []
    selectedId.value       = null
    isDirty.value          = false
  }

  function loadTemplate(template: Template): void {
    currentTemplate.value  = template
    currentPlatform.value  = PLATFORMS[template.platform]
    currentImageType.value = IMAGE_TYPES[template.imageType]
    elements.value         = JSON.parse(JSON.stringify(template.elements)) as TemplateElement[]
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
  }

  function selectElement(id: string | null): void {
    selectedId.value = id
  }

  function updateElement(id: string, patch: Partial<TemplateElement>): void {
    const idx = elements.value.findIndex(el => el.id === id)
    if (idx === -1) return
    elements.value[idx] = { ...elements.value[idx], ...patch } as TemplateElement
  }

  function commitElementUpdate(id: string, patch: Partial<TemplateElement>): void {
    updateElement(id, patch)
    isDirty.value = true
    snapshot()
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
      color:       '#ffffff',
      stroke:      '',
      strokeWidth: 0,
      fontStyle:   'normal',
      align:       'center',
      width:       300,
      draggable:   true,
      visible:     true,
      opacity:     1,
    }
    elements.value.push(el)
    selectedId.value = el.id
    isDirty.value    = true
    snapshot()
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
      color:       '#ffffff',
      stroke:      '',
      strokeWidth: 0,
      fontStyle:   'bold',
      align:       'center',
      width:       640,
      draggable:   true,
      visible:     true,
      opacity:     1,
    }
    elements.value.push(el)
    selectedId.value = el.id
    isDirty.value    = true
    snapshot()
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
      color:       '#e5e5e5',
      stroke:      '',
      strokeWidth: 0,
      fontStyle:   'normal',
      align:       'center',
      width:       520,
      draggable:   true,
      visible:     true,
      opacity:     1,
    }
    elements.value.push(el)
    selectedId.value = el.id
    isDirty.value    = true
    snapshot()
  }

  function duplicateElement(id: string): void {
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

  /**
   * Unified image insertion — used by upload panel, paste, and drag-drop.
   * When isBackground=true, any existing background element is replaced and
   * the new element is inserted at index 0 (behind everything else).
   */
  function addImageElement(src: string, opts?: { isBackground?: boolean }): void {
    const size = canvasSize.value
    const img  = new window.Image()
    img.onload = () => {
      if (opts?.isBackground) {
        elements.value = elements.value.filter(
          el => !(el.type === 'image' && (el as ImageElement).isBackground),
        )
      }

      const maxW  = opts?.isBackground ? size.width  : size.width  * 0.6
      const maxH  = opts?.isBackground ? size.height : size.height * 0.6
      const ratio = Math.min(maxW / img.width, maxH / img.height, 1)

      const el: ImageElement = {
        id:           uuid(),
        type:         'image',
        src,
        x:            opts?.isBackground ? 0 : Math.round((size.width  - img.width  * ratio) / 2),
        y:            opts?.isBackground ? 0 : Math.round((size.height - img.height * ratio) / 2),
        width:        opts?.isBackground ? size.width  : Math.round(img.width  * ratio),
        height:       opts?.isBackground ? size.height : Math.round(img.height * ratio),
        draggable:    true,
        visible:      true,
        opacity:      1,
        isBackground: opts?.isBackground ?? false,
      }

      if (opts?.isBackground) elements.value.unshift(el)
      else elements.value.push(el)

      selectedId.value = el.id
      isDirty.value    = true
      snapshot()
    }
    img.src = src
  }

  function removeElement(id: string): void {
    elements.value = elements.value.filter(el => el.id !== id)
    if (selectedId.value === id) selectedId.value = null
    isDirty.value = true
    snapshot()
  }

  /**
   * Convenience wrapper kept for backward compatibility.
   * Passing null removes any existing background element.
   */
  function setBackgroundImage(src: string | null): void {
    if (src === null) {
      elements.value = elements.value.filter(
        el => !(el.type === 'image' && (el as ImageElement).isBackground),
      )
      isDirty.value = true
      snapshot()
      return
    }
    addImageElement(src, { isBackground: true })
  }

  function undo(): void {
    if (!canUndo.value) return
    historyIndex.value--
    elements.value   = JSON.parse(JSON.stringify(history.value[historyIndex.value])) as TemplateElement[]
    selectedId.value = null
  }

  function redo(): void {
    if (!canRedo.value) return
    historyIndex.value++
    elements.value   = JSON.parse(JSON.stringify(history.value[historyIndex.value])) as TemplateElement[]
    selectedId.value = null
  }

  function clearSelection(): void {
    selectedId.value = null
  }

  return {
    // state
    currentPlatform, currentImageType, currentTemplate,
    elements, selectedId, allTemplates,
    isDirty, backgroundImage, exportFormat, exportQuality,
    // computed
    selectedElement, templatesForPlatform, templatesForCurrentType,
    canUndo, canRedo, canvasSize,
    // actions
    setTemplates, selectPlatform, selectImageType,
    loadTemplate, selectElement, updateElement, commitElementUpdate,
    addTextElement, addTitleElement, addSubtitleElement, duplicateElement,
    addImageElement, removeElement, setBackgroundImage,
    undo, redo, clearSelection,
    saveToLocalStorage, restoreFromLocalStorage, markClean,
  }
})
