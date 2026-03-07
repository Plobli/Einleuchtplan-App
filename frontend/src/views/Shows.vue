<template>
  <div class="shows-container">
    <header class="header">
      <h1>Meine Shows</h1>
      <div class="user-menu" ref="userMenuRef">
        <button class="user-menu-trigger" @click="menuOpen = !menuOpen">
          {{ authStore.user?.name }} <span class="chevron">▾</span>
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
          <button @click="authStore.logout()">Abmelden</button>
        </div>
      </div>
    </header>

    <div class="content">
      <div class="toolbar">
        <button @click="showCreateModal = true" class="btn-primary">
          Neue Show erstellen
        </button>
      </div>

      <div v-if="loading" class="loading">Lädt...</div>

      <div v-else-if="shows.length === 0" class="empty-state">
        <p>Noch keine Shows vorhanden</p>
        <button @click="showCreateModal = true" class="btn-primary">
          Erste Show erstellen
        </button>
      </div>

      <div v-else>
        <div v-for="([venue, venueShows]) in showsByVenue" :key="venue" class="venue-group">
          <h2 class="venue-heading">{{ venue }}</h2>
          <div class="shows-grid">
            <div
              v-for="show in venueShows"
              :key="show.id"
              class="show-card"
              @click="$router.push(`/show/${show.name.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}`)"
            >
              <h3>{{ show.name }}</h3>
              <p class="date">{{ formatDate(show.date) }}</p>
              <p class="channels">{{ show.channel_count }} Channels</p>
              <p class="creator">{{ show.creator_name }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Show Modal -->
    <div v-if="showCreateModal" class="modal" @click.self="showCreateModal = false">
      <div class="modal-content">
        <h2>Neue Show erstellen</h2>
        <form @submit.prevent="createShow">
          <div class="form-group">
            <label>Show Name *</label>
            <input v-model="newShow.name" type="text" required />
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
          <div class="modal-actions">
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
    let msg = `Wiederhergestellt: ${created}, übersprungen (bereits vorhanden): ${skipped}`
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
  if (!date) return '-'
  return new Date(date).toLocaleDateString('de-DE')
}
</script>

<style scoped>
.shows-container {
  min-height: 100vh;
  background: var(--color-surface-subtle);
}

.header {
  background: var(--color-surface-base);
  border-bottom: 1px solid var(--color-border-light);
  padding: var(--space-4) var(--space-6);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-text-primary);
}

.user-menu {
  position: relative;
}

.user-menu-trigger {
  background: none;
  border: 1px solid transparent;
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
}

.user-menu-trigger:hover {
  background: var(--color-surface-muted);
  color: var(--color-text-primary);
  border-color: var(--color-border-default);
}

.chevron {
  font-size: 0.75em;
  opacity: 0.6;
}

.dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  min-width: 190px;
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
  font-weight: normal;
  color: var(--color-text-primary);
  box-sizing: border-box;
}

.dropdown button:hover,
.dropdown .dropdown-item:hover {
  background: var(--color-surface-muted);
  color: var(--color-text-primary);
}

.dropdown-divider {
  height: 1px;
  background: var(--color-border-light);
  margin: var(--space-1) 0;
}

.content {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-6);
}

.toolbar {
  margin-bottom: var(--space-6);
}

.btn-primary {
  background: var(--color-primary);
  color: #0a0a0c;
  border: none;
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-sm);
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  letter-spacing: 0.02em;
  cursor: pointer;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}

.btn-secondary {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-default);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-sm);
}

.btn-secondary:hover {
  background: var(--color-surface-muted);
  color: var(--color-text-primary);
}

.loading, .empty-state {
  text-align: center;
  padding: var(--space-8);
  color: var(--color-text-secondary);
}

.empty-state button {
  margin-top: var(--space-4);
}

.venue-group {
  margin-bottom: var(--space-8);
}

.venue-heading {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.venue-heading::before {
  content: '';
  display: inline-block;
  width: 3px;
  height: 1em;
  background: var(--color-primary);
  border-radius: 2px;
  flex-shrink: 0;
}

.shows-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
}

.show-card {
  background: var(--color-surface-base);
  border: 1px solid var(--color-border-light);
  padding: var(--space-5);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
  position: relative;
  overflow: hidden;
}

.show-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--color-primary);
  opacity: 0;
  transition: opacity 0.15s;
}

.show-card:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.show-card:hover::before {
  opacity: 1;
}

.show-card h3 {
  margin-bottom: var(--space-3);
  color: var(--color-text-primary);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
}

.show-card p {
  margin: var(--space-1) 0;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.show-card .channels {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-primary);
  margin-top: var(--space-3);
  letter-spacing: 0.03em;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border-default);
  padding: var(--space-6);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  max-width: 480px;
  width: 90%;
}

.modal-content h2 {
  margin-bottom: var(--space-5);
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text-primary);
}

.form-group {
  margin-bottom: var(--space-4);
}

.form-group label {
  display: block;
  margin-bottom: var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.form-group input[type="text"],
.form-group input[type="date"],
.form-group select {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-sm);
  background: var(--color-surface-muted);
  color: var(--color-text-primary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: border-color 0.14s;
}

.form-group input[type="text"]:focus,
.form-group input[type="date"]:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-group select option {
  background: var(--color-surface-elevated);
}

.modal-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  margin-top: var(--space-5);
}
</style>
