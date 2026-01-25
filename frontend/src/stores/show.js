import { defineStore } from 'pinia'
import api from '../api'

export const useShowStore = defineStore('show', {
  state: () => ({
    shows: [],
    currentShow: null,
    channels: [],
    loading: false,
    error: null
  }),

  actions: {
    async fetchShows() {
      this.loading = true
      try {
        const response = await api.get('/api/shows')
        this.shows = response.data
      } catch (error) {
        this.error = error.response?.data || error
      } finally {
        this.loading = false
      }
    },

    async fetchShow(id) {
      this.loading = true
      try {
        const response = await api.get(`/api/shows/${id}`)
        this.currentShow = response.data
      } catch (error) {
        this.error = error.response?.data || error
      } finally {
        this.loading = false
      }
    },

    async createShow(data) {
      try {
        const response = await api.post('/api/shows', data)
        this.shows.unshift(response.data)
        return response.data
      } catch (error) {
        throw error.response?.data || error
      }
    },

    async updateShow(id, data) {
      try {
        const response = await api.put(`/api/shows/${id}`, data)
        const index = this.shows.findIndex(s => s.id === id)
        if (index !== -1) {
          this.shows[index] = response.data
        }
        if (this.currentShow?.id === id) {
          this.currentShow = response.data
        }
        return response.data
      } catch (error) {
        throw error.response?.data || error
      }
    },

    async deleteShow(id) {
      try {
        await api.delete(`/api/shows/${id}`)
        this.shows = this.shows.filter(s => s.id !== id)
      } catch (error) {
        throw error.response?.data || error
      }
    },

    async fetchTrashedShows() {
      this.loading = true
      try {
        const response = await api.get('/api/shows/trash')
        return response.data
      } catch (error) {
        this.error = error.response?.data || error
      } finally {
        this.loading = false
      }
    },

    async restoreShow(id) {
      try {
        await api.post(`/api/shows/${id}/restore`)
      } catch (error) {
        throw error.response?.data || error
      }
    },

    async permanentDeleteShow(id) {
      try {
        await api.delete(`/api/shows/${id}/permanent`)
      } catch (error) {
        throw error.response?.data || error
      }
    },

    async fetchChannels(showId) {
      this.loading = true
      try {
        const response = await api.get(`/api/channels/show/${showId}`)
        this.channels = response.data
      } catch (error) {
        this.error = error.response?.data || error
      } finally {
        this.loading = false
      }
    },

    async updateChannel(channelId, data) {
      try {
        const response = await api.put(`/api/channels/${channelId}`, data)
        const index = this.channels.findIndex(c => c.id === channelId)
        if (index !== -1) {
          this.channels[index] = response.data
        }
        return response.data
      } catch (error) {
        throw error.response?.data || error
      }
    },

    async importChannels(showId, channels) {
      try {
        const response = await api.post(`/api/shows/${showId}/import`, { channels })
        await this.fetchChannels(showId)
        return response.data
      } catch (error) {
        throw error.response?.data || error
      }
    },

    async exportAsJSON(showId) {
      try {
        const response = await api.get(`/api/shows/${showId}/export/json`)
        return response.data
      } catch (error) {
        throw error.response?.data || error
      }
    }
  }
})
