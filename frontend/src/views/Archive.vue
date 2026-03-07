<template>
  <div class="archive-container">
    <header class="header">
      <div class="header-left">
        <button @click="$router.push('/')" class="btn-back">Zurück</button>
        <h1>Archiv</h1>
      </div>
    </header>

    <div class="content">
      <div v-if="loading" class="loading">Lädt...</div>

      <div v-else-if="archivedShows.length === 0" class="empty-state">
        <p>Keine archivierten Shows</p>
      </div>

      <div v-else class="shows-grid">
        <div v-for="show in archivedShows" :key="show.id" class="show-card">
          <h3>{{ show.name }}</h3>
          <p class="venue">{{ show.venue || 'Keine Bühne' }}</p>
          <p class="date">{{ formatDate(show.date) }}</p>
          <p class="channels">{{ show.channel_count }} Channels</p>
          <p class="archived">Archiviert: {{ formatDateTime(show.archived_at) }}</p>

          <div class="actions">
            <button @click="unarchive(show.id)" class="btn-primary">Wiederherstellen</button>
            <button @click="permanentDelete(show.id, show.name)" class="btn-danger">Endgültig löschen</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useShowStore } from '../stores/show'

const showStore = useShowStore()
const archivedShows = ref([])
const loading = ref(true)

const load = async () => {
  loading.value = true
  try {
    archivedShows.value = await showStore.fetchArchivedShows()
  } catch (error) {
    alert('Fehler beim Laden: ' + error.message)
  } finally {
    loading.value = false
  }
}

const unarchive = async (id) => {
  try {
    await showStore.unarchiveShow(id)
    await load()
  } catch (error) {
    alert('Fehler: ' + error.message)
  }
}

const permanentDelete = async (id, name) => {
  if (!confirm(`Show "${name}" wirklich ENDGÜLTIG löschen?`)) return
  try {
    await showStore.permanentDeleteShow(id)
    await load()
  } catch (error) {
    alert('Fehler: ' + error.message)
  }
}

const formatDate = (date) => date ? new Date(date).toLocaleDateString('de-DE') : ''
const formatDateTime = (date) => date ? new Date(date).toLocaleString('de-DE') : ''

onMounted(load)
</script>

<style scoped>
.archive-container {
  min-height: 100vh;
  background: var(--color-surface-subtle);
}

.header {
  background: var(--color-surface-base);
  border-bottom: 1px solid var(--color-border-light);
  padding: var(--space-4) var(--space-6);
  display: flex;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.header-left h1 {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-text-primary);
}

.btn-back {
  background: transparent;
  border: 1px solid var(--color-border-default);
  color: var(--color-text-secondary);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-sm);
}

.btn-back:hover {
  background: var(--color-surface-muted);
  color: var(--color-text-primary);
}

.content {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-6);
}

.loading, .empty-state {
  text-align: center;
  padding: var(--space-8);
  color: var(--color-text-secondary);
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
}

.show-card h3 {
  margin-bottom: var(--space-3);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.show-card p {
  margin: var(--space-1) 0;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.archived {
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--color-text-tertiary);
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border-light);
  letter-spacing: 0.03em;
}

.actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.btn-primary {
  flex: 1;
  background: var(--color-primary);
  color: #0a0a0c;
  border: none;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
}

.btn-primary:hover { background: var(--color-primary-hover); }

.btn-danger {
  flex: 1;
  background: transparent;
  color: var(--color-danger);
  border: 1px solid rgba(184, 64, 64, 0.3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-sm);
}

.btn-danger:hover {
  background: rgba(184, 64, 64, 0.1);
  border-color: var(--color-danger);
}
</style>
