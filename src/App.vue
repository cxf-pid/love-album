<template>
  <div class="app-container h-screen w-screen flex flex-col overflow-hidden bg-[--color-yubai]">
    <!-- ===== 顶部导航 ===== -->
    <header class="flex-shrink-0 flex items-center justify-between px-8 py-4 z-30
                    bg-white/60 backdrop-blur-xl border-b border-[--color-lanming]/15"
            :style="{ boxShadow: '0 1px 20px rgba(108, 134, 80, 0.04)' }">
      <!-- 左侧标题 -->
      <div class="flex items-baseline gap-3 select-none">
        <h1 class="text-2xl font-serif font-bold text-[--color-congqian] tracking-[0.12em]">
          陈彪 <span class="text-[--color-bizi] text-lg font-normal">&</span> 王莎莎
        </h1>
        <span class="hidden sm:inline text-[11px] text-[--color-bizi] tracking-[0.35em] font-sans">
          · 时光胶片 ·
        </span>
      </div>

      <!-- 右侧按钮组 -->
      <div class="flex items-center gap-2.5">
        <!-- 刷新 -->
        <button @click="loadPhotos"
          class="p-2.5 rounded-full text-[--color-bizi] hover:bg-[--color-yubai] hover:text-[--color-congqian]
                 transition-all duration-300" title="刷新照片">
          <svg class="w-4 h-4" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
        </button>

        <!-- 批量模式切换 -->
        <button @click="trackRef?.toggleBatchMode()"
          class="btn-float px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 border"
          :class="batchModeActive
            ? 'bg-[--color-congqian] text-white border-[--color-congqian] shadow-md shadow-[--color-congqian]/15'
            : 'text-[--color-bizi] border-[--color-lanming]/40 hover:border-[--color-bizi] hover:text-[--color-congqian]'">
          <span class="flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
            </svg>
            批量
          </span>
        </button>

        <!-- 执行下载 -->
        <button v-if="batchModeActive" @click="trackRef?.batchDownload()"
          class="btn-float px-4 py-2 rounded-full text-xs font-medium text-white
                 bg-[--color-bizi] hover:bg-[--color-congqian] transition-all duration-300 shadow-md">
          打包 {{ selectedCount }} 帧
        </button>

        <!-- 主上传 CTA -->
        <button @click="showUploadDrawer = true"
          class="btn-float px-5 py-2 rounded-full text-xs font-medium text-white
                 bg-[--color-congqian] hover:bg-[--color-congqian]/90 transition-all duration-300
                 shadow-md shadow-[--color-congqian]/15 flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          添加照片
        </button>
      </div>
    </header>

    <!-- ===== 主体 ===== -->
    <main class="flex-1 relative overflow-hidden">
      <!-- 加载 -->
      <div v-if="loading && photos.length === 0"
        class="absolute inset-0 flex flex-col items-center justify-center gap-5 z-10">
        <div class="flex gap-2">
          <span class="w-2 h-2 rounded-full bg-[--color-congqian] animate-bounce [animation-delay:0s]"></span>
          <span class="w-2 h-2 rounded-full bg-[--color-bizi] animate-bounce [animation-delay:0.12s]"></span>
          <span class="w-2 h-2 rounded-full bg-[--color-lanming] animate-bounce [animation-delay:0.24s]"></span>
        </div>
        <p class="text-[--color-bizi] text-xs tracking-[0.2em]">正在加载回忆</p>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && photos.length === 0"
        class="absolute inset-0 flex flex-col items-center justify-center gap-5 z-10">
        <div class="text-7xl select-none opacity-80">🎞️</div>
        <p class="text-xl font-serif text-[--color-congqian] tracking-wider">时光胶片还是空的</p>
        <p class="text-xs text-[--color-bizi]">点击右上角「添加照片」定格你们的故事</p>
        <button @click="showUploadDrawer = true"
          class="btn-float mt-3 px-8 py-3 rounded-full text-sm font-medium text-white
                 bg-[--color-congqian] shadow-lg shadow-[--color-congqian]/20 transition-all duration-300">
          定格第一个瞬间 ✨
        </button>
      </div>

      <!-- 轨道 -->
      <MovieTrack v-if="photos.length > 0" ref="trackRef" :photos="photos" @photos-updated="loadPhotos"/>
    </main>

    <!-- ===== 上传抽屉 ===== -->
    <UploadDrawer :visible="showUploadDrawer" @close="showUploadDrawer = false" @uploaded="onUploaded"/>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MovieTrack from './components/MovieTrack.vue'
import UploadDrawer from './components/UploadDrawer.vue'
import { fetchPhotos } from './lib/supabase.js'

const photos = ref([])
const loading = ref(false)
const showUploadDrawer = ref(false)
const trackRef = ref(null)

const batchModeActive = computed(() => trackRef.value?.batchMode ?? false)
const selectedCount = computed(() => trackRef.value?.selectedIds?.size ?? 0)

async function loadPhotos() {
  loading.value = true
  photos.value = await fetchPhotos().catch(() => [])
  loading.value = false
}

function onUploaded() { loadPhotos() }
onMounted(() => loadPhotos())
</script>
