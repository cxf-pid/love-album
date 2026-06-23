-- ============================================
-- 陈彪 & 王莎莎 · 时光胶片 — 数据库建表脚本
-- 在 Supabase SQL Editor 中执行本脚本
-- ============================================

-- 1. 照片表
CREATE TABLE IF NOT EXISTS photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  public_url TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  date DATE NOT NULL,
  story TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 留言表
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  author TEXT NOT NULL CHECK (author IN ('陈彪', '王莎莎')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 点赞表 (每张照片一条记录，count 表示总点赞数)
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE UNIQUE,
  count INTEGER DEFAULT 0
);

-- ===== Row Level Security 策略 =====
-- 允许匿名读取（公开相册）
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Photos: 允许所有人读取
CREATE POLICY "Allow public read photos" ON photos
  FOR SELECT USING (true);

-- Comments: 允许所有人读取
CREATE POLICY "Allow public read comments" ON comments
  FOR SELECT USING (true);

-- Likes: 允许所有人读取
CREATE POLICY "Allow public read likes" ON likes
  FOR SELECT USING (true);

-- ===== 索引 =====
CREATE INDEX IF NOT EXISTS idx_photos_date ON photos(date DESC);
CREATE INDEX IF NOT EXISTS idx_comments_photo_id ON comments(photo_id);
CREATE INDEX IF NOT EXISTS idx_likes_photo_id ON likes(photo_id);
