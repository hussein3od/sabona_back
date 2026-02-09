import express from 'express'
import ctrl from '../controllers/product.controller.js'
import auth from '../middleware/auth.middleware.js'
import admin from '../middleware/admin.middleware.js'
import upload from '../config/upload.js'

const router = express.Router()

router.get('/', ctrl.getAll)

// get single product
router.get('/:id', auth, ctrl.getById)

// // // إضافة منتج + صور متعددة
router.post('/', auth, admin, upload.array('images', 5), ctrl.create)

router.put('/:id', auth, admin, upload.array('images', 5), ctrl.update)

// // حذف منتج
router.delete('/:id', auth, admin, ctrl.delete)

export default router
