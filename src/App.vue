<template>
  <div class="app-container h-screen w-screen flex flex-col overflow-hidden bg-[--color-yubai]">
    
    <!-- ===== 顶部导航（电影开幕式宽幅质感） ===== -->
    <header class="flex-shrink-0 flex items-center justify-between px-8 py-4 z-30
                    bg-[#fafaf7]/90 backdrop-blur-xl border-b border-[--color-lanming]/20 shadow-[0_2px_20px_rgba(108, 134, 80, 0.03)]">
      <!-- 左侧标题 -->
      <div class="flex items-baseline gap-3 select-none">
        <h1 class="text-2xl font-serif font-bold text-[--color-congqian] tracking-[0.15em]">
          陈彪 <span class="text-[--color-bizi] text-lg font-normal font-sans">&</span> 王莎莎
        </h1>
        <span class="hidden sm:inline text-[10px] text-[--color-lanming] tracking-[0.4em] font-mono uppercase opacity-80">
          · Film Track ·
        </span>
      </div>

      <!-- 右侧按钮组 -->
      <div class="flex items-center gap-3">
        <!-- 刷新 -->
        <button @click="loadPhotos"
          class="p-2 rounded-full text-[--color-lanming] hover:bg-[--color-lanming]/10 hover:text-[--color-congqian]
                 transition-all duration-300" title="刷新照片">
          <svg class="w-4 h-4" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
        </button>

        <!-- 批量模式切换 -->
        <button @click="trackRef?.toggleBatchMode()"
          class="px-4 py-1.5 rounded-full text-xs font-serif font-bold transition-all duration-300 border"
          :class="batchModeActive
            ? 'bg-[--color-bizi] text-white border-[--color-bizi] shadow-md shadow-[--color-bizi]/20'
            : 'text-[--color-bizi] border-[--color-lanming]/40 hover:border-[--color-bizi] hover:bg-[--color-lanming]/5'">
          <span class="flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
            </svg>
            批量选择
          </span>
        </button>

        <!-- 执行打包下载 -->
        <button v-if="batchModeActive" @click="trackRef?.batchDownload()"
          class="px-4 py-1.5 rounded-full text-xs font-serif font-bold text-white
                 bg-red-400 hover:bg-red-500 transition-all duration-300 shadow-md shadow-red-100 animate-[fadeIn_0.2s_ease]">
          打包 {{ selectedCount }} 帧 🎞️
        </button>

        <!-- 主上传 CTA：彻底剥离旧样式，强制执行高级暗房色调（解决白底重叠问题） -->
        <button @click="showUploadDrawer = true"
          class="!bg-[--color-congqian] !text-[#fafaf7] px-5 py-2 rounded-full text-xs font-serif font-bold tracking-wider
                 hover:!bg-[#485939] active:scale-95 transition-all duration-300
                 shadow-md shadow-[--color-congqian]/20 hover:shadow-lg hover:shadow-[--color-congqian]/30
                 flex items-center gap-1.5 border border-[--color-congqian]"
        >
          <svg class="w-3.5 h-3.5 text-[#fafaf7]/90" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
          添加照片
        </button>
      </div>
    </header>

    <!-- ===== 主体内容区域 ===== -->
    <main class="flex-1 relative overflow-hidden bg-[#e6e8e3]/30">
      
      <!-- 加载中状态 (电影粒子感加载) -->
      <div v-if="loading && photos.length === 0"
        class="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-[#fafaf7]/60 backdrop-blur-sm">
        <div class="flex gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-[--color-congqian] animate-bounce [animation-delay:0s]"></span>
          <span class="w-2.5 h-2.5 rounded-full bg-[--color-bizi] animate-bounce [animation-delay:0.15s]"></span>
          <span class="w-2.5 h-2.5 rounded-full bg-[--color-lanming] animate-bounce [animation-delay:0.3s]"></span>
        </div>
        <p class="text-[--color-congqian] text-xs font-serif italic tracking-[0.25em]">正在显影往日时光...</p>
      </div>

      <!-- 空状态提示 -->
      <div v-if="!loading && photos.length === 0"
        class="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
        <div class="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-md text-3xl border border-[--color-lanming]/10 select-none animate-pulse">
          🎞️
        </div>
        <p class="text-lg font-serif font-bold text-[--color-congqian] tracking-wider mt-2">时光胶片空空如也</p>
        <p class="text-xs text-[--color-bizi] tracking-wide">按下右上角的“添加照片”，开始连载你们的故事</p>
        <button @click="showUploadDrawer = true"
          class="mt-4 px-6 py-2.5 rounded-full text-xs font-serif font-bold text-[#fafaf7]
                 bg-[--color-congqian] shadow-lg shadow-[--color-congqian]/15 hover:bg-[#485939] transition-all duration-300">
          定格第一个瞬间 ✨
        </button>
      </div>

      <!-- 电影胶片主轨道组件 -->
      <MovieTrack v-if="photos.length > 0" ref="trackRef" :photos="photos" @photos-updated="loadPhotos"/>
    </main>

    <!-- ===== 上传抽屉（暗房组件） ===== -->
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

// 响应式计算子组件传上来的批量状态与选中计数
const batchModeActive = computed(() => trackRef.value?.batchMode ?? false)
const selectedCount = computed(() => trackRef.value?.selectedIds?.size ?? 0)

// 加载 Supabase 中的照片数据
async function loadPhotos() {
  loading.value = true
  try {
    photos.value = await fetchPhotos()
  } catch (err) {
    console.error('获取照片失败:', err)
    photos.value = []
  } finally {
    loading.value = false
  }
}

// 冲印成功回调
function onUploaded() { 
  loadPhotos() 
}

// 挂载时自动触发显影
onMounted(() => {
  loadPhotos()
})
</script>

<style>
/* 全局基础动画淡入效果扩展 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-\[fadeIn_0\.2s_ease\] {
  animation: fadeIn 0.2s ease forwards;
}
</style>