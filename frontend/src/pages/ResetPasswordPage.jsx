import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import axiosInstance from '../lib/axios'
import NadiaLogo from '../components/NadiaLogo'

export default function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) return toast.error('Passwords do not match')
    if (password.length < 8) return toast.error('Password must be at least 8 characters')
    setLoading(true)
    try {
      await axiosInstance.post(`/auth/reset-password/${token}`, { password })
      toast.success('Password reset! Please login.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed — link may have expired')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-logo-side"><NadiaLogo size="lg" /></div>
      <div className="auth-card">
        <p className="auth-card-title">Reset Password</p>
        <form onSubmit={onSubmit}>
          <input className="auth-input" type="password" placeholder="New Password (min 8 chars)"
            value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
          <input className="auth-input" type="password" placeholder="Confirm New Password"
            value={confirm} onChange={e => setConfirm(e.target.value)} required />
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Reset Password'}
          </button>
        </form>
        <p className="auth-bottom-text"><Link to="/login">← Back to login</Link></p>
      </div>
    </div>
  )
}
