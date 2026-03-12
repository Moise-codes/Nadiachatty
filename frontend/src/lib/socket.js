import { io } from 'socket.io-client'

let socket = null

export const initSocket = (userId) => {
  if (socket?.connected) return socket
  socket = io('/', {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    query: { userId }
  })
  socket.on('connect', () => console.log('✅ Socket:', socket.id))
  socket.on('disconnect', (r) => console.log('❌ Socket disconnected:', r))
  socket.on('connect_error', (e) => console.error('Socket error:', e.message))
  return socket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null }
}
