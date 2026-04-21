<template>
  <div class="flex flex-col gap-1.5 px-3 py-2">
    <button
      v-for="platform in platforms"
      :key="platform.id"
      class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left group"
      :class="[
        store.currentPlatform?.id === platform.id
          ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
          : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-transparent'
      ]"
      @click="store.selectPlatform(platform.id)"
    >
      <span class="text-xl leading-none">{{ platform.icon }}</span>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium truncate">{{ platform.label }}</p>
        <p class="text-xs text-zinc-500">{{ platform.size }}</p>
      </div>
      <div
        v-if="store.currentPlatform?.id === platform.id"
        class="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import { useEditorStore } from '@/store/editor'
import type { PlatformId } from '@/types'

const store = useEditorStore()

const platforms: { id: PlatformId; label: string; size: string; icon: string }[] = [
  { id: 'youtube',  label: 'YouTube',  size: '1280 × 720',  icon: '▶' },
  { id: 'tiktok',   label: 'TikTok',   size: '1080 × 1920', icon: '♪' },
  { id: 'facebook', label: 'Facebook', size: '1200 × 628',  icon: 'f' },
]
</script>
