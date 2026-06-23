<template>
  <div
    class="photo-card relative flex-shrink-0 w-[340px] rounded-xl overflow-hidden shadow-lg
           transition-all duration-500 ease-out group"
    :class="{
      'ring-2 ring-[--color-bizi] ring-offset-2 ring-offset-[--color-yubai]': isSelected,
      'leaf-falling': isDeleting
    }"
    :style="{ boxShadow: '0 8px 32px rgba(108, 134, 80, 0.12), 0 2px 8px rgba(108, 134, 80, 0.06)' }"
  >
    <!-- ===== 胶片打孔 ===== -->
    <div class="film-perforation"></div>

    <!-- ===== 照片主体 ===== -->
    <div class="relative h-[420px] overflow-hidden cursor-pointer" @dblclick="handleDoubleLike">
      <!-- 高清原图，不做任何压缩 -->
      <img
        :src="photo.public_url"
        :alt="photo.story || '我们的记忆'"
        class="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        loading="lazy"
      />

      <!-- ===== 悬停遮罩 (葱倩色) ===== -->
      <div
        class="absolute inset-0 flex flex-col justify-end p-6
               opacity-0 group-hover:opacity-100
               transition-opacity duration-400 ease-out
               bg-gradient-to-t from-[--color-congqian]/85 via-[--color-congqian]/30 to-transparent"
      >
        <!-- 日期标签 -->
        <span class="text-white/90 text-sm tracking-widest font-sans mb-2">
          {{ formatDate(photo.date) }}
        </span>

        <!-- 故事文案 -->
        <p class="text-white text-base leading-relaxed font-serif mb-4 line-clamp-3">
          {{ photo.story || '那天，我们一起走过...' }}
        </p>

        <!-- 操作按钮行 -->
        <div class="flex items-center gap-3">
          <!-- 点赞按钮 + 计数 -->
          <button
            @click.stop="toggleLike"
            class="flex items-center gap-1 text-white/90 hover:text-white transition-colors"
            :class="{ 'text-red-300': liked }"
          >
            <svg class="w-5 h-5" :fill="liked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span class="text-sm">{{ likeCount }}</span>
          </button>

          <!-- 单张下载 -->
          <a
            :href="photo.public_url"
            :download="`${photo.date}_记忆.jpg`"
            @click.stop
            class="flex items-center gap-1 text-white/90 hover:text-white transition-colors"
            title="下载原图"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>

          <!-- 删除按钮 -->
          <button
            @click.stop="confirmDelete"
            class="flex items-center gap-1 text-white/70 hover:text-red-300 transition-colors ml-auto"
            title="删除照片"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        <!-- 批量选择勾选框 -->
        <div
          v-if="batchMode"
          @click.stop="$emit('toggle-select', photo.id)"
          class="absolute top-4 right-4 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center cursor-pointer transition-colors"
          :class="isSelected ? 'bg-[--color-congqian] border-[--color-congqian]' : 'bg-black/20'"
        >
          <svg v-if="isSelected" class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      <!-- ===== 双击心动粒子 ===== -->
      <transition-group name="fade">
        <span
          v-for="heart in floatingHearts"
          :key="heart.id"
          class="heart-particle"
          :style="{ left: heart.x + 'px', top: heart.y + 'px' }"
        >❤️</span>
      </transition-group>
    </div>

    <!-- ===== 拍立得留白区 - 留言 ===== -->
    <div class="bg-white px-5 py-4 space-y-3 min-h-[80px]">
      <!-- 留言列表 -->
      <div
        v-for="comment in comments"
        :key="comment.id"
        class="flex items-start gap-2 text-sm"
      >
        <span
          class="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium"
          :class="comment.author === '陈彪' ? 'bg-[--color-lanming]/30 text-[--color-congqian]' : 'bg-[--color-bizi]/20 text-[--color-congqian]'"
        >{{ comment.author }}</span>
        <p class="text-gray-600 leading-relaxed flex-1">{{ comment.content }}</p>
        <button
          @click.stop="deleteComment(comment.id)"
          class="flex-shrink-0 text-gray-300 hover:text-red-400 transition-colors"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- 添加快捷留言 -->
      <div class="flex gap-2 pt-1">
        <select
          v-model="newCommentAuthor"
          class="text-xs bg-[--color-yubai] border border-[--color-lanming] rounded-full px-3 py-1.5
                 text-[--color-congqian] focus:outline-none focus:ring-1 focus:ring-[--color-bizi]"
        >
          <option value="陈彪">陈彪</option>
          <option value="王莎莎">王莎莎</option>
        </select>
        <input
          v-model="newCommentContent"
          @keyup.enter="addComment"
          type="text"
          placeholder="留下你想说的话..."
          class="flex-1 text-sm bg-[--color-yubai] border border-[--color-lanming] rounded-full px-3 py-1.5
                 text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[--color-bizi]"
          maxlength="60"
        />
        <button
          @click="addComment"
          :disabled="!newCommentContent.trim()"
          class="flex-shrink-0 w-7 h-7 rounded-full bg-[--color-bizi] text-white flex items-center justify-center
                 hover:bg-[--color-congqian] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { supabase, fetchComments, fetchLikeCount } from '../lib/supabase.js'

const props = defineProps({
  photo: { type: Object, required: true },
  batchMode: { type: Boolean, default: false },
  isSelected: { type: Boolean, default: false }
})

const emit = defineEmits(['toggle-select', 'delete-photo', 'like-update'])

// ===== 点赞相关 =====
const likeCount = ref(0)
const liked = ref(false)

fetchLikeCount(props.photo.id).then(c => { likeCount.value = c })

async function toggleLike() {
  if (liked.value) {
    likeCount.value = Math.max(0, likeCount.value - 1)
    liked.value = false
    // 直接操作 Supabase
    const { data: existing } = await supabase
      .from('likes').select('*').eq('photo_id', props.photo.id).maybeSingle()
    if (existing && existing.count > 0) {
      await supabase.from('likes').update({ count: existing.count - 1 }).eq('photo_id', props.photo.id)
    }
  } else {
    likeCount.value++
    liked.value = true
    const { data: existing } = await supabase
      .from('likes').select('*').eq('photo_id', props.photo.id).maybeSingle()
    if (existing) {
      await supabase.from('likes').update({ count: existing.count + 1 }).eq('photo_id', props.photo.id)
    } else {
      await supabase.from('likes').insert({ photo_id: props.photo.id, count: 1 })
    }
  }
}

// ===== 双击心动特效 =====
const floatingHearts = ref([])
let heartId = 0

function handleDoubleLike(e) {
  const heart = {
    id: heartId++,
    x: e.clientX,
    y: e.clientY
  }
  floatingHearts.value.push(heart)

  // 1.2 秒后移除
  setTimeout(() => {
    floatingHearts.value = floatingHearts.value.filter(h => h.id !== heart.id)
  }, 1200)

  // 自动点赞
  if (!liked.value) {
    toggleLike()
  }
}

// ===== 留言相关 =====
const comments = ref([])
const newCommentAuthor = ref('陈彪')
const newCommentContent = ref('')

fetchComments(props.photo.id).then(c => { comments.value = c })

async function addComment() {
  const content = newCommentContent.value.trim()
  if (!content) return

  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        photo_id: props.photo.id,
        author: newCommentAuthor.value,
        content
      })
      .select()
      .single()

    if (error) throw error
    comments.value.push(data)
    newCommentContent.value = ''
  } catch (e) {
    console.error('留言失败:', e)
  }
}

async function deleteComment(commentId) {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (error) throw error
    comments.value = comments.value.filter(c => c.id !== commentId)
  } catch (e) {
    console.error('删除留言失败:', e)
  }
}

// ===== 删除确认 =====
const isDeleting = ref(false)

function confirmDelete() {
  if (confirm('确定要删除这张照片吗？它会像叶片一样飘落离开...🍃')) {
    isDeleting.value = true
    setTimeout(() => {
      emit('delete-photo', props.photo.id)
    }, 1500) // 等飘落动画播完
  }
}

// ===== 日期格式化 =====
function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}
</script>
