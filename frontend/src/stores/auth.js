import { defineStore } from 'pinia'
import api from '../api'
import { connectWebSocket, disconnectWebSocket } from '../api/websocket'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    isAuthenticated: false
  }),

  actions: {
    async login(email, password) {
      try {
        const response = await api.post('/api/auth/login', { email, password })
        this.user = response.data.user
        this.token = response.data.token
        this.isAuthenticated = true

        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))

        connectWebSocket(response.data.token)

        return response.data
      } catch (error) {
        throw error.response?.data || error
      }
    },

    async register(email, password, name) {
      try {
        const response = await api.post('/api/auth/register', { email, password, name })
        this.user = response.data.user
        this.token = response.data.token
        this.isAuthenticated = true

        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))

        connectWebSocket(response.data.token)

        return response.data
      } catch (error) {
        throw error.response?.data || error
      }
    },

    logout() {
      this.user = null
      this.token = null
      this.isAuthenticated = false

      localStorage.removeItem('token')
      localStorage.removeItem('user')

      disconnectWebSocket()
    },

    checkAuth() {
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')

      if (token && user) {
        this.token = token
        this.user = JSON.parse(user)
        this.isAuthenticated = true
        connectWebSocket(token)
      }
    }
  }
})
