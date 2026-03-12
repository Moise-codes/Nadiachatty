import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import NadiaLogo from '../components/NadiaLogo'

export default function LoginPage() {
  const [form, setForm] = useState({ email:'', password:'' })
  const [agreed, setAgreed] = useState(false)
  const { login, isLoggingIn } = useAuthStore()

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const onSubmit = (e) => {
    e.preventDefault()
    if (!agreed) return
    login(form)
  }

  return (
    <div className="auth-layout">
      <div className="auth-logo-side">
        <NadiaLogo size="lg" />
        <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.9rem', textAlign:'center', maxWidth:260 }}>
          Welcome back! Sign in to continue chatting.
        </p>
      </div>

      <div className="auth-card">
        <p className="auth-card-title">Login</p>

        <form onSubmit={onSubmit}>
          <input
            className="auth-input" type="email" name="email"
            placeholder="Email Address" value={form.email}
            onChange={onChange} autoComplete="email" required
          />
          <input
            className="auth-input" type="password" name="password"
            placeholder="Password" value={form.password}
            onChange={onChange} autoComplete="current-password" required
          />

          <div className="auth-checkbox-row">
            <input type="checkbox" id="agree-login" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
            <label htmlFor="agree-login">Agree to the terms of use &amp; privacy policy.</label>
          </div>

          <button type="submit" className="auth-btn" disabled={isLoggingIn || !agreed}>
            {isLoggingIn ? <span className="spinner" /> : 'Login Now'}
          </button>
        </form>

        <p className="auth-bottom-text">
          <Link to="/forgot-password">Forgot password?</Link>
          &nbsp;&nbsp;·&nbsp;&nbsp;
          Create an account? <Link to="/signup">Click here</Link>
        </p>
      </div>
    </div>
  )
}
