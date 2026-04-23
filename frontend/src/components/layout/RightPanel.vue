<template>
  <aside class="panel relative shrink-0 border-l border-gray-200 dark:border-zinc-800 border-r-0">

    <!-- Default color for newly added text/icons -->
    <div
      v-if="store.currentTemplate"
      class="px-3 pt-2 pb-1.5 shrink-0"
    >
      <span class="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
        Text/Icon Defaults
      </span>
      <div class="mt-1.5 flex items-center gap-2">
        <input
          type="color"
          class="w-8 h-8 rounded-lg cursor-pointer border border-zinc-700 bg-transparent p-0.5"
          :value="store.textIconDefaultColor"
          @change="store.setTextIconDefaultColor(($event.target as HTMLInputElement).value)"
        />
        <input
          type="text"
          class="input-field text-xs font-mono h-8"
          :value="store.textIconDefaultColor"
          maxlength="7"
          @change="store.setTextIconDefaultColor(($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <div
      v-if="store.currentTemplate"
      class="px-3 pb-2 shrink-0"
    >
      <span class="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
        Collaboration
      </span>
      <label class="mt-1.5 inline-flex items-center gap-2 text-xs text-zinc-400">
        <input
          :checked="props.syncMode"
          type="checkbox"
          class="h-4 w-4 accent-brand-500"
          @change="emit('update:sync-mode', ($event.target as HTMLInputElement).checked)"
        />
        Sync mode
      </label>
    </div>

    <div
      v-if="store.readOnly && store.currentTemplate"
      class="absolute left-0 right-0 bottom-0 top-[108px] z-40 bg-zinc-900/60 backdrop-blur-[1px] flex items-start justify-center pt-10 pointer-events-auto"
    >
      <div class="mx-3 w-full rounded-xl border border-zinc-700 bg-zinc-900/90 p-4 text-center">
        <div class="mx-auto w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c1.657 0 3 1.343 3 3v3H9v-3c0-1.657 1.343-3 3-3zm-5 3V9a5 5 0 0110 0v5" />
          </svg>
        </div>
        <p class="mt-3 text-sm font-semibold text-zinc-100">View-only mode</p>
        <p class="mt-1 text-xs text-zinc-400">
          Editing is disabled for this shared editor. You can still use Collaboration controls.
        </p>
      </div>
    </div>

    <!-- Panel header with simple/advanced toggle -->
    <div
      v-if="store.selectedElement"
      class="flex items-center justify-between px-3 pt-2 pb-1 shrink-0"
    >
      <span class="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
        Properties
      </span>
      <div class="inline-flex p-1 rounded-xl bg-zinc-900/60 border border-zinc-700">
        <button
          type="button"
          class="px-2.5 py-0.5 rounded-lg text-[10px] font-semibold tracking-wide transition-colors"
          :class="simpleMode
            ? 'bg-brand-500 text-white shadow-sm'
            : 'text-zinc-400 hover:text-zinc-200'"
          title="Show simple controls"
          @click="simpleMode = true"
        >
          Simple
        </button>
        <button
          type="button"
          class="px-2.5 py-0.5 rounded-lg text-[10px] font-semibold tracking-wide transition-colors"
          :class="!simpleMode
            ? 'bg-brand-500 text-white shadow-sm'
            : 'text-zinc-400 hover:text-zinc-200'"
          title="Show advanced controls"
          @click="simpleMode = false"
        >
          Advanced
        </button>
      </div>
    </div>

    <!-- Layers -->
    <div class="px-3 pb-2 shrink-0">
      <p class="section-label !px-0">Layers</p>
      <div class="space-y-1 max-h-56 overflow-y-auto pr-1">
        <button
          v-for="(layer, index) in layersTopToBottom"
          :key="layer.id"
          type="button"
          draggable="true"
          class="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-xs border transition-colors"
          :class="[
            layer.id === store.selectedId
              ? 'border-brand-500/60 bg-brand-500/10 text-brand-200'
              : 'border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-900/40',
            dragOverLayerId === layer.id ? 'ring-1 ring-brand-400/70' : '',
          ]"
          @click="store.selectElement(layer.id)"
          @dragstart="onLayerDragStart(layer.id)"
          @dragenter.prevent="onLayerDragEnter(layer.id)"
          @dragover.prevent
          @drop.prevent="onLayerDrop(layer.id)"
          @dragend="onLayerDragEnd"
          @contextmenu.prevent="openLayerContextMenu($event, layer.id)"
        >
          <span class="truncate text-left">{{ index + 1 }}. {{ layer.label }}</span>
          <span class="text-[10px] uppercase tracking-wide opacity-70">{{ layer.type }}</span>
        </button>
        <p v-if="layersTopToBottom.length === 0" class="text-xs text-zinc-500 px-1 py-1">
          No layers
        </p>
      </div>
    </div>

    <div class="h-px bg-gray-100 dark:bg-zinc-800 mx-4" />

    <div
      v-if="contextMenu.visible"
      class="fixed z-50 min-w-40 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl p-1"
      :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
      @click.stop
    >
      <button
        type="button"
        class="w-full text-left px-2 py-1.5 rounded text-xs text-zinc-200 hover:bg-zinc-800"
        @click="onBringToFront"
      >
        Bring to front
      </button>
      <button
        type="button"
        class="w-full text-left px-2 py-1.5 rounded text-xs text-zinc-200 hover:bg-zinc-800"
        @click="onSendToBack"
      >
        Send to back
      </button>
      <button
        type="button"
        class="w-full text-left px-2 py-1.5 rounded text-xs text-zinc-200 hover:bg-zinc-800"
        @click="onRotate180"
      >
        Rotate 180deg
      </button>
      <button
        v-if="contextMenuLayer?.type === 'image'"
        type="button"
        class="w-full text-left px-2 py-1.5 rounded text-xs text-zinc-200 hover:bg-zinc-800"
        @click="onFlipHorizontal"
      >
        Flip horizontal
      </button>
      <button
        v-if="contextMenuLayer?.type === 'image'"
        type="button"
        class="w-full text-left px-2 py-1.5 rounded text-xs text-zinc-200 hover:bg-zinc-800"
        @click="onFlipVertical"
      >
        Flip vertical
      </button>
      <button
        type="button"
        class="w-full text-left px-2 py-1.5 rounded text-xs text-red-300 hover:bg-red-900/30"
        @click="onDeleteLayer"
      >
        Delete
      </button>
    </div>

    <!-- No selection -->
    <div
      v-if="!store.selectedElement"
      class="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-zinc-600 text-sm text-center px-6 gap-3"
    >
      <svg class="w-10 h-10 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
      </svg>
      <p>Click an element on the canvas to edit it</p>
    </div>

    <!-- ── Text element controls ────────────────────────────────────────── -->
    <template v-else-if="store.selectedElement.type === 'text'">
      <div>
        <p class="section-label">Text</p>
        <div class="px-3 pb-3 space-y-2">
          <textarea
            class="input-field resize-none h-24 text-sm"
            :value="textEl!.text"
            placeholder="Enter text..."
            @input="patch({ text: ($event.target as HTMLTextAreaElement).value })"
            @change="commit({ text: ($event.target as HTMLTextAreaElement).value })"
          />
        </div>
      </div>

      <div class="h-px bg-gray-100 dark:bg-zinc-800 mx-4" />

      <!-- Font -->
      <div>
        <p class="section-label">Font</p>
        <div class="px-3 pb-3 space-y-2">
          <FontPicker
            :model-value="textEl!.fontFamily"
            @update:model-value="commit({ fontFamily: $event })"
          />

          <div class="flex gap-2">
            <div class="flex-1">
              <label class="block text-xs text-zinc-500 mb-1">Size</label>
              <select
                class="input-field text-sm"
                :value="textEl!.fontSize"
                @change="commit({ fontSize: Number(($event.target as HTMLSelectElement).value) })"
              >
                <option v-for="s in FONT_SIZES" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>

            <div class="flex-1">
              <label class="block text-xs text-zinc-500 mb-1">Align</label>
              <div class="flex gap-1">
                <button
                  v-for="a in ['left', 'center', 'right'] as const"
                  :key="a"
                  class="flex-1 py-1.5 rounded-lg text-xs transition-colors"
                  :class="textEl!.align === a
                    ? 'bg-brand-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'"
                  @click="commit({ align: a })"
                >
                  {{ a[0].toUpperCase() }}
                </button>
              </div>
            </div>
          </div>

          <div class="flex gap-1.5">
            <button
              class="flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors"
              :class="textEl!.fontStyle.includes('bold')
                ? 'bg-brand-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'"
              @click="toggleBold"
            >B</button>
            <button
              class="flex-1 py-1.5 rounded-lg text-xs italic transition-colors"
              :class="textEl!.fontStyle.includes('italic')
                ? 'bg-brand-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'"
              @click="toggleItalic"
            >I</button>
            <button
              class="flex-1 py-1.5 rounded-lg text-xs underline transition-colors"
              :class="(textEl!.textDecoration ?? 'none') === 'underline'
                ? 'bg-brand-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'"
              @click="toggleUnderline"
            >U</button>
          </div>
        </div>
      </div>

      <div class="h-px bg-gray-100 dark:bg-zinc-800 mx-4" />

      <!-- Colour — fill always visible; stroke only in advanced -->
      <div>
        <p class="section-label">Color</p>
        <div class="px-3 pb-3 space-y-2">
          <div class="flex items-center gap-2">
            <label class="text-xs text-zinc-400 w-14 shrink-0">Fill</label>
            <div class="relative flex-1 flex items-center gap-2">
              <input
                type="color"
                class="w-8 h-8 rounded-lg cursor-pointer border border-zinc-700 bg-transparent p-0.5"
                :value="textEl!.color"
                @input="patch({ color: ($event.target as HTMLInputElement).value })"
                @change="commit({ color: ($event.target as HTMLInputElement).value })"
              />
              <input
                type="text"
                class="input-field text-xs font-mono"
                :value="textEl!.color"
                maxlength="7"
                @change="commit({ color: ($event.target as HTMLInputElement).value })"
              />
            </div>
          </div>

          <!-- Stroke — advanced only -->
          <div v-if="!simpleMode" class="flex items-center gap-2">
            <label class="text-xs text-zinc-400 w-14 shrink-0">Stroke</label>
            <div class="flex-1 flex items-center gap-2">
              <input
                type="color"
                class="w-8 h-8 rounded-lg cursor-pointer border border-zinc-700 bg-transparent p-0.5"
                :value="textEl!.stroke || '#000000'"
                @input="patch({ stroke: ($event.target as HTMLInputElement).value })"
                @change="commit({ stroke: ($event.target as HTMLInputElement).value })"
              />
              <input
                type="text"
                class="input-field text-xs font-mono"
                :value="textEl!.stroke || '#000000'"
                maxlength="7"
                @change="setTextStrokeColor(($event.target as HTMLInputElement).value)"
              />
              <input
                type="number"
                class="input-field text-xs"
                min="0" max="20" step="1"
                :value="textEl!.strokeWidth"
                placeholder="Width"
                @change="commit({ strokeWidth: Number(($event.target as HTMLInputElement).value) })"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Position — advanced only -->
      <template v-if="!simpleMode">
        <div class="h-px bg-gray-100 dark:bg-zinc-800 mx-4" />
        <div>
          <p class="section-label">Position</p>
          <div class="px-3 pb-3 grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs text-zinc-500 mb-1">X</label>
              <input
                type="number"
                class="input-field text-xs"
                :value="Math.round(store.selectedElement.x)"
                @change="commit({ x: Number(($event.target as HTMLInputElement).value) })"
              />
            </div>
            <div>
              <label class="block text-xs text-zinc-500 mb-1">Y</label>
              <input
                type="number"
                class="input-field text-xs"
                :value="Math.round(store.selectedElement.y)"
                @change="commit({ y: Number(($event.target as HTMLInputElement).value) })"
              />
            </div>
          </div>
        </div>
      </template>

      <!-- Opacity — advanced only -->
      <template v-if="!simpleMode">
        <div class="h-px bg-gray-100 dark:bg-zinc-800 mx-4" />
        <div>
          <p class="section-label">Opacity</p>
          <div class="px-3 pb-4 flex items-center gap-3">
            <input
              type="range"
              min="0" max="1" step="0.01"
              class="flex-1 accent-brand-500"
              :value="store.selectedElement.opacity"
              @input="patch({ opacity: Number(($event.target as HTMLInputElement).value) })"
              @change="commit({ opacity: Number(($event.target as HTMLInputElement).value) })"
            />
            <span class="text-xs text-zinc-400 w-8 text-right">
              {{ Math.round(store.selectedElement.opacity * 100) }}%
            </span>
          </div>
        </div>
      </template>

      <!-- Delete -->
      <div class="px-3 pb-4 mt-auto">
        <button
          class="w-full py-2 rounded-xl text-sm text-red-400 border border-red-900/40 hover:bg-red-900/20 transition-colors"
          @click="store.removeElement(store.selectedId!)"
        >
          Delete Element
        </button>
      </div>
    </template>

    <!-- ── Image element controls ────────────────────────────────────────── -->
    <template v-else-if="store.selectedElement.type === 'image'">
      <div>
        <p class="section-label">Image</p>

        <!-- Flip buttons -->
        <div class="px-3 pb-3 flex gap-2">
          <button
            class="flex-1 py-2 rounded-xl text-xs font-medium border transition-colors"
            :class="imgEl!.flipX
              ? 'bg-brand-500 text-white border-brand-500'
              : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'"
            @click="toggleFlipX"
          >
            ↔ Flip H
          </button>
          <button
            class="flex-1 py-2 rounded-xl text-xs font-medium border transition-colors"
            :class="imgEl!.flipY
              ? 'bg-brand-500 text-white border-brand-500'
              : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'"
            @click="toggleFlipY"
          >
            ↕ Flip V
          </button>
        </div>
      </div>

      <div class="h-px bg-gray-100 dark:bg-zinc-800 mx-4" />

      <!-- Rotation -->
      <div>
        <p class="section-label">Rotation</p>
        <div class="px-3 pb-3 space-y-2">
          <div class="flex items-center gap-2">
            <input
              type="range"
              min="0" max="360" step="1"
              class="flex-1 accent-brand-500"
              :value="imgEl!.rotation ?? 0"
              @input="patch({ rotation: Number(($event.target as HTMLInputElement).value) })"
              @change="commit({ rotation: Number(($event.target as HTMLInputElement).value) })"
            />
            <input
              type="number"
              class="input-field text-xs w-16 shrink-0"
              min="0" max="360" step="1"
              :value="Math.round(imgEl!.rotation ?? 0)"
              @change="commit({ rotation: Number(($event.target as HTMLInputElement).value) })"
            />
          </div>
          <button
            class="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            @click="commit({ rotation: 0 })"
          >
            Reset rotation
          </button>
        </div>
      </div>

      <!-- Size — advanced only -->
      <template v-if="!simpleMode">
        <div class="h-px bg-gray-100 dark:bg-zinc-800 mx-4" />
        <div>
          <p class="section-label">Size</p>
          <div class="px-3 pb-3 grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs text-zinc-500 mb-1">W</label>
              <input
                type="number"
                class="input-field text-xs"
                min="1"
                :value="Math.round(imgEl!.width)"
                @change="commit({ width: Number(($event.target as HTMLInputElement).value) })"
              />
            </div>
            <div>
              <label class="block text-xs text-zinc-500 mb-1">H</label>
              <input
                type="number"
                class="input-field text-xs"
                min="1"
                :value="Math.round(imgEl!.height)"
                @change="commit({ height: Number(($event.target as HTMLInputElement).value) })"
              />
            </div>
          </div>
        </div>
      </template>

      <!-- Position — advanced only -->
      <template v-if="!simpleMode">
        <div class="h-px bg-gray-100 dark:bg-zinc-800 mx-4" />
        <div>
          <p class="section-label">Position</p>
          <div class="px-3 pb-3 grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs text-zinc-500 mb-1">X</label>
              <input
                type="number"
                class="input-field text-xs"
                :value="Math.round(store.selectedElement.x)"
                @change="commit({ x: Number(($event.target as HTMLInputElement).value) })"
              />
            </div>
            <div>
              <label class="block text-xs text-zinc-500 mb-1">Y</label>
              <input
                type="number"
                class="input-field text-xs"
                :value="Math.round(store.selectedElement.y)"
                @change="commit({ y: Number(($event.target as HTMLInputElement).value) })"
              />
            </div>
          </div>
        </div>
      </template>

      <!-- Opacity — advanced only -->
      <template v-if="!simpleMode">
        <div class="h-px bg-gray-100 dark:bg-zinc-800 mx-4" />
        <div>
          <p class="section-label">Opacity</p>
          <div class="px-3 pb-4 flex items-center gap-3">
            <input
              type="range"
              min="0" max="1" step="0.01"
              class="flex-1 accent-brand-500"
              :value="store.selectedElement.opacity"
              @input="patch({ opacity: Number(($event.target as HTMLInputElement).value) })"
              @change="commit({ opacity: Number(($event.target as HTMLInputElement).value) })"
            />
            <span class="text-xs text-zinc-400 w-8 text-right">
              {{ Math.round(store.selectedElement.opacity * 100) }}%
            </span>
          </div>
        </div>
      </template>

      <!-- Delete -->
      <div class="px-3 pb-4 mt-auto">
        <button
          class="w-full py-2 rounded-xl text-sm text-red-400 border border-red-900/40 hover:bg-red-900/20 transition-colors"
          @click="store.removeElement(store.selectedId!)"
        >
          Delete Image
        </button>
      </div>
    </template>

    <!-- ── Icon element controls ─────────────────────────────────────────── -->
    <template v-else-if="store.selectedElement.type === 'icon'">
      <div>
        <p class="section-label">Icon</p>
        <div class="px-3 pb-3 space-y-2">
          <div class="flex items-center gap-2">
            <label class="text-xs text-zinc-400 w-16 shrink-0">Color</label>
            <div class="flex-1 flex items-center gap-2">
              <input
                type="color"
                class="w-8 h-8 rounded-lg cursor-pointer border border-zinc-700 bg-transparent p-0.5"
                :value="paintColor(normalizePaint(iconEl!.fill), 0)"
                @change="setIconColor(($event.target as HTMLInputElement).value)"
              />
              <input
                type="text"
                class="input-field text-xs font-mono"
                :value="paintColor(normalizePaint(iconEl!.fill), 0)"
                maxlength="7"
                @change="setIconColor(($event.target as HTMLInputElement).value)"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="px-3 pb-4 mt-auto">
        <button
          class="w-full py-2 rounded-xl text-sm text-red-400 border border-red-900/40 hover:bg-red-900/20 transition-colors"
          @click="store.removeElement(store.selectedId!)"
        >
          Delete Icon
        </button>
      </div>
    </template>

    <!-- ── Rect element controls ─────────────────────────────────────────── -->
    <template v-else-if="store.selectedElement.type === 'rect'">
      <div>
        <p class="section-label">Rectangle</p>
        <div class="px-3 pb-3 space-y-2">
          <div class="flex items-center gap-2">
            <label class="text-xs text-zinc-400 w-16 shrink-0">Radius</label>
            <input
              type="range"
              class="flex-1 accent-brand-500"
              min="0"
              :max="Math.round(Math.min(rectEl!.width, rectEl!.height) / 2)"
              :value="rectEl!.cornerRadius"
              @input="patch({ cornerRadius: Number(($event.target as HTMLInputElement).value) })"
              @change="commit({ cornerRadius: Number(($event.target as HTMLInputElement).value) })"
            />
            <span class="text-xs text-zinc-400 w-10 text-right">{{ Math.round(rectEl!.cornerRadius) }}</span>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-xs text-zinc-400 w-16 shrink-0">Inside</label>
            <input
              type="checkbox"
              class="h-4 w-4 accent-brand-500"
              :checked="rectEl!.fillEnabled ?? true"
              @change="commit({ fillEnabled: ($event.target as HTMLInputElement).checked })"
            />
            <span class="text-xs text-zinc-400">{{ (rectEl!.fillEnabled ?? true) ? 'Filled' : 'Empty' }}</span>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-xs text-zinc-400 w-16 shrink-0">Fill Type</label>
            <select
              class="input-field text-xs"
              :value="normalizePaint(rectEl!.fill).kind"
              @change="setRectFillType(($event.target as HTMLSelectElement).value as 'solid' | 'linear')"
            >
              <option value="solid">Solid</option>
              <option value="linear">Linear</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-xs text-zinc-400 w-16 shrink-0">Fill A</label>
            <div class="flex-1 flex items-center gap-2">
              <input
                type="color"
                class="w-8 h-8 rounded-lg cursor-pointer border border-zinc-700 bg-transparent p-0.5"
                :value="paintColor(normalizePaint(rectEl!.fill), 0)"
                @change="setRectFillColor(0, ($event.target as HTMLInputElement).value)"
              />
              <input
                type="text"
                class="input-field text-xs font-mono"
                :value="paintColor(normalizePaint(rectEl!.fill), 0)"
                maxlength="7"
                @change="setRectFillColor(0, ($event.target as HTMLInputElement).value)"
              />
            </div>
          </div>
          <div v-if="normalizePaint(rectEl!.fill).kind !== 'solid'" class="flex items-center gap-2">
            <label class="text-xs text-zinc-400 w-16 shrink-0">Fill B</label>
            <div class="flex-1 flex items-center gap-2">
              <input
                type="color"
                class="w-8 h-8 rounded-lg cursor-pointer border border-zinc-700 bg-transparent p-0.5"
                :value="paintColor(normalizePaint(rectEl!.fill), 1)"
                @change="setRectFillColor(1, ($event.target as HTMLInputElement).value)"
              />
              <input
                type="text"
                class="input-field text-xs font-mono"
                :value="paintColor(normalizePaint(rectEl!.fill), 1)"
                maxlength="7"
                @change="setRectFillColor(1, ($event.target as HTMLInputElement).value)"
              />
            </div>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-xs text-zinc-400 w-16 shrink-0">Stroke W</label>
            <input
              type="range"
              min="0"
              max="40"
              class="flex-1 accent-brand-500"
              :value="rectEl!.strokeWidth ?? 0"
              @input="patch({ strokeWidth: Number(($event.target as HTMLInputElement).value) })"
              @change="commit({ strokeWidth: Number(($event.target as HTMLInputElement).value) })"
            />
            <span class="text-xs text-zinc-400 w-10 text-right">{{ Math.round(rectEl!.strokeWidth ?? 0) }}</span>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-xs text-zinc-400 w-16 shrink-0">Stroke T</label>
            <select
              class="input-field text-xs"
              :value="normalizePaint(rectEl!.stroke).kind"
              @change="setRectStrokeType(($event.target as HTMLSelectElement).value as 'solid' | 'linear')"
            >
              <option value="solid">Solid</option>
              <option value="linear">Linear</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-xs text-zinc-400 w-16 shrink-0">Stroke A</label>
            <div class="flex-1 flex items-center gap-2">
              <input
                type="color"
                class="w-8 h-8 rounded-lg cursor-pointer border border-zinc-700 bg-transparent p-0.5"
                :value="paintColor(normalizePaint(rectEl!.stroke), 0)"
                @change="setRectStrokeColor(0, ($event.target as HTMLInputElement).value)"
              />
              <input
                type="text"
                class="input-field text-xs font-mono"
                :value="paintColor(normalizePaint(rectEl!.stroke), 0)"
                maxlength="7"
                @change="setRectStrokeColor(0, ($event.target as HTMLInputElement).value)"
              />
            </div>
          </div>
          <div v-if="normalizePaint(rectEl!.stroke).kind !== 'solid'" class="flex items-center gap-2">
            <label class="text-xs text-zinc-400 w-16 shrink-0">Stroke B</label>
            <div class="flex-1 flex items-center gap-2">
              <input
                type="color"
                class="w-8 h-8 rounded-lg cursor-pointer border border-zinc-700 bg-transparent p-0.5"
                :value="paintColor(normalizePaint(rectEl!.stroke), 1)"
                @change="setRectStrokeColor(1, ($event.target as HTMLInputElement).value)"
              />
              <input
                type="text"
                class="input-field text-xs font-mono"
                :value="paintColor(normalizePaint(rectEl!.stroke), 1)"
                maxlength="7"
                @change="setRectStrokeColor(1, ($event.target as HTMLInputElement).value)"
              />
            </div>
          </div>
          <div v-if="!simpleMode" class="flex items-center gap-2">
            <label class="text-xs text-zinc-400 w-16 shrink-0">Opacity</label>
            <input
              type="range"
              min="0" max="1" step="0.01"
              class="flex-1 accent-brand-500"
              :value="rectEl!.opacity"
              @input="patch({ opacity: Number(($event.target as HTMLInputElement).value) })"
              @change="commit({ opacity: Number(($event.target as HTMLInputElement).value) })"
            />
          </div>
        </div>
      </div>

      <div class="px-3 pb-4 mt-auto">
        <button
          class="w-full py-2 rounded-xl text-sm text-red-400 border border-red-900/40 hover:bg-red-900/20 transition-colors"
          @click="store.removeElement(store.selectedId!)"
        >
          Delete Element
        </button>
      </div>
    </template>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useEditorStore }   from '@/store/editor'
import FontPicker           from '@/components/ui/FontPicker.vue'
import type { TextElement, RectElement, ImageElement, IconElement, TemplateElement, PaintStyle } from '@/types'
import { FONT_SIZES } from '@/types'

const store = useEditorStore()
const props = withDefaults(defineProps<{
  syncMode?: boolean
}>(), {
  syncMode: false,
})
const emit = defineEmits<{
  (e: 'update:sync-mode', value: boolean): void
}>()

// ── Simple / Advanced mode ─────────────────────────────────────────────────
const simpleMode = ref<boolean>(localStorage.getItem('right-panel-simple') !== 'false')
watch(simpleMode, v => localStorage.setItem('right-panel-simple', String(v)))

// ── Element computed refs ──────────────────────────────────────────────────
const textEl = computed(() =>
  store.selectedElement?.type === 'text'
    ? (store.selectedElement as TextElement)
    : null,
)

const rectEl = computed(() =>
  store.selectedElement?.type === 'rect'
    ? (store.selectedElement as RectElement)
    : null,
)

const imgEl = computed(() =>
  store.selectedElement?.type === 'image'
    ? (store.selectedElement as ImageElement)
    : null,
)
const iconEl = computed(() =>
  store.selectedElement?.type === 'icon'
    ? (store.selectedElement as IconElement)
    : null,
)

const layersTopToBottom = computed(() =>
  [...store.elements]
    .map(el => ({
      id: el.id,
      type: el.type,
      label: getLayerLabel(el),
    }))
    .reverse(),
)

const draggedLayerId  = ref<string | null>(null)
const dragOverLayerId = ref<string | null>(null)
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  layerId: null as string | null,
})
const contextMenuLayer = computed(() =>
  contextMenu.value.layerId
    ? store.elements.find(el => el.id === contextMenu.value.layerId) ?? null
    : null,
)

// ── Helpers ────────────────────────────────────────────────────────────────
function patch(attrs: Partial<TemplateElement>): void {
  if (!store.selectedId) return
  store.updateElement(store.selectedId, attrs)
}

function commit(attrs: Partial<TemplateElement>): void {
  if (!store.selectedId) return
  store.commitElementUpdate(store.selectedId, attrs)
}

function toggleBold(): void {
  if (!textEl.value) return
  const hasBold   = textEl.value.fontStyle.includes('bold')
  const hasItalic = textEl.value.fontStyle.includes('italic')
  const next = [hasBold ? '' : 'bold', hasItalic ? 'italic' : ''].filter(Boolean).join(' ') || 'normal'
  commit({ fontStyle: next })
}

function toggleItalic(): void {
  if (!textEl.value) return
  const hasBold   = textEl.value.fontStyle.includes('bold')
  const hasItalic = textEl.value.fontStyle.includes('italic')
  const next = [hasBold ? 'bold' : '', hasItalic ? '' : 'italic'].filter(Boolean).join(' ') || 'normal'
  commit({ fontStyle: next })
}

function toggleUnderline(): void {
  if (!textEl.value) return
  const next = (textEl.value.textDecoration ?? 'none') === 'underline' ? 'none' : 'underline'
  commit({ textDecoration: next })
}

function toggleFlipX(): void {
  if (!imgEl.value) return
  commit({ flipX: !imgEl.value.flipX })
}

function toggleFlipY(): void {
  if (!imgEl.value) return
  commit({ flipY: !imgEl.value.flipY })
}

function normalizePaint(paint: string | PaintStyle | undefined): PaintStyle {
  if (!paint) return { kind: 'solid', color: '#ffffff' }
  if (typeof paint === 'string') return { kind: 'solid', color: paint }
  return paint
}

function paintColor(paint: PaintStyle, index: number): string {
  if (paint.kind === 'solid') return paint.color
  return paint.colorStops[index]?.[1] ?? paint.colorStops[0]?.[1] ?? '#ffffff'
}

function paintWithType(base: PaintStyle, kind: 'solid' | 'linear'): PaintStyle {
  const colorA = paintColor(base, 0)
  const colorB = paintColor(base, 1)
  if (kind === 'solid') return { kind: 'solid', color: colorA }
  return { kind: 'linear', startX: 0, startY: 0, endX: 220, endY: 0, colorStops: [[0, colorA], [1, colorB]] }
}

function patchPaintColor(paint: PaintStyle, index: number, color: string): PaintStyle {
  if (paint.kind === 'solid') return { ...paint, color }
  const nextStops: [number, string][] = [...paint.colorStops]
  if (!nextStops[index]) nextStops[index] = [index === 0 ? 0 : 1, color]
  else nextStops[index] = [nextStops[index][0], color]
  return { ...paint, colorStops: nextStops }
}

function normalizeHexColorInput(input: string): string | null {
  const trimmed = input.trim()
  if (/^#[\da-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase()
  if (/^[\da-fA-F]{6}$/.test(trimmed)) return `#${trimmed.toLowerCase()}`
  return null
}

function setRectFillType(kind: 'solid' | 'linear'): void {
  if (!rectEl.value) return
  commit({ fill: paintWithType(normalizePaint(rectEl.value.fill), kind) })
}
function setRectFillColor(index: number, color: string): void {
  if (!rectEl.value) return
  const normalized = normalizeHexColorInput(color)
  if (!normalized) return
  commit({ fill: patchPaintColor(normalizePaint(rectEl.value.fill), index, normalized) })
}
function setRectStrokeType(kind: 'solid' | 'linear'): void {
  if (!rectEl.value) return
  commit({ stroke: paintWithType(normalizePaint(rectEl.value.stroke), kind) })
}
function setRectStrokeColor(index: number, color: string): void {
  if (!rectEl.value) return
  const normalized = normalizeHexColorInput(color)
  if (!normalized) return
  commit({ stroke: patchPaintColor(normalizePaint(rectEl.value.stroke), index, normalized) })
}
function setIconColor(color: string): void {
  if (!iconEl.value) return
  const normalized = normalizeHexColorInput(color)
  if (!normalized) return
  commit({ fill: { kind: 'solid', color: normalized }, strokeWidth: 0, stroke: { kind: 'solid', color: '#000000' } })
}

function setTextStrokeColor(color: string): void {
  const normalized = normalizeHexColorInput(color)
  if (!normalized) return
  commit({ stroke: normalized })
}

function getLayerLabel(el: TemplateElement): string {
  if (el.type === 'text') {
    const text = (el as TextElement).text?.trim() || 'Text'
    return text.length > 24 ? `${text.slice(0, 24)}...` : text
  }
  if (el.type === 'image') {
    return 'Image'
  }
  if (el.type === 'icon') {
    return `Icon: ${(el as IconElement).icon}`
  }
  return 'Rectangle'
}

function onLayerDragStart(id: string): void {
  draggedLayerId.value = id
}

function onLayerDragEnter(id: string): void {
  if (!draggedLayerId.value || draggedLayerId.value === id) return
  dragOverLayerId.value = id
}

function onLayerDrop(targetId: string): void {
  if (!draggedLayerId.value || draggedLayerId.value === targetId) return
  const idsTop = layersTopToBottom.value.map(l => l.id)
  const from   = idsTop.indexOf(draggedLayerId.value)
  const to     = idsTop.indexOf(targetId)
  if (from === -1 || to === -1) return
  const [moved] = idsTop.splice(from, 1)
  idsTop.splice(to, 0, moved)
  store.setElementOrder(idsTop.reverse())
  onLayerDragEnd()
}

function onLayerDragEnd(): void {
  draggedLayerId.value  = null
  dragOverLayerId.value = null
}

function openLayerContextMenu(e: MouseEvent, layerId: string): void {
  const layer = store.elements.find(el => el.id === layerId)
  const itemCount = layer?.type === 'image' ? 6 : 4
  const menuHeight = itemCount * 32 + 8
  store.selectElement(layerId)
  contextMenu.value = {
    visible: true,
    x: Math.min(e.clientX, window.innerWidth - 180),
    y: Math.min(e.clientY, window.innerHeight - menuHeight),
    layerId,
  }
}

function closeLayerContextMenu(): void {
  contextMenu.value.visible = false
  contextMenu.value.layerId = null
}

function onBringToFront(): void {
  if (!contextMenu.value.layerId) return
  store.bringToFront(contextMenu.value.layerId)
  closeLayerContextMenu()
}

function onSendToBack(): void {
  if (!contextMenu.value.layerId) return
  store.sendToBack(contextMenu.value.layerId)
  closeLayerContextMenu()
}

function onRotate180(): void {
  const layer = contextMenuLayer.value
  if (!layer) return
  const nextRotation = ((layer.rotation ?? 0) + 180) % 360
  store.commitElementUpdate(layer.id, { rotation: nextRotation })
  closeLayerContextMenu()
}

function onFlipHorizontal(): void {
  const layer = contextMenuLayer.value
  if (!layer || layer.type !== 'image') return
  store.commitElementUpdate(layer.id, { flipX: !layer.flipX })
  closeLayerContextMenu()
}

function onFlipVertical(): void {
  const layer = contextMenuLayer.value
  if (!layer || layer.type !== 'image') return
  store.commitElementUpdate(layer.id, { flipY: !layer.flipY })
  closeLayerContextMenu()
}

function onDeleteLayer(): void {
  if (!contextMenu.value.layerId) return
  store.removeElement(contextMenu.value.layerId)
  closeLayerContextMenu()
}

function onWindowKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') closeLayerContextMenu()
}

onMounted(() => {
  window.addEventListener('click', closeLayerContextMenu)
  window.addEventListener('keydown', onWindowKeydown)
})

onUnmounted(() => {
  window.removeEventListener('click', closeLayerContextMenu)
  window.removeEventListener('keydown', onWindowKeydown)
})
</script>
