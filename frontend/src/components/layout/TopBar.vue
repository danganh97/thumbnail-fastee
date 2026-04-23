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
      <div class="relative ml-2" data-file-menu>
        <button
          class="btn-ghost text-sm px-2.5 py-1.5"
          title="File menu"
          @click="toggleFileMenu"
        >
          File
        </button>
        <div
          v-if="showFileMenu"
          class="absolute left-0 top-full mt-1.5 w-44 rounded-xl border border-gray-200 dark:border-zinc-700
                 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden"
        >
          <button
            class="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            @click="onNewFile"
          >
            New...
          </button>
          <button
            class="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            @click="onSave"
          >
            Save...
          </button>
          <button
            class="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            @click="onPrint"
          >
            Print
          </button>
        </div>
      </div>
      <nav
        v-if="props.breadcrumbs.length"
        aria-label="Breadcrumb"
        class="hidden md:block ml-2"
      >
        <ol class="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400">
          <li
            v-for="(crumb, index) in props.breadcrumbs"
            :key="`${crumb.label}-${index}`"
            class="flex items-center gap-2 min-w-0"
          >
            <RouterLink
              v-if="crumb.to && !crumb.current"
              :to="crumb.to"
              class="hover:text-brand-500 transition-colors truncate max-w-[140px]"
            >
              {{ crumb.label }}
            </RouterLink>
            <span
              v-else
              class="truncate max-w-[180px]"
              :class="crumb.current ? 'text-gray-800 dark:text-zinc-200 font-medium' : ''"
            >
              {{ crumb.label }}
            </span>
            <span v-if="index < props.breadcrumbs.length - 1" class="text-gray-400 dark:text-zinc-600">/</span>
          </li>
        </ol>
      </nav>
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
        <template v-if="isRenaming">
          <input
            ref="renameInputRef"
            v-model="renameValue"
            class="input-field h-7 text-xs max-w-[220px]"
            maxlength="255"
            @keydown.enter.prevent="commitRename"
            @keydown.esc.prevent="cancelRename"
            @blur="commitRename"
          />
        </template>
        <template v-else>
          <button
            class="text-sm text-gray-600 dark:text-zinc-400 font-medium truncate max-w-[180px] hover:text-brand-500 transition-colors"
            :disabled="store.readOnly"
            title="Rename editor"
            @click="startRename"
          >
            {{ store.currentTemplate.name }}
          </button>
        </template>
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
        <span
          v-if="store.readOnly"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
        >
          View only
        </span>
      </div>
    </div>

    <!-- Right actions -->
    <div class="flex items-center gap-1.5">
      <div class="relative" data-recent-menu>
        <button
          class="btn-ghost text-sm px-2.5 py-1.5"
          title="Recent edits"
          @click="toggleRecentMenu"
        >
          Recent
        </button>
        <div
          v-if="showRecentMenu"
          class="absolute right-0 top-full mt-1.5 w-72 rounded-xl border border-gray-200 dark:border-zinc-700
                 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden z-20"
        >
          <div
            v-if="!props.recentItems.length"
            class="px-3 py-2 text-xs text-gray-500 dark:text-zinc-400"
          >
            No recent edits yet.
          </div>
          <div
            v-for="item in props.recentItems"
            :key="item.editorId"
            class="group flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <button
              class="flex-1 min-w-0 text-left"
              @click="onOpenRecent(item)"
            >
              <p class="text-sm font-medium text-gray-800 dark:text-zinc-200 truncate">{{ item.title }}</p>
              <p class="text-xs text-gray-500 dark:text-zinc-400 truncate">{{ item.subtitle }}</p>
            </button>
            <button
              class="shrink-0 rounded-md p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors opacity-0 group-hover:opacity-100"
              title="Delete editor"
              @click.stop="onDeleteRecent(item.editorId)"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-3h4m-8 3h12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

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

      <button
        v-if="store.currentTemplate"
        class="btn-ghost text-sm flex items-center gap-1.5"
        title="Share via QR code"
        :disabled="store.readOnly"
        @click="emit('share')"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm12 2h2m2 0h-2m0 0v-2m0 2v2m-4 2h2" />
        </svg>
        <span class="hidden sm:inline">Share</span>
      </button>

      <span
        v-if="auth.currentUser.value"
        class="text-xs text-gray-500 dark:text-zinc-400 max-w-[180px] truncate"
      >
        {{ auth.currentUser.value.name || auth.currentUser.value.email }}
      </span>
      <button
        v-if="auth.currentUser.value"
        class="btn-ghost text-sm"
        title="Logout"
        @click="auth.logout()"
      >
        Logout
      </button>
      <button
        v-else-if="auth.authReady.value"
        class="btn-ghost text-sm text-amber-600 dark:text-amber-400 disabled:opacity-50"
        :disabled="auth.isLoading.value"
        @click="auth.promptGoogleLogin()"
      >
        Login with Google
      </button>

      <button
        v-if="store.currentTemplate"
        class="btn-ghost text-sm flex items-center gap-1.5"
        title="Reset editor to template defaults"
        :disabled="store.readOnly"
        @click="store.resetToTemplateDefaults()"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M16.023 9.348h4.992V4.356m0 0l-2.526 2.527a9 9 0 11-2.223-1.39"
          />
        </svg>
        <span class="hidden sm:inline">Reset</span>
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

      <div
        v-if="props.activeUsers.length"
        class="relative hidden md:flex items-center ml-1"
        data-presence-menu
      >
        <button
          type="button"
          class="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
          @click="togglePresenceMenu"
        >
          <div class="flex -space-x-2">
            <span
              v-for="user in props.activeUsers.slice(0, 4)"
              :key="user.sessionId"
              class="w-7 h-7 rounded-full border border-white dark:border-zinc-900 text-[10px] font-semibold flex items-center justify-center"
              :class="avatarClass(user.sessionId)"
              :title="user.displayName"
            >
              {{ initials(user.displayName) }}
            </span>
            <span
              v-if="props.activeUsers.length > 4"
              class="w-7 h-7 rounded-full border border-white dark:border-zinc-900 text-[10px] font-semibold flex items-center justify-center bg-zinc-700 text-zinc-100"
            >
              +{{ props.activeUsers.length - 4 }}
            </span>
          </div>
        </button>
        <div
          v-if="showPresenceMenu"
          class="absolute right-0 top-full mt-1.5 w-64 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl p-2 z-20"
        >
          <p class="px-2 pb-1 text-xs text-zinc-500">People on this editor</p>
          <div class="max-h-56 overflow-y-auto space-y-1">
            <div
              v-for="user in props.activeUsers"
              :key="user.sessionId"
              class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
            >
              <span
                class="w-7 h-7 rounded-full text-[10px] font-semibold flex items-center justify-center"
                :class="avatarClass(user.sessionId)"
              >
                {{ initials(user.displayName) }}
              </span>
              <span class="text-xs text-gray-700 dark:text-zinc-200 truncate">{{ user.displayName }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import type { RouteLocationRaw } from 'vue-router'
import { useEditorStore } from '@/store/editor'
import { useColorMode }   from '@/composables/useColorMode'
import { useAuth } from '@/composables/useAuth'
import type { PresenceUser } from '@/types'

interface RecentItem {
  editorId: string
  title: string
  subtitle: string
}

interface BreadcrumbItem {
  label: string
  to?: RouteLocationRaw
  current?: boolean
}

const router    = useRouter()
const store     = useEditorStore()
const colorMode = useColorMode()
const auth      = useAuth()
const emit      = defineEmits<{
  (e: 'export'): void
  (e: 'share'): void
  (e: 'new-file'): void
  (e: 'save'): void
  (e: 'print'): void
  (e: 'open-recent', item: RecentItem): void
  (e: 'delete-recent', editorId: string): void
}>()
const props = withDefaults(defineProps<{
  recentItems: RecentItem[]
  breadcrumbs?: BreadcrumbItem[]
  activeUsers?: PresenceUser[]
}>(), {
  breadcrumbs: () => [],
  activeUsers: () => [],
})
const showFileMenu = ref(false)
const showRecentMenu = ref(false)
const showPresenceMenu = ref(false)
const isRenaming = ref(false)
const renameValue = ref('')
const renameInputRef = ref<HTMLInputElement | null>(null)

function goHome(): void {
  router.push({ name: 'home' })
}

function toggleFileMenu(): void {
  showFileMenu.value = !showFileMenu.value
  if (showFileMenu.value) {
    showRecentMenu.value = false
    showPresenceMenu.value = false
  }
}

function startRename(): void {
  if (!store.currentTemplate || store.readOnly) return
  renameValue.value = store.currentTemplate.name
  isRenaming.value = true
  nextTick(() => {
    renameInputRef.value?.focus()
    renameInputRef.value?.select()
  })
}

function commitRename(): void {
  if (!isRenaming.value) return
  const value = renameValue.value.trim()
  if (value) {
    store.setCurrentTemplateName(value)
  }
  isRenaming.value = false
}

function cancelRename(): void {
  isRenaming.value = false
}

function toggleRecentMenu(): void {
  showRecentMenu.value = !showRecentMenu.value
  if (showRecentMenu.value) {
    showFileMenu.value = false
    showPresenceMenu.value = false
  }
}

function togglePresenceMenu(): void {
  showPresenceMenu.value = !showPresenceMenu.value
  if (showPresenceMenu.value) {
    showFileMenu.value = false
    showRecentMenu.value = false
  }
}

function onNewFile(): void {
  showFileMenu.value = false
  emit('new-file')
}

function onSave(): void {
  showFileMenu.value = false
  emit('save')
}

function onPrint(): void {
  showFileMenu.value = false
  emit('print')
}

function onOpenRecent(item: RecentItem): void {
  showRecentMenu.value = false
  emit('open-recent', item)
}

function onDeleteRecent(editorId: string): void {
  emit('delete-recent', editorId)
}

function onWindowClick(event: MouseEvent): void {
  const target = event.target as HTMLElement | null
  if (target?.closest('[data-file-menu]') || target?.closest('[data-recent-menu]') || target?.closest('[data-presence-menu]')) return
  showFileMenu.value = false
  showRecentMenu.value = false
  showPresenceMenu.value = false
}

function onWindowKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    showFileMenu.value = false
    showRecentMenu.value = false
    showPresenceMenu.value = false
  }
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/g).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0]?.[0] ?? ''
  const second = parts[1]?.[0] ?? ''
  return `${first}${second}`.toUpperCase()
}

function avatarClass(seed: string): string {
  const palette = [
    'bg-indigo-500 text-white',
    'bg-emerald-500 text-white',
    'bg-amber-500 text-black',
    'bg-pink-500 text-white',
    'bg-sky-500 text-white',
    'bg-violet-500 text-white',
  ]
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return palette[hash % palette.length]
}

onMounted(() => {
  window.addEventListener('click', onWindowClick)
  window.addEventListener('keydown', onWindowKeydown)
})

onUnmounted(() => {
  window.removeEventListener('click', onWindowClick)
  window.removeEventListener('keydown', onWindowKeydown)
})
</script>
