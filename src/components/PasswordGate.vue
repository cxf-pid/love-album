<template>
  <div class="fixed inset-0 z-[200] flex items-center justify-center bg-[--color-yubai]">
    <!-- 背景装饰 -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none select-none">
      <div class="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-[--color-lanming]/10 blur-3xl"></div>
      <div class="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-[--color-bizi]/8 blur-3xl"></div>
    </div>

    <div class="relative z-10 flex flex-col items-center gap-8">
      <!-- 胶片图标 -->
      <div class="text-7xl select-none animate-pulse">🎞️</div>

      <!-- 标题 -->
      <div class="text-center space-y-2">
        <h1 class="text-2xl font-serif font-bold text-[--color-congqian] tracking-[0.15em]">
          陈彪 <span class="text-[--color-bizi] text-xl">&</span> 王莎莎
        </h1>
        <p class="text-xs text-[--color-lanming] tracking-[0.3em] font-sans">· 时光胶片 ·</p>
      </div>

      <!-- 密码输入 -->
      <div class="flex flex-col items-center gap-4">
        <div class="flex gap-3">
          <input
            v-for="(_, i) in 4"
            :key="i"
            :ref="el => { if (el) inputs[i] = el }"
            v-model="digits[i]"
            @input="handleInput(i, $event)"
            @keydown.backspace="handleBackspace(i, $event)"
            @keydown="handleKeyDown(i, $event)"
            @paste="handlePaste"
            @focus="selectAll(i)"
            type="text"
            inputmode="numeric"
            maxlength="1"
            autocomplete="off"
            class="w-14 h-16 text-center text-2xl font-serif font-bold rounded-xl
                   bg-white border-2 transition-all duration-300
                   focus:outline-none focus:ring-0 select-none"
            :class="shake
              ? 'border-red-400 text-red-400 animate-[shake_0.5s_ease]'
              : 'border-[--color-lanming]/30 text-[--color-congqian] focus:border-[--color-congqian] focus:shadow-lg focus:shadow-[--color-congqian]/10'"
          />
        </div>

        <!-- 错误提示 -->
        <transition name="fade">
          <p v-if="errorMsg" class="text-xs text-red-400 font-sans tracking-wide">
            {{ errorMsg }}
          </p>
        </transition>

        <!-- 提示文字 -->
        <p class="text-[10px] text-[--color-lanming]/60 tracking-wider font-sans mt-2">
          输入专属密码，开启我们的时光胶片
        </p>
      </div>
    </div>

    <!-- 底部版权 -->
    <p class="absolute bottom-8 text-[10px] text-[--color-lanming]/40 tracking-wider select-none">
      For 陈彪 & 王莎莎 · Forever Love
    </p>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const emit = defineEmits(['unlocked'])

const CORRECT_PASSWORD = '9895'
const digits = ref(['', '', '', ''])
const inputs = ref([])
const errorMsg = ref('')
const shake = ref(false)

function selectAll(i) {
  nextTick(() => inputs.value[i]?.select())
}

function handleInput(i, e) {
  const val = (e.target.value || '').replace(/\D/g, '')
  digits.value[i] = val.slice(-1)

  if (val && i < 3) {
    // 自动跳到下一个
    nextTick(() => inputs.value[i + 1]?.focus())
  }

  // 检查是否全部填完
  if (i === 3 && val) {
    nextTick(checkPassword)
  }
}

function handleBackspace(i, e) {
  if (digits.value[i] === '' && i > 0) {
    digits.value[i - 1] = ''
    nextTick(() => inputs.value[i - 1]?.focus())
  }
}

function handleKeyDown(i, e) {
  // 方向键左右切换
  if (e.key === 'ArrowLeft' && i > 0) {
    e.preventDefault()
    nextTick(() => inputs.value[i - 1]?.focus())
  }
  if (e.key === 'ArrowRight' && i < 3) {
    e.preventDefault()
    nextTick(() => inputs.value[i + 1]?.focus())
  }
}

function handlePaste(e) {
  e.preventDefault()
  const text = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 4)
  if (!text) return

  for (let i = 0; i < 4; i++) {
    digits.value[i] = text[i] || ''
  }
  nextTick(() => {
    inputs.value[Math.min(text.length, 3)]?.focus()
    checkPassword()
  })
}

function checkPassword() {
  errorMsg.value = ''
  shake.value = false

  const entered = digits.value.join('')
  if (entered.length < 4) return

  if (entered === CORRECT_PASSWORD) {
    // 成功
    localStorage.setItem('love_album_unlocked', 'true')
    emit('unlocked')
  } else {
    // 失败
    shake.value = true
    errorMsg.value = '密码不对哦，再试一次吧 💚'
    setTimeout(() => {
      digits.value = ['', '', '', '']
      shake.value = false
      nextTick(() => inputs.value[0]?.focus())
    }, 600)
  }
}
</script>

<style scoped>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-6px); }
  80% { transform: translateX(4px); }
}
</style>
