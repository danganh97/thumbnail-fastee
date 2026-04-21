<template>
  <button
    class="group relative w-full text-left rounded-2xl overflow-hidden border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
    :class="[
      isActive
        ? 'border-brand-500 shadow-lg shadow-brand-500/20'
        : 'border-zinc-700/60 hover:border-zinc-600 hover:scale-[1.02]'
    ]"
    @click="emit('select', template)"
  >
    <!-- Preview swatch -->
    <div
      class="w-full aspect-video flex items-end p-2.5 bg-cover bg-center"
      :style="previewStyle"
    >
      <!-- Mini text preview — only shown when no image preview -->
      <span
        v-if="previewText && !template.previewUrl"
        class="text-white text-[9px] font-bold leading-tight line-clamp-2 opacity-90 drop-shadow"
        style="font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.05em;"
      >
        {{ previewText }}
      </span>
    </div>

    <!-- Name row -->
    <div class="flex items-center justify-between px-3 py-2 bg-zinc-800 group-hover:bg-zinc-750 transition-colors">
      <span class="text-xs font-medium text-zinc-300 truncate">{{ template.name }}</span>
      <span v-if="isActive" class="w-2 h-2 rounded-full bg-brand-400 shrink-0 ml-2" />
    </div>

    <!-- Active ring overlay -->
    <div
      v-if="isActive"
      class="absolute inset-0 border-2 border-brand-500 rounded-2xl pointer-events-none"
    />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Template } from '@/types'

const props = defineProps<{
  template: Template
  isActive: boolean
}>()

const emit = defineEmits<{
  (e: 'select', template: Template): void
}>()

const previewStyle = computed(() =>
  props.template.previewUrl
    ? { backgroundImage: `url(${props.template.previewUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: props.template.background },
)

const previewText = computed(() => {
  const textEl = props.template.elements.find(el => el.type === 'text')
  if (!textEl || textEl.type !== 'text') return ''
  return textEl.text.slice(0, 40)
})
</script>
