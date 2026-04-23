<template>
  <div
    class="relative flex items-center justify-center w-full h-full bg-zinc-200 dark:bg-zinc-950 overflow-hidden"
    :style="{ cursor: isPanning ? 'grabbing' : isSpaceHeld ? 'grab' : undefined }"
    @wheel="onWheelZoom"
    @mousedown="onContainerMouseDown"
    @mousemove="onContainerMouseMove"
    @mouseup="onContainerMouseUp"
  >
    <!-- Empty state -->
    <div
      v-if="!store.currentTemplate"
      class="flex flex-col items-center gap-4 text-gray-400 dark:text-zinc-600 select-none text-center px-6"
    >
      <svg class="w-20 h-20 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p class="text-lg font-medium">Select a template to get started</p>
      <p class="text-sm opacity-70">Choose a template from the left panel</p>
    </div>

    <!-- Canvas focus glow -->
    <div
      v-show="store.currentTemplate"
      class="absolute pointer-events-none rounded-2xl bg-indigo-500/10 blur-3xl"
      :style="glowStyle"
    />

    <!-- Scaled canvas wrapper + drag-drop target -->
    <div
      v-show="store.currentTemplate"
      class="relative shadow-2xl shadow-black/40 ring-1 ring-white/10 dark:ring-white/5 rounded-sm"
      :style="wrapperStyle"
      @dragenter="onDragEnter"
      @dragleave="onDragLeave"
      @dragover="onDragOver"
      @drop="onDrop"
    >
      <!-- Konva container -->
      <div
        ref="containerRef"
        class="absolute inset-0"
        :style="{ width: `${store.canvasSize.width}px`, height: `${store.canvasSize.height}px` }"
      />

      <!-- Inline text editing overlay -->
      <textarea
        v-if="editingId && editingEl"
        ref="textOverlayRef"
        class="absolute z-40 bg-transparent outline-none resize-none overflow-hidden p-0 m-0
               border-2 border-dashed border-indigo-400/70"
        :style="textOverlayStyle"
        :value="pendingEditText"
        @input="onTextOverlayInput"
        @blur="commitTextEdit"
        @keydown="onTextOverlayKeydown"
      />

      <!-- Drop overlay -->
      <Transition name="drop-overlay">
        <div
          v-if="isDraggingOver"
          class="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4
                 bg-brand-500/20 border-4 border-dashed border-brand-500
                 rounded-sm backdrop-blur-sm pointer-events-none"
        >
          <svg class="w-16 h-16 text-brand-400 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M8 6h.01M4 20h16a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p class="text-white font-bold text-xl drop-shadow-lg">Drop image here</p>
          <p class="text-brand-200 text-sm drop-shadow">Adds image to canvas</p>
        </div>
      </Transition>
    </div>

    <div
      v-if="elementContextMenu.visible"
      class="fixed z-50 min-w-40 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl p-1"
      :style="{ left: `${elementContextMenu.x}px`, top: `${elementContextMenu.y}px` }"
      @click.stop
    >
      <button
        type="button"
        class="w-full text-left px-2 py-1.5 rounded text-xs text-zinc-200 hover:bg-zinc-800"
        @click="bringSelectedElementToFront"
      >
        Bring to front
      </button>
      <button
        type="button"
        class="w-full text-left px-2 py-1.5 rounded text-xs text-zinc-200 hover:bg-zinc-800"
        @click="sendSelectedElementToBack"
      >
        Send to back
      </button>
      <button
        type="button"
        class="w-full text-left px-2 py-1.5 rounded text-xs text-zinc-200 hover:bg-zinc-800"
        @click="rotateSelectedElement180"
      >
        Rotate 180deg
      </button>
      <button
        v-if="selectedContextElement?.type === 'image'"
        type="button"
        class="w-full text-left px-2 py-1.5 rounded text-xs text-zinc-200 hover:bg-zinc-800"
        @click="flipSelectedElementHorizontal"
      >
        Flip horizontal
      </button>
      <button
        v-if="selectedContextElement?.type === 'image'"
        type="button"
        class="w-full text-left px-2 py-1.5 rounded text-xs text-zinc-200 hover:bg-zinc-800"
        @click="flipSelectedElementVertical"
      >
        Flip vertical
      </button>
      <button
        type="button"
        class="w-full text-left px-2 py-1.5 rounded text-xs text-red-300 hover:bg-red-900/30"
        @click="deleteSelectedElementFromContext"
      >
        Delete
      </button>
    </div>

    <!-- Zoom toolbar -->
    <div
      v-if="store.currentTemplate"
      class="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1
             bg-white/95 dark:bg-zinc-800/95 backdrop-blur rounded-xl px-2 py-1.5
             border border-gray-200 dark:border-zinc-700 shadow-lg select-none"
    >
      <button
        class="w-6 h-6 flex items-center justify-center rounded-lg text-base font-bold
               text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
        title="Zoom out (Ctrl+scroll)"
        @click="zoomOut"
      >−</button>
      <span class="text-xs font-mono text-gray-500 dark:text-zinc-400 w-12 text-center tabular-nums">
        {{ Math.round(scale * 100) }}%
      </span>
      <button
        class="w-6 h-6 flex items-center justify-center rounded-lg text-base font-bold
               text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
        title="Zoom in (Ctrl+scroll)"
        @click="zoomIn"
      >+</button>
      <div class="w-px h-4 bg-gray-200 dark:bg-zinc-700 mx-0.5" />
      <button
        class="px-2 h-6 flex items-center justify-center rounded-lg text-xs
               text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
        title="Fit to screen"
        @click="fitToScreen"
      >Fit</button>
    </div>

    <!-- Hints -->
    <div
      v-if="store.currentTemplate"
      class="absolute bottom-4 right-4 text-xs text-gray-400 dark:text-zinc-600 select-none space-y-0.5 text-right"
    >
      <p>Del — remove &nbsp; Ctrl+Z/Y — undo &nbsp; Ctrl+D — dupe</p>
      <p>Space+drag — pan &nbsp; Dblclick text — edit &nbsp; Paste/drop image</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useEditorStore } from '@/store/editor'
import { useCanvas }      from '@/composables/useCanvas'
import type { TextElement } from '@/types'

const store        = useEditorStore()
const containerRef = ref<HTMLDivElement | null>(null)

// ── Scale / Zoom ──────────────────────────────────────────────────────────
const PADDING = 80

function computeAutoScale(): number {
  const vw = window.innerWidth  - 560 - PADDING * 2
  const vh = window.innerHeight - 60  - PADDING * 2
  const sx = vw / store.canvasSize.width
  const sy = vh / store.canvasSize.height
  return Math.min(sx, sy, 1)
}

const baseScale      = ref(computeAutoScale())
const zoomMultiplier = ref(1.0)
const scale          = computed(() => baseScale.value * zoomMultiplier.value)

function zoomIn():      void { zoomMultiplier.value = Math.min(zoomMultiplier.value + 0.15, 3) }
function zoomOut():     void { zoomMultiplier.value = Math.max(zoomMultiplier.value - 0.15, 0.15) }
function fitToScreen(): void { zoomMultiplier.value = 1.0 }

function onWheelZoom(e: WheelEvent): void {
  if (!e.ctrlKey || !store.currentTemplate) return
  e.preventDefault()
  const delta = e.deltaY < 0 ? 0.1 : -0.1
  zoomMultiplier.value = Math.max(0.15, Math.min(3, zoomMultiplier.value + delta))
}

const canvasW = computed(() => store.canvasSize.width)
const canvasH = computed(() => store.canvasSize.height)
const bgColor = computed(() => '#ffffff')

const panOffset  = ref({ x: 0, y: 0 })
const elementContextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  elementId: null as string | null,
})
const selectedContextElement = computed(() =>
  elementContextMenu.value.elementId
    ? store.elements.find(el => el.id === elementContextMenu.value.elementId) ?? null
    : null,
)

const wrapperStyle = computed(() => ({
  width:           `${canvasW.value}px`,
  height:          `${canvasH.value}px`,
  transform:       `translate(${panOffset.value.x}px, ${panOffset.value.y}px) scale(${scale.value})`,
  transformOrigin: 'center center',
}))

const glowStyle = computed(() => ({
  width:     `${canvasW.value * scale.value * 1.2}px`,
  height:    `${canvasH.value * scale.value * 1.2}px`,
  opacity:   '0.6',
}))

function onResize(): void {
  baseScale.value = computeAutoScale()
}

// ── Canvas composable ─────────────────────────────────────────────────────
const { stage, layer, init, syncElements, syncBackground } = useCanvas(
  containerRef,
  computed(() => store.elements),
  computed(() => store.selectedId),
  canvasW,
  canvasH,
  bgColor,
  computed(() => store.readOnly),
  {
    onElementDragEnd(id, x, y) {
      store.commitElementUpdate(id, { x, y })
    },
    onElementTransformEnd(id, attrs) {
      store.commitElementUpdate(id, attrs)
    },
    onElementClick(id) {
      store.selectElement(id)
      closeElementContextMenu()
    },
    onElementContextMenu(id, x, y) {
      if (store.readOnly) return
      const contextElement = store.elements.find(el => el.id === id)
      const itemCount = contextElement?.type === 'image' ? 6 : 4
      const menuHeight = itemCount * 32 + 8
      store.selectElement(id)
      elementContextMenu.value = {
        visible: true,
        x: Math.min(x, window.innerWidth - 180),
        y: Math.min(y, window.innerHeight - menuHeight),
        elementId: id,
      }
    },
    onStageClick() {
      store.clearSelection()
      closeElementContextMenu()
    },
    onTextDblClick(id) {
      startTextEdit(id)
    },
  },
)

defineExpose({ stage })

// ── Lifecycle ─────────────────────────────────────────────────────────────
onMounted(() => {
  window.addEventListener('resize', onResize)
  window.addEventListener('click', closeElementContextMenu)
  window.addEventListener('keydown', onGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('click', closeElementContextMenu)
  window.removeEventListener('keydown', onGlobalKeydown)
  stage.value?.destroy()
})

watch(
  [() => store.currentTemplate?.id, () => containerRef.value],
  () => {
    if (!store.currentTemplate || !containerRef.value) return
    editingId.value      = null
    zoomMultiplier.value = 1.0
    panOffset.value      = { x: 0, y: 0 }
    stage.value?.destroy()
    baseScale.value = computeAutoScale()
    setTimeout(() => {
      if (!containerRef.value) return
      init()
      syncBackground()
      syncElements()
    }, 0)
  },
  { immediate: true },
)

// ── Inline text editing ───────────────────────────────────────────────────
const editingId      = ref<string | null>(null)
const textOverlayRef = ref<HTMLTextAreaElement | null>(null)
let   pendingEditText = ''

const editingEl = computed(() => {
  if (!editingId.value) return null
  const el = store.elements.find(e => e.id === editingId.value)
  return el?.type === 'text' ? (el as TextElement) : null
})

const textOverlayStyle = computed(() => {
  if (!editingEl.value) return {}
  const el = editingEl.value
  return {
    left:       `${el.x}px`,
    top:        `${el.y}px`,
    width:      `${el.width ?? 400}px`,
    minHeight:  `${el.fontSize * 1.5}px`,
    fontFamily: `'${el.fontFamily}', sans-serif`,
    fontSize:   `${el.fontSize}px`,
    fontStyle:  el.fontStyle.includes('italic') ? 'italic' : 'normal',
    fontWeight: el.fontStyle.includes('bold') ? 'bold' : 'normal',
    textDecoration: el.textDecoration === 'underline' ? 'underline' : 'none',
    color:      el.color,
    textAlign:  el.align,
    lineHeight: '1.2',
    caretColor: el.color,
  }
})

function startTextEdit(id: string): void {
  if (store.readOnly) return
  const el = store.elements.find(e => e.id === id)
  if (!el || el.type !== 'text') return

  pendingEditText = (el as TextElement).text
  editingId.value = id

  // Hide the Konva node directly so the textarea appears in its place
  const node = layer.value?.findOne(`#${id}`)
  if (node) {
    node.visible(false)
    layer.value?.batchDraw()
  }

  nextTick(() => {
    if (textOverlayRef.value) {
      textOverlayRef.value.focus()
      textOverlayRef.value.select()
      // Auto-resize height
      textOverlayRef.value.style.height = 'auto'
      textOverlayRef.value.style.height = textOverlayRef.value.scrollHeight + 'px'
    }
  })
}

function commitTextEdit(): void {
  if (!editingId.value) return
  const id = editingId.value

  // Restore Konva node visibility before clearing editingId
  const node = layer.value?.findOne(`#${id}`)
  if (node) {
    node.visible(true)
    layer.value?.batchDraw()
  }

  editingId.value = null

  const current = store.elements.find(e => e.id === id)
  if (current && (current as TextElement).text !== pendingEditText) {
    store.commitElementUpdate(id, { text: pendingEditText })
  }
}

function onTextOverlayInput(e: Event): void {
  const ta = e.target as HTMLTextAreaElement
  pendingEditText = ta.value
  // Auto-resize height
  ta.style.height = 'auto'
  ta.style.height = ta.scrollHeight + 'px'
}

function onTextOverlayKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    e.preventDefault()
    commitTextEdit()
  }
}

// ── Space-to-pan ──────────────────────────────────────────────────────────
const isSpaceHeld = ref(false)
const isPanning   = ref(false)
let   panStartX   = 0
let   panStartY   = 0
let   panStartOffsetX = 0
let   panStartOffsetY = 0

function onSpaceDown(e: KeyboardEvent): void {
  if (e.code === 'Space' && !editingId.value && !isSpaceHeld.value) {
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return
    e.preventDefault()
    isSpaceHeld.value = true
  }
}

function onSpaceUp(e: KeyboardEvent): void {
  if (e.code === 'Space') {
    isSpaceHeld.value = false
    isPanning.value   = false
  }
}

function onContainerMouseDown(e: MouseEvent): void {
  if (!isSpaceHeld.value || !store.currentTemplate) return
  isPanning.value   = true
  panStartX         = e.clientX
  panStartY         = e.clientY
  panStartOffsetX   = panOffset.value.x
  panStartOffsetY   = panOffset.value.y
  e.preventDefault()
}

function onContainerMouseMove(e: MouseEvent): void {
  if (!isPanning.value) return
  panOffset.value = {
    x: panStartOffsetX + (e.clientX - panStartX),
    y: panStartOffsetY + (e.clientY - panStartY),
  }
}

function onContainerMouseUp(): void {
  isPanning.value = false
}

function closeElementContextMenu(): void {
  elementContextMenu.value.visible   = false
  elementContextMenu.value.elementId = null
}

function bringSelectedElementToFront(): void {
  const id = elementContextMenu.value.elementId
  if (!id) return
  store.bringToFront(id)
  closeElementContextMenu()
}

function sendSelectedElementToBack(): void {
  const id = elementContextMenu.value.elementId
  if (!id) return
  store.sendToBack(id)
  closeElementContextMenu()
}

function rotateSelectedElement180(): void {
  const el = selectedContextElement.value
  if (!el) return
  const nextRotation = ((el.rotation ?? 0) + 180) % 360
  store.commitElementUpdate(el.id, { rotation: nextRotation })
  closeElementContextMenu()
}

function flipSelectedElementHorizontal(): void {
  const el = selectedContextElement.value
  if (!el || el.type !== 'image') return
  store.commitElementUpdate(el.id, { flipX: !el.flipX })
  closeElementContextMenu()
}

function flipSelectedElementVertical(): void {
  const el = selectedContextElement.value
  if (!el || el.type !== 'image') return
  store.commitElementUpdate(el.id, { flipY: !el.flipY })
  closeElementContextMenu()
}

function deleteSelectedElementFromContext(): void {
  const id = elementContextMenu.value.elementId
  if (!id) return
  store.removeElement(id)
  closeElementContextMenu()
}

function onGlobalKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') closeElementContextMenu()
}

// ── Keyboard shortcuts ────────────────────────────────────────────────────
function onKeyDown(e: KeyboardEvent): void {
  if (store.readOnly) return
  // Don't handle shortcuts while editing inline text or panning
  if (editingId.value || isPanning.value) return

  const tag = (e.target as HTMLElement).tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return

  // Delete selected element
  if ((e.key === 'Delete' || e.key === 'Backspace') && store.selectedId) {
    store.removeElement(store.selectedId)
    return
  }

  // Undo / Redo
  if (e.ctrlKey && e.key === 'z') { e.preventDefault(); store.undo(); return }
  if (e.ctrlKey && (e.key === 'y' || e.key === 'Y')) { e.preventDefault(); store.redo(); return }

  // Duplicate
  if (e.ctrlKey && (e.key === 'd' || e.key === 'D')) {
    e.preventDefault()
    if (store.selectedId) store.duplicateElement(store.selectedId)
    return
  }

  // Arrow key nudge
  if (store.selectedId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault()
    const step = e.shiftKey ? 10 : 1
    const el   = store.selectedElement
    if (!el) return
    const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
    const dy = e.key === 'ArrowUp'   ? -step : e.key === 'ArrowDown'  ? step : 0
    store.commitElementUpdate(store.selectedId, { x: el.x + dx, y: el.y + dy })
  }
}

// ── Paste image ───────────────────────────────────────────────────────────
function onPaste(e: ClipboardEvent): void {
  if (store.readOnly) return
  if (editingId.value) return // let the textarea handle paste
  const items   = Array.from(e.clipboardData?.items ?? [])
  const imgItem = items.find(item => item.type.startsWith('image/'))
  if (!imgItem) return
  const file = imgItem.getAsFile()
  if (!file) return
  readFileAsDataUrl(file).then(src => store.addImageElement(src))
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keydown', onSpaceDown)
  window.addEventListener('keyup', onSpaceUp)
  window.addEventListener('paste', onPaste)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keydown', onSpaceDown)
  window.removeEventListener('keyup', onSpaceUp)
  window.removeEventListener('paste', onPaste)
})

// ── Drag-and-drop ─────────────────────────────────────────────────────────
const isDraggingOver = ref(false)
const dragCounter    = ref(0)

function hasImageFile(e: DragEvent): boolean {
  return Array.from(e.dataTransfer?.items ?? []).some(i => i.type.startsWith('image/'))
}

function onDragEnter(e: DragEvent): void {
  e.preventDefault()
  if (hasImageFile(e)) {
    dragCounter.value++
    isDraggingOver.value = true
  }
}

function onDragLeave(): void {
  dragCounter.value--
  if (dragCounter.value <= 0) {
    dragCounter.value    = 0
    isDraggingOver.value = false
  }
}

function onDragOver(e: DragEvent): void { e.preventDefault() }

function onDrop(e: DragEvent): void {
  if (store.readOnly) return
  e.preventDefault()
  isDraggingOver.value = false
  dragCounter.value    = 0
  const file = Array.from(e.dataTransfer?.files ?? []).find(f => f.type.startsWith('image/'))
  if (!file) return
  readFileAsDataUrl(file).then(src => store.addImageElement(src))
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader   = new FileReader()
    reader.onload  = ev => resolve(ev.target?.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
</script>

<style scoped>
.drop-overlay-enter-active,
.drop-overlay-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.drop-overlay-enter-from,
.drop-overlay-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>
