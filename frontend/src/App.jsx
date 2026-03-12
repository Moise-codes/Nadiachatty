import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/useAuthStore'
import { useSocket } from './hooks/useSocket'   // ← ADD THIS
import SignupPage from './pages/SignupPage'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'

const ProtectedRoute = ({ children }) => {
  const { authUser, isCheckingAuth } = useAuthStore()
  if (isCheckingAuth) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#000' }}>
      <span className="spinner lg" />
    </div>
  )
  return authUser ? children : <Navigate to="/login" replace />
}

const PublicRoute = ({ children }) => {
  const { authUser, isCheckingAuth } = useAuthStore()
  if (isCheckingAuth) return null
  return authUser ? <Navigate to="/" replace /> : children
}

function AppContent() {
  useSocket()   // ← ADD THIS — runs socket for logged-in users
  return (
    <Routes>
      <Route path="/signup"                element={<PublicRoute><SignupPage /></PublicRoute>} />
      <Route path="/login"                 element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/forgot-password"       element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/"                      element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/profile"               element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="*"                      element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  const { checkAuth } = useAuthStore()
  useEffect(() => { checkAuth() }, [checkAuth])

  return (
    <BrowserRouter>
      <div className="app-bg" />
      <AppContent />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#12121e', color: '#e2e8f0',
            border: '1px solid rgba(124,58,237,0.25)',
            borderRadius: '0.5rem', fontFamily: 'Inter,sans-serif', fontSize: '0.875rem'
          },
          success: { iconTheme: { primary:'#22c55e', secondary:'#12121e' } },
          error:   { iconTheme: { primary:'#ef4444', secondary:'#12121e' } }
        }}
      />
    </BrowserRouter>
  )
}