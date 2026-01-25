<template>
  <div class="trash-container">
    <header class="header">
      <div class="header-left">
        <button @click="$router.push('/')" class="btn-back">Zurück</button>
        <h1>Papierkorb</h1>
      </div>
    </header>

    <div class="content">
      <div v-if="loading" class="loading">Lädt...</div>
      
      <div v-else-if="trashedShows.length === 0" class="empty-state">
        <p>Papierkorb ist leer</p>
      </div>

      <div v-else class="shows-grid">
        <div 
          v-for="show in trashedShows" 
          :key="show.id" 
          class="show-card"
        >
          <h3>{{ show.name }}</h3>
          <p class="venue">{{ show.venue || 'Kein Venue' }}</p>
          <p class="date">{{ formatDate(show.date) }}</p>
          <p class="channels">{{ show.channel_count }} Channels</p>
          <p class="creator">{{ show.creator_name }}</p>
          <p class="deleted">Gelöscht: {{ formatDateTime(show.deleted_at) }}</p>
          
          <div class="actions">
            <button @click="restoreShow(show.id)" class="btn-primary">
              Wiederherstellen
            </button>
            <button @click="permanentDelete(show.id, show.name)" class="btn-danger">
              Endgültig löschen
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useShowStore } from '../stores/show'

const router = useRouter()
const showStore = useShowStore()

const trashedShows = ref([])
const loading = ref(true)

const loadTrashedShows = async () => {
  loading.value = true
  try {
    trashedShows.value = await showStore.fetchTrashedShows()
  } catch (error) {
    alert('Fehler beim Laden: ' + error.message)
  } finally {
    loading.value = false
  }
}

const restoreShow = async (showId) => {
  try {
    await showStore.restoreShow(showId)
    await loadTrashedShows()
  } catch (error) {
    alert('Fehler beim Wiederherstellen: ' + error.message)
  }
}

const permanentDelete = async (showId, showName) => {
  if (!confirm(`Show "${showName}" wirklich ENDGÜLTIG löschen? Diese Aktion kann nicht rückgängig gemacht werden!`)) return
  try {
    await showStore.permanentDeleteShow(showId)
    await loadTrashedShows()
  } catch (error) {
    alert('Fehler beim Löschen: ' + error.message)
  }
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('de-DE')
}

const formatDateTime = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('de-DE')
}

onMounted(() => {
  loadTrashedShows()
})
</script>

<style scoped>
.trash-container {
  min-height: 100vh;
  background: var(--color-surface-subtle);
}

.header {
  background: white;
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.btn-back {
  background: white;
  border: 1px solid var(--color-border-default);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  cursor: pointer;
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
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-4);
}

.show-card {
  background: white;
  padding: var(--space-5);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.show-card h3 {
  margin-bottom: var(--space-3);
  color: var(--color-text-primary);
}

.show-card p {
  margin: var(--space-2) 0;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.deleted {
  color: var(--color-error);
  font-style: italic;
  margin-top: var(--space-3);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border-light);
}

.actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.btn-primary {
  flex: 1;
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-sm);
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}

.btn-danger {
  flex: 1;
  background: var(--color-danger);
  color: white;
  border: none;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-sm);
}

.btn-danger:hover {
  background: var(--color-danger-hover);
}
</style>
