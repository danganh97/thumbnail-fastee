<template>
  <div class="min-h-screen bg-gray-50 dark:bg-zinc-950">
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { useColorMode } from '@/composables/useColorMode'

// Initialize color mode on app mount (applies class to <html>)
useColorMode()
</script>
