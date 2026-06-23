<template>
  <div class="movie-track-wrapper relative flex h-full w-full">
    <!-- ===== 左侧时光轴 ===== -->
    <aside class="timeline-sidebar flex-shrink-0 w-[140px] h-full flex flex-col items-center justify-center
                  border-r border-[--color-lanming]/30 bg-[--color-yubai]/50 backdrop-blur-sm z-20">
      <div class="flex flex-col items-center gap-3">
        <!-- 时间轴线条 -->
        <div class="relative flex flex-col items-center">
          <div class="w-[1px] h-16 bg-gradient-to-b from-transparent via-[--color-lanming] to-[--color-bizi]"></div>

          <template v-for="(group, idx) in photoGroups" :key="group.date">
            <div
              class="timeline-dot w-2.5 h-2.5 rounded-full cursor-pointer transition-all duration-300 my-3"
              :class="idx === activeGroupIndex ? 'bg-[--color-congqian] scale-150' : 'bg-[--color-lanming] hover:bg-[--color-bizi]'"
              :title="group.label"
              @click="scrollToGroup(idx)"
            ></div>
            <span
              v-if="idx === activeGroupIndex"
              class="text-xs text-[--color-congqian] font-serif tracking-widest writing-vertical whitespace-nowrap
                     transition-all duration-300"
            >{{ group.label }}</span>
          </template>

          <div class="w-[1px] h-16 bg-gradient-to-b from-[--color-bizi] via-[--color-lanming] to-transparent"></div>
        </div>
      </div>
    </aside>

    <!-- ===== 电影轨道主区域 ===== -->
    <div class="track-main flex-1 flex flex-col relative">
      <!-- 照片横向滚动区 -->
      <div
        ref="trackEl"
        class="photo-track flex-1 flex items-center gap-8 px-12 overflow-x-auto overflow-y-hidden
               scroll-smooth cursor-grab active:cursor-grabbing"
        :class="{ 'cursor-default': batchMode }"
        @wheel.prevent="handleWheel"
        @scroll="updateProgress"
      >
        <!-- 开场留白 -->
        <div class="flex-shrink-0 w-[60px]"></div>

        <!-- 照片按日期分组排列 -->
        <template v-for="(group, gIdx) in photoGroups" :key="group.date">
          <!-- 日期分组标题卡片 -->
          <div
            :ref="el => { if (el) groupRefs[gIdx] = el }"
            class="date-marker flex-shrink-0 flex flex-col items-center justify-center w-[100px] h-[300px]
                   rounded-2xl bg-white/60 backdrop-blur-sm border border-[--color-lanming]/20
                   shadow-sm select-none"
          >
            <span class="text-4xl font-serif font-bold text-[--color-congqian] leading-none">
              {{ group.day }}
            </span>
            <span class="text-xs text-[--color-bizi] mt-3 tracking-widest">
              {{ group.month }}
            </span>
            <span class="text-[10px] text-[--color-lanming] mt-1">
              {{ group.photos.length }} 张
            </span>
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
            @like-update="() => {}"
          />
        </template>

        <!-- 结尾留白 -->
        <div class="flex-shrink-0 w-[60px]"></div>
      </div>

      <!-- ===== 底部进度条 ===== -->
      <div class="progress-container h-2 bg-[--color-yubai] border-t border-[--color-lanming]/20 relative z-10">
        <div
          class="progress-bar h-full transition-all duration-150 ease-out"
          :style="{ width: progressPercent + '%' }"
        ></div>
        <!-- 进度条上的时间节点 -->
        <div class="absolute inset-0 flex items-center">
          <div
            v-for="(group, idx) in photoGroups"
            :key="'dot-' + group.date"
            class="absolute w-1.5 h-1.5 rounded-full transition-all duration-300"
            :class="idx <= activeGroupIndex ? 'bg-[--color-congqian]' : 'bg-[--color-lanming]'"
            :style="{ left: groupDotPositions[idx] + '%' }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import PhotoCard from './PhotoCard.vue'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { deletePhoto, deletePhotoFromStorage } from '../lib/supabase.js'

const props = defineProps({
  photos: { type: Array, required: true }
})

const emit = defineEmits(['photos-updated'])

// ===== 按日期分组 =====
const photoGroups = computed(() => {
  const groups = {}
  for (const photo of props.photos) {
    const date = photo.date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(photo)
  }

  // 按日期降序排列
  const sorted = Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))

  return sorted.map(([date, photos]) => {
    const d = new Date(date)
    const label = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
    return {
      date,
      label,
      day: String(d.getDate()).padStart(2, '0'),
      month: `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`,
      photos
    }
  })
})

// ===== 横向滚动逻辑 =====
const trackEl = ref(null)
const groupRefs = ref({})
const activeGroupIndex = ref(0)
const progressPercent = ref(0)

function handleWheel(e) {
  const el = trackEl.value
  if (!el) return

  // 将垂直滚轮 deltaY 转为横向滚动，加入平滑系数
  const scrollAmount = e.deltaY * 1.5
  el.scrollBy({
    left: scrollAmount,
    behavior: 'auto' // 用 auto 配合 CSS scroll-behavior: smooth 会有延迟，这里手动平滑
  })
}

function updateProgress() {
  const el = trackEl.value
  if (!el) return

  const maxScroll = el.scrollWidth - el.clientWidth
  if (maxScroll <= 0) {
    progressPercent.value = 0
    return
  }
  progressPercent.value = Math.min(100, (el.scrollLeft / maxScroll) * 100)

  // 计算当前活跃的分组
  determineActiveGroup()
}

function determineActiveGroup() {
  const el = trackEl.value
  if (!el) return

  const trackCenter = el.scrollLeft + el.clientWidth / 2
  let closest = 0
  let closestDist = Infinity

  for (const [idx, grpEl] of Object.entries(groupRefs.value)) {
    if (!grpEl) continue
    const grpCenter = grpEl.offsetLeft + grpEl.offsetWidth / 2
    const dist = Math.abs(trackCenter - grpCenter)
    if (dist < closestDist) {
      closestDist = dist
      closest = parseInt(idx)
    }
  }
  activeGroupIndex.value = closest
}

function scrollToGroup(idx) {
  const el = groupRefs.value[idx]
  if (!el || !trackEl.value) return
  trackEl.value.scrollTo({
    left: el.offsetLeft - 100,
    behavior: 'smooth'
  })
}

// 分组点在进度条上的位置
const groupDotPositions = computed(() => {
  if (!photoGroups.value.length) return []
  return photoGroups.value.map((_, idx) => {
    return (idx / (photoGroups.value.length - 1 || 1)) * 100
  })
})

// ===== 批量选择 =====
const batchMode = ref(false)
const selectedIds = ref(new Set())

function toggleBatchMode() {
  batchMode.value = !batchMode.value
  if (!batchMode.value) {
    selectedIds.value.clear()
  }
}

function toggleSelect(photoId) {
  if (!batchMode.value) return
  const s = new Set(selectedIds.value)
  if (s.has(photoId)) {
    s.delete(photoId)
  } else {
    s.add(photoId)
  }
  selectedIds.value = s
}

// ===== JSZip 批量下载 =====
async function batchDownload() {
  if (selectedIds.value.size === 0) {
    alert('请先在批量模式下勾选照片')
    return
  }

  const selectedPhotos = props.photos.filter(p => selectedIds.value.has(p.id))
  const zip = new JSZip()
  const folder = zip.folder('陈彪&王莎莎_时光胶片')

  // 并发下载所有选中图片
  const downloads = selectedPhotos.map(async (photo) => {
    try {
      const res = await fetch(photo.public_url)
      const blob = await res.blob()
      const ext = photo.public_url.split('.').pop()?.split('?')[0] || 'jpg'
      folder.file(`${photo.date}_${photo.story?.slice(0, 10) || '记忆'}.${ext}`, blob)
    } catch (e) {
      console.error(`下载失败: ${photo.public_url}`, e)
    }
  })

  await Promise.all(downloads)
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  saveAs(zipBlob, '陈彪&王莎莎_时光胶片.zip')
  alert('打包完成！你的记忆已下载到本地 💚')

  // 退出批量模式
  batchMode.value = false
  selectedIds.value.clear()
}

// ===== 删除照片 =====
async function handleDeletePhoto(photoId) {
  try {
    // 找到照片获取 storage path
    const photo = props.photos.find(p => p.id === photoId)
    if (photo?.r2_key) {
      await deletePhotoFromStorage(photo.r2_key)
    }
    await deletePhoto(photoId)
    emit('photos-updated')
  } catch (e) {
    console.error('删除失败:', e)
    alert('删除失败，请重试')
  }
}

// 暴露方法给父组件
defineExpose({
  toggleBatchMode,
  batchDownload,
  batchMode,
  selectedIds
})
</script>

<style scoped>
/* 竖排文字 */
.writing-vertical {
  writing-mode: vertical-rl;
}

/* 自定义横向滚动条更美观 */
.photo-track::-webkit-scrollbar {
  height: 4px;
}
.photo-track::-webkit-scrollbar-track {
  background: transparent;
}
.photo-track::-webkit-scrollbar-thumb {
  background: var(--color-lanming);
  border-radius: 9999px;
}
</style>
