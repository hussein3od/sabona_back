import express from 'express'
import cors from 'cors'
import path from 'path'

const app = express()

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))
import authRoutes from './routes/auth.routes.js'
import productRoutes from './routes/product.routes.js'
import orderRoutes from './routes/order.routes.js'
import messageRoutes from './routes/message.routes.js'
import adminRoutes from './routes/admin.routes.js'

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/admin', adminRoutes)

export default app
