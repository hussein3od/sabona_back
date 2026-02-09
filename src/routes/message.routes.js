import express from 'express'
import ctrl from '../controllers/message.controller.js'
import auth from '../middleware/auth.middleware.js'
import admin from '../middleware/admin.middleware.js'

const router = express.Router()

// public endpoint for contact form
router.post('/', ctrl.createMessage)

// admin endpoints
router.get('/', auth, admin, ctrl.getMessages)
router.put('/:id', auth, admin, ctrl.markMessage)
router.delete('/:id', auth, admin, ctrl.deleteMessage)

export default router
