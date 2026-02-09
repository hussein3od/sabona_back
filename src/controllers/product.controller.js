import pool from '../config/db.js'

// جلب كل المنتجات
async function getAll(req, res) {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.name_en,
        p.name_ar,
        p.description_en,
        p.description_ar,
        p.description_short_en,
        p.description_short_ar,
        p.usage_instructions_en,
        p.usage_instructions_ar,
        p.ingredients_en,
        p.ingredients_ar,
        p.warning_en,
        p.warning_ar,
        p.benefits_en,
        p.benefits_ar,
        p.price,
        p.category_en,
        p.category_ar,
        p.skin_type_en,
        p.skin_type_ar,
        p.stock,
        p.is_active,
        p.created_at,
        COALESCE(
          json_agg(pi.image_url) 
          FILTER (WHERE pi.image_url IS NOT NULL),
          '[]'
        ) AS images
      FROM products p
      LEFT JOIN product_images pi 
        ON p.id = pi.product_id
      WHERE p.is_active = true
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `)


    res.json(result.rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch products' })
  }
}

// جلب منتج حسب المعرف
async function getById(req, res) {
  const { id } = req.params
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.name_en,
        p.name_ar,
        p.description_en,
        p.description_ar,
        p.description_short_en,
        p.description_short_ar,
        p.usage_instructions_en,
        p.usage_instructions_ar,
        p.ingredients_en,
        p.ingredients_ar,
        p.warning_en,
        p.warning_ar,
        p.benefits_en,
        p.benefits_ar,
        p.price,
        p.category_en,
        p.category_ar,
        p.skin_type_en,
        p.skin_type_ar,
        p.stock,
        p.is_active,
        p.created_at,
        COALESCE(
          json_agg(pi.image_url) 
          FILTER (WHERE pi.image_url IS NOT NULL),
          '[]'
        ) AS images
      FROM products p
      LEFT JOIN product_images pi 
        ON p.id = pi.product_id
      WHERE p.id = $1
      GROUP BY p.id
      LIMIT 1
    `, [id])

    if (!result.rows.length) return res.status(404).json({ message: 'Product not found' })

    res.json(result.rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch product' })
  }
}

// انشاء منتج جديد
async function create(req, res) {
  const {
    name_en,
    name_ar,
    description_en,
    description_ar,
    description_short_en,
    description_short_ar,
    usage_instructions_en,
    usage_instructions_ar,
    warning_en,
    warning_ar,
    benefits_en,
    benefits_ar,
    ingredients_en,
    ingredients_ar,
    price,
    category_en,
    category_ar,
    skin_type_en,
    skin_type_ar,
    stock
  } = req.body;

  try {
    const productRes = await pool.query(
      `INSERT INTO products
      (
        name_en, name_ar,
        description_en, description_ar,
        description_short_en, description_short_ar,
        usage_instructions_en, usage_instructions_ar,
        warning_en, warning_ar,
        benefits_en, benefits_ar,
        ingredients_en, ingredients_ar,
        price,
        category_en, category_ar,
        skin_type_en, skin_type_ar,
        stock
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
      RETURNING id`,
      [
        name_en, name_ar,
        description_en, description_ar,
        description_short_en, description_short_ar,
        usage_instructions_en, usage_instructions_ar,
        warning_en, warning_ar,
        benefits_en, benefits_ar,
        ingredients_en, ingredients_ar,
        price,
        category_en, category_ar,
        skin_type_en, skin_type_ar,
        stock
      ]
    )

    const productId = productRes.rows[0].id

    if (req.files?.length) {
      for (const file of req.files) {
        await pool.query(
          `INSERT INTO product_images (product_id, image_url)
           VALUES ($1,$2)`,
          [productId, `/uploads/${file.filename}`]
        )
      }
    }

    res.status(201).json({ message: 'Product created successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// تحديث منتج
async function update(req, res) {
  const { id } = req.params

  const {
    name_en,
    name_ar,
    description_en,
    description_ar,
    description_short_en,
    description_short_ar,
    usage_instructions_en,
    usage_instructions_ar,
    warning_en,
    warning_ar,
    benefits_en,
    benefits_ar,
    ingredients_en,
    ingredients_ar,
    price,
    category_en,
    category_ar,
    skin_type_en,
    skin_type_ar,
    stock,
    is_active,
    remove_images,
    replace_images
  } = req.body

  try {
    const result = await pool.query(
      `UPDATE products SET
        name_en = COALESCE($1, name_en),
        name_ar = COALESCE($2, name_ar),
        description_en = COALESCE($3, description_en),
        description_ar = COALESCE($4, description_ar),
        description_short_en = COALESCE($5, description_short_en),
        description_short_ar = COALESCE($6, description_short_ar),
        usage_instructions_en = COALESCE($7, usage_instructions_en),
        usage_instructions_ar = COALESCE($8, usage_instructions_ar),
        warning_en = COALESCE($9, warning_en),
        warning_ar = COALESCE($10, warning_ar),
        benefits_en = COALESCE($11, benefits_en),
        benefits_ar = COALESCE($12, benefits_ar),
        ingredients_en = COALESCE($13, ingredients_en),
        ingredients_ar = COALESCE($14, ingredients_ar),
        price = COALESCE($15, price),
        category_en = COALESCE($16, category_en),
        category_ar = COALESCE($17, category_ar),
        skin_type_en = COALESCE($18, skin_type_en),
        skin_type_ar = COALESCE($19, skin_type_ar),
        stock = COALESCE($20, stock),
        is_active = COALESCE($21, is_active)
      WHERE id = $22
      RETURNING *`,
      [
        name_en, name_ar,
        description_en, description_ar,
        description_short_en, description_short_ar,
        usage_instructions_en, usage_instructions_ar,
        warning_en, warning_ar,
        benefits_en, benefits_ar,
        ingredients_en, ingredients_ar,
        price,
        category_en, category_ar,
        skin_type_en, skin_type_ar,
        stock,
        is_active,
        id
      ]
    )

    if (!result.rows.length)
      return res.status(404).json({ message: 'Product not found' })

    if (remove_images === 'true') {
      await pool.query('DELETE FROM product_images WHERE product_id = $1', [id])
    }

    if (req.files?.length) {
      if (replace_images === 'true') {
        await pool.query('DELETE FROM product_images WHERE product_id = $1', [id])
      }

      for (const file of req.files) {
        await pool.query(
          `INSERT INTO product_images (product_id, image_url)
           VALUES ($1, $2)`,
          [id, `/uploads/${file.filename}`]
        )
      }
    }

    res.json({
      message: 'Product updated successfully',
      product: result.rows[0]
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
}

// حذف منتج
async function remove(req, res) {
  const { id } = req.params

  try {
    await pool.query('DELETE FROM products WHERE id=$1', [id])
    res.json({ message: 'Product deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', err })
  }
}

export default {
  getAll,
  getById,
  create,
  update,
  delete: remove
}
