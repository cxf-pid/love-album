<template>
  <transition name="fade">
    <div
      v-if="visible"
      class="fixed inset-0 bg-[#333d29]/15 backdrop-blur-md z-40 transition-all duration-500"
      @click="$emit('close')"
    ></div>
  </transition>

  <transition name="drawer">
    <div
      v-if="visible"
      class="fixed right-0 top-0 h-full w-[460px] max-w-[95vw] z-50
             bg-[#fafaf7] flex flex-col overflow-y-auto border-l border-[--color-lanming]/10"
      :style="{ boxShadow: '-20px 0 60px rgba(84, 102, 65, 0.08)' }"
    >
      <div class="flex items-center justify-between px-8 pt-8 pb-5 border-b border-[--color-lanming]/15 bg-white/60 backdrop-blur-sm sticky top-0 z-10">
        <div class="flex flex-col gap-1">
          <h2 class="text-xl font-serif font-bold text-[--color-congqian] tracking-widest">
            定格这一刻
          </h2>
          <span class="text-[10px] font-mono tracking-widest text-[--color-lanming] uppercase">
            Film Processing Chamber
          </span>
        </div>
        <button
          @click="$emit('close')"
          class="w-8 h-8 rounded-full flex items-center justify-center text-gray-400
                 hover:text-[--color-congqian] hover:bg-[--color-yubai]/60 transition-all duration-300"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="flex-1 px-8 py-8 space-y-7">
        
        <div class="flex flex-col items-center justify-center">
          <div
            class="upload-polaroid-card relative w-[240px] h-[310px] bg-white rounded-lg p-3 pb-12
                   border border-[--color-lanming]/20 cursor-pointer select-none transition-all duration-500
                   flex flex-col items-center justify-center group"
            :class="isDragover
              ? 'scale-[1.03] border-[--color-congqian] bg-[--color-yubai]/10 ring-4 ring-[--color-congqian]/5'
              : 'hover:scale-[1.01] hover:border-[--color-bizi]/40 shadow-[0_15px_35px_rgba(108,134,80,0.06)] hover:shadow-[0_20px_45px_rgba(108,134,80,0.1)]'"
            @click="triggerFileInput"
            @dragover.prevent="isDragover = true"
            @dragleave.prevent="isDragover = false"
            @drop.prevent="handleDrop"
          >
            <div class="absolute top-1.5 left-0 right-0 flex justify-between px-3 opacity-20 pointer-events-none">
              <div v-for="i in 6" :key="'pt-'+i" class="w-1 h-1 bg-black rounded-sm"></div>
            </div>

            <template v-if="selectedFile">
              <div class="w-full h-full rounded bg-[#fafaf7] overflow-hidden relative shadow-inner">
                <img
                  :src="filePreview"
                  class="w-full h-full object-cover animate-[fadeIn_0.4s_ease]"
                  alt="暗房预览"
                />
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                  <button
                    @click.stop="clearFile"
                    class="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs border border-white/20 hover:bg-red-500/80 transition-colors"
                  >
                    更换底片
                  </button>
                </div>
              </div>
            </template>

            <template v-else>
              <div class="w-full h-full rounded bg-[#fafaf7] border border-dashed border-[--color-lanming]/40 flex flex-col items-center justify-center px-4 text-center group-hover:bg-[--color-yubai]/20 transition-colors">
                <div class="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-[--color-lanming]/10 text-[--color-lanming] group-hover:text-[--color-congqian] group-hover:scale-110 transition-all duration-300 mb-3">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 13.5V6a2 2 0 012-2h8a2 2 0 012 2v7.5m-12 0a2.25 2.25 0 001.5 2.158V21a.75.75 0 001.28.53l3.22-3.22 3.22 3.22a.75.75 0 001.28-.53v-5.342a2.25 2.25 0 001.5-2.158m-12 0a3 3 0 016 0m0 0a3 3 0 016 0" />
                  </svg>
                </div>
                <p class="text-xs text-[--color-congqian] font-medium tracking-wider">置入高清原图</p>
                <p class="text-[9px] text-[--color-lanming] mt-1.5 leading-relaxed">支持点击或拖拽<br>保留完整画质与 EXIF</p>
              </div>
            </template>

            <div class="absolute bottom-3 left-0 right-0 text-center select-none">
              <span class="text-[10px] font-serif italic text-gray-300 tracking-widest font-bold">
                {{ selectedFile ? 'READY FOR PRINT' : 'LATENT IMAGE' }}
              </span>
            </div>

            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleFileChange"
            />
          </div>
          <p v-if="selectedFile" class="mt-2 text-[10px] font-mono text-[--color-lanming] tracking-tight animate-[fadeIn_0.3s_ease]">
            {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
          </p>
        </div>

        <div class="space-y-2">
          <label class="flex items-center gap-1.5 text-xs font-serif font-bold text-[--color-congqian] tracking-wider">
            <span>📅</span> 记下日期
          </label>
          <div class="relative">
            <input
              v-model="formDate"
              type="date"
              class="w-full px-4 py-3 rounded-xl border border-[--color-lanming]/30 bg-white
                     text-sm text-[--color-congqian] font-mono shadow-sm
                     focus:outline-none focus:border-[--color-bizi] transition-all duration-300"
            />
          </div>
        </div>

        <div class="space-y-2">
          <label class="flex items-center gap-1.5 text-xs font-serif font-bold text-[--color-congqian] tracking-wider">
            <span>🌿</span> 幕后故事
          </label>
          <textarea
            v-model="formStory"
            rows="4"
            placeholder="写下那天发生的事... 比如：莎莎在植物园里追着一只蝴蝶跑了半个下午 🦋"
            class="w-full px-4 py-3 rounded-xl border border-[--color-lanming]/30 bg-white
                   text-xs text-gray-600 placeholder-gray-300 resize-none shadow-sm leading-relaxed
                   focus:outline-none focus:border-[--color-bizi] transition-all duration-300"
          ></textarea>
        </div>

        <div v-if="uploading" class="space-y-2 bg-white rounded-xl p-3 border border-[--color-lanming]/15 animate-[fadeIn_0.3s_ease]">
          <div class="flex justify-between text-[11px] font-mono text-[--color-bizi]">
            <span class="italic tracking-wide animate-pulse">{{ uploadStatus }}</span>
            <span class="font-bold">{{ uploadProgress }}%</span>
          </div>
          <div class="w-full h-[3px] bg-[--color-yubai] rounded-full overflow-hidden">
            <div
              class="progress-bar h-full bg-[--color-congqian] transition-all duration-300"
              :style="{ width: uploadProgress + '%' }"
            ></div>
          </div>
        </div>

        <button
          @click="handleUpload"
          :disabled="!canSubmit || uploading"
          class="w-full py-4 rounded-xl text-white font-serif font-bold text-base tracking-[0.25em]
                 transition-all duration-500 disabled:opacity-30 disabled:cursor-not-allowed shadow-md"
          :class="canSubmit && !uploading
            ? 'bg-[--color-congqian] hover:bg-[#485939] hover:shadow-lg hover:shadow-[--color-congqian]/10 active:scale-[0.99]'
            : 'bg-[--color-lanming]'"
        >
          <span v-if="!uploading" class="inline-flex items-center gap-2">
            🎞️ 冲印这张胶片
          </span>
          <span v-else class="inline-flex items-center gap-2 tracking-widest text-white/90">
            <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            暗房冲印中...
          </span>
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
  uploadStatus.value = '显影中...'

  try {
    const { publicUrl, storagePath } = await uploadPhotoToStorage(file, (percent) => {
      uploadProgress.value = Math.round(percent * 0.9)
    })

    uploadStatus.value = '定影固化中...'
    uploadProgress.value = 95

    await insertPhoto({
      publicUrl,
      storagePath,
      date: formDate.value,
      story: formStory.value.trim()
    })

    uploadProgress.value = 100
    uploadStatus.value = '冲印完成！✨'

    setTimeout(() => {
      emit('uploaded')
      resetForm()
      emit('close')
    }, 1000)

  } catch (error) {
    console.error('上传失败:', error)
    alert('冲印失败: ' + error.message)
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

<style scoped>
/* 隐藏原生日期选择器图标，保持极简 */
input[type="date"]::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.2s;
}
input[type="date"]::-webkit-calendar-picker-indicator:hover {
  opacity: 0.8;
}
</style>