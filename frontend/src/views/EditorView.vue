<template>
  <div class="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-zinc-950">
    <TopBar
      :recent-items="recentItems"
      :breadcrumbs="editorBreadcrumbs"
      @new-file="showNewFileModal = true"
      @save="showExportModal = true"
      @print="printCanvasOnly"
      @export="showExportModal = true"
      @open-recent="onOpenRecent"
    />

    <div class="flex flex-1 min-h-0">
      <LeftPanel />
      <main class="flex-1 min-w-0 relative">
        <CanvasStage ref="canvasStageRef" />
      </main>
      <RightPanel />
    </div>

    <!-- Export modal -->
    <ExportModal
      v-if="showExportModal"
      @close="showExportModal = false"
      @download="handleExport"
    />

    <NewFileModal
      v-if="showNewFileModal"
      @close="showNewFileModal = false"
      @select-platform="onSelectPlatformFromNew"
      @create-custom="onCreateCustomFromNew"
    />

    <!-- Save toast -->
    <Transition name="toast">
      <div
        v-if="showSaveToast"
        class="fixed bottom-6 left-6 z-50 flex items-center gap-2.5 px-4 py-3
               bg-emerald-600 text-white text-sm font-medium rounded-2xl shadow-xl
               shadow-emerald-900/30 pointer-events-none select-none"
      >
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
        </svg>
        Saved to browser
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import axios              from 'axios'
import { useRoute, useRouter } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'
import TopBar             from '@/components/layout/TopBar.vue'
import LeftPanel          from '@/components/layout/LeftPanel.vue'
import RightPanel         from '@/components/layout/RightPanel.vue'
import CanvasStage        from '@/components/canvas/CanvasStage.vue'
import ExportModal        from '@/components/ui/ExportModal.vue'
import NewFileModal       from '@/components/ui/NewFileModal.vue'
import { useEditorStore } from '@/store/editor'
import { useExport }      from '@/composables/useExport'
import { useAutoSave }    from '@/composables/useAutoSave'
import { localTemplates } from '@/templates/index'
import { PLATFORMS, IMAGE_TYPES, PLATFORM_IMAGE_TYPES } from '@/types'
import type { PlatformId, ImageTypeId } from '@/types'
import type Konva         from 'konva'

const route           = useRoute()
const router          = useRouter()
const store           = useEditorStore()
const { exportStage } = useExport()
const canvasStageRef  = ref<InstanceType<typeof CanvasStage> | null>(null)
const showExportModal = ref(false)
const showNewFileModal = ref(false)
const showSaveToast   = ref(false)
let   saveToastTimer  = 0
let   isApplyingRoute = false

useAutoSave()

interface RecentItem {
  platformId: PlatformId
  imageTypeId: ImageTypeId
  templateId: string
  title: string
  subtitle: string
}

interface BreadcrumbItem {
  label: string
  to?: RouteLocationRaw
  current?: boolean
}

const recentItems = ref<RecentItem[]>([])
const editorBreadcrumbs = computed<BreadcrumbItem[]>(() => {
  const currentPlatform = store.currentPlatform?.id
  const currentType = store.currentImageType?.id
  const queryTemplate = typeof route.query.template === 'string' ? route.query.template : undefined
  const queryW = typeof route.query.customW === 'string' ? Number(route.query.customW) : undefined
  const queryH = typeof route.query.customH === 'string' ? Number(route.query.customH) : undefined

  const isCustom =
    queryTemplate === 'custom'
    || store.currentTemplate?.id.startsWith('custom_')

  if (isCustom) {
    const width = Number.isFinite(queryW) ? Math.round(queryW as number) : store.currentTemplate?.width ?? 1080
    const height = Number.isFinite(queryH) ? Math.round(queryH as number) : store.currentTemplate?.height ?? 1080
    return [
      { label: 'Home', to: { name: 'home' } },
      { label: `Custom size (${width} x ${height})`, current: true },
    ]
  }

  if (!currentPlatform || !currentType) {
    return [
      { label: 'Home', to: { name: 'home' } },
      { label: 'Editor', current: true },
    ]
  }

  const platformLabel = PLATFORMS[currentPlatform]?.label ?? 'Platform'
  const typeLabel = IMAGE_TYPES[currentType]?.label ?? 'Image Type'
  return [
    { label: 'Home', to: { name: 'home' } },
    { label: platformLabel, to: { name: 'platform', params: { platformId: currentPlatform } } },
    { label: typeLabel },
    { label: 'Editor', current: true },
  ]
})

function quickSaveExport(): void {
  const stage = canvasStageRef.value?.stage as Konva.Stage | null | undefined
  if (!stage || !store.currentTemplate) return
  store.clearSelection()
  requestAnimationFrame(() => {
    exportStage(stage, store.currentTemplate!.name, {
      format: store.exportFormat,
      quality: store.exportQuality,
    })
  })
}

// ── Fetch templates ───────────────────────────────────────────────────────
async function fetchTemplates(): Promise<void> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL as string | undefined
    if (apiUrl) {
      const { data } = await axios.get(`${apiUrl}/templates`)
      store.setTemplates(data)
    } else {
      store.setTemplates(localTemplates)
    }
  } catch {
    store.setTemplates(localTemplates)
  }
}

function readRouteSelection(): { platform?: PlatformId; type?: ImageTypeId; template?: string; customW?: number; customH?: number } {
  const platform = route.query.platform
  const type     = route.query.type
  const template = route.query.template
  const customW  = route.query.customW
  const customH  = route.query.customH
  return {
    platform: typeof platform === 'string' ? (platform as PlatformId) : undefined,
    type: typeof type === 'string' ? (type as ImageTypeId) : undefined,
    template: typeof template === 'string' ? template : undefined,
    customW: typeof customW === 'string' ? Number(customW) : undefined,
    customH: typeof customH === 'string' ? Number(customH) : undefined,
  }
}

function applyRouteSelection(): boolean {
  const { platform, type, template, customW, customH } = readRouteSelection()
  if (!platform || !type) return false
  if (!PLATFORMS[platform] || !IMAGE_TYPES[type]) return false
  if (!(PLATFORM_IMAGE_TYPES[platform] ?? []).includes(type)) return false

  isApplyingRoute = true
  if (store.currentPlatform?.id !== platform) {
    store.selectPlatform(platform)
  }
  if (store.currentImageType?.id !== type) {
    store.selectImageType(type)
  }

  let selectedTemplateId: string | null = null
  if (template === 'custom') {
    const width = Number.isFinite(customW) ? Math.round(customW as number) : 1080
    const height = Number.isFinite(customH) ? Math.round(customH as number) : 1080
    const safeWidth = Math.max(100, Math.min(8000, width))
    const safeHeight = Math.max(100, Math.min(8000, height))
    store.createCustomTemplate(safeWidth, safeHeight)
    selectedTemplateId = store.currentTemplate?.id ?? null
  } else if (template) {
    const tpl = store.templatesForCurrentType.find(t => t.id === template)
    if (tpl) {
      store.loadTemplate(tpl)
      selectedTemplateId = tpl.id
    }
  } else {
    const sessionTemplateId = store.restoreSessionTemplateId()
    if (sessionTemplateId) {
      const sessionTemplate = store.templatesForCurrentType.find(t => t.id === sessionTemplateId)
      if (sessionTemplate) {
        store.loadTemplate(sessionTemplate)
        selectedTemplateId = sessionTemplate.id
      }
    }
  }
  isApplyingRoute = false
  if (selectedTemplateId) store.markTemplateSelection(selectedTemplateId)
  return true
}

function syncRouteFromStore(): void {
  if (route.name !== 'editor' || isApplyingRoute) return

  const query: Record<string, string> = {}
  if (store.currentPlatform?.id) query.platform = store.currentPlatform.id
  if (store.currentImageType?.id) query.type = store.currentImageType.id
  if (store.currentTemplate?.id) {
    if (store.currentTemplate.id.startsWith('custom_')) {
      query.template = 'custom'
      query.customW = String(store.currentTemplate.width)
      query.customH = String(store.currentTemplate.height)
    } else {
      query.template = store.currentTemplate.id
    }
  }

  const currentPlatform = typeof route.query.platform === 'string' ? route.query.platform : undefined
  const currentType     = typeof route.query.type === 'string' ? route.query.type : undefined
  const currentTemplate = typeof route.query.template === 'string' ? route.query.template : undefined
  const currentCustomW  = typeof route.query.customW === 'string' ? route.query.customW : undefined
  const currentCustomH  = typeof route.query.customH === 'string' ? route.query.customH : undefined
  if (
    currentPlatform === query.platform
    && currentType === query.type
    && currentTemplate === query.template
    && currentCustomW === query.customW
    && currentCustomH === query.customH
  ) return

  router.replace({ name: 'editor', query })
}

function confirmDiscardChanges(): boolean {
  if (!store.isDirty) return true
  return window.confirm('You have unsaved changes. Create a new file and replace current work?')
}

function onSelectPlatformFromNew(platformId: PlatformId): void {
  if (!confirmDiscardChanges()) return
  showNewFileModal.value = false
  router.push({ name: 'platform', params: { platformId } })
}

function onCreateCustomFromNew(payload: { width: number; height: number }): void {
  if (!confirmDiscardChanges()) return
  store.createCustomTemplate(payload.width, payload.height)
  showNewFileModal.value = false
  syncRouteFromStore()
}

function parseSessionKey(key: string): { platformId: PlatformId; imageTypeId: ImageTypeId } | null {
  const match = key.match(/^fastee-session-([^-]+)-(.+)$/)
  if (!match) return null
  const platformId = match[1] as PlatformId
  const imageTypeId = match[2] as ImageTypeId
  if (!PLATFORMS[platformId] || !IMAGE_TYPES[imageTypeId]) return null
  return { platformId, imageTypeId }
}

function displayTemplateName(templateId: string): string {
  const template = store.allTemplates.find(t => t.id === templateId)
  if (template) return template.name
  if (templateId.startsWith('custom_')) {
    const sizePart = templateId.replace('custom_', '')
    return `Custom (${sizePart})`
  }
  return templateId
}

function refreshRecentItems(): void {
  const items: RecentItem[] = []
  const seen = new Set<string>()

  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i)
    if (!key || !key.startsWith('fastee-session-')) continue
    const parsed = parseSessionKey(key)
    if (!parsed) continue

    const raw = localStorage.getItem(key)
    if (!raw) continue

    try {
      const data = JSON.parse(raw) as { templateId?: string | null }
      if (!data.templateId) continue
      if (!localStorage.getItem(`fastee-draft-${data.templateId}`)) continue

      const unique = `${parsed.platformId}-${parsed.imageTypeId}-${data.templateId}`
      if (seen.has(unique)) continue
      seen.add(unique)

      const platformLabel = PLATFORMS[parsed.platformId].label
      const typeLabel = IMAGE_TYPES[parsed.imageTypeId].label

      items.push({
        platformId: parsed.platformId,
        imageTypeId: parsed.imageTypeId,
        templateId: data.templateId,
        title: displayTemplateName(data.templateId),
        subtitle: `${platformLabel} • ${typeLabel}`,
      })
    } catch {
      continue
    }
  }

  recentItems.value = items.slice(0, 10)
}

function onOpenRecent(item: RecentItem): void {
  if (!confirmDiscardChanges()) return

  showNewFileModal.value = false
  showExportModal.value = false

  store.selectPlatform(item.platformId)
  store.selectImageType(item.imageTypeId)

  const restored = store.restoreDraftByTemplateId(item.templateId)
  if (!restored) {
    const fallback = store.templatesForCurrentType.find(t => t.id === item.templateId)
      ?? store.templatesForCurrentType[0]
    if (fallback) store.loadTemplate(fallback)
  }

  syncRouteFromStore()
}

// ── Export ────────────────────────────────────────────────────────────────
function handleExport(format: 'png' | 'jpeg', quality: number): void {
  const stage = canvasStageRef.value?.stage as Konva.Stage | null | undefined
  if (!stage || !store.currentTemplate) return

  store.clearSelection()
  store.exportFormat = format
  store.exportQuality = quality

  requestAnimationFrame(() => {
    exportStage(stage, store.currentTemplate!.name, { format, quality })
    showExportModal.value = false
  })
}

function printCanvasOnly(): void {
  const stage = canvasStageRef.value?.stage as Konva.Stage | null | undefined
  if (!stage || !store.currentTemplate) return

  store.clearSelection()
  const dataUrl = stage.toDataURL({ pixelRatio: 2 })
  const printWindow = window.open('', '_blank', 'noopener,noreferrer')
  if (!printWindow) {
    window.alert('Popup was blocked. Please allow popups for this site to print.')
    return
  }

  const safeTitle = store.currentTemplate.name.replace(/"/g, '&quot;')
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>${safeTitle}</title>
        <style>
          html, body { margin: 0; padding: 0; background: #fff; }
          body {
            display: flex;
            justify-content: center;
            align-items: flex-start;
            min-height: 100vh;
          }
          img {
            display: block;
            width: 100%;
            height: auto;
            max-width: 100vw;
          }
        </style>
      </head>
      <body>
        <img src="${dataUrl}" alt="${safeTitle}" />
      </body>
    </html>
  `)
  printWindow.document.close()
}

// ── Keyboard shortcuts ────────────────────────────────────────────────────
function onKeyDown(e: KeyboardEvent): void {
  const tag = (e.target as HTMLElement).tagName
  const target = e.target as HTMLElement
  if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault()
    quickSaveExport()
  }

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
    e.preventDefault()
    printCanvasOnly()
  }
}

// ── Unsaved changes on browser close ─────────────────────────────────────
function onBeforeUnload(): void {
  if (store.isDirty) {
    store.saveToLocalStorage()
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', onBeforeUnload)
  window.addEventListener('keydown', onKeyDown)
  fetchTemplates().then(() => {
    const applied = applyRouteSelection()
    if (applied) {
      const isCustomRoute = readRouteSelection().template === 'custom'
      if (!isCustomRoute) {
        const restored = store.restoreFromLocalStorage()
        if (!restored && !store.currentTemplate) {
          const fallback = store.templatesForCurrentType[0]
          if (fallback) store.loadTemplate(fallback)
        }
      }
    }
    syncRouteFromStore()
    refreshRecentItems()
  })
})

onUnmounted(() => {
  if (store.isDirty) store.saveToLocalStorage()
  window.removeEventListener('beforeunload', onBeforeUnload)
  window.removeEventListener('keydown', onKeyDown)
  clearTimeout(saveToastTimer)
})

watch(
  () => [store.currentPlatform?.id, store.currentImageType?.id, store.currentTemplate?.id],
  () => {
    syncRouteFromStore()
    refreshRecentItems()
  },
)

watch(
  () => route.query,
  () => {
    if (isApplyingRoute) return
    const applied = applyRouteSelection()
    if (!applied) return
    const isCustomRoute = readRouteSelection().template === 'custom'
    if (!isCustomRoute) {
      const restored = store.restoreFromLocalStorage()
      if (!restored && !store.currentTemplate) {
        const fallback = store.templatesForCurrentType[0]
        if (fallback) store.loadTemplate(fallback)
      }
    }
  },
)
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
