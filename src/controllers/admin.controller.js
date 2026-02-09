import pool from '../config/db.js'

// GET /api/admin/orders
export async function getOrders(req, res) {
  try {
    const result = await pool.query(
      `SELECT o.id, o.user_id, o.total_price, o.address, o.phone, o.processed, o.created_at,
        json_agg(json_build_object('product_id', oi.product_id, 'quantity', oi.quantity, 'price', oi.price, 'product_name', p.name_en)) AS items,
        u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN products p ON p.id = oi.product_id
       LEFT JOIN users u ON u.id = o.user_id
       GROUP BY o.id, u.id
       ORDER BY o.processed ASC, o.created_at DESC`
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to fetch orders' })
  }
}

// PUT /api/admin/orders/:id  body { processed: true }
export async function updateOrder(req, res) {
  try {
    const { id } = req.params
    const { processed } = req.body
    const result = await pool.query(
      'UPDATE orders SET processed = $1 WHERE id=$2 RETURNING *',
      [processed === true || processed === 'true', id]
    )
    if (!result.rows.length) return res.status(404).json({ message: 'Order not found' })
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to update order' })
  }
}

// DELETE /api/admin/orders/:id
export async function deleteOrder(req, res) {
  const client = await pool.connect()
  try {
    const { id } = req.params
    await client.query('BEGIN')
    // remove order items
    await client.query('DELETE FROM order_items WHERE order_id=$1', [id])
    // remove order
    await client.query('DELETE FROM orders WHERE id=$1', [id])
    await client.query('COMMIT')
    res.json({ message: 'Order deleted' })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    res.status(500).json({ message: 'Failed to delete order' })
  } finally {
    client.release()
  }
}

export default { getOrders, updateOrder, deleteOrder }
