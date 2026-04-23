import { Router } from 'express'
import { getCurrentUser, googleOneTapLogin, logout } from '../controllers/authController'

const router = Router()

router.post('/google/onetap', googleOneTapLogin)
router.get('/me', getCurrentUser)
router.post('/logout', logout)

export default router
