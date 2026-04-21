<template>
  <header class="flex items-center justify-between px-5 h-[60px] bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 shrink-0 z-10">
    <!-- Logo + back nav -->
    <div class="flex items-center gap-2.5">
      <button
        class="btn-ghost p-2 mr-1"
        title="Back to home"
        @click="goHome"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-soft">
        <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
            d="M15 10l4.553-2.069A1 1 0 0121 8.869v6.262a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </div>
      <span class="font-semibold text-gray-900 dark:text-zinc-100 tracking-tight text-[15px] hidden sm:block">Fastee</span>
    </div>

    <!-- Centre: undo/redo + template info + dirty indicator -->
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-1">
        <button
          class="btn-ghost p-2 disabled:opacity-30 disabled:cursor-not-allowed"
          :disabled="!store.canUndo"
          title="Undo (Ctrl+Z)"
          @click="store.undo()"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a4 4 0 010 8H9m-6-8l3-3m-3 3l3 3" />
          </svg>
        </button>
        <button
          class="btn-ghost p-2 disabled:opacity-30 disabled:cursor-not-allowed"
          :disabled="!store.canRedo"
          title="Redo (Ctrl+Y)"
          @click="store.redo()"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10H11a4 4 0 000 8h4m6-8l-3-3m3 3l-3 3" />
          </svg>
        </button>
      </div>

      <div v-if="store.currentTemplate" class="flex items-center gap-2">
        <span class="text-sm text-gray-600 dark:text-zinc-400 font-medium truncate max-w-[180px]">
          {{ store.currentTemplate.name }}
        </span>
        <span class="text-gray-400 dark:text-zinc-600 text-xs">
          {{ store.canvasSize.width }}×{{ store.canvasSize.height }}
        </span>
        <!-- Save status pill -->
        <span
          v-if="store.isDirty"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Saving…
        </span>
        <span
          v-else-if="store.currentTemplate"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
          </svg>
          Saved
        </span>
      </div>
    </div>

    <!-- Right actions -->
    <div class="flex items-center gap-1.5">
      <!-- Color mode toggle -->
      <button class="btn-ghost p-2" @click="colorMode.toggle()">
        <svg v-if="colorMode.mode.value === 'dark'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </button>

      <!-- Add text -->
      <button
        v-if="store.currentTemplate"
        class="btn-ghost text-sm flex items-center gap-1.5"
        @click="store.addTextElement()"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span class="hidden sm:inline">Add Text</span>
      </button>

      <!-- Export button -->
      <button
        class="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-xl
               bg-gradient-to-r from-brand-500 to-purple-600 shadow-md shadow-brand-600/30
               hover:scale-105 hover:shadow-lg hover:shadow-brand-600/40
               active:scale-95 transition-all duration-150
               disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
        :disabled="!store.currentTemplate"
        @click="emit('export')"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useEditorStore } from '@/store/editor'
import { useColorMode }   from '@/composables/useColorMode'

const router    = useRouter()
const store     = useEditorStore()
const colorMode = useColorMode()
const emit      = defineEmits<{ (e: 'export'): void }>()

function goHome(): void {
  router.push({ name: 'home' })
}
</script>
