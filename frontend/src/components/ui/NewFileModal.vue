<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/45" @click="emit('close')" />

    <div class="relative w-full max-w-2xl rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl">
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-zinc-800">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-zinc-100">New File</h2>
        <button
          class="btn-ghost p-2"
          title="Close"
          @click="emit('close')"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="px-5 pt-4">
        <div class="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-zinc-800">
          <button
            class="px-3 py-1.5 rounded-lg text-sm transition-colors"
            :class="mode === 'platform'
              ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow'
              : 'text-gray-600 dark:text-zinc-400'"
            @click="mode = 'platform'"
          >
            Platform
          </button>
          <button
            class="px-3 py-1.5 rounded-lg text-sm transition-colors"
            :class="mode === 'custom'
              ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow'
              : 'text-gray-600 dark:text-zinc-400'"
            @click="mode = 'custom'"
          >
            Custom
          </button>
        </div>
      </div>

      <div class="px-5 py-4">
        <template v-if="mode === 'platform'">
          <p class="text-sm text-gray-600 dark:text-zinc-400 mb-3">
            Choose a platform to start a new design.
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              v-for="platform in platforms"
              :key="platform.id"
              class="relative p-4 rounded-xl border border-gray-200 dark:border-zinc-700 text-left overflow-hidden
                     hover:border-brand-500 transition-colors"
              @click="onSelectPlatform(platform.id)"
            >
              <div
                class="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80"
                :style="{ backgroundImage: `url(${platform.background})` }"
                aria-hidden="true"
              />
              <div class="absolute inset-0 bg-gradient-to-b from-white/86 to-white/94 dark:from-zinc-900/84 dark:to-zinc-900/94" aria-hidden="true" />
              <div class="relative z-10">
                <p class="font-semibold text-gray-900 dark:text-zinc-100">{{ platform.label }}</p>
                <p class="text-xs text-gray-500 dark:text-zinc-400 mt-1">{{ platform.description }}</p>
              </div>
            </button>
          </div>
        </template>

        <template v-else>
          <div class="space-y-4">
            <div>
              <label class="block text-xs text-zinc-500 mb-2">Presets</label>
              <div class="flex flex-wrap gap-2">
                <button
                  class="px-3 py-1.5 rounded-lg text-xs border transition-colors"
                  :class="selectedPreset === 'a4_portrait'
                    ? 'border-brand-500 text-brand-500 bg-brand-500/10'
                    : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'"
                  @click="applyPreset('a4_portrait')"
                >
                  A4 Portrait (2480×3508)
                </button>
                <button
                  class="px-3 py-1.5 rounded-lg text-xs border transition-colors"
                  :class="selectedPreset === 'a4_landscape'
                    ? 'border-brand-500 text-brand-500 bg-brand-500/10'
                    : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'"
                  @click="applyPreset('a4_landscape')"
                >
                  A4 Landscape (3508×2480)
                </button>
                <button
                  class="px-3 py-1.5 rounded-lg text-xs border transition-colors"
                  :class="selectedPreset === 'square'
                    ? 'border-brand-500 text-brand-500 bg-brand-500/10'
                    : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'"
                  @click="applyPreset('square')"
                >
                  Square (1080×1080)
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-zinc-500 mb-1">Width</label>
                <input
                  v-model.number="customWidth"
                  type="number"
                  min="100"
                  max="8000"
                  class="input-field text-sm"
                />
              </div>
              <div>
                <label class="block text-xs text-zinc-500 mb-1">Height</label>
                <input
                  v-model.number="customHeight"
                  type="number"
                  min="100"
                  max="8000"
                  class="input-field text-sm"
                />
              </div>
            </div>

            <p v-if="customSizeError" class="text-xs text-red-500">{{ customSizeError }}</p>
          </div>
        </template>
      </div>

      <div class="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-zinc-800">
        <button class="btn-ghost text-sm" @click="emit('close')">Cancel</button>
        <button
          v-if="mode === 'custom'"
          class="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-500 to-purple-600 disabled:opacity-40"
          :disabled="!!customSizeError"
          @click="onCreateCustom"
        >
          Create
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlatformId } from '@/types'
import { PLATFORMS } from '@/types'
import { computed, ref } from 'vue'
import youtubeBg from '@/assets/backgrounds/platform-youtube.svg'
import tiktokBg from '@/assets/backgrounds/platform-tiktok.svg'
import facebookBg from '@/assets/backgrounds/platform-facebook.svg'
import instagramBg from '@/assets/backgrounds/platform-instagram.svg'

type PresetId = 'a4_portrait' | 'a4_landscape' | 'square'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select-platform', platformId: PlatformId): void
  (e: 'create-custom', payload: { width: number; height: number; preset: PresetId }): void
}>()

const mode = ref<'platform' | 'custom'>('platform')
const selectedPreset = ref<PresetId>('square')
const customWidth = ref(1080)
const customHeight = ref(1080)
const platformBackgrounds: Record<PlatformId, string> = {
  youtube: youtubeBg,
  tiktok: tiktokBg,
  facebook: facebookBg,
  instagram: instagramBg,
}
const platforms = Object.values(PLATFORMS).map(platform => ({
  ...platform,
  background: platformBackgrounds[platform.id],
}))

const customSizeError = computed(() => {
  if (!Number.isInteger(customWidth.value) || !Number.isInteger(customHeight.value)) return 'Width and height must be whole numbers.'
  if (customWidth.value < 100 || customHeight.value < 100) return 'Minimum size is 100 x 100.'
  if (customWidth.value > 8000 || customHeight.value > 8000) return 'Maximum size is 8000 x 8000.'
  return ''
})

function onSelectPlatform(platformId: PlatformId): void {
  emit('select-platform', platformId)
}

function applyPreset(preset: PresetId): void {
  selectedPreset.value = preset
  if (preset === 'a4_portrait') {
    customWidth.value = 2480
    customHeight.value = 3508
    return
  }
  if (preset === 'a4_landscape') {
    customWidth.value = 3508
    customHeight.value = 2480
    return
  }
  customWidth.value = 1080
  customHeight.value = 1080
}

function onCreateCustom(): void {
  if (customSizeError.value) return
  emit('create-custom', {
    width: customWidth.value,
    height: customHeight.value,
    preset: selectedPreset.value,
  })
}
</script>
