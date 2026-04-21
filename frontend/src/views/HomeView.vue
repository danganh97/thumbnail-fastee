<template>
  <div class="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col">
    <!-- Header -->
    <header class="flex items-center justify-between px-8 py-5 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-soft">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
              d="M15 10l4.553-2.069A1 1 0 0121 8.869v6.262a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <span class="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">Thumbnail Fastee</span>
      </div>
      <button
        class="btn-ghost text-sm"
        title="Toggle color mode"
        @click="colorMode.toggle()"
      >
        <svg v-if="colorMode.mode.value === 'dark'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </button>
    </header>

    <!-- Hero -->
    <div class="text-center py-16 px-6">
      <h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight mb-4">
        Create stunning thumbnails
        <span class="bg-gradient-to-r from-brand-500 to-purple-500 bg-clip-text text-transparent"> in seconds</span>
      </h1>
      <p class="text-lg text-gray-500 dark:text-zinc-400 max-w-xl mx-auto">
        Choose your platform to get started. Optimized templates for every format.
      </p>
    </div>

    <!-- Platform cards -->
    <div class="flex-1 px-8 pb-16 max-w-5xl mx-auto w-full">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <button
          v-for="platform in platforms"
          :key="platform.id"
          class="group relative bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 text-left
                 transition-all duration-200 hover:border-brand-500/60 hover:shadow-xl hover:shadow-brand-500/10 hover:-translate-y-1
                 focus:outline-none focus:ring-2 focus:ring-brand-500"
          @click="navigate(platform.id)"
        >
          <!-- Icon bubble -->
          <div
            class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4 transition-transform duration-200 group-hover:scale-110"
            :class="platform.color"
          >
            {{ platform.icon }}
          </div>

          <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-1">{{ platform.label }}</h2>
          <p class="text-sm text-gray-500 dark:text-zinc-400 mb-4">{{ platform.description }}</p>

          <!-- Image type badges -->
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="typeId in getTypes(platform.id)"
              :key="typeId"
              class="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400"
            >
              {{ IMAGE_TYPES[typeId].label }}
            </span>
          </div>

          <!-- Arrow -->
          <div class="absolute top-5 right-5 text-gray-300 dark:text-zinc-700 group-hover:text-brand-500 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useEditorStore } from '@/store/editor'
import { useColorMode } from '@/composables/useColorMode'
import { IMAGE_TYPES, PLATFORM_IMAGE_TYPES } from '@/types'
import type { PlatformId } from '@/types'

const router = useRouter()
const store  = useEditorStore()
const colorMode = useColorMode()

const platforms = [
  { id: 'youtube'   as PlatformId, label: 'YouTube',   icon: '▶', description: 'Video thumbnails & Shorts', color: 'bg-red-100 dark:bg-red-900/30 text-red-600' },
  { id: 'tiktok'    as PlatformId, label: 'TikTok',    icon: '♪', description: 'Video covers & Live banners', color: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300' },
  { id: 'facebook'  as PlatformId, label: 'Facebook',  icon: 'f', description: 'Posts, covers, stories & reels', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' },
  { id: 'instagram' as PlatformId, label: 'Instagram', icon: '◈', description: 'Posts, reels & stories', color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600' },
]

function getTypes(platformId: PlatformId) {
  return PLATFORM_IMAGE_TYPES[platformId] ?? []
}

function navigate(platformId: PlatformId): void {
  store.selectPlatform(platformId)
  router.push({ name: 'platform', params: { platformId } })
}
</script>
