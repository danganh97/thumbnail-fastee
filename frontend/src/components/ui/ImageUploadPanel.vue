<template>
  <div class="space-y-2">
    <div>
      <p class="section-label">Images</p>
      <div class="px-3 pb-3 space-y-2">
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
        <p class="text-xs text-gray-400 dark:text-zinc-600">Tip: right-click image for quick actions.</p>
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

async function onImageAdd(e: Event): Promise<void> {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const src = await readFileAsDataUrl(file)
  store.addImageElement(src)
  ;(e.target as HTMLInputElement).value = ''
}
</script>
