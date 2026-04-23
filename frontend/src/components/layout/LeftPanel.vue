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
        <div class="relative" data-more-icons-popup>
          <p class="section-label">Quick Add</p>
          <div class="px-3 pb-3 grid grid-cols-4 gap-1.5">
            <button
              class="h-10 rounded-xl text-sm font-medium flex items-center justify-center
                     bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20
                     hover:bg-brand-500/20 transition-colors duration-150"
              title="Add Text"
              @click="store.addTextElement()"
            >
              <span class="text-base font-black leading-none">T</span>
            </button>
            <button
              class="h-10 rounded-xl text-sm flex items-center justify-center
                     text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700
                     hover:border-brand-500 hover:text-brand-500 transition-colors duration-150"
              title="Add Rectangle"
              @click="store.addRectangleElement()"
            >
              <span class="text-sm leading-none">▭</span>
            </button>
            <button
              class="h-10 rounded-xl text-sm flex items-center justify-center
                     text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700
                     hover:border-brand-500 hover:text-brand-500 transition-colors duration-150"
              title="Add Like Button"
              @click="store.addSocialButtonPreset('like')"
            >
              <i class="bi bi-hand-thumbs-up-fill text-sm leading-none" />
            </button>
            <button
              class="h-10 rounded-xl text-sm flex items-center justify-center
                     text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700
                     hover:border-brand-500 hover:text-brand-500 transition-colors duration-150"
              title="Add Subscribe Button"
              @click="store.addSocialButtonPreset('subscribe')"
            >
              <i class="bi bi-bell-fill text-sm leading-none" />
            </button>
            <button
              class="h-10 rounded-xl text-sm flex items-center justify-center
                     text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700
                     hover:border-brand-500 hover:text-brand-500 transition-colors duration-150"
              title="Add Share Button"
              @click="store.addSocialButtonPreset('share')"
            >
              <i class="bi bi-share-fill text-sm leading-none" />
            </button>
            <button
              class="h-10 rounded-xl text-sm flex items-center justify-center
                     text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700
                     hover:border-brand-500 hover:text-brand-500 transition-colors duration-150"
              title="Add Camera Icon"
              @click="store.addIconElement('camera-fill', 'bootstrap')"
            >
              <i class="bi bi-camera-fill text-sm leading-none" />
            </button>
            <button
              class="h-10 rounded-xl text-sm flex items-center justify-center
                     text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700
                     hover:border-brand-500 hover:text-brand-500 transition-colors duration-150"
              title="Add Megaphone Icon"
              @click="store.addIconElement('megaphone-fill', 'bootstrap')"
            >
              <i class="bi bi-megaphone-fill text-sm leading-none" />
            </button>
            <button
              class="h-10 rounded-xl text-sm flex items-center justify-center
                     text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700
                     hover:border-brand-500 hover:text-brand-500 transition-colors duration-150"
              title="More Icons"
              @click="showMoreIcons = !showMoreIcons"
            >
              <i class="fa-solid fa-icons text-sm leading-none" />
            </button>
          </div>
          <div
            v-if="showMoreIcons"
            class="absolute top-2 right-3 w-72 z-30 rounded-xl border border-gray-200 dark:border-zinc-700
                   bg-white dark:bg-zinc-900 shadow-xl p-3"
          >
            <div class="flex items-center justify-between mb-2">
              <p class="text-[10px] uppercase tracking-wider text-zinc-400">More Icons</p>
              <button
                class="text-zinc-400 hover:text-zinc-200 transition-colors"
                title="Close icons popup"
                @click="showMoreIcons = false"
              >
                <i class="fa-solid fa-xmark text-xs" />
              </button>
            </div>
            <div class="grid grid-cols-5 gap-1.5 max-h-48 overflow-y-auto pr-1">
              <button
                v-for="icon in moreFontAwesomeIcons"
                :key="icon.icon"
                class="h-9 rounded-lg text-xs flex items-center justify-center
                       text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700
                       hover:border-brand-500 hover:text-brand-500 transition-colors duration-150"
                :title="`Add ${icon.label} icon`"
                @click="store.addIconElement(icon.icon, 'fontawesome')"
              >
                <i :class="icon.previewClass" class="text-sm leading-none" />
              </button>
            </div>
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
import { ref, onMounted, onUnmounted } from 'vue'
import { useEditorStore } from '@/store/editor'
import TemplateCard       from '@/components/ui/TemplateCard.vue'
import ImageUploadPanel   from '@/components/ui/ImageUploadPanel.vue'

const store = useEditorStore()

const LS_KEY = 'fastee-left-panel-collapsed'
const collapsed = ref(localStorage.getItem(LS_KEY) === 'true')
const showMoreIcons = ref(false)
const moreFontAwesomeIcons = [
  { label: 'Heart', icon: 'fa-heart', previewClass: 'fa-solid fa-heart' },
  { label: 'Star', icon: 'fa-star', previewClass: 'fa-solid fa-star' },
  { label: 'Bolt', icon: 'fa-bolt', previewClass: 'fa-solid fa-bolt' },
  { label: 'Camera', icon: 'fa-camera', previewClass: 'fa-solid fa-camera' },
  { label: 'Bell', icon: 'fa-bell', previewClass: 'fa-solid fa-bell' },
  { label: 'Comment', icon: 'fa-comment', previewClass: 'fa-solid fa-comment' },
  { label: 'Envelope', icon: 'fa-envelope', previewClass: 'fa-solid fa-envelope' },
  { label: 'Phone', icon: 'fa-phone', previewClass: 'fa-solid fa-phone' },
  { label: 'House', icon: 'fa-house', previewClass: 'fa-solid fa-house' },
  { label: 'Gear', icon: 'fa-gear', previewClass: 'fa-solid fa-gear' },
  { label: 'Fire', icon: 'fa-fire', previewClass: 'fa-solid fa-fire' },
  { label: 'Music', icon: 'fa-music', previewClass: 'fa-solid fa-music' },
  { label: 'Image', icon: 'fa-image', previewClass: 'fa-solid fa-image' },
  { label: 'Video', icon: 'fa-video', previewClass: 'fa-solid fa-video' },
  { label: 'Trophy', icon: 'fa-trophy', previewClass: 'fa-solid fa-trophy' },
  { label: 'Bookmark', icon: 'fa-bookmark', previewClass: 'fa-solid fa-bookmark' },
  { label: 'Check', icon: 'fa-circle-check', previewClass: 'fa-solid fa-circle-check' },
  { label: 'X Mark', icon: 'fa-circle-xmark', previewClass: 'fa-solid fa-circle-xmark' },
  { label: 'User', icon: 'fa-user', previewClass: 'fa-solid fa-user' },
  { label: 'Play', icon: 'fa-play', previewClass: 'fa-solid fa-play' },
  { label: 'Pause', icon: 'fa-pause', previewClass: 'fa-solid fa-pause' },
]

function toggleCollapsed() {
  collapsed.value = !collapsed.value
  localStorage.setItem(LS_KEY, String(collapsed.value))
}

function onClickOutsideMoreIcons(event: MouseEvent): void {
  const target = event.target as HTMLElement | null
  if (target?.closest('[data-more-icons-popup]')) return
  showMoreIcons.value = false
}

onMounted(() => {
  document.addEventListener('click', onClickOutsideMoreIcons)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutsideMoreIcons)
})
</script>
