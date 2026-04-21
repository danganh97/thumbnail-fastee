<template>
  <div class="space-y-2">
    <!-- Background image -->
    <div>
      <p class="section-label">Background</p>
      <div class="px-3 pb-3 space-y-2">
        <!-- Current background preview -->
        <div
          v-if="store.backgroundImage"
          class="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-700"
        >
          <img :src="store.backgroundImage" class="w-full h-full object-cover" alt="background" />
          <button
            class="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
            title="Remove background image"
            @click="store.setBackgroundImage(null)"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Upload button -->
        <label
          class="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700
                 text-gray-500 dark:text-zinc-400 text-sm cursor-pointer hover:border-brand-500 hover:text-brand-500
                 transition-colors duration-150"
        >
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{{ store.backgroundImage ? 'Replace background' : 'Upload background' }}</span>
          <input
            type="file"
            accept="image/*"
            class="sr-only"
            @change="onBgUpload"
          />
        </label>

        <p class="text-xs text-gray-400 dark:text-zinc-600">Or paste / drop an image anywhere</p>
      </div>
    </div>

    <div class="h-px bg-gray-100 dark:bg-zinc-800 mx-4" />

    <!-- Add image element -->
    <div>
      <p class="section-label">Add Image</p>
      <div class="px-3 pb-3">
        <label
          class="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700
                 text-gray-500 dark:text-zinc-400 text-sm cursor-pointer hover:border-brand-500 hover:text-brand-500
                 transition-colors duration-150"
        >
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Add image to canvas</span>
          <input
            type="file"
            accept="image/*"
            class="sr-only"
            @change="onImageAdd"
          />
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEditorStore } from '@/store/editor'

const store = useEditorStore()

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = e => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function onBgUpload(e: Event): Promise<void> {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const src = await readFileAsDataUrl(file)
  store.addImageElement(src, { isBackground: true })
  ;(e.target as HTMLInputElement).value = ''
}

async function onImageAdd(e: Event): Promise<void> {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const src = await readFileAsDataUrl(file)
  store.addImageElement(src)
  ;(e.target as HTMLInputElement).value = ''
}
</script>
