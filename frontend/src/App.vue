<template>
  <RouterView />
</template>

<script setup lang="ts">
import { useColorMode } from '@/composables/useColorMode'

// Initialize color mode on app mount (applies class to <html>)
useColorMode()
</script>
