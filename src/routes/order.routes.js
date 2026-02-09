import express from 'express'
import { createOrder } from '../controllers/order.controller.js'
import auth from '../middleware/auth.middleware.js'

const router = express.Router()

router.post('/', auth, createOrder)

export default router
