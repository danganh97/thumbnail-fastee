import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useEditorStore } from '@/store/editor'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/platform/:platformId',
    name: 'platform',
    component: () => import('@/views/ImageTypeView.vue'),
  },
  {
    path: '/editor',
    name: 'editor',
    component: () => import('@/views/EditorView.vue'),
  },
  {
    path: '/editors/:editorId',
    name: 'editor-by-id',
    component: () => import('@/views/EditorView.vue'),
  },
  {
    path: '/share/:code',
    name: 'share',
    component: () => import('@/views/ShareRedirectView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const fromIsEditor = from.name === 'editor' || from.name === 'editor-by-id'
  const toIsEditor = to.name === 'editor' || to.name === 'editor-by-id'
  if (fromIsEditor && !toIsEditor) {
    const store = useEditorStore()
    if (store.isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      )
      if (!confirmed) {
        next(false)
        return
      }
      store.saveToLocalStorage()
    }
  }
  next()
})

export default router
