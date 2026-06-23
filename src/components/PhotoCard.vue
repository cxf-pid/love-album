<template>
  <div
    class="photo-card flex-shrink-0 w-[350px] rounded-xl overflow-visible card-enter group bg-white"
    :style="{ boxShadow: '0 12px 40px rgba(108, 134, 80, 0.08), 0 2px 6px rgba(108, 134, 80, 0.03)' }"
  >
    <div class="film-perforation"></div>

    <div class="relative h-[470px] overflow-hidden rounded-t-xl cursor-pointer bg-[#e6e8e3]"
         @dblclick="handleDoubleLike">
      <img
        :src="photo.public_url"
        :alt="photo.story || '记忆'"
        class="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        loading="lazy"
      />

      <div class="absolute inset-0 flex flex-col justify-end p-5
                  opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out
                  bg-gradient-to-t from-black/80 via-black/35 to-transparent">

        <span class="text-white/75 text-xs tracking-[0.2em] font-sans mb-1.5 drop-shadow-sm">
          {{ fmtDate }}
        </span>

        <p class="text-white text-sm leading-relaxed font-serif mb-4 line-clamp-3 opacity-95 drop-shadow-sm">
          {{ photo.story || '那天，我们一起走过...' }}
        </p>

        <div class="flex items-center gap-2 flex-wrap">
          <button @click.stop="toggleLike"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                   bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-all duration-300
                   border border-white/10"
            :class="{ '!bg-red-500/80 !border-red-400/40 shadow-sm shadow-red-900/30': liked }">
            <svg class="w-3.5 h-3.5" :fill="liked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
            <span class="font-mono text-[11px]">{{ likeCount }}</span>
          </button>

          <a :href="photo.public_url" :download="`${photo.date}_记忆.jpg`" @click.stop
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                   bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-all duration-300
                   border border-white/10">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            <span>原图</span>
          </a>

          <button @click.stop="showDeleteDialog = true"
            class="inline-flex items-center justify-center w-7 h-7 rounded-full
                   bg-black/40 backdrop-blur-md text-white/80 hover:bg-red-500/80 hover:text-white
                   transition-all duration-300 border border-white/10 ml-auto">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>

        <div v-if="batchMode" @click.stop="$emit('toggle-select', photo.id)"
          class="absolute top-4 right-4 w-7 h-7 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-300"
          :class="isSelected ? 'bg-[--color-congqian] border-[--color-congqian] shadow-lg' : 'border-white/60 bg-black/30 backdrop-blur-sm hover:bg-black/50'">
          <svg v-if="isSelected" class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
      </div>

      <span v-for="h in hearts" :key="h.id"
        class="heart-particle select-none z-10"
        :style="{ left: h.x + 'px', top: h.y + 'px', fontSize: h.size + 'rem', animationDelay: h.delay + 'ms' }">
        {{ h.emoji }}
      </span>
    </div>

    <div class="bg-[#fafaf7] px-5 py-4 space-y-3 rounded-b-xl border-t border-[--color-lanming]/15 shadow-[inset_0_2px_6px_rgba(0,0,0,0.015)]">

      <div v-if="comments.length > 0" class="space-y-2 max-h-[120px] overflow-y-auto pr-1">
        <div v-for="c in comments" :key="c.id" class="flex items-start gap-2 text-xs animate-[fadeIn_0.3s_ease] group/comment">
          <span class="flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium font-serif"
            :class="c.author === '陈彪'
              ? 'bg-[--color-lanming]/20 text-[--color-congqian]'
              : 'bg-[--color-bizi]/15 text-[--color-congqian]'">
            {{ c.author === '陈彪' ? '彪' : '莎' }}
          </span>
          <p class="text-gray-600 leading-relaxed flex-1 break-all">{{ c.content }}</p>
          <button @click.stop="deleteComment(c.id)"
            class="flex-shrink-0 text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover/comment:opacity-100">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="flex gap-1.5 pt-1 border-t border-[--color-lanming]/5">
        <select v-model="newAuthor"
          class="text-[11px] bg-white border border-[--color-lanming]/30 rounded-full px-2.5 py-1.5
                 text-[--color-congqian] font-serif font-bold shadow-sm focus:outline-none focus:border-[--color-bizi] flex-shrink-0">
          <option value="陈彪">彪</option>
          <option value="王莎莎">莎</option>
        </select>
        <input v-model="newContent" @keyup.enter="addComment"
          type="text" placeholder="留下一句碎碎念..." maxlength="50"
          class="flex-1 text-xs bg-white border border-[--color-lanming]/30 rounded-full px-3 py-1.5
                 text-gray-700 placeholder-gray-300 shadow-sm focus:outline-none focus:border-[--color-bizi]"/>
        <button @click="addComment" :disabled="!newContent.trim()"
          class="flex-shrink-0 w-7 h-7 rounded-full bg-[--color-bizi] text-white flex items-center justify-center
                 hover:bg-[--color-congqian] transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed
                 active:scale-90 shadow-sm shadow-[--color-bizi]/20">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>

    <teleport to="body">
      <transition name="fade">
        <div v-if="showDeleteDialog"
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm"
          @click.self="showDeleteDialog = false">
          <div class="bg-white rounded-2xl p-8 max-w-sm w-[90%] text-center shadow-2xl"
               :style="{ boxShadow: '0 20px 60px rgba(108, 134, 80, 0.15)' }">
            <div class="text-5xl mb-4">🍃</div>
            <h3 class="text-lg font-serif font-bold text-[--color-congqian] mb-2">删除这张记忆？</h3>
            <p class="text-sm text-[--color-bizi] mb-6">照片会像叶片一样飘落离开，但不会真正消失...</p>
            <div class="flex gap-3 justify-center">
              <button @click="showDeleteDialog = false"
                class="px-6 py-2.5 rounded-full text-sm font-medium border border-[--color-lanming]
                       text-[--color-bizi] hover:bg-[--color-yubai] transition-all duration-300">
                保留
              </button>
              <button @click="confirmDelete"
                class="px-6 py-2.5 rounded-full text-sm font-medium bg-red-400 text-white
                       hover:bg-red-500 transition-all duration-300 shadow-md shadow-red-200">
                飘落它
              </button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
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

const emit = defineEmits(['toggle-select', 'delete-photo'])

// ===== 点赞 =====
const likeCount = ref(0)
const liked = ref(false)
fetchLikeCount(props.photo.id).then(c => { likeCount.value = c })

async function toggleLike() {
  if (liked.value) {
    likeCount.value = Math.max(0, likeCount.value - 1)
    liked.value = false
    const { data: ex } = await supabase.from('likes').select('*').eq('photo_id', props.photo.id).maybeSingle()
    if (ex && ex.count > 0) await supabase.from('likes').update({ count: ex.count - 1 }).eq('photo_id', props.photo.id)
  } else {
    likeCount.value++
    liked.value = true
    const { data: ex } = await supabase.from('likes').select('*').eq('photo_id', props.photo.id).maybeSingle()
    if (ex) await supabase.from('likes').update({ count: ex.count + 1 }).eq('photo_id', props.photo.id)
    else await supabase.from('likes').insert({ photo_id: props.photo.id, count: 1 })
  }
}

// ===== 双击心动 =====
const hearts = ref([])
let hid = 0
const emojis = ['❤️', '💚', '💕', '✨', '🫶']

function handleDoubleLike(e) {
  // 获取局部相对坐标
  const rect = e.currentTarget.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  for (let i = 0; i < 3; i++) {
    const id = hid++
    hearts.value.push({
      id,
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 40,
      size: 1.5 + Math.random() * 1.5,
      delay: i * 80,
      emoji: emojis[Math.floor(Math.random() * emojis.length)]
    })
    setTimeout(() => {
      hearts.value = hearts.value.filter(h => h.id !== id)
    }, 1500 + i * 80)
  }
  if (!liked.value) toggleLike()
}

// ===== 留言 =====
const comments = ref([])
const newAuthor = ref('陈彪')
const newContent = ref('')
fetchComments(props.photo.id).then(c => { comments.value = c })

async function addComment() {
  const content = newContent.value.trim()
  if (!content) return
  const { data, error } = await supabase.from('comments')
    .insert({ photo_id: props.photo.id, author: newAuthor.value, content })
    .select().single()
  if (!error && data) {
    comments.value.push(data)
    newContent.value = ''
  }
}

async function deleteComment(id) {
  await supabase.from('comments').delete().eq('id', id)
  comments.value = comments.value.filter(c => c.id !== id)
}

// ===== 删除 =====
const showDeleteDialog = ref(false)
const isDeleting = ref(false)

function confirmDelete() {
  showDeleteDialog.value = false
  isDeleting.value = true
  setTimeout(() => emit('delete-photo', props.photo.id), 1500)
}

// ===== 日期 =====
const fmtDate = computed(() => {
  const d = new Date(props.photo.date)
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
})
</script>