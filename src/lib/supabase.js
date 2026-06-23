import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase 环境变量未配置。请将 .env.local.example 复制为 .env.local 并填入你的 Supabase 凭证。'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

/**
 * 从 Supabase 获取所有照片（按日期降序）
 */
export async function fetchPhotos() {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .order('date', { ascending: false })

  if (error) {
    console.error('获取照片失败:', error)
    return []
  }
  return data
}

/**
 * 获取某张照片的留言列表
 */
export async function fetchComments(photoId) {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('photo_id', photoId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('获取留言失败:', error)
    return []
  }
  return data
}

/**
 * 获取某张照片的点赞数
 */
export async function fetchLikeCount(photoId) {
  const { data, error } = await supabase
    .from('likes')
    .select('count')
    .eq('photo_id', photoId)
    .maybeSingle()

  if (error) {
    console.error('获取点赞数失败:', error)
    return 0
  }
  return data?.count || 0
}

/**
 * 上传照片到 Supabase Storage（高清原图直传）
 * @param {File} file - 原始图片文件
 * @param {Function} onProgress - 进度回调 (percent: 0-100)
 * @returns {{ publicUrl: string, storagePath: string }}
 */
export async function uploadPhotoToStorage(file, onProgress) {
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 10)
  const safeName = file.name.replace(/[^a-zA-Z0-9._\-一-龥]/g, '_')
  const storagePath = `${timestamp}_${randomStr}_${safeName}`

  const { data, error } = await supabase.storage
    .from('photos')
    .upload(storagePath, file, {
      cacheControl: '31536000',
      contentType: file.type,
      upsert: false
    })

  if (error) {
    console.error('上传照片失败:', error)
    throw error
  }

  // 获取公开访问 URL
  const { data: urlData } = supabase.storage
    .from('photos')
    .getPublicUrl(data.path)

  return {
    publicUrl: urlData.publicUrl,
    storagePath: data.path
  }
}

/**
 * 新增照片记录到 Supabase
 */
export async function insertPhoto({ publicUrl, storagePath, date, story }) {
  const { data, error } = await supabase
    .from('photos')
    .insert({
      public_url: publicUrl,
      r2_key: storagePath,
      date,
      story
    })
    .select()
    .single()

  if (error) {
    console.error('插入照片失败:', error)
    throw error
  }
  return data
}

/**
 * 从 Storage 删除照片文件
 */
export async function deletePhotoFromStorage(storagePath) {
  const { error } = await supabase.storage
    .from('photos')
    .remove([storagePath])

  if (error) {
    console.error('删除存储文件失败:', error)
  }
}

/**
 * 删除照片记录
 */
export async function deletePhoto(photoId) {
  const { error } = await supabase
    .from('photos')
    .delete()
    .eq('id', photoId)

  if (error) {
    console.error('删除照片失败:', error)
    throw error
  }
}
