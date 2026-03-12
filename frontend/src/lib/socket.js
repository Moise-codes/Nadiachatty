import { io } from 'socket.io-client'

let socket = null
let currentUserId = null

export const initSocket = (userId) => {
  // Same user already connected — reuse, never create duplicate
  if (socket?.connected && currentUserId === userId) {
    console.log('♻️ Reusing existing socket:', socket.id)
    return socket
  }

  // Stale socket from different user — kill it first
  if (socket) {
    socket.disconnect()
    socket = null
    currentUserId = null
  }

  currentUserId = userId

  socket = io(import.meta.env.VITE_API_URL || '/', {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    query: { userId },
    reconnection:         true,
    reconnectionAttempts: 5,
    reconnectionDelay:    1000,
  })

  socket.on('connect',       () => console.log('✅ Socket connected:', socket.id))
  socket.on('disconnect',    (r) => console.log('❌ Socket disconnected:', r))
  socket.on('connect_error', (e) => console.error('🔴 Socket error:', e.message))

  return socket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
    currentUserId = null
    console.log('🔌 Socket manually disconnected')
  }
}