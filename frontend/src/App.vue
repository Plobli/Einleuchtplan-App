<template>
  <div id="app">
    <router-view />
    <button class="theme-toggle" @click="toggleTheme" :title="isDark ? 'Hellmodus' : 'Dunkelmodus'">
      <span v-if="isDark">○</span>
      <span v-else>●</span>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()
const isDark = ref(true)

const applyTheme = (dark) => {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  localStorage.setItem('theme', dark ? 'dark' : 'light')
  isDark.value = dark
}

const toggleTheme = () => applyTheme(!isDark.value)

onMounted(() => {
  authStore.checkAuth()
  const stored = localStorage.getItem('theme')
  if (stored) {
    applyTheme(stored === 'dark')
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    applyTheme(prefersDark)
  }
})
</script>

<style>
.theme-toggle {
  position: fixed;
  bottom: var(--space-4);
  right: var(--space-4);
  z-index: 9999;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border-default);
  color: var(--color-text-secondary);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
  transition: color 0.14s, border-color 0.14s, background 0.14s;
  font-family: inherit;
}

.theme-toggle:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: var(--color-surface-muted);
}
</style>
