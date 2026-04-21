<template>
  <div class="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-zinc-950">
    <TopBar @export="showExportModal = true" />

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
import { ref, onMounted, onUnmounted } from 'vue'
import axios              from 'axios'
import TopBar             from '@/components/layout/TopBar.vue'
import LeftPanel          from '@/components/layout/LeftPanel.vue'
import RightPanel         from '@/components/layout/RightPanel.vue'
import CanvasStage        from '@/components/canvas/CanvasStage.vue'
import ExportModal        from '@/components/ui/ExportModal.vue'
import { useEditorStore } from '@/store/editor'
import { useExport }      from '@/composables/useExport'
import { useAutoSave }    from '@/composables/useAutoSave'
import { localTemplates } from '@/templates/index'
import type Konva         from 'konva'

const store           = useEditorStore()
const { exportStage } = useExport()
const canvasStageRef  = ref<InstanceType<typeof CanvasStage> | null>(null)
const showExportModal = ref(false)
const showSaveToast   = ref(false)
let   saveToastTimer  = 0

useAutoSave()

// ── Save toast ────────────────────────────────────────────────────────────
function triggerSaveToast(): void {
  showSaveToast.value = true
  clearTimeout(saveToastTimer)
  saveToastTimer = window.setTimeout(() => { showSaveToast.value = false }, 3000)
}

function manualSave(): void {
  if (!store.currentTemplate) return
  store.saveToLocalStorage()
  triggerSaveToast()
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

// ── Export ────────────────────────────────────────────────────────────────
function handleExport(format: 'png' | 'jpeg', quality: number): void {
  const stage = canvasStageRef.value?.stage as Konva.Stage | null | undefined
  if (!stage || !store.currentTemplate) return

  store.clearSelection()

  requestAnimationFrame(() => {
    exportStage(stage, store.currentTemplate!.name, { format, quality })
    showExportModal.value = false
  })
}

// ── Keyboard shortcuts ────────────────────────────────────────────────────
function onKeyDown(e: KeyboardEvent): void {
  const tag = (e.target as HTMLElement).tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return

  if (e.ctrlKey && e.key === 's') {
    e.preventDefault()
    manualSave()
  }
}

// ── Unsaved changes on browser close ─────────────────────────────────────
function onBeforeUnload(ev: BeforeUnloadEvent): void {
  if (store.isDirty) {
    ev.preventDefault()
    ev.returnValue = ''
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', onBeforeUnload)
  window.addEventListener('keydown', onKeyDown)
  fetchTemplates().then(() => store.restoreFromLocalStorage())
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', onBeforeUnload)
  window.removeEventListener('keydown', onKeyDown)
  clearTimeout(saveToastTimer)
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
