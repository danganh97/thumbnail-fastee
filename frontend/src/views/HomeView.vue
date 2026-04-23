<template>
  <div class="relative min-h-screen flex flex-col overflow-hidden bg-gray-50 dark:bg-zinc-950">
    <div
      class="absolute inset-0 bg-cover bg-center bg-no-repeat"
      :style="{ backgroundImage: `url(${homeNatureBg})` }"
      aria-hidden="true"
    />
    <div class="absolute inset-0 bg-gradient-to-b from-white/80 via-white/70 to-white/85 dark:from-zinc-950/80 dark:via-zinc-950/75 dark:to-zinc-950/90" aria-hidden="true" />

    <div class="relative z-10 flex min-h-screen flex-col">
    <!-- Header -->
    <header class="flex items-center justify-between px-8 py-5 border-b border-gray-200 dark:border-zinc-800 bg-white/85 dark:bg-zinc-900/75 backdrop-blur-sm">
      <button
        type="button"
        class="flex items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/60"
        title="Go to home page"
        @click="router.push({ name: 'home' })"
      >
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-soft">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
              d="M15 10l4.553-2.069A1 1 0 0121 8.869v6.262a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <span class="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">Fastee</span>
      </button>
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
      <div
        v-if="auth.currentUser.value"
        class="mb-8 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white/85 dark:bg-zinc-900/70 backdrop-blur-sm p-4"
      >
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-gray-800 dark:text-zinc-100">Your Editors</h2>
          <span class="text-xs text-gray-500 dark:text-zinc-400">{{ dbEditors.length }} item(s)</span>
        </div>
        <p v-if="isLoadingEditors" class="text-xs text-gray-500 dark:text-zinc-400">Loading editors…</p>
        <p v-else-if="editorsError" class="text-xs text-red-500">{{ editorsError }}</p>
        <p v-else-if="dbEditors.length === 0" class="text-xs text-gray-500 dark:text-zinc-400">
          No editors yet. Create one to see it here.
        </p>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div
            v-for="editor in dbEditors"
            :key="editor.editorId"
            class="group rounded-xl border border-gray-200 dark:border-zinc-800 px-3 py-2 hover:border-brand-500/60 hover:bg-brand-500/5 transition-colors"
          >
            <div class="flex items-start gap-2">
              <button
                class="flex-1 min-w-0 text-left"
                @click="openEditor(editor.editorId)"
              >
                <p class="text-sm font-medium text-gray-800 dark:text-zinc-100 truncate">{{ editor.name }}</p>
                <p class="text-[11px] text-gray-500 dark:text-zinc-400">
                  Updated {{ formatDate(editor.updatedAt) }}
                </p>
              </button>
              <button
                class="mt-0.5 rounded-md p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-40"
                title="Delete editor"
                :disabled="deletingEditorId === editor.editorId"
                @click.stop="removeEditor(editor.editorId)"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-3h4m-8 3h12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        <button
          v-for="platform in platforms"
          :key="platform.id"
          class="group relative border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 text-left overflow-hidden
                 transition-all duration-200 hover:border-brand-500/60 hover:shadow-xl hover:shadow-brand-500/10 hover:-translate-y-1
                 focus:outline-none focus:ring-2 focus:ring-brand-500"
          @click="navigate(platform.id)"
        >
          <div
            class="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80"
            :style="{ backgroundImage: `url(${platform.background})` }"
            aria-hidden="true"
          />
          <div class="absolute inset-0 bg-gradient-to-b from-white/82 to-white/92 dark:from-zinc-900/82 dark:to-zinc-900/92" aria-hidden="true" />

          <div class="relative z-10">
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
          </div>
        </button>
      </div>
    </div>

    <div v-if="showCustomSizeModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/45" @click="showCustomSizeModal = false" />
      <div class="relative w-full max-w-xl rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl">
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-zinc-800">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-zinc-100">Custom Size</h2>
          <button class="btn-ghost p-2" title="Close" @click="showCustomSizeModal = false">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="px-5 py-4 space-y-4">
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
                A4 Portrait (2480x3508)
              </button>
              <button
                class="px-3 py-1.5 rounded-lg text-xs border transition-colors"
                :class="selectedPreset === 'a4_landscape'
                  ? 'border-brand-500 text-brand-500 bg-brand-500/10'
                  : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'"
                @click="applyPreset('a4_landscape')"
              >
                A4 Landscape (3508x2480)
              </button>
              <button
                class="px-3 py-1.5 rounded-lg text-xs border transition-colors"
                :class="selectedPreset === 'square'
                  ? 'border-brand-500 text-brand-500 bg-brand-500/10'
                  : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'"
                @click="applyPreset('square')"
              >
                Square (1080x1080)
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-zinc-500 mb-1">Width</label>
              <input v-model.number="customWidth" type="number" min="100" max="8000" class="input-field text-sm" />
            </div>
            <div>
              <label class="block text-xs text-zinc-500 mb-1">Height</label>
              <input v-model.number="customHeight" type="number" min="100" max="8000" class="input-field text-sm" />
            </div>
          </div>
          <p v-if="customSizeError" class="text-xs text-red-500">{{ customSizeError }}</p>
        </div>

        <div class="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-zinc-800">
          <button class="btn-ghost text-sm" @click="showCustomSizeModal = false">Cancel</button>
          <button
            class="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-500 to-purple-600 disabled:opacity-40"
            :disabled="!!customSizeError"
            @click="confirmCustomSize"
          >
            Create
          </button>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useColorMode } from '@/composables/useColorMode'
import { useAuth } from '@/composables/useAuth'
import { deleteEditor, listEditors } from '@/services/editorApi'
import { IMAGE_TYPES, PLATFORM_IMAGE_TYPES } from '@/types'
import type { EditorListItemResponse, PlatformId } from '@/types'
import homeNatureBg from '@/assets/backgrounds/home-nature.svg'
import youtubeBg from '@/assets/backgrounds/platform-youtube.svg'
import tiktokBg from '@/assets/backgrounds/platform-tiktok.svg'
import facebookBg from '@/assets/backgrounds/platform-facebook.svg'
import instagramBg from '@/assets/backgrounds/platform-instagram.svg'
import templateSharedBg from '@/assets/backgrounds/template-shared.svg'

const router = useRouter()
const colorMode = useColorMode()
const auth = useAuth()
const showCustomSizeModal = ref(false)
const selectedPreset = ref<PresetId>('square')
const customWidth = ref(1080)
const customHeight = ref(1080)
const dbEditors = ref<EditorListItemResponse[]>([])
const isLoadingEditors = ref(false)
const deletingEditorId = ref<string | null>(null)
const editorsError = ref('')

type HomeCardId = PlatformId | 'custom'
type PresetId = 'a4_portrait' | 'a4_landscape' | 'square'

interface HomeCard {
  id: HomeCardId
  label: string
  icon: string
  description: string
  color: string
  background: string
}

const platforms: HomeCard[] = [
  { id: 'youtube'   as PlatformId, label: 'YouTube',   icon: '▶', description: 'Video thumbnails & Shorts', color: 'bg-red-100 dark:bg-red-900/30 text-red-600', background: youtubeBg },
  { id: 'tiktok'    as PlatformId, label: 'TikTok',    icon: '♪', description: 'Video covers & Live banners', color: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300', background: tiktokBg },
  { id: 'facebook'  as PlatformId, label: 'Facebook',  icon: 'f', description: 'Posts, covers, stories & reels', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600', background: facebookBg },
  { id: 'instagram' as PlatformId, label: 'Instagram', icon: '◈', description: 'Posts, reels & stories', color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600', background: instagramBg },
  { id: 'custom', label: 'Custom Size', icon: '⬚', description: 'Start with your own canvas dimensions', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600', background: templateSharedBg },
]

function getTypes(platformId: HomeCardId) {
  if (platformId === 'custom') return []
  return PLATFORM_IMAGE_TYPES[platformId] ?? []
}

function navigate(platformId: HomeCardId): void {
  if (platformId === 'custom') {
    showCustomSizeModal.value = true
    return
  }
  router.push({ name: 'platform', params: { platformId } })
}

async function refreshEditors(): Promise<void> {
  if (!auth.currentUser.value) {
    dbEditors.value = []
    return
  }
  isLoadingEditors.value = true
  editorsError.value = ''
  try {
    dbEditors.value = await listEditors()
  } catch {
    editorsError.value = 'Failed to load editors.'
  } finally {
    isLoadingEditors.value = false
  }
}

function openEditor(editorId: string): void {
  router.push({ name: 'editor-by-id', params: { editorId } })
}

async function removeEditor(editorId: string): Promise<void> {
  const confirmed = window.confirm('Delete this editor? This action cannot be undone.')
  if (!confirmed || deletingEditorId.value) return
  deletingEditorId.value = editorId
  try {
    await deleteEditor(editorId)
    dbEditors.value = dbEditors.value.filter(editor => editor.editorId !== editorId)
  } catch {
    window.alert('Failed to delete editor.')
  } finally {
    deletingEditorId.value = null
  }
}

function formatDate(value: string): string {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString()
}

const customSizeError = computed(() => {
  if (!Number.isInteger(customWidth.value) || !Number.isInteger(customHeight.value)) return 'Width and height must be whole numbers.'
  if (customWidth.value < 100 || customHeight.value < 100) return 'Minimum size is 100 x 100.'
  if (customWidth.value > 8000 || customHeight.value > 8000) return 'Maximum size is 8000 x 8000.'
  return ''
})

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

function confirmCustomSize(): void {
  if (customSizeError.value) return
  showCustomSizeModal.value = false
  router.push({
    name: 'editor',
    query: {
      platform: 'youtube',
      type: 'youtube_video',
      template: 'custom',
      customW: String(customWidth.value),
      customH: String(customHeight.value),
    },
  })
}

watch(
  () => auth.currentUser.value?.id ?? null,
  () => {
    refreshEditors().catch(() => {
      editorsError.value = 'Failed to load editors.'
    })
  },
  { immediate: true },
)
</script>
