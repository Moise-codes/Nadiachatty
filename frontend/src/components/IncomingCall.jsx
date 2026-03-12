import React, { useEffect, useRef } from 'react'
import { FiPhone, FiPhoneOff } from 'react-icons/fi'
import { getAvatarUrl } from '../lib/utils'

export default function IncomingCall({ call, onAccept, onReject }) {
  const audioRef = useRef(null)

  useEffect(() => {
    // Create ringtone using Web Audio API
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return

    const ctx = new AudioContext()
    let stopped = false

    const ring = () => {
      if (stopped) return
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type      = 'sine'
      osc.frequency.setValueAtTime(520, ctx.currentTime)
      osc.frequency.setValueAtTime(420, ctx.currentTime + 0.15)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.4)
      if (!stopped) setTimeout(ring, 800)
    }

    ring()

    return () => {
      stopped = true
      ctx.close()
    }
  }, [])

  if (!call) return null

  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 99999,
      background: 'rgba(12,12,22,0.98)',
      border: '1px solid rgba(124,58,237,0.45)',
      borderRadius: '1rem', padding: '1.25rem 1.5rem',
      display: 'flex', alignItems: 'center', gap: '1rem',
      boxShadow: '0 8px 40px rgba(124,58,237,0.25), 0 4px 20px rgba(0,0,0,0.8)',
      animation: 'slideUp 0.3s ease',
      minWidth: 300
    }}>
      {/* Pulsing ring around avatar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          position: 'absolute', inset: -6, borderRadius: '50%',
          background: 'rgba(34,197,94,0.15)',
          animation: 'pulseRing 1.2s ease-out infinite'
        }} />
        <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', border: '2px solid #22c55e', position: 'relative', zIndex: 1 }}>
          <img src={getAvatarUrl(call.callerName, call.callerPic)} alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1 }}>
        <p style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{call.callerName}</p>
        <p style={{ color: '#22c55e', fontSize: '0.78rem', marginTop: 2 }}>
          {call.callType === 'video' ? '📹 Incoming video call…' : '📞 Incoming voice call…'}
        </p>
      </div>

      {/* Reject */}
      <button onClick={onReject} title="Reject" style={{
        width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: 'pointer',
        background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 12px rgba(239,68,68,0.5)', flexShrink: 0
      }}>
        <FiPhoneOff size={18} color="white" />
      </button>

      {/* Accept */}
      <button onClick={onAccept} title="Accept" style={{
        width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: 'pointer',
        background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 12px rgba(34,197,94,0.5)', flexShrink: 0,
        animation: 'bouncePhone 0.6s infinite alternate'
      }}>
        <FiPhone size={18} color="white" />
      </button>

      <style>{`
        @keyframes bouncePhone {
          from { transform: rotate(-15deg) scale(1); }
          to   { transform: rotate(15deg)  scale(1.1); }
        }
      `}</style>
    </div>
  )
}