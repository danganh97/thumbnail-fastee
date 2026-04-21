<template>
  <div class="relative" data-font-picker>
    <button
      class="input-field flex items-center justify-between cursor-pointer"
      @click="open = !open"
    >
      <span :style="{ fontFamily: modelValue }">{{ modelValue }}</span>
      <svg class="w-4 h-4 text-zinc-500 transition-transform" :class="{ 'rotate-180': open }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <Transition name="dropdown">
      <ul
        v-if="open"
        class="absolute z-50 top-full mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden shadow-xl"
      >
        <li
          v-for="font in fonts"
          :key="font"
          class="px-3 py-2.5 text-sm cursor-pointer transition-colors hover:bg-zinc-700"
          :class="font === modelValue ? 'text-brand-400 bg-zinc-700/50' : 'text-zinc-300'"
          :style="{ fontFamily: font }"
          @click="select(font)"
        >
          {{ font }}
        </li>
      </ul>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { FONTS } from '@/types'

defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const open  = ref(false)
const fonts = FONTS

function select(font: string): void {
  emit('update:modelValue', font)
  open.value = false
}

function onClickOutside(e: MouseEvent): void {
  const el = (e.target as HTMLElement).closest('[data-font-picker]')
  if (!el) open.value = false
}

onMounted (() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
