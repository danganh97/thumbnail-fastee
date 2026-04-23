<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 px-4">
    <div class="w-full max-w-md rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl">
      <h1 class="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-2">Open Shared Design</h1>
      <p class="text-sm text-gray-600 dark:text-zinc-400 mb-4">{{ message }}</p>
      <button
        v-if="requiresLogin && auth.authReady.value"
        class="mb-3 w-full px-4 py-2 rounded-xl text-sm font-semibold text-amber-700 dark:text-amber-300 border border-amber-400/60 dark:border-amber-500/40 hover:bg-amber-100/70 dark:hover:bg-amber-900/20 disabled:opacity-50"
        :disabled="auth.isLoading.value"
        @click="auth.promptGoogleLogin()"
      >
        {{ auth.isLoading.value ? 'Opening Google Login...' : 'Login with Google' }}
      </button>
      <button
        v-if="hasError"
        class="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-500 to-purple-600"
        @click="goHome"
      >
        Back to Home
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import axios from 'axios'
import { useRoute, useRouter } from 'vue-router'
import { getShareByCode } from '@/services/shareApi'
import { useAuth } from '@/composables/useAuth'
import { useEditorStore } from '@/store/editor'

const route = useRoute()
const router = useRouter()
const store = useEditorStore()
const auth = useAuth()
const message = ref('Loading shared design...')
const hasError = ref(false)
const requiresLogin = ref(false)

function goHome(): void {
  router.replace({ name: 'home' })
}

onMounted(async () => {
  const code = String(route.params.code ?? '').trim()
  if (!code) {
    message.value = 'Invalid share link.'
    hasError.value = true
    requiresLogin.value = false
    return
  }

  try {
    const data = await getShareByCode(code)
    store.loadSharedSnapshot(data.payload, { permissionMode: data.permissionMode })
    router.replace({
      name: 'editor',
      query: {
        source: 'share',
        shareCode: code,
        platform: data.payload.template.platform,
        type: data.payload.template.imageType,
        template: data.payload.template.id,
      },
    })
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      message.value = 'This shared editor requires login. Please sign in with an authorized account to edit.'
      hasError.value = true
      requiresLogin.value = true
      return
    }
    message.value = 'This share link is expired or unavailable.'
    hasError.value = true
    requiresLogin.value = false
  }
})
</script>
