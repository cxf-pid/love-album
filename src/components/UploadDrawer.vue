<template>
  <!-- ===== 遮罩层 ===== -->
  <transition name="fade">
    <div
      v-if="visible"
      class="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
      @click="$emit('close')"
    ></div>
  </transition>

  <!-- ===== 抽屉主体 ===== -->
  <transition name="drawer">
    <div
      v-if="visible"
      class="fixed right-0 top-0 h-full w-[480px] max-w-[90vw] z-50
             bg-white shadow-2xl flex flex-col overflow-y-auto"
      :style="{ boxShadow: '-8px 0 40px rgba(108, 134, 80, 0.1)' }"
    >
      <!-- 头部 -->
      <div class="flex items-center justify-between px-8 pt-8 pb-4 border-b border-[--color-lanming]/20">
        <h2 class="text-xl font-serif font-bold text-[--color-congqian] tracking-wider">
          定格这一刻 🎞️
        </h2>
        <button
          @click="$emit('close')"
          class="w-9 h-9 rounded-full flex items-center justify-center
                 text-[--color-bizi] hover:bg-[--color-yubai] transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- 表单区域 -->
      <div class="flex-1 px-8 py-6 space-y-6">
        <!-- ===== 拖拽上传区 ===== -->
        <div
          class="upload-zone relative border-2 border-dashed rounded-2xl p-10 text-center
                 transition-all duration-300 cursor-pointer select-none"
          :class="isDragover
            ? 'border-[--color-congqian] bg-[--color-congqian]/5 scale-[1.01]'
            : 'border-[--color-lanming] hover:border-[--color-bizi] hover:bg-[--color-yubai]/50'"
          @click="triggerFileInput"
          @dragover.prevent="isDragover = true"
          @dragleave.prevent="isDragover = false"
          @drop.prevent="handleDrop"
        >
          <!-- 已选文件预览 -->
          <template v-if="selectedFile">
            <div class="relative inline-block">
              <img
                :src="filePreview"
                class="max-h-[200px] rounded-lg shadow-md object-cover"
                alt="预览"
              />
              <button
                @click.stop="clearFile"
                class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-400 text-white
                       flex items-center justify-center text-xs hover:bg-red-500 transition-colors"
              >
                ✕
              </button>
            </div>
            <p class="mt-3 text-sm text-[--color-bizi]">{{ selectedFile.name }}</p>
            <p class="text-xs text-[--color-lanming] mt-1">
              {{ formatFileSize(selectedFile.size) }}
            </p>
          </template>

          <!-- 空状态提示 -->
          <template v-else>
            <div class="mb-4">
              <svg class="w-14 h-14 mx-auto text-[--color-lanming]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p class="text-[--color-congqian] font-medium">点击或拖拽高清原图到此处</p>
            <p class="text-xs text-[--color-lanming] mt-2">支持 JPG / PNG / HEIC / RAW，保留完整画质与 EXIF</p>
          </template>

          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleFileChange"
          />
        </div>

        <!-- ===== 日期字段 ===== -->
        <div>
          <label class="block text-sm font-medium text-[--color-congqian] mb-2 tracking-wide">
            📅 拍摄日期
          </label>
          <input
            v-model="formDate"
            type="date"
            class="w-full px-4 py-3 rounded-xl border border-[--color-lanming] bg-[--color-yubai]/30
                   text-[--color-congqian] focus:outline-none focus:ring-2 focus:ring-[--color-bizi] focus:border-transparent
                   transition-all"
          />
        </div>

        <!-- ===== 故事字段 ===== -->
        <div>
          <label class="block text-sm font-medium text-[--color-congqian] mb-2 tracking-wide">
            💚 背后的故事
          </label>
          <textarea
            v-model="formStory"
            rows="4"
            placeholder="写下那天发生的事...比如：莎莎在植物园里追着一只蝴蝶跑了半个下午 🦋"
            class="w-full px-4 py-3 rounded-xl border border-[--color-lanming] bg-[--color-yubai]/30
                   text-[--color-congqian] placeholder-[--color-lanming] resize-none
                   focus:outline-none focus:ring-2 focus:ring-[--color-bizi] focus:border-transparent
                   transition-all"
          ></textarea>
        </div>

        <!-- ===== 上传进度 ===== -->
        <div v-if="uploading" class="space-y-2">
          <div class="flex justify-between text-sm text-[--color-bizi]">
            <span>{{ uploadStatus }}</span>
            <span>{{ uploadProgress }}%</span>
          </div>
          <div class="w-full h-2 bg-[--color-yubai] rounded-full overflow-hidden">
            <div
              class="progress-bar h-full transition-all duration-300"
              :style="{ width: uploadProgress + '%' }"
            ></div>
          </div>
        </div>

        <!-- ===== 提交按钮 ===== -->
        <button
          @click="handleUpload"
          :disabled="!canSubmit || uploading"
          class="w-full py-4 rounded-2xl text-white font-serif font-bold text-lg tracking-widest
                 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
          :class="canSubmit && !uploading
            ? 'bg-[--color-congqian] hover:bg-[--color-congqian] active:scale-[0.98] shadow-lg shadow-[--color-congqian]/20'
            : 'bg-[--color-lanming]'"
        >
          <span v-if="!uploading">📷 冲印这张胶片</span>
          <span v-else>⏳ 正在冲印...</span>
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed } from 'vue'
import { insertPhoto, uploadPhotoToStorage } from '../lib/supabase.js'

const props = defineProps({
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'uploaded'])

// ===== 文件选择 =====
const fileInput = ref(null)
const selectedFile = ref(null)
const filePreview = ref('')
const isDragover = ref(false)

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileChange(e) {
  const file = e.target.files?.[0]
  if (file) setFile(file)
}

function handleDrop(e) {
  isDragover.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) setFile(file)
}

function setFile(file) {
  if (!file.type.startsWith('image/')) {
    alert('请选择图片文件')
    return
  }
  selectedFile.value = file

  // 生成预览
  const reader = new FileReader()
  reader.onload = (e) => {
    filePreview.value = e.target.result
  }
  reader.readAsDataURL(file)
}

function clearFile() {
  selectedFile.value = null
  filePreview.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

// ===== 表单 =====
const formDate = ref(new Date().toISOString().split('T')[0])
const formStory = ref('')

const canSubmit = computed(() => selectedFile.value && formDate.value)

// ===== 上传流程 =====
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadStatus = ref('')

async function handleUpload() {
  if (!canSubmit.value || uploading.value) return

  const file = selectedFile.value
  uploading.value = true
  uploadProgress.value = 0
  uploadStatus.value = '正在上传原图至 Supabase Storage...'

  try {
    // 步骤 1 & 2: 直传 Supabase Storage（替代 R2 预签名流程）
    const { publicUrl, storagePath } = await uploadPhotoToStorage(file, (percent) => {
      uploadProgress.value = Math.round(percent * 0.9) // 90% 给上传
    })

    // 步骤 3: 保存照片信息到数据库
    uploadStatus.value = '正在保存照片信息...'
    uploadProgress.value = 95

    await insertPhoto({
      publicUrl,
      storagePath,
      date: formDate.value,
      story: formStory.value.trim()
    })

    uploadProgress.value = 100
    uploadStatus.value = '冲印完成！✨'

    // 延迟关闭
    setTimeout(() => {
      emit('uploaded')
      resetForm()
      emit('close')
    }, 1000)

  } catch (error) {
    console.error('上传失败:', error)
    alert('上传失败: ' + error.message)
    uploading.value = false
  }
}

function resetForm() {
  clearFile()
  formDate.value = new Date().toISOString().split('T')[0]
  formStory.value = ''
  uploading.value = false
  uploadProgress.value = 0
  uploadStatus.value = ''
}
</script>
