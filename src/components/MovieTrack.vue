<template>
  <div class="movie-track-wrapper relative flex h-full w-full">
    <!-- ===== 左侧时光轴 80px ===== -->
    <aside class="timeline-sidebar flex-shrink-0 w-[80px] h-full flex flex-col items-center justify-center
                  border-r border-[--color-lanming]/20 bg-gradient-to-r from-[--color-yubai] to-[--color-yubai]/40
                  backdrop-blur-sm z-20 select-none">
      <div class="relative flex flex-col items-center h-[80%] justify-center">
        <!-- 竖线 -->
        <div class="absolute top-0 bottom-0 w-[1px] bg-[--color-lanming]/25 left-1/2 -translate-x-1/2"></div>

        <template v-for="(group, idx) in photoGroups" :key="group.date">
          <!-- 时间点 -->
          <div class="relative z-10 flex flex-col items-center"
               :class="{ 'my-7': idx > 0 && idx < photoGroups.length - 1, 'mt-7': idx === 0, 'mb-7': idx === photoGroups.length - 1 }">
            <div
              class="w-3 h-3 rounded-full cursor-pointer transition-all duration-500 hover:scale-150"
              :class="idx === activeGroupIndex
                ? 'bg-[--color-congqian] shadow-lg shadow-[--color-congqian]/30 scale-125'
                : 'bg-[--color-lanming] hover:bg-[--color-bizi]'"
              :title="group.label"
              @click="scrollToGroup(idx)">
            </div>
            <!-- 活跃日期标签 -->
            <span
              class="absolute left-full ml-2 text-[11px] font-serif whitespace-nowrap transition-all duration-500"
              :class="idx === activeGroupIndex
                ? 'text-[--color-congqian] font-bold opacity-100 translate-x-0'
                : 'text-[--color-lanming] opacity-0 -translate-x-2'">
              {{ group.label }}
            </span>
          </div>
        </template>
      </div>
    </aside>

    <!-- ===== 电影轨道主区域 ===== -->
    <div class="track-main flex-1 flex flex-col relative min-w-0">
      <div
        ref="trackEl"
        class="photo-track flex-1 flex items-center gap-4 px-10 overflow-x-auto overflow-y-hidden
               cursor-grab active:cursor-grabbing"
        :class="{ 'cursor-default': batchMode }"
        @wheel.passive="handleWheel"
        @scroll="updateProgress"
      >
        <!-- 开场留白 -->
        <div class="flex-shrink-0 w-[80px]"></div>

        <template v-for="(group, gIdx) in photoGroups" :key="group.date">
          <!-- 场记板式日期卡片 -->
          <div
            :ref="el => { if (el) groupRefs[gIdx] = el }"
            class="date-clapboard flex-shrink-0 w-[80px] h-[240px] rounded-2xl flex flex-col items-center justify-center
                   bg-white/40 backdrop-blur-sm border border-[--color-lanming]/20 select-none
                   transition-all duration-500"
            :class="gIdx === activeGroupIndex
              ? 'shadow-lg shadow-[--color-congqian]/8 scale-105 border-[--color-bizi]/30'
              : 'shadow-sm hover:shadow-md'">
            <!-- 场记板上缘条纹 -->
            <div class="w-full h-1 bg-[--color-lanming]/30 rounded-t-2xl mb-3"></div>
            <span class="text-[28px] font-serif font-bold text-[--color-congqian] leading-none">
              {{ group.day }}
            </span>
            <span class="text-[10px] text-[--color-bizi] mt-2 tracking-[0.15em]">
              {{ group.month }}
            </span>
            <div class="w-6 h-[1px] bg-[--color-lanming]/40 my-2"></div>
            <span class="text-[9px] text-[--color-lanming]">
              {{ group.photos.length }}帧
            </span>
            <!-- 场记板下缘条纹 -->
            <div class="w-full h-1 bg-[--color-lanming]/30 rounded-b-2xl mt-3"></div>
          </div>

          <!-- 照片卡片 -->
          <PhotoCard
            v-for="photo in group.photos"
            :key="photo.id"
            :photo="photo"
            :batch-mode="batchMode"
            :is-selected="selectedIds.has(photo.id)"
            @toggle-select="toggleSelect"
            @delete-photo="handleDeletePhoto"
          />
        </template>

        <!-- 结尾留白 -->
        <div class="flex-shrink-0 w-[80px]"></div>
      </div>

      <!-- ===== 底部进度条 4px ===== -->
      <div class="progress-container h-1 bg-[--color-yubai] border-t border-[--color-lanming]/15 relative z-10 flex-shrink-0">
        <div class="progress-bar h-full transition-all duration-200 ease-out"
             :style="{ width: progressPercent + '%' }"></div>
        <!-- 进度节点 -->
        <div class="absolute inset-0">
          <div v-for="(g, idx) in photoGroups" :key="'pd-' + g.date"
            class="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full transition-all duration-500"
            :class="idx <= activeGroupIndex ? 'bg-[--color-congqian]' : 'bg-[--color-lanming]/50'"
            :style="{ left: dotPositions[idx] + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import PhotoCard from './PhotoCard.vue'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { deletePhoto, deletePhotoFromStorage } from '../lib/supabase.js'

const props = defineProps({ photos: { type: Array, required: true } })
const emit = defineEmits(['photos-updated'])

// ===== 分组 =====
const photoGroups = computed(() => {
  const groups = {}
  for (const p of props.photos) {
    if (!groups[p.date]) groups[p.date] = []
    groups[p.date].push(p)
  }
  return Object.entries(groups)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, photos]) => {
      const d = new Date(date)
      return {
        date,
        label: `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`,
        day: String(d.getDate()).padStart(2, '0'),
        month: `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}`,
        photos
      }
    })
})

// ===== 惯性滚动 =====
const trackEl = ref(null)
const groupRefs = ref({})
const activeGroupIndex = ref(0)
const progressPercent = ref(0)

let velocity = 0
let animFrame = null

function handleWheel(e) {
  if (!trackEl.value) return
  e.preventDefault()

  // 累加速度
  velocity += e.deltaY * 1.2
  // 限速
  velocity = Math.max(-80, Math.min(80, velocity))

  if (!animFrame) {
    animFrame = requestAnimationFrame(applyInertia)
  }
}

function applyInertia() {
  const el = trackEl.value
  if (!el) { animFrame = null; return }

  el.scrollLeft += velocity

  // 摩擦力衰减
  velocity *= 0.88

  if (Math.abs(velocity) < 0.5) {
    velocity = 0
    animFrame = null
  } else {
    animFrame = requestAnimationFrame(applyInertia)
  }
}

function updateProgress() {
  const el = trackEl.value
  if (!el) return
  const max = el.scrollWidth - el.clientWidth
  progressPercent.value = max > 0 ? Math.min(100, (el.scrollLeft / max) * 100) : 0
  determineActive()
}

function determineActive() {
  const el = trackEl.value
  if (!el) return
  const center = el.scrollLeft + el.clientWidth / 2
  let best = 0, bestDist = Infinity
  for (const [idx, ref] of Object.entries(groupRefs.value)) {
    if (!ref) continue
    const d = Math.abs(ref.offsetLeft + ref.offsetWidth / 2 - center)
    if (d < bestDist) { bestDist = d; best = parseInt(idx) }
  }
  activeGroupIndex.value = best
}

function scrollToGroup(idx) {
  const el = groupRefs.value[idx]
  if (!el || !trackEl.value) return
  trackEl.value.scrollTo({ left: el.offsetLeft - 120, behavior: 'smooth' })
}

const dotPositions = computed(() =>
  photoGroups.value.length <= 1
    ? [50]
    : photoGroups.value.map((_, i) => (i / (photoGroups.value.length - 1)) * 100)
)

// ===== 批量 =====
const batchMode = ref(false)
const selectedIds = ref(new Set())

function toggleBatchMode() {
  batchMode.value = !batchMode.value
  if (!batchMode.value) selectedIds.value.clear()
}
function toggleSelect(id) {
  if (!batchMode.value) return
  const s = new Set(selectedIds.value)
  s.has(id) ? s.delete(id) : s.add(id)
  selectedIds.value = s
}

async function batchDownload() {
  if (selectedIds.value.size === 0) { alert('请先勾选照片'); return }
  const zip = new JSZip()
  const folder = zip.folder('时光胶片')
  const tasks = props.photos.filter(p => selectedIds.value.has(p.id)).map(async p => {
    try {
      const blob = await fetch(p.public_url).then(r => r.blob())
      folder.file(`${p.date}_记忆.${p.public_url.split('.').pop()?.split('?')[0] || 'jpg'}`, blob)
    } catch(e) { console.error(e) }
  })
  await Promise.all(tasks)
  saveAs(await zip.generateAsync({ type: 'blob' }), '陈彪&王莎莎_时光胶片.zip')
  batchMode.value = false
  selectedIds.value.clear()
}

// ===== 删除 =====
async function handleDeletePhoto(id) {
  const photo = props.photos.find(p => p.id === id)
  if (photo?.r2_key) await deletePhotoFromStorage(photo.r2_key)
  await deletePhoto(id)
  emit('photos-updated')
}

defineExpose({ toggleBatchMode, batchDownload, batchMode, selectedIds })
</script>

<style scoped>
.photo-track::-webkit-scrollbar { height: 4px; }
.photo-track::-webkit-scrollbar-track { background: transparent; }
.photo-track::-webkit-scrollbar-thumb { background: var(--color-lanming); border-radius: 99px; }
</style>
