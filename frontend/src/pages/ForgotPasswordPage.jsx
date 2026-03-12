import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import axiosInstance from '../lib/axios'
import NadiaLogo from '../components/NadiaLogo'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axiosInstance.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-logo-side"><NadiaLogo size="lg" /></div>
      <div className="auth-card">
        {sent ? (
          <div style={{ textAlign:'center', padding:'0.5rem 0' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>📧</div>
            <p style={{ color:'#fff', fontWeight:500, marginBottom:'0.5rem' }}>Check your email</p>
            <p style={{ color:'rgba(255,255,255,0.32)', fontSize:'0.82rem', lineHeight:1.6 }}>
              A reset link was sent to <span style={{ color:'#9333ea' }}>{email}</span>
            </p>
          </div>
        ) : (
          <>
            <p className="auth-card-title">Forgot Password</p>
            <p style={{ color:'rgba(255,255,255,0.32)', fontSize:'0.8rem', marginBottom:'1rem', lineHeight:1.5 }}>
              Enter your email and we'll send you a reset link.
            </p>
            <form onSubmit={onSubmit}>
              <input className="auth-input" type="email" placeholder="Email Address"
                value={email} onChange={e => setEmail(e.target.value)} required />
              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}
        <p className="auth-bottom-text" style={{ marginTop:'1rem' }}>
          <Link to="/login">← Back to login</Link>
        </p>
      </div>
    </div>
  )
}
