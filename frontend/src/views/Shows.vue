<template>
  <div class="shows-container">
    <header class="header">
      <h1>🎭 Meine Shows</h1>
      <div class="header-actions">
        <span class="user-info">{{ authStore.user?.name }}</span>
        <button @click="authStore.logout()" class="btn-secondary">Abmelden</button>
      </div>
    </header>

    <div class="content">
      <div class="toolbar">
        <button @click="showCreateModal = true" class="btn-primary">
          ➕ Neue Show erstellen
        </button>
      </div>

      <div v-if="loading" class="loading">Lädt...</div>

      <div v-else-if="shows.length === 0" class="empty-state">
        <p>Noch keine Shows vorhanden</p>
        <button @click="showCreateModal = true" class="btn-primary">
          Erste Show erstellen
        </button>
      </div>

      <div v-else class="shows-grid">
        <div 
          v-for="show in shows" 
          :key="show.id" 
          class="show-card"
          @click="$router.push(`/show/${show.id}`)"
        >
          <h3>{{ show.name }}</h3>
          <p class="venue">📍 {{ show.venue || 'Kein Venue' }}</p>
          <p class="date">📅 {{ formatDate(show.date) }}</p>
          <p class="channels">💡 {{ show.channel_count }} Channels</p>
          <p class="creator">👤 {{ show.creator_name }}</p>
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
            <label>Venue</label>
            <input v-model="newShow.venue" type="text" />
          </div>
          <div class="form-group">
            <label>Datum</label>
            <input v-model="newShow.date" type="date" />
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
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useShowStore } from '../stores/show'

const authStore = useAuthStore()
const showStore = useShowStore()

const shows = ref([])
const loading = ref(false)
const showCreateModal = ref(false)
const newShow = ref({
  name: '',
  venue: '',
  date: ''
})

onMounted(async () => {
  await loadShows()
})

const loadShows = async () => {
  loading.value = true
  await showStore.fetchShows()
  shows.value = showStore.shows
  loading.value = false
}

const createShow = async () => {
  try {
    await showStore.createShow(newShow.value)
    showCreateModal.value = false
    newShow.value = { name: '', venue: '', date: '' }
    await loadShows()
  } catch (error) {
    alert('Fehler beim Erstellen: ' + error.message)
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
  background: white;
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  margin: 0;
  font-size: var(--text-xl);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.user-info {
  color: var(--color-text-secondary);
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
  color: white;
  border: none;
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-sm);
  font-weight: 500;
  cursor: pointer;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}

.btn-secondary {
  background: white;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-default);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.loading, .empty-state {
  text-align: center;
  padding: var(--space-8);
  color: var(--color-text-secondary);
}

.empty-state button {
  margin-top: var(--space-4);
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
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.show-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
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

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: var(--space-6);
  border-radius: var(--radius-md);
  max-width: 500px;
  width: 90%;
}

.modal-content h2 {
  margin-bottom: var(--space-5);
}

.form-group {
  margin-bottom: var(--space-4);
}

.form-group label {
  display: block;
  margin-bottom: var(--space-2);
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-sm);
}

.modal-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  margin-top: var(--space-5);
}
</style>
