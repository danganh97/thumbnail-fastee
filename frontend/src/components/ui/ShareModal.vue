<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/45" @click="emit('close')" />
    <div class="relative w-full max-w-xl rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl">
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-zinc-800">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-zinc-100">Share Design</h2>
        <button class="btn-ghost p-2" title="Close" @click="emit('close')">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="px-5 py-4 space-y-4">
        <p class="text-sm text-gray-600 dark:text-zinc-400">Choose who can access, what they can do, and expiry settings.</p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-zinc-500 mb-1">Access</label>
            <div class="space-y-1.5">
              <label
                class="flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer"
                :class="localAccessMode === 'anyone' ? 'border-brand-500 bg-brand-500/10' : 'border-zinc-700'"
              >
                <input
                  v-model="localAccessMode"
                  type="radio"
                  name="access-mode"
                  value="anyone"
                  class="accent-brand-500"
                />
                <span class="text-sm text-zinc-200">Anyone with link</span>
              </label>
              <label
                class="flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer"
                :class="localAccessMode === 'specific_users' ? 'border-brand-500 bg-brand-500/10' : 'border-zinc-700'"
              >
                <input
                  v-model="localAccessMode"
                  type="radio"
                  name="access-mode"
                  value="specific_users"
                  class="accent-brand-500"
                />
                <span class="text-sm text-zinc-200">Specific users</span>
              </label>
            </div>
          </div>
          <div>
            <label class="block text-xs text-zinc-500 mb-1">Permission</label>
            <div class="space-y-1.5">
              <label
                class="flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer"
                :class="localPermissionMode === 'view' ? 'border-brand-500 bg-brand-500/10' : 'border-zinc-700'"
              >
                <input
                  v-model="localPermissionMode"
                  type="radio"
                  name="permission-mode"
                  value="view"
                  class="accent-brand-500"
                />
                <span class="text-sm text-zinc-200">View only</span>
              </label>
              <label
                class="flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer"
                :class="localPermissionMode === 'edit' ? 'border-brand-500 bg-brand-500/10' : 'border-zinc-700'"
              >
                <input
                  v-model="localPermissionMode"
                  type="radio"
                  name="permission-mode"
                  value="edit"
                  class="accent-brand-500"
                />
                <span class="text-sm text-zinc-200">Can edit</span>
              </label>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-xs text-zinc-500 mb-1">Expiry</label>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <label
              class="flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer"
              :class="expiryMode === 'forever' ? 'border-brand-500 bg-brand-500/10' : 'border-zinc-700'"
            >
              <input
                v-model="expiryMode"
                type="radio"
                name="expiry-mode"
                value="forever"
                class="accent-brand-500"
              />
              <span class="text-sm text-zinc-200">Never expire</span>
            </label>
            <label
              class="flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer"
              :class="expiryMode === 'hours' ? 'border-brand-500 bg-brand-500/10' : 'border-zinc-700'"
            >
              <input
                v-model="expiryMode"
                type="radio"
                name="expiry-mode"
                value="hours"
                class="accent-brand-500"
              />
              <span class="text-sm text-zinc-200">Expire after</span>
            </label>
          </div>
          <div v-if="expiryMode === 'hours'" class="mt-2">
            <select v-model.number="expiresInHours" class="input-field text-sm">
              <option v-for="hours in expiryHourOptions" :key="hours" :value="hours">
                {{ hours }} hour<span v-if="hours !== 1">s</span>
              </option>
            </select>
          </div>
        </div>

        <div v-if="localAccessMode === 'specific_users'">
          <label class="block text-xs text-zinc-500 mb-1">Allowed emails</label>
          <div class="rounded-lg border border-zinc-700 p-2 min-h-11 flex flex-wrap items-center gap-1.5">
            <span
              v-for="email in localAllowedEmails"
              :key="email"
              class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs bg-zinc-800 text-zinc-200"
            >
              {{ email }}
              <button
                type="button"
                class="text-zinc-400 hover:text-zinc-100"
                @click="removeEmail(email)"
              >
                ×
              </button>
            </span>
            <input
              v-model="emailInput"
              class="flex-1 min-w-40 bg-transparent outline-none text-xs text-zinc-200"
              placeholder="Type email then press Tab / Enter / Space"
              @keydown="onEmailKeydown"
            />
          </div>
        </div>

        <div class="flex items-center justify-end">
          <button
            v-if="!hasExistingShare"
            class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-brand-500 to-purple-600 disabled:opacity-50"
            :disabled="isCreating"
            @click="emitCreateShare"
          >
            {{ isCreating ? 'Creating...' : 'Create Link' }}
          </button>
        </div>

        <div class="rounded-xl border border-gray-200 dark:border-zinc-700 p-3 flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
          <img v-if="qrDataUrl" :src="qrDataUrl" alt="Share QR code" class="w-56 h-56 rounded-lg" />
          <div v-else class="text-sm text-gray-500 dark:text-zinc-400 py-12">Generating QR…</div>
        </div>

        <div class="space-y-2">
          <label class="block text-xs text-zinc-500">Share link</label>
          <div class="flex gap-2">
            <input :value="shareUrl" readonly class="input-field text-xs font-mono flex-1" />
            <button class="btn-ghost text-sm whitespace-nowrap" :disabled="!shareUrl" @click="copyLink">Copy</button>
          </div>
        </div>

        <p class="text-xs text-zinc-500">Expires: {{ expiresLabel }}</p>
        <p v-if="copyMessage" class="text-xs text-brand-400">{{ copyMessage }}</p>
        <p v-if="statusMessage" class="text-xs text-emerald-500">{{ statusMessage }}</p>
        <p v-if="errorMessage" class="text-xs text-red-500">{{ errorMessage }}</p>
      </div>

      <div class="px-5 py-4 border-t border-gray-200 dark:border-zinc-800 flex items-center justify-between">
        <button class="btn-ghost text-sm text-red-400" :disabled="isDeleting || !shareUrl" @click="emit('delete-share')">
          {{ isDeleting ? 'Deleting…' : 'Delete Share' }}
        </button>
        <button
          class="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-500 to-purple-600 disabled:opacity-50"
          :disabled="isCreating"
          @click="onDone"
        >
          {{ hasExistingShare ? (isCreating ? 'Saving...' : 'Save & Done') : 'Done' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import QRCode from 'qrcode'

const props = defineProps<{
  shareUrl: string
  expiresAt: string | null
  accessMode?: 'anyone' | 'specific_users'
  permissionMode?: 'view' | 'edit'
  allowedEmails?: string[]
  expiresInSeconds?: number | null
  hasExistingShare?: boolean
  isCreating?: boolean
  isDeleting?: boolean
  statusMessage?: string
  errorMessage?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'delete-share'): void
  (e: 'create-share', payload: {
    accessMode: 'anyone' | 'specific_users'
    permissionMode: 'view' | 'edit'
    allowedEmails: string[]
    expiresInSeconds: number | null
  }): void
  (e: 'save-config-and-close', payload: {
    accessMode: 'anyone' | 'specific_users'
    permissionMode: 'view' | 'edit'
    allowedEmails: string[]
    expiresInSeconds: number | null
  }): void
}>()

const qrDataUrl = ref('')
const localAccessMode = ref<'anyone' | 'specific_users'>(props.accessMode ?? 'anyone')
const localPermissionMode = ref<'view' | 'edit'>(props.permissionMode ?? 'edit')
const localAllowedEmails = ref<string[]>([...(props.allowedEmails ?? [])])
const emailInput = ref('')
const copyMessage = ref('')
const expiryMode = ref<'forever' | 'hours'>('hours')
const expiresInHours = ref(24)
const expiryHourOptions = [1, 6, 12, 24, 48, 72, 168]
let copyTimer = 0

const expiresLabel = computed(() => {
  if (!props.expiresAt) return 'Never'
  const date = new Date(props.expiresAt)
  return Number.isNaN(date.getTime()) ? props.expiresAt : date.toLocaleString()
})
const hasExistingShare = computed(() => Boolean(props.hasExistingShare))

async function copyLink(): Promise<void> {
  if (!props.shareUrl) return
  try {
    await navigator.clipboard.writeText(props.shareUrl)
    copyMessage.value = 'Copied'
    clearTimeout(copyTimer)
    copyTimer = window.setTimeout(() => {
      copyMessage.value = ''
    }, 1200)
  } catch {
    copyMessage.value = 'Failed to copy'
  }
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

function pushEmailFromInput(): void {
  const value = normalizeEmail(emailInput.value)
  if (!value) return
  if (!localAllowedEmails.value.includes(value)) {
    localAllowedEmails.value.push(value)
  }
  emailInput.value = ''
}

function removeEmail(email: string): void {
  localAllowedEmails.value = localAllowedEmails.value.filter(value => value !== email)
}

function onEmailKeydown(event: KeyboardEvent): void {
  if (['Enter', 'Tab', ' ', ','].includes(event.key)) {
    event.preventDefault()
    pushEmailFromInput()
    return
  }
  if (event.key === 'Backspace' && !emailInput.value && localAllowedEmails.value.length > 0) {
    localAllowedEmails.value = localAllowedEmails.value.slice(0, -1)
  }
}

function currentSharePayloadConfig(): {
  accessMode: 'anyone' | 'specific_users'
  permissionMode: 'view' | 'edit'
  allowedEmails: string[]
  expiresInSeconds: number | null
} {
  pushEmailFromInput()
  return {
    accessMode: localAccessMode.value,
    permissionMode: localPermissionMode.value,
    allowedEmails: localAllowedEmails.value,
    expiresInSeconds: expiryMode.value === 'forever' ? null : Math.max(1, Math.floor(expiresInHours.value)) * 3600,
  }
}

function emitCreateShare(): void {
  emit('create-share', currentSharePayloadConfig())
}

function onDone(): void {
  if (hasExistingShare.value) {
    emit('save-config-and-close', currentSharePayloadConfig())
    return
  }
  emit('close')
}

watch(
  () => props.accessMode,
  value => {
    localAccessMode.value = value ?? 'anyone'
  },
  { immediate: true },
)

watch(
  () => props.permissionMode,
  value => {
    localPermissionMode.value = value ?? 'edit'
  },
  { immediate: true },
)

watch(
  () => props.allowedEmails,
  value => {
    localAllowedEmails.value = [...(value ?? [])]
  },
  { immediate: true },
)

watch(
  () => props.expiresInSeconds,
  value => {
    if (value === null) {
      expiryMode.value = 'forever'
      return
    }
    const hours = typeof value === 'number' && value > 0 ? Math.max(1, Math.round(value / 3600)) : 24
    expiryMode.value = 'hours'
    expiresInHours.value = hours
  },
  { immediate: true },
)

watch(
  () => props.shareUrl,
  async value => {
    qrDataUrl.value = ''
    if (!value) return
    qrDataUrl.value = await QRCode.toDataURL(value, {
      margin: 1,
      width: 320,
    })
  },
  { immediate: true },
)

onUnmounted(() => {
  clearTimeout(copyTimer)
})
</script>
