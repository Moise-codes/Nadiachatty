import { useEffect, useRef } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { useChatStore } from '../store/useChatStore'
import { initSocket, getSocket, disconnectSocket } from '../lib/socket'

export const useSocket = () => {
  const { authUser } = useAuthStore()
  const { subscribeToMessages, unsubscribeFromMessages } = useChatStore()

  const socketInitialized = useRef(false)

  useEffect(() => {
    if (!authUser?._id) return

    // Prevent double-init if effect runs twice (React StrictMode)
    if (socketInitialized.current) return
    socketInitialized.current = true

    // Init socket connection with userId as query param
    const socket = initSocket(authUser._id)

    // Listen for online users list from server
    socket.on('getOnlineUsers', (userIds) => {
      useAuthStore.setState({ onlineUsers: userIds })
    })

    // Subscribe to incoming messages for active chat
    subscribeToMessages()

    return () => {
      socket.off('getOnlineUsers')
      unsubscribeFromMessages()
      disconnectSocket()
      socketInitialized.current = false
    }
  }, [authUser?._id])
}