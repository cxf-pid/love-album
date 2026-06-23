<template>
  <div class="app-container h-screen w-screen flex flex-col overflow-hidden bg-[--color-yubai]">
    <!-- ===== 顶部导航栏 ===== -->
    <header
      class="flex-shrink-0 flex items-center justify-between px-8 py-4 z-30
             bg-white/70 backdrop-blur-md border-b border-[--color-lanming]/20"
      :style="{ boxShadow: '0 2px 20px rgba(108, 134, 80, 0.06)' }"
    >
      <!-- 标题区 -->
      <div class="flex items-center gap-4">
        <h1 class="text-2xl font-serif font-bold text-[--color-congqian] tracking-[0.15em] select-none">
          陈彪 <span class="text-[--color-bizi] text-lg">&</span> 王莎莎
        </h1>
        <span class="hidden sm:inline text-xs text-[--color-bizi] tracking-[0.3em] font-sans pt-1">
          · 时光胶片 ·
        </span>
      </div>

      <!-- 操作按钮区 -->
      <div class="flex items-center gap-3">
        <!-- 刷新按钮 -->
        <button
          @click="loadPhotos"
          class="p-2 rounded-full text-[--color-bizi] hover:bg-[--color-yubai] transition-colors"
          title="刷新"
        >
          <svg class="w-5 h-5" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <!-- 批量模式 -->
        <button
          @click="trackRef?.toggleBatchMode()"
          class="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
                 border hover:shadow-md"
          :class="batchModeActive
            ? 'bg-[--color-congqian] text-white border-[--color-congqian]'
            : 'text-[--color-bizi] border-[--color-lanming] hover:border-[--color-bizi]'"
        >
          <span class="flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            批量下载
          </span>
        </button>

        <!-- 执行批量下载 -->
        <button
          v-if="batchModeActive"
          @click="trackRef?.batchDownload()"
          class="px-4 py-2 rounded-full text-sm font-medium text-white
                 bg-[--color-congqian] hover:bg-[--color-congqian] active:scale-95
                 transition-all shadow-md"
        >
          打包选中 ({{ selectedCount }})
        </button>

        <!-- 上传按钮 -->
        <button
          @click="showUploadDrawer = true"
          class="px-5 py-2 rounded-full text-sm font-medium text-white
                 bg-[--color-congqian] hover:bg-[--color-congqian] active:scale-95
                 transition-all shadow-md shadow-[--color-congqian]/20
                 flex items-center gap-1.5"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          添加照片
        </button>
      </div>
    </header>

    <!-- ===== 主内容区 ===== -->
    <main class="flex-1 relative overflow-hidden">
      <!-- 加载状态 -->
      <div
        v-if="loading && photos.length === 0"
        class="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10"
      >
        <div class="flex items-center gap-1">
          <span class="w-2.5 h-2.5 rounded-full bg-[--color-congqian] animate-bounce" style="animation-delay: 0s"></span>
          <span class="w-2.5 h-2.5 rounded-full bg-[--color-bizi] animate-bounce" style="animation-delay: 0.15s"></span>
          <span class="w-2.5 h-2.5 rounded-full bg-[--color-lanming] animate-bounce" style="animation-delay: 0.3s"></span>
        </div>
        <p class="text-[--color-bizi] text-sm tracking-wider">正在加载回忆...</p>
      </div>

      <!-- 空状态 -->
      <div
        v-if="!loading && photos.length === 0"
        class="absolute inset-0 flex flex-col items-center justify-center gap-6 z-10"
      >
        <div class="text-8xl select-none">🎞️</div>
        <p class="text-xl font-serif text-[--color-congqian] tracking-wider">时光胶片还是空的</p>
        <p class="text-[--color-bizi] text-sm">点右上角「添加照片」开始记录你们的故事吧</p>
        <button
          @click="showUploadDrawer = true"
          class="mt-4 px-8 py-3 rounded-full text-white font-medium
                 bg-[--color-congqian] hover:bg-[--color-congqian] active:scale-95
                 transition-all shadow-lg shadow-[--color-congqian]/20"
        >
          定格第一个瞬间
        </button>
      </div>

      <!-- 电影轨道 -->
      <MovieTrack
        v-if="photos.length > 0"
        ref="trackRef"
        :photos="photos"
        @photos-updated="loadPhotos"
      />
    </main>

    <!-- ===== 上传抽屉 ===== -->
    <UploadDrawer
      :visible="showUploadDrawer"
      @close="showUploadDrawer = false"
      @uploaded="onUploaded"
    />
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

// 批量模式状态通过 trackRef 访问子组件
const batchModeActive = computed(() => trackRef.value?.batchMode || false)
const selectedCount = computed(() => trackRef.value?.selectedIds?.size || 0)

async function loadPhotos() {
  loading.value = true
  try {
    photos.value = await fetchPhotos()
  } catch (e) {
    console.error('加载照片失败:', e)
  } finally {
    loading.value = false
  }
}

function onUploaded() {
  loadPhotos()
}

onMounted(() => {
  loadPhotos()
})
</script>
