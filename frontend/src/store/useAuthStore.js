import { create } from 'zustand'
import toast from 'react-hot-toast'
import axiosInstance from '../lib/axios'
import { initSocket, disconnectSocket, getSocket } from '../lib/socket'

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],

  checkAuth: async () => {
    try {
      const { data } = await axiosInstance.get('/auth/check')
      set({ authUser: data })
      // Init socket once — useSocket hook will also call this but initSocket
      // is idempotent (returns existing socket if already connected)
      initSocket(data._id)
    } catch {
      set({ authUser: null })
    } finally {
      set({ isCheckingAuth: false })
    }
  },

  signup: async (formData) => {
    set({ isSigningUp: true })
    try {
      const { data } = await axiosInstance.post('/auth/signup', formData)
      set({ authUser: data })
      initSocket(data._id)
      toast.success('Account created! Welcome 🎉')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed')
    } finally {
      set({ isSigningUp: false })
    }
  },

  login: async (formData) => {
    set({ isLoggingIn: true })
    try {
      const { data } = await axiosInstance.post('/auth/login', formData)
      set({ authUser: data })
      initSocket(data._id)
      toast.success(`Welcome back, ${data.fullName}! 👋`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      set({ isLoggingIn: false })
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post('/auth/logout')
      disconnectSocket()
      set({ authUser: null, onlineUsers: [] })
      toast.success('Logged out')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Logout failed')
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true })
    try {
      const res = await axiosInstance.put('/auth/update-profile', data)
      set({ authUser: res.data })
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally {
      set({ isUpdatingProfile: false })
    }
  }
}))