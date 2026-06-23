/**
 * /api/manage-comments
 * GET  ?photoId=xxx  → 获取该照片的留言列表
 * POST { photoId, author, content } → 新增留言
 * DELETE { commentId } → 删除留言
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export default async function handler(req, res) {
  // CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  try {
    switch (req.method) {
      case 'GET': {
        const { photoId } = req.query
        if (!photoId) {
          return res.status(400).json({ error: '缺少 photoId 参数' })
        }

        const { data, error } = await supabase
          .from('comments')
          .select('*')
          .eq('photo_id', photoId)
          .order('created_at', { ascending: true })

        if (error) throw error
        return res.status(200).json(data)
      }

      case 'POST': {
        const { photoId, author, content } = req.body

        if (!photoId || !author || !content) {
          return res.status(400).json({ error: '缺少必填字段: photoId, author, content' })
        }

        if (!['陈彪', '王莎莎'].includes(author)) {
          return res.status(400).json({ error: '作者只能是陈彪或王莎莎' })
        }

        const { data, error } = await supabase
          .from('comments')
          .insert({
            photo_id: photoId,
            author,
            content
          })
          .select()
          .single()

        if (error) throw error
        return res.status(201).json(data)
      }

      case 'DELETE': {
        const { commentId } = req.body

        if (!commentId) {
          return res.status(400).json({ error: '缺少 commentId' })
        }

        const { error } = await supabase
          .from('comments')
          .delete()
          .eq('id', commentId)

        if (error) throw error
        return res.status(200).json({ success: true })
      }

      default:
        return res.status(405).json({ error: 'Method Not Allowed' })
    }
  } catch (error) {
    console.error('留言操作失败:', error)
    return res.status(500).json({
      error: '留言操作失败',
      message: error.message
    })
  }
}
