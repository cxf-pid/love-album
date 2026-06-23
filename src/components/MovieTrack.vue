<template>
  <div class="movie-track-wrapper relative flex h-full w-full overflow-hidden">
    <aside class="timeline-sidebar flex-shrink-0 w-[60px] h-full flex flex-col items-center justify-center
                  border-r border-[--color-lanming]/15 bg-gradient-to-r from-[--color-yubai] to-[--color-yubai]/20
                  backdrop-blur-sm z-20 select-none">
      <div class="relative flex flex-col items-center h-[70%] justify-center">
        <div class="absolute top-0 bottom-0 w-[1px] bg-[--color-lanming]/20 left-1/2 -translate-x-1/2"></div>

        <template v-for="(group, idx) in photoGroups" :key="group.date">
          <div class="relative z-10 flex flex-col items-center"
               :class="{ 'my-6': idx > 0 && idx < photoGroups.length - 1, 'mt-6': idx === 0, 'mb-6': idx === photoGroups.length - 1 }">
            <div
              class="w-2.5 h-2.5 rounded-full cursor-pointer transition-all duration-500 hover:scale-130 border border-white"
              :class="idx === activeGroupIndex
                ? 'bg-[--color-congqian] shadow-md shadow-[--color-congqian]/40 scale-110'
                : 'bg-[--color-lanming]/60 hover:bg-[--color-bizi]'"
              :title="group.label"
              @click="scrollToGroup(idx)">
            </div>
            <span
              class="absolute left-full ml-3 text-[10px] font-mono tracking-widest text-[--color-congqian] font-bold whitespace-nowrap transition-all duration-500"
              :class="idx === activeGroupIndex ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none'">
              {{ group.day }}日
            </span>
          </div>
        </template>
      </div>
    </aside>

    <div class="track-main flex-1 flex flex-col relative min-w-0 bg-[#E8EDE4]/40">
      <div
        ref="trackEl"
        class="photo-track flex-1 flex items-center gap-12 px-16 overflow-x-auto overflow-y-hidden
               cursor-grab active:cursor-grabbing no-scrollbar"
        :class="{ 'cursor-default': batchMode }"
        @wheel.passive="handleWheel"
        @scroll="updateProgress"
      >
        <div class="flex-shrink-0 w-[60px]"></div>

        <template v-for="(group, gIdx) in photoGroups" :key="group.date">
          
          <div
            :ref="el => { if (el) groupRefs[gIdx] = el }"
            class="date-section-header flex-shrink-0 flex flex-col justify-center items-start select-none pr-4 border-l-2 border-[--color-lanming]/30 pl-4 h-[120px] transition-all duration-500"
            :class="gIdx === activeGroupIndex ? 'opacity-100 translate-x-0' : 'opacity-40 -translate-x-1'"
          >
            <span class="text-4xl font-serif font-bold text-[--color-congqian] tracking-tighter leading-none">
              {{ group.day }}
            </span>
            <span class="text-[10px] font-mono text-[--color-bizi] mt-1.5 tracking-wider">
              {{ group.month }}
            </span>
            <span class="text-[9px] font-sans text-gray-400 mt-1 tracking-widest">
              —— SCENE {{ group.photos.length }}
            </span>
          </div>

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

        <div class="flex-shrink-0 w-[150px]"></div>
      </div>

      <div class="progress-container h-[2px] bg-[--color-lanming]/10 relative z-10 flex-shrink-0">
        <div class="progress-bar h-full bg-[--color-congqian] transition-all duration-300 ease-out"
             :style="{ width: progressPercent + '%' }"></div>
        <div class="absolute inset-0 pointer-events-none">
          <div v-for="(g, idx) in photoGroups" :key="'pd-' + g.date"
            class="absolute top-1/2 -translate-y-1/2 w-1 h-1 rounded-full transition-all duration-500"
            :class="idx <= activeGroupIndex ? 'bg-[--color-congqian]' : 'bg-transparent'"
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
        month: `${d.getFullYear()} . ${String(d.getMonth()+1).padStart(2,'0')}`,
        photos
      }
    })
})

const trackEl = ref(null)
const groupRefs = ref({})
const activeGroupIndex = ref(0)
const progressPercent = ref(0)

let velocity = 0
let animFrame = null

function handleWheel(e) {
  if (!trackEl.value) return
  e.preventDefault()
  velocity += e.deltaY * 1.0
  velocity = Math.max(-60, Math.min(60, velocity))
  if (!animFrame) animFrame = requestAnimationFrame(applyInertia)
}

function applyInertia() {
  const el = trackEl.value
  if (!el) { animFrame = null; return }
  el.scrollLeft += velocity
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
  trackEl.value.scrollTo({ left: el.offsetLeft - 60, behavior: 'smooth' })
}

const dotPositions = computed(() =>
  photoGroups.value.length <= 1
    ? [50]
    : photoGroups.value.map((_, i) => (i / (photoGroups.value.length - 1)) * 100)
)

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

async function handleDeletePhoto(id) {
  const photo = props.photos.find(p => p.id === id)
  if (photo?.r2_key) await deletePhotoFromStorage(photo.r2_key)
  await deletePhoto(id)
  emit('photos-updated')
}

defineExpose({ toggleBatchMode, batchDownload, batchMode, selectedIds })
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>