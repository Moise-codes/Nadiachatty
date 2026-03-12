import { useAuthStore } from '../store/useAuthStore'

/**
 * Returns true if the given userId is currently online
 * Usage: const isOnline = useOnlineStatus(user._id)
 */
export const useOnlineStatus = (userId) => {
  const { onlineUsers } = useAuthStore()
  return onlineUsers.includes(userId)
}