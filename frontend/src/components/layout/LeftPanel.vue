<template>
  <aside
    class="panel shrink-0 transition-all duration-200 overflow-hidden"
    :style="{ width: collapsed ? '48px' : 'var(--panel-width, 240px)' }"
  >
    <!-- Toggle button always visible -->
    <div class="flex items-center px-2 pt-3 pb-2" :class="collapsed ? 'justify-center' : 'justify-end'">
      <button
        class="p-1.5 rounded-lg text-gray-400 dark:text-zinc-500 hover:text-brand-500 hover:bg-brand-500/10 transition-colors"
        :title="collapsed ? 'Expand panel' : 'Collapse panel'"
        @click="toggleCollapsed"
      >
        <svg
          class="w-4 h-4 transition-transform duration-200"
          :class="collapsed ? 'rotate-180' : ''"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </div>

    <!-- Panel content — hidden when collapsed -->
    <div v-show="!collapsed" class="flex flex-col min-h-0 flex-1">
      <!-- Context: current platform + image type -->
      <div v-if="store.currentImageType" class="px-4 pb-2">
        <div class="flex items-center gap-2 text-xs">
          <span class="text-gray-400 dark:text-zinc-500">{{ store.currentPlatform?.label }}</span>
          <span class="text-gray-300 dark:text-zinc-700">/</span>
          <span class="font-medium text-brand-500">{{ store.currentImageType.label }}</span>
        </div>
        <p class="text-xs text-gray-400 dark:text-zinc-600 mt-0.5">
          {{ store.currentImageType.width }}×{{ store.currentImageType.height }}
        </p>
      </div>

      <div class="h-px bg-gray-100 dark:bg-zinc-800 mx-4 my-1" />

      <!-- Templates -->
      <div class="flex-1 overflow-y-auto min-h-0">
        <p class="section-label">Templates</p>

        <div
          v-if="!store.currentImageType"
          class="px-4 py-6 text-center text-gray-400 dark:text-zinc-600 text-sm"
        >
          No image type selected
        </div>

        <div
          v-else-if="store.templatesForCurrentType.length === 0"
          class="px-4 py-6 text-center text-gray-400 dark:text-zinc-600 text-sm"
        >
          No templates found
        </div>

        <div v-else class="px-3 pb-4 grid grid-cols-1 gap-2">
          <TemplateCard
            v-for="tpl in store.templatesForCurrentType"
            :key="tpl.id"
            :template="tpl"
            :is-active="store.currentTemplate?.id === tpl.id"
            @select="store.loadTemplate($event)"
          />
        </div>
      </div>

      <!-- Quick add + image upload (when template loaded) -->
      <template v-if="store.currentTemplate">
        <div class="h-px bg-gray-100 dark:bg-zinc-800 mx-4" />

        <!-- Quick Add -->
        <div>
          <p class="section-label">Quick Add</p>
          <div class="px-3 pb-3 flex flex-col gap-1.5">
            <button
              class="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-medium
                     bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20
                     hover:bg-brand-500/20 transition-colors duration-150"
              @click="store.addTitleElement()"
            >
              <span class="text-base font-black leading-none">T</span>
              Add Title
            </button>
            <button
              class="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm
                     text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700
                     hover:border-brand-500 hover:text-brand-500 transition-colors duration-150"
              @click="store.addSubtitleElement()"
            >
              <span class="text-sm leading-none">T</span>
              Add Subtitle
            </button>
            <button
              class="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm
                     text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700
                     hover:border-brand-500 hover:text-brand-500 transition-colors duration-150"
              @click="store.addTextElement()"
            >
              <span class="text-xs leading-none">T</span>
              Add Text
            </button>
          </div>
        </div>

        <div class="h-px bg-gray-100 dark:bg-zinc-800 mx-4" />

        <!-- Image upload panel -->
        <ImageUploadPanel />
      </template>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useEditorStore } from '@/store/editor'
import TemplateCard       from '@/components/ui/TemplateCard.vue'
import ImageUploadPanel   from '@/components/ui/ImageUploadPanel.vue'

const store = useEditorStore()

const LS_KEY = 'fastee-left-panel-collapsed'
const collapsed = ref(localStorage.getItem(LS_KEY) === 'true')

function toggleCollapsed() {
  collapsed.value = !collapsed.value
  localStorage.setItem(LS_KEY, String(collapsed.value))
}
</script>
