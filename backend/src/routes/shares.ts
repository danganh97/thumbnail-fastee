import { Router } from 'express'
import {
  createShare,
  getShare,
  getShareForEditor,
  getShareStatus,
  heartbeatSharePresence,
  listSharePresence,
  removeShare,
  updateSharedEditor,
} from '../controllers/sharesController'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.post('/', requireAuth, createShare)
router.get('/editor/:editorId', requireAuth, getShareForEditor)
router.get('/:code', getShare)
router.patch('/:code/editor', updateSharedEditor)
router.get('/:code/status', getShareStatus)
router.get('/:code/presence', listSharePresence)
router.post('/:code/presence/heartbeat', heartbeatSharePresence)
router.delete('/:snapshotId', requireAuth, removeShare)

export default router
