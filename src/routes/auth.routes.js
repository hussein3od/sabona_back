import express from 'express'
import * as auth from '../controllers/auth.controller.js'
import authMiddleware from '../middleware/auth.middleware.js'

const router = express.Router()

router.post('/register', auth.register)
router.post('/login', auth.login)

// profile endpoints (require auth)
router.get('/profile', authMiddleware, auth.getProfile)
router.put('/profile', authMiddleware, auth.updateProfile)

export default router
