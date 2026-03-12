import { useEffect } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { useChatStore } from '../store/useChatStore'
import { getSocket } from '../lib/socket'

export const useSocket = () => {
  const { authUser } = useAuthStore()
  const { subscribeToMessages, unsubscribeFromMessages } = useChatStore()

  useEffect(() => {
    if (!authUser?._id) return

    // Socket already created by useAuthStore — just get it
    const socket = getSocket()
    if (!socket) return

    // Always remove before adding — prevents stacking on re-renders
    socket.off('getOnlineUsers')
    socket.on('getOnlineUsers', (userIds) => {
      useAuthStore.setState({ onlineUsers: userIds })
    })

    subscribeToMessages()

    return () => {
      socket.off('getOnlineUsers')
      unsubscribeFromMessages()
      // DO NOT call disconnectSocket() here — useAuthStore owns the socket lifecycle
    }
  }, [authUser?._id])
}