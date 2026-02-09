import pool from '../config/db.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export async function register(req, res) {
  const { name, email, phone, password } = req.body;

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'هذا البريد مسجل مسبقًا' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await pool.query(
      `INSERT INTO users (name,email,phone,password) VALUES ($1,$2,$3,$4) RETURNING id,name,email,role`,
      [name,email,phone,hashed]
    );

    const token = jwt.sign(
      { id: user.rows[0].id, email: user.rows[0].email, role: user.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({ user: user.rows[0], token }); // 🔑 هنا نرسل token
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'حدث خطأ أثناء التسجيل' });
  }
}


export async function login(req, res) {
  const { email, password } = req.body

  const userRes = await pool.query('SELECT * FROM users WHERE email=$1', [email])

  if (!userRes.rows.length)
    return res.status(401).json({ message: 'Invalid credentials' })

  const user = userRes.rows[0]
  const match = await bcrypt.compare(password, user.password)

  if (!match) return res.status(401).json({ message: 'Invalid credentials' })

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  })

  res.json({ token, user: { id: user.id, name: user.name, role: user.role } })
}

export async function getProfile(req, res) {
  const userId = req.user?.id
  if (!userId) return res.sendStatus(401)

  const result = await pool.query(
    'SELECT id, name, email, phone, role FROM users WHERE id=$1',
    [userId]
  )

  if (!result.rows.length) return res.sendStatus(404)

  res.json(result.rows[0])
}

export async function updateProfile(req, res) {
  const userId = req.user?.id
  if (!userId) return res.sendStatus(401)

  const { name, phone, password } = req.body

  // build update dynamically
  const updates = []
  const values = []
  let idx = 1

  if (name) {
    updates.push(`name=$${idx++}`)
    values.push(name)
  }
  if (phone) {
    updates.push(`phone=$${idx++}`)
    values.push(phone)
  }
  if (password) {
    const hashed = await bcrypt.hash(password, 10)
    updates.push(`password=$${idx++}`)
    values.push(hashed)
  }

  if (updates.length === 0) return res.status(400).json({ message: 'No fields to update' })

  values.push(userId)
  const q = `UPDATE users SET ${updates.join(', ')} WHERE id=$${idx} RETURNING id,name,email,phone,role`

  const result = await pool.query(q, values)
  res.json(result.rows[0])
}
