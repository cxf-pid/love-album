/**
 * /api/manage-likes
 * GET  ?photoId=xxx → 获取点赞数
 * POST { photoId, action: 'like' | 'unlike' } → 点赞/取消点赞
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
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
          .from('likes')
          .select('count')
          .eq('photo_id', photoId)
          .maybeSingle()

        if (error) throw error
        return res.status(200).json({ count: data?.count || 0 })
      }

      case 'POST': {
        const { photoId, action } = req.body

        if (!photoId || !action) {
          return res.status(400).json({ error: '缺少必填字段: photoId, action' })
        }

        if (!['like', 'unlike'].includes(action)) {
          return res.status(400).json({ error: 'action 只能是 like 或 unlike' })
        }

        // 获取当前点赞记录
        const { data: existing } = await supabase
          .from('likes')
          .select('*')
          .eq('photo_id', photoId)
          .maybeSingle()

        if (action === 'like') {
          if (existing) {
            // 已有点赞记录，count +1
            const { data, error } = await supabase
              .from('likes')
              .update({ count: existing.count + 1 })
              .eq('photo_id', photoId)
              .select()
              .single()

            if (error) throw error
            return res.status(200).json(data)
          } else {
            // 没有记录，创建
            const { data, error } = await supabase
              .from('likes')
              .insert({ photo_id: photoId, count: 1 })
              .select()
              .single()

            if (error) throw error
            return res.status(201).json(data)
          }
        } else {
          // unlike
          if (existing && existing.count > 0) {
            const { data, error } = await supabase
              .from('likes')
              .update({ count: existing.count - 1 })
              .eq('photo_id', photoId)
              .select()
              .single()

            if (error) throw error
            return res.status(200).json(data)
          }
          return res.status(200).json({ count: 0 })
        }
      }

      default:
        return res.status(405).json({ error: 'Method Not Allowed' })
    }
  } catch (error) {
    console.error('点赞操作失败:', error)
    return res.status(500).json({
      error: '点赞操作失败',
      message: error.message
    })
  }
}
