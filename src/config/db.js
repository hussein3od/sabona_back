// src/config/db.js
import pkg from 'pg'
const { Pool } = pkg

let pool

if (!global.pgPool) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  global.pgPool = pool
} else {
  pool = global.pgPool
}

export default pool
