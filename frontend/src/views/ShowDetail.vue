<template>
  <div class="show-detail-container">
    <header class="header">
      <div class="header-left">
        <button @click="$router.push('/')" class="btn-back">← Zurück</button>
        <div v-if="show">
          <h1>{{ show.name }}</h1>
          <p class="show-meta">
            <span v-if="show.venue">📍 {{ show.venue }}</span>
            <span v-if="show.date">📅 {{ formatDate(show.date) }}</span>
          </p>
        </div>
      </div>
      <div class="header-actions">
        <div v-if="activeUsers.length > 0" class="active-users">
          👥 {{ activeUsers.length }} Online
        </div>
        <button @click="showImportModal = true" class="btn-secondary">
          📥 Import
        </button>
        <button @click="exportJSON" class="btn-secondary">
          💾 Export JSON
        </button>
        <button @click="exportPDF" class="btn-secondary">
          📄 Export PDF
        </button>
      </div>
    </header>

    <div class="content">
      <div class="toolbar">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Suche nach Kanal, Gerät, Farbe..."
          class="search-input"
        />
        <div class="stats">
          📊 {{ filteredChannels.length }} von {{ channels.length }} Channels
          | ✅ {{ activeChannelsCount }} aktiv
        </div>
      </div>

      <div v-if="loading" class="loading">Lädt Channels...</div>

      <div v-else class="table-container">
        <table class="channels-table">
          <thead>
            <tr>
              <th>✓</th>
              <th>Kanal</th>
              <th>Adresse</th>
              <th>Gerät</th>
              <th>Farbe</th>
              <th>Beschreibung</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="channel in filteredChannels" 
              :key="channel.id"
              :class="{ 'active-row': channel.aktiv, 'editing-row': editingChannelId === channel.id }"
            >
              <td>
                <input 
                  type="checkbox" 
                  v-model="channel.aktiv"
                  @change="updateChannel(channel, 'aktiv', channel.aktiv)"
                />
              </td>
              <td class="channel-number">{{ channel.kanal }}</td>
              <td>
                <input 
                  v-model="channel.adresse"
                  @blur="updateChannel(channel, 'adresse', channel.adresse)"
                  @focus="startEditing(channel.id)"
                  @input="handleTyping(channel.id, 'adresse')"
                  class="cell-input"
                />
              </td>
              <td>
                <input 
                  v-model="channel.geraet"
                  @blur="updateChannel(channel, 'geraet', channel.geraet)"
                  @focus="startEditing(channel.id)"
                  @input="handleTyping(channel.id, 'geraet')"
                  class="cell-input"
                />
              </td>
              <td>
                <select 
                  v-model="channel.farbe"
                  @change="updateChannel(channel, 'farbe', channel.farbe)"
                  @focus="startEditing(channel.id)"
                  class="cell-select"
                >
                  <option value="NC">NC</option>
                  <option value="200">200</option>
                  <option value="201">201</option>
                  <option value="202">202</option>
                </select>
              </td>
              <td>
                <input 
                  v-model="channel.beschreibung"
                  @blur="updateChannel(channel, 'beschreibung', channel.beschreibung)"
                  @focus="startEditing(channel.id)"
                  @input="handleTyping(channel.id, 'beschreibung')"
                  class="cell-input"
                  placeholder="Position/Notizen"
                />
              </td>
              <td>
                <button 
                  @click="showHistory(channel)"
                  class="btn-icon"
                  title="Änderungshistorie"
                >
                  📜
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Import Modal -->
    <div v-if="showImportModal" class="modal" @click.self="showImportModal = false">
      <div class="modal-content">
        <h2>Channels importieren</h2>
        <p>JSON-Datei mit Channel-Daten hochladen</p>
        <textarea 
          v-model="importData"
          placeholder='[{"kanal": "1", "adresse": "121", "geraet": "VK Bühne", "farbe": "NC", "beschreibung": ""}]'
          rows="10"
          class="import-textarea"
        ></textarea>
        <div class="modal-actions">
          <button @click="showImportModal = false" class="btn-secondary">Abbrechen</button>
          <button @click="importChannels" class="btn-primary">Importieren</button>
        </div>
      </div>
    </div>

    <!-- History Modal -->
    <div v-if="showHistoryModal" class="modal" @click.self="showHistoryModal = false">
      <div class="modal-content">
        <h2>Änderungshistorie - Kanal {{ selectedChannel?.kanal }}</h2>
        <div v-if="loadingHistory" class="loading">Lädt...</div>
        <div v-else-if="history.length === 0">Keine Änderungen vorhanden</div>
        <div v-else class="history-list">
          <div v-for="entry in history" :key="entry.id" class="history-entry">
            <div class="history-header">
              <strong>{{ entry.user_name }}</strong>
              <span class="history-time">{{ formatDateTime(entry.changed_at) }}</span>
            </div>
            <div class="history-change">
              <strong>{{ entry.field_name }}:</strong>
              "{{ entry.old_value }}" → "{{ entry.new_value }}"
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="showHistoryModal = false" class="btn-secondary">Schließen</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useShowStore } from '../stores/show'
import { getSocket } from '../api/websocket'
import api from '../api'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const route = useRoute()
const showStore = useShowStore()

const show = ref(null)
const channels = ref([])
const loading = ref(false)
const searchQuery = ref('')
const editingChannelId = ref(null)
const activeUsers = ref([])

const showImportModal = ref(false)
const importData = ref('')

const showHistoryModal = ref(false)
const selectedChannel = ref(null)
const history = ref([])
const loadingHistory = ref(false)

let typingTimeout = null
const socket = getSocket()

onMounted(async () => {
  await loadShow()
  await loadChannels()
  setupWebSocket()
})

onUnmounted(() => {
  if (socket) {
    socket.emit('show:leave', route.params.id)
  }
})

const loadShow = async () => {
  await showStore.fetchShow(route.params.id)
  show.value = showStore.currentShow
}

const loadChannels = async () => {
  loading.value = true
  await showStore.fetchChannels(route.params.id)
  channels.value = showStore.channels
  loading.value = false
}

const setupWebSocket = () => {
  if (!socket) return

  socket.emit('show:join', route.params.id)

  socket.on('show:users', (users) => {
    activeUsers.value = users
  })

  socket.on('channel:updated', (data) => {
    const channel = channels.value.find(c => c.id === data.channelId)
    if (channel && editingChannelId.value !== data.channelId) {
      channel[data.field] = data.value
    }
  })

  socket.on('channel:created', async () => {
    await loadChannels()
  })

  socket.on('channel:deleted', (data) => {
    channels.value = channels.value.filter(c => c.id !== data.channelId)
  })
}

const filteredChannels = computed(() => {
  if (!searchQuery.value) return channels.value

  const query = searchQuery.value.toLowerCase()
  return channels.value.filter(c => 
    c.kanal?.toLowerCase().includes(query) ||
    c.adresse?.toLowerCase().includes(query) ||
    c.geraet?.toLowerCase().includes(query) ||
    c.farbe?.toLowerCase().includes(query) ||
    c.beschreibung?.toLowerCase().includes(query)
  )
})

const activeChannelsCount = computed(() => {
  return channels.value.filter(c => c.aktiv).length
})

const startEditing = (channelId) => {
  editingChannelId.value = channelId
}

const handleTyping = (channelId, field) => {
  if (typingTimeout) clearTimeout(typingTimeout)
  
  typingTimeout = setTimeout(() => {
    if (socket) {
      socket.emit('channel:typing', {
        showId: route.params.id,
        channelId,
        field
      })
    }
  }, 300)
}

const updateChannel = async (channel, field, value) => {
  try {
    await showStore.updateChannel(channel.id, { [field]: value })
    
    if (socket) {
      socket.emit('channel:update', {
        showId: route.params.id,
        channelId: channel.id,
        field,
        value
      })
    }
  } catch (error) {
    console.error('Update failed:', error)
    alert('Fehler beim Aktualisieren')
  }

  editingChannelId.value = null
}

const importChannels = async () => {
  try {
    const data = JSON.parse(importData.value)
    
    // Add position field
    const channelsWithPosition = data.map((ch, index) => ({
      ...ch,
      position: index + 1,
      aktiv: ch.aktiv || false
    }))

    await showStore.importChannels(route.params.id, channelsWithPosition)
    showImportModal.value = false
    importData.value = ''
    await loadChannels()
  } catch (error) {
    alert('Fehler beim Importieren: ' + error.message)
  }
}

const exportJSON = async () => {
  try {
    const data = await showStore.exportAsJSON(route.params.id)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${show.value.name}_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    alert('Fehler beim Export: ' + error.message)
  }
}

const exportPDF = () => {
  const doc = new jsPDF()
  
  doc.setFontSize(16)
  doc.text(show.value.name, 14, 15)
  
  if (show.value.venue) {
    doc.setFontSize(10)
    doc.text(`Venue: ${show.value.venue}`, 14, 22)
  }
  
  const tableData = channels.value
    .filter(c => c.aktiv)
    .map(c => [c.kanal, c.adresse, c.geraet, c.farbe, c.beschreibung])

  doc.autoTable({
    head: [['Kanal', 'Adresse', 'Gerät', 'Farbe', 'Beschreibung']],
    body: tableData,
    startY: 30,
    styles: { fontSize: 8 }
  })

  doc.save(`${show.value.name}_${new Date().toISOString().split('T')[0]}.pdf`)
}

const showHistory = async (channel) => {
  selectedChannel.value = channel
  showHistoryModal.value = true
  loadingHistory.value = true

  try {
    const response = await api.get(`/api/channels/${channel.id}/history`)
    history.value = response.data
  } catch (error) {
    alert('Fehler beim Laden der Historie')
  } finally {
    loadingHistory.value = false
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
</script>

<style scoped>
.show-detail-container {
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
  flex-wrap: wrap;
  gap: var(--space-4);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.btn-back {
  background: none;
  border: none;
  font-size: var(--text-base);
  color: var(--color-primary);
  cursor: pointer;
  padding: var(--space-2);
}

.header h1 {
  margin: 0;
  font-size: var(--text-xl);
}

.show-meta {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  margin-top: var(--space-1);
}

.show-meta span {
  margin-right: var(--space-3);
}

.header-actions {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.active-users {
  background: var(--color-success);
  color: white;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
}

.btn-secondary {
  background: white;
  border: 1px solid var(--color-border-default);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-sm);
}

.btn-secondary:hover {
  background: var(--color-surface-muted);
}

.content {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--space-6);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
  gap: var(--space-4);
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 250px;
  padding: var(--space-3);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-sm);
  font-size: var(--text-base);
}

.stats {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.table-container {
  background: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  overflow-x: auto;
}

.channels-table {
  width: 100%;
  border-collapse: collapse;
}

.channels-table thead {
  background: var(--color-surface-muted);
}

.channels-table th {
  padding: var(--space-3);
  text-align: left;
  font-weight: 600;
  color: var(--color-text-primary);
  border-bottom: 2px solid var(--color-border-default);
}

.channels-table td {
  padding: var(--space-2);
  border-bottom: 1px solid var(--color-border-light);
}

.channels-table tr:hover {
  background: var(--color-surface-subtle);
}

.active-row {
  background: var(--color-surface-accent) !important;
}

.editing-row {
  background: var(--color-primary-light) !important;
  opacity: 0.1;
}

.channel-number {
  font-weight: 600;
  color: var(--color-primary);
}

.cell-input, .cell-select {
  width: 100%;
  padding: var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  background: transparent;
}

.cell-input:focus, .cell-select:focus {
  outline: none;
  border-color: var(--color-primary);
  background: white;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--text-lg);
  padding: var(--space-1);
}

.btn-icon:hover {
  opacity: 0.7;
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
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  width: 90%;
}

.modal-content h2 {
  margin-bottom: var(--space-4);
}

.import-textarea {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-sm);
  font-family: monospace;
  font-size: var(--text-sm);
  margin-top: var(--space-3);
}

.modal-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  margin-top: var(--space-5);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}

.history-list {
  margin-top: var(--space-4);
}

.history-entry {
  padding: var(--space-3);
  border-left: 3px solid var(--color-primary);
  background: var(--color-surface-subtle);
  margin-bottom: var(--space-3);
  border-radius: var(--radius-sm);
}

.history-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}

.history-time {
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
}

.history-change {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.loading {
  text-align: center;
  padding: var(--space-8);
  color: var(--color-text-secondary);
}
</style>
