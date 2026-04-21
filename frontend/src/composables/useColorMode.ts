import { ref, watch } from 'vue'

type ColorMode = 'dark' | 'light'

const mode = ref<ColorMode>(
  (localStorage.getItem('color-mode') as ColorMode | null) ?? 'dark',
)

function applyMode(m: ColorMode): void {
  document.documentElement.classList.toggle('dark', m === 'dark')
  document.documentElement.classList.toggle('light', m === 'light')
}

// Apply immediately on module load
applyMode(mode.value)

watch(mode, m => {
  applyMode(m)
  localStorage.setItem('color-mode', m)
})

export function useColorMode() {
  const toggle = (): void => {
    mode.value = mode.value === 'dark' ? 'light' : 'dark'
  }
  return { mode, toggle }
}
