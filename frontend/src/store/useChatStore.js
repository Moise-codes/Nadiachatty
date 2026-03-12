import { create } from 'zustand'
import toast from 'react-hot-toast'
import axiosInstance from '../lib/axios'
import { getSocket } from '../lib/socket'

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSendingMessage: false,
  typingUsers: {},

  getUsers: async () => {
    set({ isUsersLoading: true })
    try {
      const { data } = await axiosInstance.get('/messages/users')
      set({ users: data })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load users')
    } finally {
      set({ isUsersLoading: false })
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true })
    try {
      const { data } = await axiosInstance.get(`/messages/${userId}`)
      set({ messages: data })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load messages')
    } finally {
      set({ isMessagesLoading: false })
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get()
    if (!selectedUser) return
    if (!messageData.text?.trim() && !messageData.image && !messageData.audio) {
      return toast.error('Message cannot be empty')
    }
    set({ isSendingMessage: true })
    try {
      const { data } = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData)
      set({ messages: [...messages, data] })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message')
    } finally {
      set({ isSendingMessage: false })
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`)
      set({ messages: get().messages.filter(m => m._id !== messageId) })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    }
  },

  addReaction: async (messageId, emoji) => {
    try {
      const { data } = await axiosInstance.post(`/messages/${messageId}/react`, { emoji })
      set({ messages: get().messages.map(m => m._id === messageId ? data : m) })
    } catch (err) {
      toast.error('Reaction failed')
    }
  },

  setSelectedUser: (user) => set({ selectedUser: user, messages: [] }),

  subscribeToMessages: () => {
    const socket = getSocket()
    if (!socket) return
    const { selectedUser } = get()

    socket.on('newMessage', (msg) => {
      if (msg.senderId === selectedUser?._id || msg.receiverId === selectedUser?._id) {
        set({ messages: [...get().messages, msg] })
      }
      set(state => ({
        users: state.users.map(u =>
          u._id === msg.senderId || u._id === msg.receiverId
            ? { ...u, lastMessage: msg }
            : u
        )
      }))
    })

    socket.on('messageDeleted', ({ messageId }) => {
      set({ messages: get().messages.filter(m => m._id !== messageId) })
    })

    socket.on('messageReaction', (updatedMsg) => {
      set({ messages: get().messages.map(m => m._id === updatedMsg._id ? updatedMsg : m) })
    })

    socket.on('typing', ({ senderId, isTyping }) => {
      set(state => ({ typingUsers: { ...state.typingUsers, [senderId]: isTyping } }))
    })
  },

  unsubscribeFromMessages: () => {
    const socket = getSocket()
    if (!socket) return
    socket.off('newMessage')
    socket.off('messageDeleted')
    socket.off('messageReaction')
    socket.off('typing')
  },

  emitTyping: (receiverId, isTyping) => {
    const socket = getSocket()
    if (socket) socket.emit('typing', { receiverId, isTyping })
  }
}))