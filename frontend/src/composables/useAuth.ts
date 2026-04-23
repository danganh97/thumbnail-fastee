import { ref } from 'vue'
import { fetchCurrentUser, loginWithGoogleOneTap, logoutCurrentUser } from '@/services/authApi'
import type { AuthUser } from '@/types'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string
            callback: (response: { credential: string }) => void
            auto_select?: boolean
            ux_mode?: 'popup' | 'redirect'
            itp_support?: boolean
            use_fedcm_for_prompt?: boolean
          }) => void
          prompt: () => void
        }
      }
    }
  }
}

const currentUser = ref<AuthUser | null>(null)
const isLoading = ref(false)
const authReady = ref(false)
const authError = ref('')
let initialized = false

function googleClientId(): string {
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() ?? ''
}

async function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Identity script'))
    document.head.appendChild(script)
  })
}

async function refreshCurrentUser(): Promise<void> {
  currentUser.value = await fetchCurrentUser()
}

async function initializeGoogleOneTap(): Promise<void> {
  const clientId = googleClientId()
  if (!clientId) return
  await loadGoogleScript()
  if (!window.google?.accounts?.id) return

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: async response => {
      try {
        isLoading.value = true
        await loginWithGoogleOneTap(response.credential)
        await refreshCurrentUser()
      } catch (error) {
        authError.value = error instanceof Error ? error.message : 'Google login failed'
      } finally {
        isLoading.value = false
      }
    },
    auto_select: false,
    ux_mode: 'popup',
    itp_support: true,
    use_fedcm_for_prompt: true,
  })

  if (!currentUser.value) {
    window.google.accounts.id.prompt()
  }
}

export async function promptGoogleLogin(): Promise<void> {
  try {
    authError.value = ''
    await initializeGoogleOneTap()
    if (!currentUser.value && window.google?.accounts?.id) {
      window.google.accounts.id.prompt()
    }
  } catch (error) {
    authError.value = error instanceof Error ? error.message : 'Unable to start Google login'
  }
}

export async function initAuth(): Promise<void> {
  if (initialized) return
  initialized = true
  isLoading.value = true
  try {
    await refreshCurrentUser()
    await initializeGoogleOneTap()
  } finally {
    isLoading.value = false
    authReady.value = true
  }
}

export async function logout(): Promise<void> {
  await logoutCurrentUser()
  currentUser.value = null
}

export function useAuth() {
  return {
    currentUser,
    isLoading,
    authReady,
    authError,
    initAuth,
    promptGoogleLogin,
    refreshCurrentUser,
    logout,
  }
}
