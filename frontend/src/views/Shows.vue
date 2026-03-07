<template>
  <div class="shows-container">
    <header class="app-header">
      <div class="app-header-brand">
        <span class="brand-mark">●</span>
        <span class="brand-name">Einleuchtplan</span>
      </div>
      <div class="app-header-actions">
        <button @click="showCreateModal = true" class="btn-primary">
          + Neue Show
        </button>
        <div class="user-menu" ref="userMenuRef">
          <button class="user-menu-trigger" @click="menuOpen = !menuOpen">
            {{ authStore.user?.name }}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 8L1 3h10L6 8z"/>
            </svg>
          </button>
          <div v-if="menuOpen" class="dropdown">
            <button @click="navigate('/archive')">Archiv</button>
            <button @click="navigate('/trash')">Papierkorb</button>
            <div class="dropdown-divider"></div>
            <button @click="doDownloadBackup">Backup herunterladen</button>
            <label class="dropdown-item">
              Backup laden
              <input type="file" accept=".json" @change="doRestoreBackup" style="display:none" />
            </label>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item-danger" @click="authStore.logout()">Abmelden</button>
          </div>
        </div>
      </div>
    </header>

    <main class="content">
      <div v-if="loading" class="loading-state">
        <div class="loading-dots"><span></span><span></span><span></span></div>
      </div>

      <div v-else-if="shows.length === 0" class="empty-state">
        <div class="empty-icon">◎</div>
        <p class="empty-title">Noch keine Shows</p>
        <p class="empty-sub">Erstelle deine erste Show, um loszulegen.</p>
        <button @click="showCreateModal = true" class="btn-primary">
          Erste Show erstellen
        </button>
      </div>

      <div v-else class="shows-list">
        <div v-for="([venue, venueShows]) in showsByVenue" :key="venue" class="venue-group">
          <div class="venue-label">{{ venue }}</div>
          <div class="show-rows">
            <div
              v-for="show in venueShows"
              :key="show.id"
              class="show-row"
              @click="$router.push(`/show/${show.name.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}`)"
            >
              <div class="show-row-name">{{ show.name }}</div>
              <div class="show-row-meta">
                <span v-if="show.date" class="show-row-date">{{ formatDate(show.date) }}</span>
                <span class="show-row-channels">{{ show.channel_count }} Kanäle</span>
                <span class="show-row-creator">{{ show.creator_name }}</span>
              </div>
              <div class="show-row-arrow">→</div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Create Show Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Neue Show</h2>
          <button @click="showCreateModal = false" class="btn-icon-close">✕</button>
        </div>
        <form @submit.prevent="createShow" class="modal-body">
          <div class="form-group">
            <label>Name *</label>
            <input v-model="newShow.name" type="text" required autofocus />
          </div>
          <div class="form-group">
            <label>Datum</label>
            <input v-model="newShow.date" type="date" />
          </div>
          <div class="form-group">
            <label>Bühnen-Standard</label>
            <select v-model="newShow.channelTemplate">
              <option value="none">Leerer Plan</option>
              <option value="k1">K1 Standard</option>
              <option value="kasino">Kasino Standard</option>
            </select>
          </div>
          <div v-if="newShow.channelTemplate === 'none'" class="form-group">
            <label>Bühnenname</label>
            <input v-model="newShow.venue" type="text" placeholder="optional" />
          </div>
          <div class="modal-footer">
            <button type="button" @click="showCreateModal = false" class="btn-secondary">
              Abbrechen
            </button>
            <button type="submit" class="btn-primary">Erstellen</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useShowStore } from '../stores/show'
import api from '../api'

const router = useRouter()
const authStore = useAuthStore()
const showStore = useShowStore()

const shows = ref([])
const loading = ref(false)
const showCreateModal = ref(false)
const menuOpen = ref(false)
const userMenuRef = ref(null)

const closeMenu = (e) => {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target)) menuOpen.value = false
}
onBeforeUnmount(() => { document.removeEventListener('click', closeMenu) })

const newShow = ref({
  name: '',
  venue: '',
  date: '',
  channelTemplate: 'none'
})

onMounted(async () => {
  await loadShows()
  document.addEventListener('click', closeMenu)
})

const loadShows = async () => {
  loading.value = true
  await showStore.fetchShows()
  shows.value = showStore.shows
  loading.value = false
}

const showsByVenue = computed(() => {
  const groups = {}
  for (const show of shows.value) {
    const venue = show.venue || 'Ohne Bühne'
    if (!groups[venue]) groups[venue] = []
    groups[venue].push(show)
  }
  return Object.entries(groups).sort(([a], [b]) => {
    if (a === 'Ohne Bühne') return 1
    if (b === 'Ohne Bühne') return -1
    return a.localeCompare(b)
  })
})

const templateVenue = { k1: 'K1', kasino: 'Kasino' }

const createShow = async () => {
  try {
    const venue = newShow.value.channelTemplate !== 'none'
      ? templateVenue[newShow.value.channelTemplate]
      : newShow.value.venue || null
    await showStore.createShow({ ...newShow.value, venue })
    showCreateModal.value = false
    newShow.value = { name: '', venue: '', date: '', channelTemplate: 'none' }
    await loadShows()
  } catch (error) {
    alert('Fehler beim Erstellen: ' + error.message)
  }
}

const navigate = (path) => { menuOpen.value = false; router.push(path) }

const doRestoreBackup = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  event.target.value = ''
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    if (!Array.isArray(data)) throw new Error('Ungültiges Backup-Format')
    const res = await api.post('/api/shows/restore-backup', data)
    const { created, skipped, errors } = res.data
    let msg = `Wiederhergestellt: ${created}, übersprungen: ${skipped}`
    if (errors.length > 0) msg += `\nFehler: ${errors.join(', ')}`
    alert(msg)
    await loadShows()
  } catch (error) {
    alert('Fehler beim Wiederherstellen: ' + (error.response?.data?.message || error.message))
  }
}

const doDownloadBackup = async () => {
  try {
    const res = await api.get('/api/shows/backup')
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backup_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    alert('Fehler beim Backup: ' + error.message)
  }
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('de-DE')
}
</script>

<style scoped>
.shows-container {
  min-height: 100vh;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
}

/* ── Header ─────────────────────────────────────────────────────────── */
.app-header {
  height: 52px;
  background: var(--color-surface-base);
  border-bottom: 1px solid var(--color-border-default);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-6);
  flex-shrink: 0;
}

.app-header-brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.brand-mark {
  color: var(--color-primary);
  font-size: 10px;
  line-height: 1;
}

.brand-name {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
}

.app-header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

/* ── Buttons ─────────────────────────────────────────────────────────── */
.btn-primary {
  background: var(--color-primary);
  color: #fff;
  border: none;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
  cursor: pointer;
}
.btn-primary:hover { background: var(--color-primary-hover); }

.btn-secondary {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-default);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  cursor: pointer;
}
.btn-secondary:hover {
  background: var(--color-surface-muted);
  color: var(--color-text-primary);
  border-color: var(--color-border-strong);
}

.btn-icon-close {
  background: none;
  border: none;
  color: var(--color-text-tertiary);
  font-size: var(--text-base);
  padding: var(--space-1);
  line-height: 1;
  cursor: pointer;
}
.btn-icon-close:hover { color: var(--color-text-primary); }

/* ── User menu ───────────────────────────────────────────────────────── */
.user-menu { position: relative; }

.user-menu-trigger {
  background: none;
  border: 1px solid transparent;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  cursor: pointer;
}
.user-menu-trigger:hover {
  background: var(--color-surface-muted);
  color: var(--color-text-primary);
  border-color: var(--color-border-light);
}

.dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  min-width: 200px;
  z-index: 100;
  overflow: hidden;
}

.dropdown button,
.dropdown .dropdown-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: var(--space-3) var(--space-4);
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--text-sm);
  font-family: inherit;
  font-weight: var(--font-normal);
  color: var(--color-text-primary);
  box-sizing: border-box;
}
.dropdown button:hover,
.dropdown .dropdown-item:hover {
  background: var(--color-surface-muted);
}

.dropdown-item-danger {
  color: var(--color-danger) !important;
}

.dropdown-divider {
  height: 1px;
  background: var(--color-border-default);
  margin: var(--space-1) 0;
}

/* ── Main content ─────────────────────────────────────────────────────── */
.content {
  flex: 1;
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  padding: var(--space-10) var(--space-6);
}

/* ── Loading ─────────────────────────────────────────────────────────── */
.loading-state {
  display: flex;
  justify-content: center;
  padding: var(--space-16);
}
.loading-dots {
  display: flex;
  gap: var(--space-2);
}
.loading-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-border-strong);
  animation: pulse 1.2s ease-in-out infinite;
}
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes pulse {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50%       { opacity: 1;   transform: scale(1);   }
}

/* ── Empty state ─────────────────────────────────────────────────────── */
.empty-state {
  text-align: center;
  padding: var(--space-16) var(--space-8);
}
.empty-icon {
  font-size: 2rem;
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-4);
}
.empty-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}
.empty-sub {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  margin-bottom: var(--space-6);
}

/* ── Shows list ───────────────────────────────────────────────────────── */
.shows-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-10);
}

.venue-group {}

.venue-label {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-border-default);
}

.show-rows {
  display: flex;
  flex-direction: column;
}

.show-row {
  display: flex;
  align-items: center;
  gap: var(--space-6);
  padding: var(--space-4) var(--space-4);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.1s;
  border-bottom: 1px solid var(--color-border-light);
}
.show-row:last-child { border-bottom: none; }

.show-row:hover {
  background: var(--color-surface-base);
}

.show-row-name {
  flex: 1;
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.show-row-meta {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  flex-shrink: 0;
}

.show-row-date,
.show-row-channels,
.show-row-creator {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  font-variant-numeric: tabular-nums;
}

.show-row-channels {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
}

.show-row-arrow {
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
  opacity: 0;
  transition: opacity 0.1s, transform 0.1s;
  flex-shrink: 0;
}
.show-row:hover .show-row-arrow {
  opacity: 1;
  transform: translateX(3px);
}

/* ── Modal ────────────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: min(480px, 92vw);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--color-border-default);
}

.modal-header h2 {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
}

.modal-body {
  padding: var(--space-5) var(--space-6);
}

.modal-footer {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  padding-top: var(--space-5);
  border-top: 1px solid var(--color-border-default);
  margin-top: var(--space-5);
}

/* ── Form ─────────────────────────────────────────────────────────────── */
.form-group {
  margin-bottom: var(--space-4);
}

.form-group label {
  display: block;
  margin-bottom: var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.form-group input[type="text"],
.form-group input[type="date"],
.form-group select {
  width: 100%;
  padding: var(--space-3) var(--space-3);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-sm);
  background: var(--color-surface-muted);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  transition: border-color 0.12s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(123, 143, 196, 0.12);
}

.form-group select option {
  background: var(--color-surface-elevated);
}
</style>
