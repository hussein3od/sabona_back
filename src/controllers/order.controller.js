import pool from '../config/db.js'

export async function createOrder(req, res) {
  const client = await pool.connect()

  try {
    const { address, phone, items } = req.body

    if (!items || !items.length) {
      return res.status(400).json({ message: 'No items in order' })
    }

    await client.query('BEGIN')

    // 1️⃣ إنشاء الطلب
    const orderRes = await client.query(
      `INSERT INTO orders (user_id, total_price, address, phone)
       VALUES ($1, 0, $2, $3)
       RETURNING *`,
      [req.user.id, address, phone]
    )

    const order = orderRes.rows[0]
    let totalPrice = 0

    // 2️⃣ إضافة المنتجات + إنقاص الستوك
    for (const item of items) {
      const productRes = await client.query(
        'SELECT price, stock FROM products WHERE id=$1 FOR UPDATE',
        [item.product_id]
      )

      if (!productRes.rows.length)
        throw new Error('Product not found')

      const product = productRes.rows[0]

      if (product.stock < item.qty)
        throw new Error('Not enough stock')

      // إضافة للـ order_items
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES ($1,$2,$3,$4)`,
        [order.id, item.product_id, item.qty, product.price]
      )

      // إنقاص الستوك
      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id=$2',
        [item.qty, item.product_id]
      )

      totalPrice += product.price * item.qty
    }

    // 3️⃣ تحديث السعر الكلي
    await client.query(
      'UPDATE orders SET total_price=$1 WHERE id=$2',
      [totalPrice, order.id]
    )

    await client.query('COMMIT')

    res.status(201).json({
      message: 'Order created successfully',
      order_id: order.id,
      total_price: totalPrice,
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ message: err.message })
  } finally {
    client.release()
  }
}
