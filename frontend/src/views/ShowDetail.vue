<template>
  <div class="show-detail-container">
    <header class="header">
      <div class="header-left">
        <button @click="$router.push('/')" class="btn-back" title="Zur Übersicht">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
        </button>
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
        <div class="header-menu-wrap" @focusout="e => { if (!e.currentTarget.contains(e.relatedTarget)) showMenu = false }">
          <button @click="showMenu = !showMenu" class="btn-menu-toggle" :class="{ active: showMenu }">
            ···
          </button>
          <div v-if="showMenu" class="header-dropdown">
            <button @click="previewPDF; showMenu = false" class="dropdown-item">
              Export PDF
            </button>
            <button @click="toggleHistory(); showMenu = false" class="dropdown-item">
              Verlauf
            </button>
            <button @click="archiveShow(); showMenu = false" class="dropdown-item">
              Archivieren
            </button>
            <div class="dropdown-divider"></div>
            <button @click="deleteShow(); showMenu = false" class="dropdown-item dropdown-item-danger">
              In Papierkorb
            </button>
          </div>
        </div>
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

      <h2 class="section-heading">Festverhang</h2>

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
              <th style="width: 55px">Kreis</th>
              <th style="width: 90px">Adresse</th>
              <th style="width: 150px">Gerät</th>
              <th style="width: 80px">Farbe</th>
              <th>Beschreibung / Position</th>
              <th style="width: 36px"></th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(group, index) in channelsByCategory" :key="index">
              <!-- Kategorie-Zeile -->
              <tr class="category-row">
                <td colspan="6">
                  <span class="category-name">{{ group.category }}<span class="category-count">{{ group.channels.length }}</span></span>
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
                  <td>
                    <input
                      v-model="channel.beschreibung"
                      @blur="updateChannel(channel, 'beschreibung', channel.beschreibung)"
                      @input="handleTyping(channel.id, 'beschreibung')"
                      class="cell-input"
                      placeholder="Notiz..."
                    />
                  </td>
                  <td class="delete-cell">
                    <button @click="deleteChannel(channel.id)" class="btn-delete-row" title="Zeile löschen">✕</button>
                    <button @click="insertChannelAfter(channel)" class="btn-insert-inline" title="Zeile darunter einfügen">+</button>
                  </td>
                </tr>
              </template>
            </template>
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
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
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
const showMenu = ref(false)

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

const parseMarkdownSegments = (text) => {
  const segments = []
  const pattern = /\*\*(.*?)\*\*|\*(.*?)\*/g
  let lastIndex = 0
  let match
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) segments.push({ text: text.slice(lastIndex, match.index), style: 'normal' })
    if (match[1] !== undefined) segments.push({ text: match[1], style: 'bold' })
    else segments.push({ text: match[2], style: 'italic' })
    lastIndex = pattern.lastIndex
  }
  if (lastIndex < text.length) segments.push({ text: text.slice(lastIndex), style: 'normal' })
  return segments
}

const renderMarkdownText = (doc, text, x, startY, maxWidth, lineHeight = 5) => {
  let currentY = startY
  for (const rawLine of text.split('\n')) {
    if (!rawLine.trim()) { currentY += lineHeight; continue }
    const segments = parseMarkdownSegments(rawLine)
    const styledWords = []
    for (const seg of segments) {
      for (const word of seg.text.split(/(\s+)/)) {
        if (word) styledWords.push({ text: word, style: seg.style })
      }
    }
    const flush = (tokens, y) => {
      let rx = x
      for (const t of tokens) {
        doc.setFont(undefined, t.style)
        doc.text(t.text, rx, y)
        rx += doc.getTextWidth(t.text)
      }
    }
    let lineTokens = []
    let lineWidth = 0
    for (const sw of styledWords) {
      doc.setFont(undefined, sw.style)
      const w = doc.getTextWidth(sw.text)
      if (lineWidth + w > maxWidth && lineTokens.length > 0 && sw.text.trim()) {
        flush(lineTokens, currentY)
        currentY += lineHeight
        lineTokens = []
        lineWidth = 0
      }
      lineTokens.push(sw)
      lineWidth += w
    }
    if (lineTokens.length) { flush(lineTokens, currentY); currentY += lineHeight }
  }
  doc.setFont(undefined, 'normal')
  return currentY
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
        currentY = renderMarkdownText(doc, `${label}: ${value}`, 14, currentY, 180)
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
    currentY = renderMarkdownText(doc, show.value.aufbau, 14, currentY, 180)
    currentY += 6
  }

  const tableData = channels.value
    .filter(c => c.beschreibung && c.beschreibung.trim() !== '')
    .map(c => [c.kanal, c.adresse, c.geraet, c.farbe, c.beschreibung])

  doc.autoTable({
    head: [['Kreis', 'Adresse', 'Gerät', 'Farbe', 'Beschreibung']],
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
  const maxPosition = Math.max(...channels.value.map(c => c.position ?? 0), 0)
  const newPos = maxPosition + 1
  const tempChannel = {
    id: `temp-${Date.now()}`,
    kanal: null, adresse: '', geraet: '', farbe: 'NC', beschreibung: '',
    kategorie: categoryName, position: newPos, aktiv: false
  }
  channels.value.push(tempChannel)
  try {
    const res = await api.post(`/api/shows/${show.value.id}/channels`, {
      kanal: null, adresse: '', geraet: '', farbe: 'NC', beschreibung: '',
      kategorie: categoryName, position: newPos, aktiv: false
    })
    const idx = channels.value.findIndex(c => c.id === tempChannel.id)
    if (idx !== -1) channels.value[idx] = res.data
  } catch (error) {
    channels.value = channels.value.filter(c => c.id !== tempChannel.id)
    alert('Fehler beim Hinzufügen')
  }
}

const insertChannelAfter = async (channel) => {
  const insertPos = channel.position + 1
  const toShift = channels.value.filter(c => (c.position ?? 0) >= insertPos)

  // Optimistic local update: shift positions immediately
  toShift.forEach(c => { c.position = (c.position ?? 0) + 1 })

  const tempChannel = {
    id: `temp-${Date.now()}`,
    kanal: null, adresse: '', geraet: '', farbe: 'NC', beschreibung: '',
    kategorie: channel.kategorie, position: insertPos, aktiv: false
  }
  channels.value.push(tempChannel)

  try {
    const [, createRes] = await Promise.all([
      Promise.all(toShift.map(c => showStore.updateChannel(c.id, { position: c.position }))),
      api.post(`/api/shows/${show.value.id}/channels`, {
        kanal: null, adresse: '', geraet: '', farbe: 'NC', beschreibung: '',
        kategorie: channel.kategorie, position: insertPos, aktiv: false
      })
    ])
    const idx = channels.value.findIndex(c => c.id === tempChannel.id)
    if (idx !== -1) channels.value[idx] = createRes.data
  } catch (error) {
    await loadChannels()
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

const archiveShow = async () => {
  if (!confirm(`Show "${show.value.name}" archivieren?`)) return
  try {
    await showStore.archiveShow(show.value.id)
    router.push('/')
  } catch (error) {
    alert('Fehler beim Archivieren: ' + error.message)
  }
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
  background: var(--color-bg);
}

/* ─── Header ─────────────────────────────────────────────────────────── */
.header {
  background: var(--color-surface-base);
  border-bottom: 1px solid var(--color-border-default);
  padding: 0 var(--space-6);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  position: sticky;
  top: 0;
  z-index: 50;
  height: 52px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
  flex: 1;
}

.btn-back {
  background: none;
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 6px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
}
.btn-back:hover {
  color: var(--color-text-primary);
  border-color: var(--color-border-strong);
  background: var(--color-surface-muted);
}

.header h1 {
  margin: 0;
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
}

.show-meta {
  display: flex;
  gap: var(--space-3);
  color: var(--color-text-tertiary);
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  flex-shrink: 0;
}

.header-actions {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  flex-shrink: 0;
}

.active-users {
  background: rgba(79, 168, 112, 0.12);
  border: 1px solid rgba(79, 168, 112, 0.25);
  color: var(--color-success);
  padding: 3px var(--space-3);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-family: var(--font-mono);
}

.header-menu-wrap {
  position: relative;
}

.btn-menu-toggle {
  background: transparent;
  border: 1px solid var(--color-border-default);
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  padding: 0 var(--space-3);
  height: 30px;
  font-size: 18px;
  letter-spacing: 0.05em;
  line-height: 1;
  display: flex;
  align-items: center;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
}
.btn-menu-toggle:hover,
.btn-menu-toggle.active {
  background: var(--color-surface-muted);
  color: var(--color-text-primary);
  border-color: var(--color-border-strong);
}

.header-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  min-width: 160px;
  z-index: 200;
  padding: var(--space-1) 0;
  display: flex;
  flex-direction: column;
}

.dropdown-item {
  background: transparent;
  border: none;
  text-align: left;
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  transition: background 0.1s, color 0.1s;
}
.dropdown-item:hover {
  background: var(--color-surface-muted);
  color: var(--color-text-primary);
}
.dropdown-item-danger { color: var(--color-danger); }
.dropdown-item-danger:hover {
  background: rgba(184, 64, 64, 0.08);
  color: var(--color-danger);
}

.dropdown-divider {
  height: 1px;
  background: var(--color-border-light);
  margin: var(--space-1) 0;
}

/* ─── Buttons ────────────────────────────────────────────────────────── */
.btn-primary {
  background: var(--color-primary);
  color: #fff;
  border: none;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  font-family: inherit;
}
.btn-primary:hover { background: var(--color-primary-hover); }

.btn-secondary {
  background: transparent;
  border: 1px solid var(--color-border-default);
  color: var(--color-text-secondary);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-sm);
  font-family: inherit;
  white-space: nowrap;
}
.btn-secondary:hover {
  background: var(--color-surface-muted);
  color: var(--color-text-primary);
  border-color: var(--color-border-strong);
}

.btn-danger {
  background: transparent;
  border: 1px solid transparent;
  color: var(--color-text-tertiary);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-sm);
  font-family: inherit;
  white-space: nowrap;
}
.btn-danger:hover {
  background: rgba(184, 64, 64, 0.10);
  color: var(--color-danger);
  border-color: rgba(184, 64, 64, 0.3);
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-1);
  color: var(--color-text-secondary);
}
.btn-icon:hover { color: var(--color-text-primary); }

/* ─── Content ────────────────────────────────────────────────────────── */
.content {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-6);
}

/* ─── Aufbau section ─────────────────────────────────────────────────── */
.aufbau-section {
  padding-bottom: var(--space-6);
  border-bottom: 1px solid var(--color-border-light);
  margin-bottom: var(--space-6);
}

.aufbau-section h2,
.section-heading {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--color-text-tertiary);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin: 0 0 var(--space-4) 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.form-group { margin-bottom: var(--space-4); }

.form-group label {
  display: block;
  margin-bottom: var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-family: inherit;
  background: var(--color-surface-muted);
  color: var(--color-text-primary);
}
.form-group input::placeholder,
.form-group textarea::placeholder { color: var(--color-text-tertiary); }
.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(123, 143, 196, 0.12);
}
.form-group textarea { resize: vertical; }

/* ─── Toolbar ────────────────────────────────────────────────────────── */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
  gap: var(--space-4);
}

.search-input {
  flex: 1;
  max-width: 300px;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  background: var(--color-surface-base);
  color: var(--color-text-primary);
}
.search-input::placeholder { color: var(--color-text-tertiary); }
.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.stats {
  color: var(--color-text-tertiary);
  font-size: var(--text-xs);
  font-family: var(--font-mono);
}

/* ─── Table ──────────────────────────────────────────────────────────── */
.table-container {
  overflow-x: auto;
}

.channels-table {
  width: 100%;
  border-collapse: collapse;
}

.channels-table thead tr {
  border-bottom: 1px solid var(--color-border-default);
}

.channels-table th {
  padding: var(--space-2) var(--space-3);
  text-align: left;
  font-size: 11px;
  font-weight: var(--font-medium);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  background: var(--color-bg);
}

.channels-table td {
  padding: 0 var(--space-2);
  height: 36px;
  border-bottom: 1px solid var(--color-border-light);
  vertical-align: middle;
}

.channels-table tr:hover:not(.category-row) td {
  background: var(--color-surface-subtle);
}

/* ─── Category rows ──────────────────────────────────────────────────── */
.category-row td {
  padding: 0 var(--space-3);
  height: 32px;
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-bg);
}

.category-row:not(:first-child) td {
  border-top: 1px solid var(--color-border-default);
}

.category-name {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 11px;
  font-weight: var(--font-semibold);
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.category-name::before {
  content: '▸';
  font-size: 9px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.category-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-muted);
  color: var(--color-text-tertiary);
  border-radius: 10px;
  font-size: 10px;
  font-weight: var(--font-normal);
  letter-spacing: 0;
  padding: 0 6px;
  min-width: 18px;
  height: 16px;
  line-height: 1;
}

/* ─── Cell inputs ────────────────────────────────────────────────────── */
.cell-input, .cell-select {
  width: 100%;
  padding: 4px var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  background: transparent;
  color: var(--color-text-primary);
  font-family: inherit;
}
.cell-select option { background: var(--color-surface-elevated); }
.cell-textarea {
  width: 100%;
  padding: 4px var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  background: transparent;
  color: var(--color-text-primary);
  resize: vertical;
  min-height: 30px;
  font-family: inherit;
}
.cell-input:focus, .cell-select:focus, .cell-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  background: var(--color-surface-muted);
  box-shadow: 0 0 0 2px rgba(123, 143, 196, 0.1);
}

.channel-number-input {
  font-family: var(--font-mono);
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  width: 45px;
}

/* ─── Row action buttons ─────────────────────────────────────────────── */
.delete-cell {
  padding: var(--space-1) var(--space-2) !important;
  vertical-align: middle;
  white-space: nowrap;
  width: 56px;
}

.btn-delete-row,
.btn-insert-inline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  font-size: 11px;
  padding: 2px 5px;
  border-radius: var(--radius-sm);
  line-height: 1.4;
  opacity: 0;
  transition: opacity 0.1s, background 0.1s, color 0.1s;
}
.btn-delete-row { color: var(--color-text-tertiary); margin-bottom: 2px; }
.btn-insert-inline { color: var(--color-text-tertiary); }

tr:hover .btn-delete-row,
tr:hover .btn-insert-inline { opacity: 1; }

.btn-delete-row:hover {
  background: rgba(184, 64, 64, 0.12);
  color: var(--color-danger);
}
.btn-insert-inline:hover {
  background: var(--color-surface-muted);
  color: var(--color-text-secondary);
}

.btn-add-channel {
  background: transparent;
  color: var(--color-text-tertiary);
  border: 1px solid transparent;
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 11px;
  font-family: var(--font-mono);
  line-height: 1.6;
  transition: background 0.12s, color 0.12s;
}
.btn-add-channel:hover {
  background: var(--color-surface-muted);
  color: var(--color-text-secondary);
}

/* ─── Editor toolbar ─────────────────────────────────────────────────── */
.editor-toolbar {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}
.format-btn {
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border-default);
  color: var(--color-text-secondary);
  padding: 3px var(--space-2);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-xs);
  min-width: 28px;
  text-align: center;
}
.format-btn:hover {
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
}
.format-btn strong, .format-btn em { font-size: var(--text-xs); }

/* ─── Loading ────────────────────────────────────────────────────────── */
.loading {
  text-align: center;
  padding: var(--space-10);
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
}

/* ─── History panel ──────────────────────────────────────────────────── */
.history-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 360px;
  height: 100vh;
  background: var(--color-surface-base);
  border-left: 1px solid var(--color-border-default);
  box-shadow: -8px 0 40px rgba(0, 0, 0, 0.6);
  z-index: 900;
  display: flex;
  flex-direction: column;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border-default);
}
.history-header h3 {
  margin: 0;
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  letter-spacing: 0.08em;
  color: var(--color-text-secondary);
  text-transform: uppercase;
}

.history-loading, .history-empty {
  padding: var(--space-8);
  color: var(--color-text-tertiary);
  text-align: center;
  font-size: var(--text-sm);
}

.history-list {
  list-style: none;
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
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--color-primary);
}
.history-kanal-show { color: var(--color-text-secondary); }
.history-field { font-size: var(--text-xs); color: var(--color-text-secondary); }
.history-time {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin-left: auto;
  font-family: var(--font-mono);
}
.history-user { font-size: var(--text-xs); color: var(--color-text-tertiary); }

.history-values {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  margin-bottom: var(--space-2);
}
.history-old {
  color: #a04040;
  text-decoration: line-through;
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-mono);
}
.history-new {
  color: var(--color-success);
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-mono);
}
.history-arrow { color: var(--color-text-tertiary); flex-shrink: 0; }

.btn-revert {
  background: none;
  border: 1px solid var(--color-border-default);
  padding: 2px var(--space-3);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  font-family: inherit;
}
.btn-revert:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* ─── Modals ─────────────────────────────────────────────────────────── */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal-content {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border-default);
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  max-width: 520px;
  max-height: 85vh;
  overflow-y: auto;
  width: 92vw;
}

.modal-content h2 {
  margin-bottom: var(--space-5);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.modal-actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
  margin-top: var(--space-5);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border-default);
}

.import-textarea {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  margin-top: var(--space-3);
  background: var(--color-surface-muted);
  color: var(--color-text-primary);
}

.beschreibung-cell { cursor: pointer; }
.beschreibung-text {
  display: block;
  font-size: var(--text-sm);
  white-space: pre-wrap;
  word-break: break-word;
  padding: 4px var(--space-2);
  border-radius: var(--radius-sm);
  min-height: 26px;
  color: var(--color-text-primary);
}
.beschreibung-text.placeholder { color: var(--color-text-tertiary); }
.beschreibung-cell:hover .beschreibung-text { background: var(--color-surface-muted); }

.beschreibung-modal-content {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  width: min(500px, 92vw);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}
.beschreibung-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border-default);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}
.beschreibung-modal-textarea {
  width: 100%;
  padding: var(--space-4);
  border: none;
  font-size: var(--text-sm);
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
  outline: none;
  line-height: 1.6;
  background: var(--color-surface-elevated);
  color: var(--color-text-primary);
}

/* ─── PDF ─────────────────────────────────────────────────────────────── */
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
  font-size: var(--text-base);
}
.pdf-iframe {
  flex: 1;
  width: 100%;
  border: none;
  border-radius: var(--radius-sm);
  background: #fff;
}

/* ─── Unused (keep for compat) ───────────────────────────────────────── */
.btn-add-category { display: none; }
.btn-delete { color: var(--color-danger); }
.insert-row td { padding: 0; border: none; height: 4px; }
.btn-insert-row { display: none; }
</style>
