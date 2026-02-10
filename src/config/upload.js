import multer from "multer"
import { put } from "@vercel/blob"

const storage = multer.memoryStorage()
const upload = multer({ storage })

export const uploadToBlob = async (file) => {
  const blob = await put(
    `products/${Date.now()}-${file.originalname}`,
    file.buffer,
    {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }
  )

  return blob.url
}

export default upload
