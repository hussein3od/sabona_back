import pool from '../config/db.js'

export async function createMessage(req, res) {
  try {
    const { name, email, subject, message } = req.body
    const result = await pool.query(
      `INSERT INTO messages (name, email, subject, message, unread, created_at)
       VALUES ($1,$2,$3,$4, true, NOW()) RETURNING *`,
      [name, email, subject, message]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to save message' })
  }
}

export async function getMessages(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, name, email, subject, message, unread, created_at FROM messages ORDER BY unread DESC, created_at DESC`
    )
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to fetch messages' })
  }
}

export async function markMessage(req, res) {
  try {
    const { id } = req.params
    const { unread } = req.body
    const result = await pool.query(
      'UPDATE messages SET unread = $1 WHERE id=$2 RETURNING *',
      [unread === true || unread === 'true', id]
    )
    if (!result.rows.length) return res.status(404).json({ message: 'Message not found' })
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to update message' })
  }
}

export async function deleteMessage(req, res) {
  try {
    const { id } = req.params
    await pool.query('DELETE FROM messages WHERE id=$1', [id])
    res.json({ message: 'Deleted' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to delete' })
  }
}

export default { createMessage, getMessages, markMessage, deleteMessage }
