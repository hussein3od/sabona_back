import express from 'express'
import adminCtrl from '../controllers/admin.controller.js'
import auth from '../middleware/auth.middleware.js'
import admin from '../middleware/admin.middleware.js'

const router = express.Router()

router.get('/orders', auth, admin, adminCtrl.getOrders)
router.put('/orders/:id', auth, admin, adminCtrl.updateOrder)
router.delete('/orders/:id', auth, admin, adminCtrl.deleteOrder)

export default router
