import pool from '../config/db.js'
import { uploadToBlob } from "../config/upload.js"

// جلب المنتجات
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
        p.created_at
      FROM products p
      WHERE p.is_active = true
      ORDER BY p.created_at DESC
    `)

    const products = result.rows

    // جلب الصور لكل منتج من جدول product_images
    for (let product of products) {
      const imagesRes = await pool.query(
        `SELECT image_url FROM product_images WHERE product_id = $1`,
        [product.id]
      )
      // الصورة كل واحدة ترجع الرابط كامل من Blob
      product.images = imagesRes.rows.map(row => row.image_url)
    }

    res.json(products)
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

    
    // 2 upload images
    for (const file of req.files) {
      const url = await uploadToBlob(file)

      await pool.query(
        `INSERT INTO product_images (product_id, image_url)
         VALUES ($1,$2)`,
        [productId, url]
      )
    }

    res.status(201).json({ message: 'Product created successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error', err })
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
    // تحديث بيانات المنتج
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

    // إزالة جميع الصور إذا طلب remove_images
    if (remove_images === 'true' || remove_images === true) {
      await pool.query('DELETE FROM product_images WHERE product_id = $1', [id])
    }

    // رفع الصور الجديدة
    if (req.files?.length) {
      // حذف الصور القديمة إذا replace_images
      if (replace_images === 'true' || replace_images === true) {
        await pool.query('DELETE FROM product_images WHERE product_id = $1', [id])
      }

      // رفع كل صورة للبلوب وإدراج الرابط في قاعدة البيانات
      for (const file of req.files) {
        const url = await uploadToBlob(file)
        await pool.query(
          `INSERT INTO product_images (product_id, image_url)
           VALUES ($1, $2)`,
          [id, url]
        )
      }
    }

    res.json({
      message: 'Product updated successfully',
      product: result.rows[0]
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error', err })
  }
}

// حذف منتج
export async function remove(req, res) {
  const { id } = req.params;

  try {
    // 1️⃣ جلب روابط الصور للمنتج
    const imagesRes = await pool.query(
      'SELECT image_url FROM product_images WHERE product_id = $1',
      [id]
    );
    const images = imagesRes.rows.map(row => row.image_url);

    // 2️⃣ حذف الصور من Firebase Blob
    for (const url of images) {
      try {
        // استخراج اسم الملف من الرابط
        const filePath = url.split(`https://storage.googleapis.com/${bucket.name}/`)[1];
        if (filePath) {
          const file = bucket.file(filePath);
          await file.delete();
        }
      } catch (err) {
        console.error(`Failed to delete blob: ${url}`, err);
      }
    }

    // 3️⃣ حذف سجلات الصور من قاعدة البيانات
    await pool.query('DELETE FROM product_images WHERE product_id = $1', [id]);

    // 4️⃣ حذف المنتج نفسه
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    if (!result.rows.length) return res.status(404).json({ message: "Product not found" });

    res.json({ message: "Product and images deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", err });
  }
}


export default {
  getAll,
  getById,
  create,
  update,
  delete: remove
}
