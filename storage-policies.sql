-- ============================================
-- Supabase Storage 权限策略（在 SQL Editor 执行）
-- ============================================

-- 允许所有人读取 photos bucket 中的文件（公开相册）
CREATE POLICY "Allow public read photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'photos');

-- 允许所有人上传到 photos bucket（情侣两人都能上传）
CREATE POLICY "Allow public upload to photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'photos');

-- 允许删除自己上传的照片
CREATE POLICY "Allow public delete from photos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'photos');
