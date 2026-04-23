<template>
  <div class="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col">
    <!-- Header -->
    <header class="flex items-center justify-between px-8 py-5 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div class="flex items-center gap-4">
        <button class="btn-ghost p-2" @click="router.push({ name: 'home' })">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                d="M15 10l4.553-2.069A1 1 0 0121 8.869v6.262a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <span class="text-lg font-semibold text-gray-900 dark:text-white tracking-tight"><a href="/">Fastee</a></span>
        </div>
      </div>
      <button class="btn-ghost p-2" @click="colorMode.toggle()">
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

    <!-- Breadcrumb -->
    <div class="px-8 py-4 flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-500">
      <button class="hover:text-brand-500 transition-colors" @click="router.push({ name: 'home' })">Home</button>
      <span>/</span>
      <span class="text-gray-900 dark:text-white font-medium">{{ platformLabel }}</span>
    </div>

    <div class="flex-1 px-8 pb-16 max-w-4xl mx-auto w-full">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">{{ platformLabel }}</h1>
      <p class="text-gray-500 dark:text-zinc-400 mb-10">Choose the type of image you want to create.</p>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        <button
          v-for="imgType in imageTypes"
          :key="imgType.id"
          class="group bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl overflow-hidden text-left
                 transition-all duration-200 hover:border-brand-500/60 hover:shadow-xl hover:shadow-brand-500/10 hover:-translate-y-1
                 focus:outline-none focus:ring-2 focus:ring-brand-500"
          @click="navigate(imgType.id)"
        >
          <!-- Aspect ratio preview -->
          <div class="relative overflow-hidden"
               :style="previewStyle(imgType)">
            <div
              class="absolute inset-0 bg-cover bg-center bg-no-repeat"
              :style="{ backgroundImage: `url(${platformBackground})` }"
              aria-hidden="true"
            />
            <div class="absolute inset-0 bg-gradient-to-b from-black/10 to-black/35 dark:from-zinc-900/20 dark:to-zinc-900/55" aria-hidden="true" />
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-3xl text-white/85 drop-shadow-md">{{ platformIcon }}</span>
            </div>
            <!-- Dimensions badge -->
            <div class="absolute bottom-2 right-2 text-[10px] font-mono bg-black/40 text-white px-1.5 py-0.5 rounded-md">
              {{ imgType.width }}×{{ imgType.height }}
            </div>
          </div>

          <!-- Info -->
          <div class="p-4">
            <h3 class="font-semibold text-gray-900 dark:text-white text-sm mb-0.5">{{ imgType.label }}</h3>
            <p class="text-xs text-gray-500 dark:text-zinc-400">{{ imgType.description }}</p>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useColorMode } from '@/composables/useColorMode'
import { PLATFORMS, IMAGE_TYPES, PLATFORM_IMAGE_TYPES } from '@/types'
import type { PlatformId, ImageTypeId, ImageType } from '@/types'
import youtubeBg from '@/assets/backgrounds/platform-youtube.svg'
import tiktokBg from '@/assets/backgrounds/platform-tiktok.svg'
import facebookBg from '@/assets/backgrounds/platform-facebook.svg'
import instagramBg from '@/assets/backgrounds/platform-instagram.svg'

const router    = useRouter()
const route     = useRoute()
const colorMode = useColorMode()

const platformId = computed(() => route.params.platformId as PlatformId)
const platform   = computed(() => PLATFORMS[platformId.value])

const platformLabel = computed(() => platform.value?.label ?? '')
const platformIcon  = computed(() => {
  const icons: Record<PlatformId, string> = { youtube: '▶', tiktok: '♪', facebook: 'f', instagram: '◈' }
  return icons[platformId.value] ?? '◈'
})
const platformBackground = computed(() => {
  const backgrounds: Record<PlatformId, string> = {
    youtube: youtubeBg,
    tiktok: tiktokBg,
    facebook: facebookBg,
    instagram: instagramBg,
  }
  return backgrounds[platformId.value] ?? youtubeBg
})

const imageTypes = computed<ImageType[]>(() => {
  const ids: ImageTypeId[] = PLATFORM_IMAGE_TYPES[platformId.value] ?? []
  return ids.map(id => IMAGE_TYPES[id])
})

function previewStyle(imgType: ImageType): Record<string, string> {
  const ratio = imgType.height / imgType.width
  const clampedRatio = Math.min(ratio, 2.5)
  return { paddingBottom: `${clampedRatio * 100}%` }
}

function navigate(imageTypeId: ImageTypeId): void {
  router.push({
    name: 'editor',
    query: {
      platform: platformId.value,
      type: imageTypeId,
    },
  })
}
</script>
