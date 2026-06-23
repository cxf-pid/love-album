<template>
  <div
    class="photo-card flex-shrink-0 w-[360px] bg-white rounded-lg p-4 overflow-visible card-enter group relative flex flex-col justify-between"
    :class="{ 'leaf-falling': isDeleting }"
    :style="{ 
      boxShadow: '0 20px 40px rgba(108, 134, 80, 0.08), 0 2px 8px rgba(0, 0, 0, 0.02)',
      border: '1px solid rgba(168, 183, 140, 0.15)'
    }"
  >
    <div class="relative h-[430px] overflow-hidden rounded-md cursor-pointer bg-[#fafaf7] flex-shrink-0">
      
      <div class="absolute top-2 left-0 right-0 h-1.5 flex justify-between px-3 z-30 pointer-events-none opacity-40">
        <div v-for="i in 14" :key="'t-'+i" class="w-1.5 h-1.5 bg-black rounded-sm"></div>
      </div>
      <div class="absolute bottom-2 left-0 right-0 h-1.5 flex justify-between px-3 z-30 pointer-events-none opacity-40">
        <div v-for="i in 14" :key="'b-'+i" class="w-1.5 h-1.5 bg-black rounded-sm"></div>
      </div>

      <img
        :src="photo.public_url"
        :alt="photo.story || '记忆'"
        class="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
        loading="lazy"
      />

      <div class="absolute inset-0 flex flex-col justify-end p-6 pt-12
                  opacity-0 group-hover:opacity-100 transition-opacity duration-400 ease-out z-20
                  bg-gradient-to-t from-[--color-congqian]/95 via-[--color-congqian]/40 to-transparent">

        <span class="absolute top-6 left-6 text-white/70 text-[10px] tracking-[0.3em] font-mono">
          {{ fmtDate }}
        </span>

        <p class="text-white text-sm leading-relaxed font-serif mb-5 line-clamp-4 opacity-95 tracking-wide italic pl-2 border-l border-white/30">
          “ {{ photo.story || '那天，我们一起走过...' }} ”
        </p>

        <div class="flex items-center gap-2 flex-wrap">
          <button @click.stop="toggleLike"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                   bg-white/15 backdrop-blur-md text-white hover:bg-white/30 transition-all duration-300
                   border border-white/10"
            :class="{ '!bg-red-500/50 !border-red-400/40': liked }">
            <svg class="w-3.5 h-3.5 transition-transform duration-300 active:scale-125" :fill="liked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
            <span class="font-mono">{{ likeCount }}</span>
          </button>

          <a :href="photo.public_url" :download="`${photo.date}_记忆.jpg`" @click.stop
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                   bg-white/15 backdrop-blur-md text-white hover:bg-white/30 transition-all duration-300
                   border border-white/10">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            <span>原图</span>
          </a>

          <button @click.stop="showDeleteDialog = true"
            class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium
                   bg-white/10 backdrop-blur-md text-white/60 hover:bg-red-500/60 hover:text-white
                   transition-all duration-300 border border-white/5 ml-auto">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>

        <div v-if="batchMode" @click.stop="$emit('toggle-select', photo.id)"
          class="absolute top-5 right-5 w-6 h-6 rounded-full border flex items-center justify-center cursor-pointer transition-all duration-300 z-30"
          :class="isSelected ? 'bg-[--color-bizi] border-[--color-bizi] shadow-md' : 'border-white/40 bg-black/20 hover:bg-black/40'">
          <svg v-if="isSelected" class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
      </div>

      <span v-for="h in hearts" :key="h.id"
        class="heart-particle select-none z-30"
        :style="{ left: h.x + 'px', top: h.y + 'px', fontSize: h.size + 'rem', animationDelay: h.delay + 'ms' }">
        {{ h.emoji }}
      </span>
    </div>

    <div class="mt-4 pt-2 flex flex-col justify-end space-y-2.5">
      
      <div class="space-y-2 max-h-[75px] overflow-y-auto pr-1 no-scrollbar">
        <div v-for="c in comments" :key="c.id" class="flex items-start gap-2 text-[11px] group/item animate-[fadeIn_0.2s_ease]">
          <span class="flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase"
            :class="c.author === '陈彪'
              ? 'bg-[--color-congqian]/10 text-[--color-congqian]'
              : 'bg-[--color-lanming]/20 text-[--color-bizi]'">
            {{ c.author === '陈彪' ? '彪' : '莎' }}
          </span>
          <p class="text-gray-600 leading-normal flex-1 break-all font-sans">{{ c.content }}</p>
          <button @click.stop="deleteComment(c.id)"
            class="flex-shrink-0 text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover/item:opacity-100">
            ✕
          </button>
        </div>
        <div v-if="comments.length === 0" class="text-center py-2 text-[10px] text-gray-300 font-serif italic">
          暂无留言 ...
        </div>
      </div>

      <div class="flex items-center gap-1 border-b border-[--color-lanming]/20 pb-0.5 pt-1 focus-within:border-[--color-bizi] transition-colors">
        <select v-model="newAuthor"
          class="text-[10px] bg-transparent text-[--color-congqian] font-bold focus:outline-none cursor-pointer pr-1">
          <option value="陈彪">彪</option>
          <option value="王莎莎">莎</option>
        </select>
        <input v-model="newContent" @keyup.enter="addComment"
          type="text" placeholder="留下一句碎碎念..." maxlength="50"
          class="flex-1 text-[11px] bg-transparent text-gray-600 placeholder-gray-300 focus:outline-none pl-1"/>
        <button @click="addComment" :disabled="!newContent.trim()"
          class="text-[--color-bizi] hover:text-[--color-congqian] disabled:opacity-20 disabled:hover:text-[--color-bizi] transition-colors p-1">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l7-7-7-7M5 12h14"/>
          </svg>
        </button>
      </div>
    </div>

    <teleport to="body">
      <transition name="fade">
        <div v-if="showDeleteDialog"
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm"
          @click.self="showDeleteDialog = false">
          <div class="bg-white rounded-2xl p-8 max-w-sm w-[85%] text-center border border-[--color-lanming]/30"
               :style="{ boxShadow: '0 30px 70px rgba(108, 134, 80, 0.15)' }">
            <div class="text-4xl mb-3">🍃</div>
            <h3 class="text-base font-serif font-bold text-[--color-congqian] mb-1">飘落这张记忆？</h3>
            <p class="text-xs text-[--color-bizi] mb-6">它将轻柔地离开胶片轨道...</p>
            <div class="flex gap-3 justify-center">
              <button @click="showDeleteDialog = false"
                class="px-5 py-2 rounded-full text-xs font-medium border border-[--color-lanming]/40 text-[--color-bizi] hover:bg-[--color-yubai]/30 transition-all">
                留住
              </button>
              <button @click="confirmDelete"
                class="px-5 py-2 rounded-full text-xs font-medium bg-red-400 text-white hover:bg-red-500 transition-all">
                确定
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

const hearts = ref([])
let hid = 0
const emojis = ['❤️', '💚', '💕', '✨', '🫶']

function handleDoubleLike(e) {
  const rect = e.target.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  for (let i = 0; i < 3; i++) {
    const id = hid++
    hearts.value.push({
      id,
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 30,
      size: 1.2 + Math.random() * 1.5,
      delay: i * 80,
      emoji: emojis[Math.floor(Math.random() * emojis.length)]
    })
    setTimeout(() => {
      hearts.value = hearts.value.filter(h => h.id !== id)
    }, 1200)
  }
  if (!liked.value) toggleLike()
}

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

const showDeleteDialog = ref(false)
const isDeleting = ref(false)

function confirmDelete() {
  showDeleteDialog.value = false
  isDeleting.value = true
  setTimeout(() => emit('delete-photo', props.photo.id), 1200)
}

const fmtDate = computed(() => {
  const d = new Date(props.photo.date)
  return `${d.getFullYear()} / ${String(d.getMonth()+1).padStart(2,'0')} / ${String(d.getDate()).padStart(2,'0')}`
})
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.heart-particle {
  position: absolute;
  transform: translate(-50%, -50%);
  animation: heartFly 1.2s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
  pointer-events: none;
}

@keyframes heartFly {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
  15% { opacity: 1; transform: translate(-50%, -60%) scale(1.1); }
  80% { opacity: 0.8; }
  100% { opacity: 0; transform: translate(-50%, -150%) scale(0.8) rotate((Math.random() - 0.5) * 30deg); }
}
</style>