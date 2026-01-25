import { io } from 'socket.io-client'

let socket = null

export const connectWebSocket = (token) => {
  if (socket?.connected) return socket

  socket = io(import.meta.env.VITE_WS_URL || window.location.origin, {
    auth: { token }
  })

  socket.on('connect', () => {
    console.log('WebSocket connected')
  })

  socket.on('disconnect', () => {
    console.log('❌ WebSocket disconnected')
  })

  socket.on('error', (error) => {
    console.error('WebSocket error:', error)
  })

  return socket
}

export const disconnectWebSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const getSocket = () => socket

export default {
  connectWebSocket,
  disconnectWebSocket,
  getSocket
}
