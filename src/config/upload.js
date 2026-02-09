import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// مجلد uploads داخل src
const uploadPath = path.join(__dirname, '../uploads')

// تأكد أن المجلد موجود
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true })
}

const storage = multer.diskStorage({
  destination: uploadPath,
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + '-' + Math.round(Math.random() * 1e9)

    cb(null, uniqueName + path.extname(file.originalname))
  },
})

const upload = multer({
  storage,
  limits: { files: 5 },
})

export default upload
