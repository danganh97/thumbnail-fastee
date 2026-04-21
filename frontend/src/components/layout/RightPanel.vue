<template>
  <aside class="panel shrink-0 border-l border-gray-200 dark:border-zinc-800 border-r-0">

    <!-- Panel header with simple/advanced toggle -->
    <div
      v-if="store.selectedElement"
      class="flex items-center justify-between px-3 pt-2 pb-1 shrink-0"
    >
      <span class="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
        Properties
      </span>
      <button
        class="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border transition-colors"
        :class="simpleMode
          ? 'border-brand-500/40 text-brand-500 bg-brand-500/10'
          : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'"
        :title="simpleMode ? 'Show advanced options' : 'Hide advanced options'"
        @click="simpleMode = !simpleMode"
      >
        {{ simpleMode ? 'Simple' : 'Advanced' }}
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

    <!-- ── Rect element controls ─────────────────────────────────────────── -->
    <template v-else-if="store.selectedElement.type === 'rect'">
      <div>
        <p class="section-label">Rectangle</p>
        <div class="px-3 pb-3 space-y-2">
          <div class="flex items-center gap-2">
            <label class="text-xs text-zinc-400 w-10 shrink-0">Fill</label>
            <input
              type="color"
              class="w-8 h-8 rounded-lg cursor-pointer border border-zinc-700 bg-transparent p-0.5"
              :value="rectEl!.fill || '#ffffff'"
              @change="commit({ fill: ($event.target as HTMLInputElement).value })"
            />
            <input
              type="text"
              class="input-field text-xs font-mono"
              :value="rectEl!.fill"
              @change="commit({ fill: ($event.target as HTMLInputElement).value })"
            />
          </div>
          <div v-if="!simpleMode" class="flex items-center gap-2">
            <label class="text-xs text-zinc-400 w-10 shrink-0">Opacity</label>
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
import { ref, computed, watch } from 'vue'
import { useEditorStore }   from '@/store/editor'
import FontPicker           from '@/components/ui/FontPicker.vue'
import type { TextElement, RectElement, ImageElement, TemplateElement } from '@/types'
import { FONT_SIZES } from '@/types'

const store = useEditorStore()

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

function toggleFlipX(): void {
  if (!imgEl.value) return
  commit({ flipX: !imgEl.value.flipX })
}

function toggleFlipY(): void {
  if (!imgEl.value) return
  commit({ flipY: !imgEl.value.flipY })
}
</script>
