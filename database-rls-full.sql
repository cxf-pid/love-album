-- ============================================
-- 补充 RLS 策略：允许前端直接增删留言和点赞
-- 在 Supabase SQL Editor 执行（追加执行，不影响已有表和策略）
-- ============================================

-- Comments: 允许所有人新增留言
CREATE POLICY "Allow public insert comments" ON comments
  FOR INSERT WITH CHECK (true);

-- Comments: 允许所有人删除留言
CREATE POLICY "Allow public delete comments" ON comments
  FOR DELETE USING (true);

-- Likes: 允许所有人新增/更新点赞
CREATE POLICY "Allow public insert likes" ON likes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update likes" ON likes
  FOR UPDATE USING (true);
