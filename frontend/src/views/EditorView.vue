<template>
  <div class="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-zinc-950">
    <TopBar
      :recent-items="recentItems"
      :breadcrumbs="editorBreadcrumbs"
      :active-users="activeUsers"
      @new-file="showNewFileModal = true"
      @save="showExportModal = true"
      @share="openShareModal"
      @print="printCanvasOnly"
      @export="showExportModal = true"
      @open-recent="onOpenRecent"
      @delete-recent="onDeleteRecent"
    />

    <div
      v-if="showStaleBanner"
      class="flex items-center justify-between gap-3 px-4 py-2 text-xs border-b border-amber-300/60 bg-amber-100/80 text-amber-900 dark:bg-amber-900/25 dark:text-amber-200 dark:border-amber-700/60"
    >
      <span>New updates are available for this editor.</span>
      <div class="flex items-center gap-3">
        <label class="inline-flex items-center gap-1.5">
          <input
            v-model="syncMode"
            type="checkbox"
            class="accent-brand-500"
          />
          Sync mode
        </label>
        <button
          class="px-2.5 py-1 rounded-md bg-amber-700 text-white dark:bg-amber-500 dark:text-black"
          @click="refreshEditorFromRemote"
        >
          Refresh
        </button>
      </div>
    </div>

    <div class="flex flex-1 min-h-0">
      <LeftPanel />
      <main class="flex-1 min-w-0 relative">
        <CanvasStage ref="canvasStageRef" />
      </main>
      <RightPanel
        :sync-mode="syncMode"
        @update:sync-mode="syncMode = $event"
      />
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

    <ShareModal
      v-if="showShareModal"
      :share-url="shareState?.shareUrl ?? ''"
      :expires-at="shareState?.expiresAt ?? ''"
      :access-mode="shareForm.accessMode"
      :permission-mode="shareForm.permissionMode"
      :allowed-emails="shareForm.allowedEmails"
      :expires-in-seconds="shareForm.expiresInSeconds"
      :has-existing-share="Boolean(shareState?.snapshotId)"
      :is-creating="isCreatingShare"
      :is-deleting="isDeletingShare"
      :status-message="shareStatusMessage"
      :error-message="shareErrorMessage"
      @close="closeShareModal"
      @delete-share="deleteCurrentShare"
      @create-share="createShareFromModal"
      @save-config-and-close="saveShareConfigAndClose"
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
import ShareModal         from '@/components/ui/ShareModal.vue'
import { useEditorStore } from '@/store/editor'
import { useExport }      from '@/composables/useExport'
import { useAutoSave }    from '@/composables/useAutoSave'
import { useAuth }        from '@/composables/useAuth'
import { localTemplates } from '@/templates/index'
import { PLATFORMS, IMAGE_TYPES, PLATFORM_IMAGE_TYPES } from '@/types'
import type { PlatformId, ImageTypeId, PresenceUser, ShareEditorPayload } from '@/types'
import {
  createShare,
  deleteShare,
  getShareByCode,
  getShareByEditorId,
  getSharePresenceByCode,
  getShareStatusByCode,
  heartbeatSharePresenceByCode,
} from '@/services/shareApi'
import {
  createEditor,
  deleteEditor,
  getEditorById,
  getEditorPresence,
  getEditorStatus,
  heartbeatEditorPresence,
  listEditors,
  updateEditor,
} from '@/services/editorApi'
import type Konva         from 'konva'

const route           = useRoute()
const router          = useRouter()
const store           = useEditorStore()
const auth            = useAuth()
const { exportStage } = useExport()
const canvasStageRef  = ref<InstanceType<typeof CanvasStage> | null>(null)
const showExportModal = ref(false)
const showNewFileModal = ref(false)
const showShareModal = ref(false)
const showSaveToast   = ref(false)
const shareState = ref<{
  snapshotId: string
  shareUrl: string
  expiresAt: string | null
} | null>(null)
const shareForm = ref<{
  accessMode: 'anyone' | 'specific_users'
  permissionMode: 'view' | 'edit'
  allowedEmails: string[]
  expiresInSeconds: number | null
}>({
  accessMode: 'anyone',
  permissionMode: 'edit',
  allowedEmails: [],
  expiresInSeconds: 24 * 3600,
})
const isCreatingShare = ref(false)
const isDeletingShare = ref(false)
const shareErrorMessage = ref('')
const shareStatusMessage = ref('')
let   saveToastTimer  = 0
let   isApplyingRoute = false
let   isHydratingRoute = false
let pollingTimer = 0
const hasCollaborationFatalError = ref(false)
const activeUsers = ref<PresenceUser[]>([])
const latestRemoteUpdatedAt = ref<string | null>(null)
const showStaleBanner = ref(false)
const SYNC_MODE_STORAGE_KEY = 'fastee-sync-mode'
const syncMode = ref(localStorage.getItem(SYNC_MODE_STORAGE_KEY) === '1')
const ANON_SESSION_ID_KEY = 'fastee-anon-session-id'
const ANON_NAME_KEY = 'fastee-anon-name'

function randomAnonymousName(): string {
  const first = ['Blue', 'Solar', 'Crimson', 'Silent', 'Rapid', 'Ivory', 'Lunar', 'Amber']
  const second = ['Panda', 'Fox', 'Eagle', 'Wolf', 'Otter', 'Falcon', 'Tiger', 'Koala']
  return `${first[Math.floor(Math.random() * first.length)]} ${second[Math.floor(Math.random() * second.length)]}`
}

function getOrCreateAnonymousSessionId(): string {
  const existing = localStorage.getItem(ANON_SESSION_ID_KEY)?.trim()
  if (existing) return existing
  const created = crypto.randomUUID()
  localStorage.setItem(ANON_SESSION_ID_KEY, created)
  return created
}

function getOrCreateAnonymousName(): string {
  const existing = localStorage.getItem(ANON_NAME_KEY)?.trim()
  if (existing) return existing
  const created = randomAnonymousName()
  localStorage.setItem(ANON_NAME_KEY, created)
  return created
}

function setLatestRemoteUpdatedAt(updatedAt: string | null | undefined): void {
  latestRemoteUpdatedAt.value = typeof updatedAt === 'string' && updatedAt.trim() ? updatedAt : null
}

useAutoSave({
  onRemoteSaved(updatedAt) {
    setLatestRemoteUpdatedAt(updatedAt)
    showStaleBanner.value = false
  },
  getShareCode() {
    const shareCode = typeof route.query.shareCode === 'string' ? route.query.shareCode.trim() : ''
    return shareCode || null
  },
})

interface RecentItem {
  editorId: string
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
      pixelRatio: store.exportScalePercent / 100,
    })
  })
}

function currentSharePayload(): ShareEditorPayload | null {
  if (!store.currentTemplate) return null
  return {
    template: JSON.parse(JSON.stringify(store.currentTemplate)),
    elements: JSON.parse(JSON.stringify(store.elements)),
    selectedId: store.selectedId,
  }
}

const currentViewerLabel = computed(() => {
  if (auth.currentUser.value) {
    return auth.currentUser.value.name || auth.currentUser.value.email
  }
  return getOrCreateAnonymousName()
})

async function openShareModal(): Promise<void> {
  if (!store.currentTemplate) return
  if (!auth.currentUser.value) {
    showShareModal.value = true
    shareErrorMessage.value = 'Sign in with Google first to create share links.'
    shareStatusMessage.value = ''
    return
  }

  shareErrorMessage.value = ''
  shareStatusMessage.value = ''
  showShareModal.value = true

  const editorId = store.activeEditorId
  if (!editorId) return
  try {
    const existing = await getShareByEditorId(editorId)
    shareState.value = {
      snapshotId: existing.snapshotId,
      shareUrl: existing.shareUrl,
      expiresAt: existing.expiresAt,
    }
    shareForm.value = {
      accessMode: existing.accessMode,
      permissionMode: existing.permissionMode,
      allowedEmails: existing.allowedEmails,
      expiresInSeconds: existing.expiresAt
        ? Math.max(3600, Math.round((new Date(existing.expiresAt).getTime() - Date.now()) / 1000))
        : null,
    }
  } catch {
    // No existing share for this editor yet.
  }
}

async function createShareFromModal(payloadConfig: {
  accessMode: 'anyone' | 'specific_users'
  permissionMode: 'view' | 'edit'
  allowedEmails: string[]
  expiresInSeconds: number | null
}): Promise<boolean> {
  const payload = currentSharePayload()
  if (!payload || !auth.currentUser.value || isCreatingShare.value) return false
  if (payloadConfig.accessMode === 'specific_users' && payloadConfig.allowedEmails.length === 0) {
    shareErrorMessage.value = 'Enter at least one allowed email for Specific users mode.'
    return false
  }
  shareForm.value = {
    accessMode: payloadConfig.accessMode,
    permissionMode: payloadConfig.permissionMode,
    allowedEmails: payloadConfig.allowedEmails,
    expiresInSeconds: payloadConfig.expiresInSeconds,
  }
  isCreatingShare.value = true
  shareErrorMessage.value = ''
  shareStatusMessage.value = ''
  try {
    let editorId = store.activeEditorId
    if (!editorId) {
      const created = await createEditor({
        name: payload.template.name,
        payload,
      })
      editorId = created.editorId
      store.setActiveEditorId(editorId)
      store.setEditorLoadSource('remote')
    } else {
      await updateEditor(editorId, {
        name: payload.template.name,
        payload,
      })
    }

    const response = await createShare({
      name: payload.template.name,
      editorId,
      accessMode: payloadConfig.accessMode,
      permissionMode: payloadConfig.permissionMode,
      allowedEmails: payloadConfig.allowedEmails,
      expiresInSeconds: payloadConfig.expiresInSeconds,
    })
    shareState.value = {
      snapshotId: response.snapshotId,
      shareUrl: response.shareUrl,
      expiresAt: response.expiresAt,
    }
    shareForm.value = {
      accessMode: response.accessMode,
      permissionMode: response.permissionMode,
      allowedEmails: response.allowedEmails,
      expiresInSeconds: payloadConfig.expiresInSeconds,
    }
    shareStatusMessage.value = 'Share settings saved.'
    return true
  } catch (error) {
    shareErrorMessage.value = error instanceof Error ? error.message : 'Failed to create share link.'
    return false
  } finally {
    isCreatingShare.value = false
  }
}

async function saveShareConfigAndClose(payloadConfig: {
  accessMode: 'anyone' | 'specific_users'
  permissionMode: 'view' | 'edit'
  allowedEmails: string[]
  expiresInSeconds: number | null
}): Promise<void> {
  const success = await createShareFromModal(payloadConfig)
  if (success) {
    closeShareModal()
  }
}

function closeShareModal(): void {
  showShareModal.value = false
  isCreatingShare.value = false
  isDeletingShare.value = false
  shareErrorMessage.value = ''
  shareStatusMessage.value = ''
}

async function deleteCurrentShare(): Promise<void> {
  const state = shareState.value
  if (!state || isDeletingShare.value) return

  isDeletingShare.value = true
  shareErrorMessage.value = ''
  shareStatusMessage.value = ''
  try {
    await deleteShare(state.snapshotId)
    shareStatusMessage.value = 'Share deleted.'
  } catch (error) {
    shareErrorMessage.value = error instanceof Error ? error.message : 'Failed to delete share.'
  } finally {
    isDeletingShare.value = false
  }
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

function routeEditorId(): string | null {
  return typeof route.params.editorId === 'string' ? route.params.editorId : null
}

function isShareSourceRoute(): boolean {
  return route.query.source === 'share' && typeof route.query.shareCode === 'string'
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
    if (
      isShareSourceRoute()
      && store.currentTemplate?.id === template
      && store.currentPlatform?.id === platform
      && store.currentImageType?.id === type
    ) {
      selectedTemplateId = template
    } else {
      const tpl = store.templatesForCurrentType.find(t => t.id === template)
      if (tpl) {
        store.loadTemplate(tpl)
        selectedTemplateId = tpl.id
      }
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
  const isEditorRoute = route.name === 'editor' || route.name === 'editor-by-id'
  if (!isEditorRoute || isApplyingRoute || isHydratingRoute) return

  const query: Record<string, string> = {}
  const currentShareCode = typeof route.query.shareCode === 'string' ? route.query.shareCode : undefined
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
  if (store.editorLoadSource === 'share' && currentShareCode) {
    query.source = 'share'
    query.shareCode = currentShareCode
  }

  const currentPlatform = typeof route.query.platform === 'string' ? route.query.platform : undefined
  const currentType     = typeof route.query.type === 'string' ? route.query.type : undefined
  const currentTemplate = typeof route.query.template === 'string' ? route.query.template : undefined
  const currentCustomW  = typeof route.query.customW === 'string' ? route.query.customW : undefined
  const currentCustomH  = typeof route.query.customH === 'string' ? route.query.customH : undefined
  const currentSource   = typeof route.query.source === 'string' ? route.query.source : undefined
  const currentShareCodeQuery = typeof route.query.shareCode === 'string' ? route.query.shareCode : undefined
  if (
    currentPlatform === query.platform
    && currentType === query.type
    && currentTemplate === query.template
    && currentCustomW === query.customW
    && currentCustomH === query.customH
    && currentSource === query.source
    && currentShareCodeQuery === query.shareCode
  ) return

  if (route.name === 'editor-by-id' && routeEditorId()) {
    router.replace({ name: 'editor-by-id', params: { editorId: routeEditorId()! }, query })
    return
  }

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

async function refreshRecentItems(): Promise<void> {
  if (!auth.currentUser.value) {
    recentItems.value = []
    return
  }
  try {
    const editors = await listEditors()
    recentItems.value = editors.slice(0, 10).map(editor => ({
      editorId: editor.editorId,
      title: editor.name,
      subtitle: `Updated ${new Date(editor.updatedAt).toLocaleString()}`,
    }))
  } catch {
    recentItems.value = []
  }
}

function onOpenRecent(item: RecentItem): void {
  if (!confirmDiscardChanges()) return
  router.push({ name: 'editor-by-id', params: { editorId: item.editorId } })
}

async function onDeleteRecent(editorId: string): Promise<void> {
  const confirmed = window.confirm('Delete this editor? This action cannot be undone.')
  if (!confirmed) return
  try {
    await deleteEditor(editorId)
    await refreshRecentItems()
    if (store.activeEditorId === editorId) {
      await router.replace({ name: 'home' })
    }
  } catch {
    window.alert('Failed to delete editor.')
  }
}

async function ensureRemoteEditorRouteForAuthenticatedUser(): Promise<void> {
  if (!auth.currentUser.value) return
  if (route.name === 'editor-by-id') return
  if (isShareSourceRoute()) return
  if (!store.currentTemplate) return

  const payload = currentSharePayload()
  if (!payload) return

  try {
    const created = await createEditor({
      name: payload.template.name,
      payload,
    })
    store.setActiveEditorId(created.editorId)
    store.setEditorLoadSource('remote')
    await router.replace({
      name: 'editor-by-id',
      params: { editorId: created.editorId },
      query: {
        platform: payload.template.platform,
        type: payload.template.imageType,
        template: payload.template.id,
      },
    })
  } catch {
    // Fall back to local draft flow if remote editor creation fails.
  }
}

async function hydrateShareSourceIfNeeded(): Promise<boolean> {
  const shareCode = typeof route.query.shareCode === 'string' ? route.query.shareCode.trim() : ''
  if (!isShareSourceRoute() || !shareCode) return false

  try {
    const resolved = await getShareByCode(shareCode)
    store.loadSharedSnapshot(resolved.payload, { permissionMode: resolved.permissionMode })
    store.setActiveEditorId(resolved.editorId)
    store.setEditorLoadSource('share')
    setLatestRemoteUpdatedAt(null)
    showStaleBanner.value = false
    return true
  } catch {
    await router.replace({ name: 'home' })
    return true
  }
}

async function hydrateRemoteEditorIfNeeded(): Promise<boolean> {
  const editorId = routeEditorId()
  if (!editorId) return false
  if (!auth.currentUser.value) {
    await router.replace({ name: 'editor', query: route.query })
    return true
  }

  try {
    const editor = await getEditorById(editorId)
    store.loadRemoteEditorSnapshot(editor.editorId, editor.payload)
    setLatestRemoteUpdatedAt(editor.updatedAt)
    showStaleBanner.value = false
    return true
  } catch {
    await router.replace({ name: 'editor', query: route.query })
    return true
  }
}

async function refreshEditorFromRemote(): Promise<void> {
  const shareCode = typeof route.query.shareCode === 'string' ? route.query.shareCode.trim() : ''
  if (isShareSourceRoute() && shareCode) {
    const [resolved, status] = await Promise.all([
      getShareByCode(shareCode),
      getShareStatusByCode(shareCode),
    ])
    store.loadSharedSnapshot(resolved.payload, { permissionMode: resolved.permissionMode })
    setLatestRemoteUpdatedAt(status.updatedAt)
    showStaleBanner.value = false
    return
  }
  const editorId = store.activeEditorId
  if (!editorId || !auth.currentUser.value) return
  const editor = await getEditorById(editorId)
  store.loadRemoteEditorSnapshot(editor.editorId, editor.payload)
  setLatestRemoteUpdatedAt(editor.updatedAt)
  showStaleBanner.value = false
}

async function pollCollaborationState(): Promise<void> {
  const shareCode = typeof route.query.shareCode === 'string' ? route.query.shareCode.trim() : ''
  if (isShareSourceRoute() && shareCode) {
    await heartbeatSharePresenceByCode(shareCode, {
      sessionId: getOrCreateAnonymousSessionId(),
      displayName: currentViewerLabel.value,
    })
    const [status, presence] = await Promise.all([
      getShareStatusByCode(shareCode),
      getSharePresenceByCode(shareCode),
    ])
    activeUsers.value = presence.users
    const hasRemoteUpdate = !latestRemoteUpdatedAt.value || status.updatedAt > latestRemoteUpdatedAt.value
    if (hasRemoteUpdate) {
      if (syncMode.value) {
        await refreshEditorFromRemote()
        showStaleBanner.value = false
      } else if (latestRemoteUpdatedAt.value) {
        showStaleBanner.value = true
      } else {
        setLatestRemoteUpdatedAt(status.updatedAt)
      }
    }
    return
  }

  const editorId = store.activeEditorId
  if (!editorId || !auth.currentUser.value) {
    activeUsers.value = []
    showStaleBanner.value = false
    return
  }
  await heartbeatEditorPresence(editorId, {
    sessionId: getOrCreateAnonymousSessionId(),
    displayName: currentViewerLabel.value,
  })
  const [status, presence] = await Promise.all([
    getEditorStatus(editorId),
    getEditorPresence(editorId),
  ])
  activeUsers.value = presence.users
  const hasRemoteUpdate = !latestRemoteUpdatedAt.value || status.updatedAt > latestRemoteUpdatedAt.value
  if (hasRemoteUpdate) {
    if (syncMode.value) {
      await refreshEditorFromRemote()
      showStaleBanner.value = false
    } else if (latestRemoteUpdatedAt.value) {
      showStaleBanner.value = true
    } else {
      setLatestRemoteUpdatedAt(status.updatedAt)
    }
  }
}

async function handleCollaborationApiFailure(): Promise<void> {
  if (hasCollaborationFatalError.value) return
  hasCollaborationFatalError.value = true
  window.alert('Unable to verify shared editor access (heartbeat/status/presence failed). You will be redirected to a non-viewable page.')
  store.setReadOnly(true)
  store.clearSelection()
  await router.replace({ name: 'home' })
}

function stopPolling(): void {
  clearInterval(pollingTimer)
  pollingTimer = 0
}

function startPolling(): void {
  stopPolling()
  pollingTimer = window.setInterval(() => {
    pollCollaborationState().catch(() => {
      handleCollaborationApiFailure().catch(() => {
        // Ignore redirect errors.
      })
    })
  }, 7000)
  pollCollaborationState().catch(() => {
    handleCollaborationApiFailure().catch(() => {
      // Ignore redirect errors.
    })
  })
}

async function hydrateFromRoute(): Promise<void> {
  isHydratingRoute = true
  try {
    const handledShare = await hydrateShareSourceIfNeeded()
    if (handledShare) return

    const handledRemote = await hydrateRemoteEditorIfNeeded()
    if (handledRemote) return

    const applied = applyRouteSelection()
    if (!applied) return

    const restored = store.restoreFromLocalStorage()
    if (!restored && !store.currentTemplate) {
      const fallback = store.templatesForCurrentType[0]
      if (fallback) store.loadTemplate(fallback)
    }
    await ensureRemoteEditorRouteForAuthenticatedUser()
  } finally {
    isHydratingRoute = false
  }
}

// ── Export ────────────────────────────────────────────────────────────────
function handleExport(format: 'png' | 'jpeg', quality: number, scalePercent: number): void {
  const stage = canvasStageRef.value?.stage as Konva.Stage | null | undefined
  if (!stage || !store.currentTemplate) return

  store.clearSelection()
  store.exportFormat = format
  store.exportQuality = quality
  store.setExportScalePercent(scalePercent)
  const pixelRatio = store.exportScalePercent / 100

  requestAnimationFrame(() => {
    exportStage(stage, store.currentTemplate!.name, { format, quality, pixelRatio })
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
  fetchTemplates().then(async () => {
    await hydrateFromRoute()
    syncRouteFromStore()
    refreshRecentItems()
    startPolling()
  })
})

onUnmounted(() => {
  if (store.isDirty) store.saveToLocalStorage()
  window.removeEventListener('beforeunload', onBeforeUnload)
  window.removeEventListener('keydown', onKeyDown)
  clearTimeout(saveToastTimer)
  stopPolling()
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
  async () => {
    if (isApplyingRoute || isHydratingRoute) return
    if (routeEditorId() && !isShareSourceRoute()) return
    await hydrateFromRoute()
    syncRouteFromStore()
    startPolling()
  },
)

watch(
  () => route.params.editorId,
  async () => {
    if (isApplyingRoute || isHydratingRoute) return
    await hydrateFromRoute()
    syncRouteFromStore()
    startPolling()
  },
)

watch(
  () => auth.currentUser.value?.id ?? null,
  async () => {
    if (isHydratingRoute) return
    await ensureRemoteEditorRouteForAuthenticatedUser()
    startPolling()
  },
)

watch(syncMode, value => {
  localStorage.setItem(SYNC_MODE_STORAGE_KEY, value ? '1' : '0')
  if (value) {
    showStaleBanner.value = false
    refreshEditorFromRemote().catch(() => {
      // Ignore transient fetch failures when toggling sync mode.
    })
  }
})
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
