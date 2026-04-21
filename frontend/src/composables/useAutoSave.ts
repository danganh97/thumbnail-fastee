import { watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useEditorStore } from '@/store/editor'

export function useAutoSave() {
  const store = useEditorStore()

  const debouncedSave = useDebounceFn(() => {
    if (!store.currentTemplate) return
    store.saveToLocalStorage()
  }, 1500)

  watch(
    () => [store.elements, store.backgroundImage] as const,
    () => {
      if (store.isDirty) debouncedSave()
    },
    { deep: true },
  )

  return { debouncedSave }
}
