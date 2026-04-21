<template>
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    @click.self="emit('close')"
  >
    <div class="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-700 w-full max-w-sm mx-4 overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
        <h2 class="font-semibold text-gray-900 dark:text-white">Export Image</h2>
        <button class="btn-ghost p-1.5" @click="emit('close')">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="px-6 py-5 space-y-5">
        <!-- Format toggle -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">Format</label>
          <div class="flex rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-700">
            <button
              v-for="fmt in ['png', 'jpeg'] as const"
              :key="fmt"
              class="flex-1 py-2.5 text-sm font-medium transition-colors"
              :class="format === fmt
                ? 'bg-brand-500 text-white'
                : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700'"
              @click="format = fmt"
            >
              {{ fmt.toUpperCase() }}
            </button>
          </div>
        </div>

        <!-- Quality (only for JPEG) -->
        <Transition name="fade">
          <div v-if="format === 'jpeg'">
            <label class="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
              Quality — {{ Math.round(quality * 100) }}%
            </label>
            <input
              v-model.number="quality"
              type="range"
              min="0.5"
              max="1"
              step="0.01"
              class="w-full accent-brand-500"
            />
            <div class="flex justify-between text-xs text-gray-400 dark:text-zinc-500 mt-1">
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </Transition>

        <!-- Pixel ratio info -->
        <p class="text-xs text-gray-400 dark:text-zinc-500">
          Exports at 2× pixel ratio for crisp high-resolution output.
        </p>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-100 dark:border-zinc-800 flex gap-3">
        <button class="flex-1 btn-ghost text-sm" @click="emit('close')">Cancel</button>
        <button
          class="flex-1 btn-primary flex items-center justify-center gap-2 text-sm"
          @click="emit('download', format, quality)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download {{ format.toUpperCase() }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useEditorStore } from '@/store/editor'

const store = useEditorStore()

const format  = ref<'png' | 'jpeg'>(store.exportFormat)
const quality = ref(store.exportQuality)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'download', format: 'png' | 'jpeg', quality: number): void
}>()
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
