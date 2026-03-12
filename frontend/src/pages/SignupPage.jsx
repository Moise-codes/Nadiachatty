import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import NadiaLogo from '../components/NadiaLogo'

export default function SignupPage() {
  const [form, setForm] = useState({ fullName:'', email:'', password:'' })
  const [agreed, setAgreed] = useState(false)
  const [errors, setErrors] = useState({})
  const { signup, isSigningUp } = useAuthStore()

  const validate = () => {
    const e = {}
    if (!form.fullName.trim()) e.fullName = true
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = true
    if (form.password.length < 8) e.password = true
    setErrors(e)
    return !Object.keys(e).length
  }

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: false })
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (!agreed || !validate()) return
    signup(form)
  }

  return (
    <div className="auth-layout">
      <div className="auth-logo-side">
        <NadiaLogo size="lg" />
        <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.9rem', textAlign:'center', maxWidth:260 }}>
          Connect with friends and the world around you.
        </p>
      </div>

      <div className="auth-card">
        <p className="auth-card-title">Sign up</p>

        <form onSubmit={onSubmit}>
          <input
            className={`auth-input ${errors.fullName ? 'error' : ''}`}
            type="text" name="fullName" placeholder="Full Name"
            value={form.fullName} onChange={onChange} autoComplete="name"
          />
          <input
            className={`auth-input ${errors.email ? 'error' : ''}`}
            type="email" name="email" placeholder="Email Address"
            value={form.email} onChange={onChange} autoComplete="email"
          />
          <input
            className={`auth-input ${errors.password ? 'error' : ''}`}
            type="password" name="password" placeholder="Password (min 8 chars)"
            value={form.password} onChange={onChange} autoComplete="new-password"
          />

          <div className="auth-checkbox-row">
            <input type="checkbox" id="agree" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
            <label htmlFor="agree">Agree to the terms of use &amp; privacy policy.</label>
          </div>

          <button type="submit" className="auth-btn" disabled={isSigningUp || !agreed}>
            {isSigningUp ? <span className="spinner" /> : 'Create Account'}
          </button>
        </form>

        <p className="auth-bottom-text">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  )
}
