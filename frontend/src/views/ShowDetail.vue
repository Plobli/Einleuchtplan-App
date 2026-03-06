<template>
  <div class="show-detail-container">
    <header class="header">
      <div class="header-left">
        <button @click="$router.push('/')" class="btn-back">Zurück</button>
        <div v-if="show">
          <h1>{{ show.name }}</h1>
          <p class="show-meta">
            <span v-if="show.venue">{{ show.venue }}</span>
            <span v-if="show.date">{{ formatDate(show.date) }}</span>
            <span>Stand: {{ formatDate(new Date().toISOString()) }}</span>
          </p>
        </div>
      </div>
      <div class="header-actions">
        <div v-if="activeUsers.length > 0" class="active-users">
          {{ activeUsers.length }} Online
        </div>
        <button @click="previewPDF" class="btn-secondary">
          Export PDF
        </button>
        <button @click="toggleHistory" class="btn-secondary">
          Verlauf
        </button>
        <button @click="deleteShow" class="btn-danger">
          In Papierkorb
        </button>
      </div>
    </header>

    <div class="content" v-if="show">
      <!-- Aufbau-Informationen -->
      <div class="aufbau-section">
        <h2>Aufbau</h2>
        <template v-if="show.venue === 'K1'">
          <div class="form-grid">
            <div class="form-group">
              <label>Portalbrücke Höhe:</label>
              <input v-model="show.portalbruecke" type="text" @blur="updateShowField('portalbruecke')" />
            </div>
            <div class="form-group">
              <label>Portale Auszug:</label>
              <input v-model="show.portale" type="text" @blur="updateShowField('portale')" />
            </div>
            <div class="form-group">
              <label>SB-Tor:</label>
              <input v-model="show.sbtor" type="text" @blur="updateShowField('sbtor')" />
            </div>
          </div>
          <div class="form-group">
            <label>Höhe Züge:</label>
            <div class="editor-toolbar">
              <button @click="formatText('zuege', 'bold')" class="format-btn" title="Fett" type="button"><strong>B</strong></button>
              <button @click="formatText('zuege', 'italic')" class="format-btn" title="Kursiv" type="button"><em>I</em></button>
            </div>
            <textarea ref="zuegeTextarea" v-model="show.zuege" @blur="updateShowField('zuege')" rows="3"></textarea>
          </div>
        </template>
        <div class="form-group">
          <label>{{ show.venue === 'K1' ? 'Weitere Aufbaunotizen' : 'Aufbaunotizen' }}:</label>
          <div class="editor-toolbar">
            <button @click="formatText('aufbau', 'bold')" class="format-btn" title="Fett" type="button"><strong>B</strong></button>
            <button @click="formatText('aufbau', 'italic')" class="format-btn" title="Kursiv" type="button"><em>I</em></button>
          </div>
          <textarea ref="aufbauTextarea" v-model="show.aufbau" @blur="updateShowField('aufbau')" rows="5"></textarea>
        </div>
      </div>

      <h2 style="margin-top: var(--space-8)">Festverhang</h2>

      <div class="toolbar">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Suche nach Kanal, Gerät, Farbe..."
          class="search-input"
        />
        <div class="stats">
          {{ filteredChannels.length }} von {{ channels.length }} Channels
        </div>
      </div>

      <div v-if="loading" class="loading">Lädt Channels...</div>

      <div v-else class="table-container">
        <table class="channels-table">
          <thead>
            <tr>
              <th style="width: 100px">Kanal</th>
              <th style="width: 140px">Adresse</th>
              <th style="width: 200px">Gerät</th>
              <th style="width: 80px">Farbe</th>
              <th>Beschreibung / Position</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(group, index) in channelsByCategory" :key="index">
              <!-- Kategorie-Zeile -->
              <tr class="category-row">
                <td colspan="4">
                  <span class="category-name">{{ group.category }}</span>
                </td>
                <td colspan="1" style="text-align: right; padding-right: var(--space-3);">
                  <button @click="addChannelToCategory(group.category)" class="btn-add-channel" title="Zeile hinzufügen">+</button>
                </td>
              </tr>
              <!-- Channel-Zeilen -->
              <template v-for="channel in group.channels" :key="channel.id">
                <tr>
                  <td>
                    <input
                      v-model="channel.kanal"
                      @blur="updateChannel(channel, 'kanal', channel.kanal)"
                      @input="handleTyping(channel.id, 'kanal')"
                      class="cell-input channel-number-input"
                    />
                  </td>
                  <td>
                    <input
                      v-model="channel.adresse"
                      @blur="updateChannel(channel, 'adresse', channel.adresse)"
                      @input="handleTyping(channel.id, 'adresse')"
                      class="cell-input"
                    />
                  </td>
                  <td>
                    <input
                      v-model="channel.geraet"
                      @blur="updateChannel(channel, 'geraet', channel.geraet)"
                      @input="handleTyping(channel.id, 'geraet')"
                      class="cell-input"
                    />
                  </td>
                  <td>
                    <select
                      v-model="channel.farbe"
                      @change="updateChannel(channel, 'farbe', channel.farbe)"
                      class="cell-select"
                    >
                      <option value="NC">NC</option>
                      <option value="200">200</option>
                      <option value="201">201</option>
                      <option value="202">202</option>
                    </select>
                  </td>
                  <td class="beschreibung-cell">
                    <textarea
                      v-model="channel.beschreibung"
                      @blur="updateChannel(channel, 'beschreibung', channel.beschreibung)"
                      @input="handleTyping(channel.id, 'beschreibung')"
                      class="cell-textarea"
                      placeholder="Position/Notizen"
                      rows="1"
                    ></textarea>
                  </td>
                </tr>
                <tr class="insert-row">
                  <td colspan="5" class="insert-cell">
                    <button @click="insertChannelAfter(channel)" class="btn-insert-row">+ Zeile einfügen</button>
                  </td>
                </tr>
              </template>
            </template>
            <!-- Neue Kategorie hinzufügen -->
            <tr>
              <td colspan="5" style="text-align: center; padding: var(--space-4);">
                <button @click="showNewCategoryModal = true" class="btn-add-category">+ Neue Kategorie</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Verlauf-Panel -->
    <div v-if="showHistory" class="history-panel">
      <div class="history-header">
        <h3>Verlauf (letzte 50)</h3>
        <button @click="showHistory = false" class="btn-secondary">✕</button>
      </div>
      <div v-if="historyLoading" class="history-loading">Lädt...</div>
      <div v-else-if="history.length === 0" class="history-empty">Keine Änderungen</div>
      <ul v-else class="history-list">
        <li v-for="entry in history" :key="entry._type + '-' + entry.id" class="history-entry">
          <div class="history-meta">
            <span class="history-kanal" v-if="entry._type === 'channel'">Kanal {{ entry.kanal }}</span>
            <span class="history-kanal history-kanal-show" v-else>Show</span>
            <span class="history-field">{{ fieldLabel(entry.field_name, entry._type) }}</span>
            <span class="history-time">{{ formatDateTime(entry.changed_at) }}</span>
            <span v-if="entry.user_name" class="history-user">{{ entry.user_name }}</span>
          </div>
          <div class="history-values">
            <span class="history-old">{{ entry.old_value || '–' }}</span>
            <span class="history-arrow">→</span>
            <span class="history-new">{{ entry.new_value || '–' }}</span>
          </div>
          <button @click="revert(entry)" class="btn-revert">Rückgängig</button>
        </li>
      </ul>
    </div>

    <!-- PDF Vorschau Modal -->
    <div v-if="pdfPreviewUrl" class="modal pdf-preview-modal" @click.self="closePdfPreview">
      <div class="modal-content pdf-modal-content">
        <div class="modal-actions pdf-modal-header">
          <h2>PDF Vorschau</h2>
          <div style="display: flex; gap: var(--space-3);">
            <button @click="printPDF" class="btn-secondary">Drucken</button>
            <button @click="downloadPDF" class="btn-primary">Herunterladen</button>
            <button @click="closePdfPreview" class="btn-secondary">Schließen</button>
          </div>
        </div>
        <iframe ref="pdfIframe" :src="pdfPreviewUrl" class="pdf-iframe"></iframe>
      </div>
    </div>

    <!-- Neue Kategorie Modal -->
    <div v-if="showNewCategoryModal" class="modal" @click.self="showNewCategoryModal = false">
      <div class="modal-content">
        <h2>Neue Kategorie erstellen</h2>
        <div class="form-group">
          <label>Kategoriename:</label>
          <input v-model="newCategoryName" type="text" placeholder="z.B. Seitenlicht" />
        </div>
        <div class="modal-actions">
          <button @click="showNewCategoryModal = false" class="btn-secondary">Abbrechen</button>
          <button @click="createNewCategory" class="btn-primary">Erstellen</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useShowStore } from '../stores/show'
import { getSocket } from '../api/websocket'
import api from '../api'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const route = useRoute()
const router = useRouter()
const showStore = useShowStore()

const show = ref(null)
const channels = ref([])
const loading = ref(false)
const searchQuery = ref('')
const editingChannelId = ref(null)
const activeUsers = ref([])

const showNewCategoryModal = ref(false)
const newCategoryName = ref('')

const zuegeTextarea = ref(null)
const aufbauTextarea = ref(null)
const pdfPreviewUrl = ref(null)
const pdfIframe = ref(null)
const showHistory = ref(false)
const history = ref([])
const historyLoading = ref(false)

let typingTimeout = null
const socket = getSocket()

onMounted(async () => {
  await loadShow()
  await loadChannels()
  setupWebSocket()
})

onUnmounted(() => {
  if (socket) {
    socket.emit('show:leave', show.value?.id)
  }
})

const loadShow = async () => {
  const res = await api.get(`/api/shows/slug/${route.params.slug}`)
  show.value = res.data
}

const updateShowField = async (field) => {
  try {
    await showStore.updateShow(show.value.id, { [field]: show.value[field] })
  } catch (error) {
    console.error('Fehler beim Speichern:', error)
  }
}

const loadChannels = async () => {
  loading.value = true
  await showStore.fetchChannels(show.value.id)
  channels.value = showStore.channels
  loading.value = false
}

const setupWebSocket = () => {
  if (!socket) return

  socket.emit('show:join', show.value.id)

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
    c.beschreibung?.toLowerCase().includes(query) ||
    c.kategorie?.toLowerCase().includes(query)
  )
})

const channelsByCategory = computed(() => {
  const grouped = {}
  
  filteredChannels.value.forEach(channel => {
    const category = channel.kategorie || 'Ohne Kategorie'
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(channel)
  })
  
  return Object.keys(grouped).map(category => ({
    category,
    channels: grouped[category].sort((a, b) => a.position - b.position)
  }))
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
        showId: show.value.id,
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

const buildPDF = () => {
  const doc = new jsPDF()

  doc.setFontSize(16)
  doc.text(show.value.name, 14, 15)

  doc.setFontSize(10)
  const metaLine = []
  if (show.value.venue) metaLine.push(`Bühne: ${show.value.venue}`)
  if (show.value.date) metaLine.push(formatDate(show.value.date))
  metaLine.push(`Stand: ${formatDate(new Date().toISOString())}`)
  doc.text(metaLine.join('   '), 14, 22)

  let currentY = 30

  // Aufbaufelder (nur K1)
  if (show.value.venue === 'K1') {
    const k1Fields = [
      ['Portalbrücke Höhe', show.value.portalbruecke],
      ['Portale Auszug', show.value.portale],
      ['SB-Tor', show.value.sbtor],
      ['Höhe Züge', show.value.zuege],
    ].filter(([, v]) => v && v.trim())

    if (k1Fields.length > 0) {
      doc.setFontSize(11)
      doc.setFont(undefined, 'bold')
      doc.text('Aufbau', 14, currentY)
      doc.setFont(undefined, 'normal')
      doc.setFontSize(9)
      currentY += 6
      for (const [label, value] of k1Fields) {
        const lines = doc.splitTextToSize(`${label}: ${value}`, 180)
        doc.text(lines, 14, currentY)
        currentY += lines.length * 5
      }
      currentY += 4
    }
  }

  // Aufbaunotizen
  if (show.value.aufbau && show.value.aufbau.trim()) {
    doc.setFontSize(11)
    doc.setFont(undefined, 'bold')
    doc.text('Aufbaunotizen', 14, currentY)
    doc.setFont(undefined, 'normal')
    doc.setFontSize(9)
    currentY += 6
    const lines = doc.splitTextToSize(show.value.aufbau, 180)
    doc.text(lines, 14, currentY)
    currentY += lines.length * 5 + 6
  }

  const tableData = channels.value
    .filter(c => c.beschreibung && c.beschreibung.trim() !== '')
    .map(c => [c.kanal, c.adresse, c.geraet, c.farbe, c.beschreibung])

  doc.autoTable({
    head: [['Kanal', 'Adresse', 'Gerät', 'Farbe', 'Beschreibung']],
    body: tableData,
    startY: currentY,
    styles: { fontSize: 8 }
  })

  return doc
}

const previewPDF = () => {
  const doc = buildPDF()
  if (pdfPreviewUrl.value) URL.revokeObjectURL(pdfPreviewUrl.value)
  pdfPreviewUrl.value = doc.output('bloburl')
}

const downloadPDF = () => {
  const doc = buildPDF()
  doc.save(`${show.value.name}_${new Date().toISOString().split('T')[0]}.pdf`)
}

const closePdfPreview = () => {
  if (pdfPreviewUrl.value) URL.revokeObjectURL(pdfPreviewUrl.value)
  pdfPreviewUrl.value = null
}

const printPDF = () => {
  if (pdfIframe.value?.contentWindow) {
    pdfIframe.value.contentWindow.print()
  }
}

const loadHistory = async () => {
  historyLoading.value = true
  try {
    const [channelRes, showRes] = await Promise.all([
      api.get(`/api/channels/show/${show.value.id}/history`),
      api.get(`/api/shows/${show.value.id}/history`)
    ])
    const channelEntries = channelRes.data.map(e => ({ ...e, _type: 'channel' }))
    const showEntries = showRes.data.map(e => ({ ...e, _type: 'show' }))
    const merged = [...channelEntries, ...showEntries]
    merged.sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at))
    history.value = merged.slice(0, 50)
  } catch (e) {
    alert('Fehler beim Laden des Verlaufs')
  } finally {
    historyLoading.value = false
  }
}

const toggleHistory = async () => {
  showHistory.value = !showHistory.value
  if (showHistory.value) {
    await loadHistory()
  }
}

const revert = async (entry) => {
  try {
    if (entry._type === 'show') {
      await api.post(`/api/shows/${show.value.id}/revert/${entry.id}`)
      await loadShow()
    } else {
      await api.post(`/api/channels/revert/${entry.id}`)
      await loadChannels()
    }
    await loadHistory()
  } catch (e) {
    alert('Fehler beim Rückgängigmachen')
  }
}

const fieldLabel = (field, type) => {
  if (type === 'show') {
    const labels = { name: 'Name', venue: 'Bühne', date: 'Datum', portalbruecke: 'Portalbrücke', portale: 'Portale', sbtor: 'SB-Tor', zuege: 'Höhe Züge', aufbau: 'Aufbaunotizen' }
    return labels[field] || field
  }
  const labels = { adresse: 'Adresse', geraet: 'Gerät', farbe: 'Farbe', beschreibung: 'Beschreibung', aktiv: 'Aktiv' }
  return labels[field] || field
}

const deleteChannel = async (channelId) => {
  if (!confirm('Kanal wirklich löschen?')) return
  try {
    await api.delete(`/api/channels/${channelId}`)
    channels.value = channels.value.filter(c => c.id !== channelId)
  } catch (error) {
    alert('Fehler beim Löschen')
  }
}

const addChannelToCategory = async (categoryName) => {
  try {
    const maxPosition = Math.max(...channels.value.map(c => c.position ?? 0), 0)
    await api.post(`/api/shows/${show.value.id}/channels`, {
      kanal: '', adresse: '', geraet: '', farbe: 'NC', beschreibung: '',
      kategorie: categoryName, position: maxPosition + 1, aktiv: false
    })
    await loadChannels()
  } catch (error) {
    alert('Fehler beim Hinzufügen')
  }
}

const insertChannelAfter = async (channel) => {
  try {
    const insertPos = channel.position + 1
    // Shift all channels at or after insertPos up by 1
    const toShift = channels.value.filter(c => (c.position ?? 0) >= insertPos)
    for (const c of toShift) {
      await showStore.updateChannel(c.id, { position: (c.position ?? 0) + 1 })
    }
    await api.post(`/api/shows/${show.value.id}/channels`, {
      kanal: '', adresse: '', geraet: '', farbe: 'NC', beschreibung: '',
      kategorie: channel.kategorie, position: insertPos, aktiv: false
    })
    await loadChannels()
  } catch (error) {
    alert('Fehler beim Einfügen')
  }
}

const createNewCategory = async () => {
  if (!newCategoryName.value.trim()) {
    alert('Bitte Kategorienamen eingeben')
    return
  }
  
  await addChannelToCategory(newCategoryName.value.trim())
  showNewCategoryModal.value = false
  newCategoryName.value = ''
}

const formatText = (field, style) => {
  const textarea = field === 'zuege' ? zuegeTextarea.value : aufbauTextarea.value
  if (!textarea) return
  
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = show.value[field].substring(start, end)
  
  if (!selectedText) return
  
  let formattedText = ''
  if (style === 'bold') {
    formattedText = `**${selectedText}**`
  } else if (style === 'italic') {
    formattedText = `*${selectedText}*`
  }
  
  show.value[field] = 
    show.value[field].substring(0, start) + 
    formattedText + 
    show.value[field].substring(end)
  
  updateShowField(field)
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('de-DE')
}

const formatDateTime = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('de-DE')
}

const deleteShow = async () => {
  if (!confirm(`Show "${show.value.name}" wirklich in den Papierkorb verschieben?`)) return
  try {
    await showStore.deleteShow(show.value.id)
    router.push('/')
  } catch (error) {
    alert('Fehler beim Löschen: ' + error.message)
  }
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

.btn-danger {
  background: var(--color-danger);
  color: white;
  border: none;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-sm);
}

.btn-danger:hover {
  background: var(--color-danger-hover);
}

.content {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--space-6);
}

.aufbau-section {
  background: white;
  padding: var(--space-6);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--space-6);
}

.aufbau-section h2 {
  margin: 0 0 var(--space-5) 0;
  font-size: var(--text-lg);
  color: var(--color-text-primary);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.form-group {
  margin-bottom: var(--space-4);
}

.form-group label {
  display: block;
  margin-bottom: var(--space-2);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-sm);
  font-size: var(--text-base);
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group textarea {
  resize: vertical;
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
  vertical-align: top;
}

.channels-table tr:hover:not(.category-row) {
  background: var(--color-surface-subtle);
}

.category-row {
  background: var(--color-surface-muted) !important;
  font-weight: var(--font-semibold);
}

.category-row:hover {
  background: var(--color-border-light) !important;
}

.category-row td {
  padding: var(--space-4) var(--space-3);
}

.category-name {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.channel-number-input {
  font-weight: 600;
  color: var(--color-primary);
  width: 90px;
}

.insert-row td {
  padding: 0;
  border: none;
  height: 4px;
}

.insert-row:hover td {
  height: auto;
}

.insert-cell {
  text-align: center;
}

.btn-insert-row {
  display: none;
  background: none;
  border: 1px dashed var(--color-border-default);
  width: 100%;
  padding: var(--space-1) 0;
  cursor: pointer;
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
}

.insert-row:hover .btn-insert-row {
  display: block;
}

.btn-insert-row:hover {
  border-color: var(--color-primary);
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

.cell-textarea {
  width: 100%;
  padding: var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  background: transparent;
  resize: vertical;
  min-height: 32px;
  font-family: inherit;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.cell-input:focus, .cell-select:focus, .cell-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  background: white;
}

.beschreibung-cell {
  max-width: 400px;
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

.loading {
  text-align: center;
  padding: var(--space-8);
  color: var(--color-text-secondary);
}

.btn-add-channel {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-sm);
  opacity: 0.7;
}

.btn-add-channel:hover {
  opacity: 1;
}

.btn-add-category {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-sm);
}

.btn-add-category:hover {
  background: var(--color-primary-hover);
}

.btn-delete {
  color: var(--color-danger);
  font-size: 24px;
  font-weight: bold;
}

.btn-delete:hover {
  color: var(--color-danger-hover);
}

.editor-toolbar {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.format-btn {
  background: white;
  border: 1px solid var(--color-border-default);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-sm);
  min-width: 32px;
}

.format-btn:hover {
  background: var(--color-surface-muted);
}

.format-btn strong,
.format-btn em {
  font-size: var(--text-sm);
}

.history-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 380px;
  height: 100vh;
  background: white;
  box-shadow: -4px 0 16px rgba(0,0,0,0.15);
  z-index: 900;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border-light);
}

.history-header h3 {
  margin: 0;
  font-size: var(--text-base);
}

.history-loading, .history-empty {
  padding: var(--space-6);
  color: var(--color-text-secondary);
  text-align: center;
}

.history-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  flex: 1;
}

.history-entry {
  padding: var(--space-3) var(--space-5);
  border-bottom: 1px solid var(--color-border-light);
}

.history-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  margin-bottom: var(--space-1);
}

.history-kanal {
  font-weight: 600;
  color: var(--color-primary);
  font-size: var(--text-sm);
}

.history-kanal-show {
  color: var(--color-text-secondary);
}

.history-field {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.history-time {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  margin-left: auto;
}

.history-user {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}

.history-values {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  margin-bottom: var(--space-2);
}

.history-old {
  color: var(--color-danger);
  text-decoration: line-through;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-new {
  color: var(--color-success);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-arrow {
  color: var(--color-text-secondary);
}

.btn-revert {
  background: none;
  border: 1px solid var(--color-border-default);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}

.btn-revert:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.pdf-preview-modal .modal-content {
  max-width: 90vw;
  width: 90vw;
  max-height: 90vh;
  height: 90vh;
  display: flex;
  flex-direction: column;
}

.pdf-modal-header {
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.pdf-modal-header h2 {
  margin: 0;
}

.pdf-iframe {
  flex: 1;
  width: 100%;
  border: none;
  border-radius: var(--radius-sm);
}
</style>
