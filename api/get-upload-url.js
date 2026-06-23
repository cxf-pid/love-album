/**
 * POST /api/get-upload-url
 * 为前端生成 Cloudflare R2 的预签名上传链接（Presigned URL）
 * 高清原图通过此链接从浏览器直传 R2，不经服务器中转
 */
import { S3Client } from '@aws-sdk/client-s3'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// R2 兼容 S3 协议，需要指定 endpoint 为自己的 R2 域名
const R2_ENDPOINT = process.env.R2_ENDPOINT
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME
const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN

const r2Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY
  },
  forcePathStyle: true
})

export default async function handler(req, res) {
  // 仅允许 POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const { fileName, contentType } = req.body

    if (!fileName || !contentType) {
      return res.status(400).json({ error: '缺少 fileName 或 contentType' })
    }

    // 生成唯一的存储路径：photos/年月日_随机串_原始文件名
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 10)
    const safeFileName = fileName.replace(/[^a-zA-Z0-9._\-一-龥]/g, '_')
    const r2Key = `photos/${timestamp}_${randomStr}_${safeFileName}`

    // 生成预签名上传 URL（有效期 5 分钟）
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: r2Key,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable'
    })

    const uploadUrl = await getSignedUrl(r2Client, command, {
      expiresIn: 300 // 5 分钟
    })

    // 构造公开访问 URL
    const publicUrl = `${R2_PUBLIC_DOMAIN}/${r2Key}`

    return res.status(200).json({
      uploadUrl,
      publicUrl,
      r2Key,
      expiresIn: 300
    })
  } catch (error) {
    console.error('生成上传链接失败:', error)
    return res.status(500).json({
      error: '生成上传链接失败',
      message: error.message
    })
  }
}
