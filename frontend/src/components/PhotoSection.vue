<template>
  <div class="photo-section">
    <div class="photo-section-header">
      <span class="photo-section-title">Fotos<span class="photo-count" v-if="photos.length">{{ photos.length }}</span></span>
    </div>

    <!-- Upload Zone -->
    <div
      class="upload-zone"
      :class="{ dragging: isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
      @click="fileInput.click()"
    >
      <input ref="fileInput" type="file" accept="image/*" multiple hidden @change="onFileChange" />
      <span class="upload-icon">↑</span>
      <span class="upload-label">Fotos hochladen</span>
      <span class="upload-hint">Klicken oder Drag & Drop · JPEG, PNG · werden komprimiert</span>
    </div>

    <!-- Photo Grid -->
    <div v-if="photos.length" class="photo-grid">
      <div
        v-for="photo in photos"
        :key="photo.id"
        class="photo-card"
        :class="{ uploading: photo._uploading }"
      >
        <div class="photo-thumb-wrap">
          <img
            v-if="photo.thumb"
            :src="photo.thumb"
            class="photo-thumb"
            :alt="photo.caption || photo.original_name"
          />
          <div v-else class="photo-thumb-placeholder">
            <span v-if="photo._uploading" class="upload-spinner"></span>
          </div>
          <button
            v-if="!photo._uploading"
            class="photo-delete"
            @click.stop="deletePhoto(photo)"
            title="Löschen"
          >✕</button>
        </div>
        <input
          class="photo-caption"
          type="text"
          :value="photo.caption"
          placeholder="Beschriftung…"
          @blur="saveCaption(photo, $event.target.value)"
          @keydown.enter.prevent="$event.target.blur()"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'

const props = defineProps({ showId: { type: Number, required: true } })

const photos = ref([])
const fileInput = ref(null)
const isDragging = ref(false)

const loadPhotos = async () => {
  const res = await api.get(`/api/shows/${props.showId}/photos`)
  // Load thumbnails separately to avoid huge initial payload
  photos.value = await Promise.all(res.data.map(async p => {
    const full = await api.get(`/api/shows/${props.showId}/photos/full`)
    const found = full.data.find(f => f.id === p.id)
    return { ...p, thumb: found ? `data:image/jpeg;base64,${found.data}` : null }
  }))
}

// Single full load is fine for small galleries; refetch after upload
const reloadWithThumbs = async () => {
  const res = await api.get(`/api/shows/${props.showId}/photos/full`)
  photos.value = res.data.map(p => ({ ...p, thumb: `data:image/jpeg;base64,${p.data}` }))
}

const compressImage = (file, maxWidth = 1400, quality = 0.78) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', quality)
      resolve({
        data: dataUrl.split(',')[1],
        width: canvas.width,
        height: canvas.height,
        thumb: dataUrl
      })
      URL.revokeObjectURL(img.src)
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

const uploadFiles = async (files) => {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue

    // Optimistic placeholder
    const placeholder = { id: `tmp-${Date.now()}-${Math.random()}`, caption: '', original_name: file.name, thumb: null, _uploading: true }
    photos.value.push(placeholder)

    try {
      const compressed = await compressImage(file)
      const res = await api.post(`/api/shows/${props.showId}/photos`, {
        data: compressed.data,
        original_name: file.name,
        width: compressed.width,
        height: compressed.height,
        caption: ''
      })
      const idx = photos.value.findIndex(p => p.id === placeholder.id)
      if (idx !== -1) {
        photos.value[idx] = { ...res.data, thumb: compressed.thumb }
      }
    } catch (err) {
      photos.value = photos.value.filter(p => p.id !== placeholder.id)
      console.error('Upload failed:', err)
    }
  }
}

const onFileChange = (e) => uploadFiles(Array.from(e.target.files))

const onDrop = (e) => {
  isDragging.value = false
  uploadFiles(Array.from(e.dataTransfer.files))
}

const saveCaption = async (photo, caption) => {
  if (photo._uploading || photo.caption === caption) return
  photo.caption = caption
  await api.put(`/api/photos/${photo.id}`, { caption })
}

const deletePhoto = async (photo) => {
  photos.value = photos.value.filter(p => p.id !== photo.id)
  await api.delete(`/api/photos/${photo.id}`)
}

// Expose for parent (PDF build needs full data)
const getPhotosForPDF = async () => {
  const res = await api.get(`/api/shows/${props.showId}/photos/full`)
  return res.data
}
defineExpose({ getPhotosForPDF })

onMounted(reloadWithThumbs)
</script>

<style scoped>
.photo-section {
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-6);
  border-bottom: 1px solid var(--color-border-light);
}

.photo-section-header {
  margin-bottom: var(--space-3);
}

.photo-section-title {
  font-size: 11px;
  font-weight: var(--font-semibold);
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.photo-count {
  background: var(--color-surface-muted);
  color: var(--color-text-tertiary);
  border-radius: 10px;
  font-size: 10px;
  font-weight: var(--font-normal);
  letter-spacing: 0;
  padding: 0 6px;
  min-width: 18px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Upload zone */
.upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-5) var(--space-4);
  border: 1px dashed var(--color-border-default);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: border-color 0.14s, background 0.14s;
  text-align: center;
  margin-bottom: var(--space-4);
}

.upload-zone:hover,
.upload-zone.dragging {
  border-color: var(--color-primary);
  background: var(--color-primary-subtle);
}

.upload-icon {
  font-size: 18px;
  color: var(--color-text-tertiary);
  line-height: 1;
}

.upload-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--color-text-secondary);
}

.upload-hint {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

/* Photo grid */
.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--space-3);
}

.photo-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.photo-card.uploading {
  opacity: 0.6;
}

.photo-thumb-wrap {
  position: relative;
  aspect-ratio: 4/3;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--color-surface-muted);
}

.photo-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.photo-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-border-strong);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.photo-delete {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0,0,0,0.55);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  width: 22px;
  height: 22px;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.12s;
}

.photo-thumb-wrap:hover .photo-delete {
  opacity: 1;
}

.photo-caption {
  width: 100%;
  padding: 4px var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  background: transparent;
  color: var(--color-text-secondary);
  font-family: inherit;
  transition: border-color 0.12s, background 0.12s;
}

.photo-caption::placeholder {
  color: var(--color-text-muted);
}

.photo-caption:focus {
  outline: none;
  border-color: var(--color-border-default);
  background: var(--color-surface-muted);
  color: var(--color-text-primary);
}
</style>
