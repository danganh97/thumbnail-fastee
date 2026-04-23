import { watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useEditorStore } from '@/store/editor'
import { useAuth } from '@/composables/useAuth'
import { updateEditor } from '@/services/editorApi'
import { updateSharedEditorByCode } from '@/services/shareApi'

export function useAutoSave(options?: {
  onRemoteSaved?: (updatedAt: string) => void
  getShareCode?: () => string | null
}) {
  const store = useEditorStore()
  const auth = useAuth()

  const debouncedSave = useDebounceFn(async () => {
    if (!store.currentTemplate) return
    store.saveToLocalStorage()
    if (store.editorLoadSource === 'share') {
      if (store.readOnly) return
      const shareCode = options?.getShareCode?.()
      if (!shareCode) return
      try {
        const response = await updateSharedEditorByCode(shareCode, {
          name: store.currentTemplate.name,
          payload: {
            template: JSON.parse(JSON.stringify(store.currentTemplate)),
            elements: JSON.parse(JSON.stringify(store.elements)),
            selectedId: store.selectedId,
          },
        })
        options?.onRemoteSaved?.(response.updatedAt)
      } catch {
        // Local draft is already saved; keep UI responsive on transient API failures.
      }
      return
    }
    if (!auth.currentUser.value) return
    if (!store.activeEditorId) return
    try {
      const response = await updateEditor(store.activeEditorId, {
        name: store.currentTemplate.name,
        payload: {
          template: JSON.parse(JSON.stringify(store.currentTemplate)),
          elements: JSON.parse(JSON.stringify(store.elements)),
          selectedId: store.selectedId,
        },
      })
      options?.onRemoteSaved?.(response.updatedAt)
    } catch {
      // Local draft is already saved; keep UI responsive on transient API failures.
    }
  }, 1500)

  watch(
    () => [store.elements, store.currentTemplate?.name] as const,
    () => {
      if (!store.currentTemplate) return
      if (store.isDirty || store.editorLoadSource === 'share' || Boolean(store.activeEditorId)) {
        debouncedSave()
      }
    },
    { deep: true },
  )

  return { debouncedSave }
}
