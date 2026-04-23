import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import {
  createEditorRecord,
  deleteEditorRecord,
  getEditorRecord,
  getEditorStatusRecord,
  heartbeatEditorPresenceRecord,
  listEditorRecords,
  listEditorPresenceRecord,
  updateEditorRecord,
} from '../controllers/editorsController'

const router = Router()

router.post('/', requireAuth, createEditorRecord)
router.get('/', requireAuth, listEditorRecords)
router.get('/:editorId', requireAuth, getEditorRecord)
router.patch('/:editorId', requireAuth, updateEditorRecord)
router.delete('/:editorId', requireAuth, deleteEditorRecord)
router.get('/:editorId/status', requireAuth, getEditorStatusRecord)
router.get('/:editorId/presence', requireAuth, listEditorPresenceRecord)
router.post('/:editorId/presence/heartbeat', requireAuth, heartbeatEditorPresenceRecord)

export default router
