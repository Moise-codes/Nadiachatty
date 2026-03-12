import React, { useState, useEffect, useRef } from 'react'
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff } from 'react-icons/fi'
import { getAvatarUrl } from '../lib/utils'
import { getSocket } from '../lib/socket'
import { useAuthStore } from '../store/useAuthStore'

export default function CallOverlay({ type, user, offer, callerSocketId, isReceiver, onClose }) {
  const { authUser } = useAuthStore()
  const [muted,    setMuted]    = useState(false)
  const [videoOff, setVideoOff] = useState(false)
  const [status,   setStatus]   = useState(isReceiver ? 'connecting' : 'calling')
  const [duration, setDuration] = useState(0)

  const localVideoRef     = useRef(null)
  const remoteVideoRef    = useRef(null)
  const pcRef             = useRef(null)
  const streamRef         = useRef(null)
  const timerRef          = useRef(null)
  const remoteStreamRef   = useRef(null)       // FIX 3: start as null, reset each call
  const receiverSocketRef = useRef(null)
  const iceCandidateQueue = useRef([])         // FIX 4: queue ICE candidates

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`

  useEffect(() => {
    initCall()
    // FIX 5: always notify other side on unmount
    return () => {
      const socket = getSocket()
      const target = isReceiver ? callerSocketId : receiverSocketRef.current
      if (socket && target) {
        socket.emit('endCall', { targetSocketId: target })
      }
      cleanup()
    }
  }, [])

  const cleanup = () => {
    clearInterval(timerRef.current)
    timerRef.current = null

    // FIX 2: stop all tracks and null the ref
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }

    // FIX 2: fully tear down peer connection and null the ref
    if (pcRef.current) {
      pcRef.current.ontrack              = null
      pcRef.current.onicecandidate       = null
      pcRef.current.onconnectionstatechange = null
      pcRef.current.close()
      pcRef.current = null
    }

    // FIX 1: remove ALL socket listeners so they don't stack on next call
    const socket = getSocket()
    if (socket) {
      socket.off('callAnswered')
      socket.off('iceCandidate')
      socket.off('callEnded')
      socket.off('callRejected')
    }

    // FIX 4: clear ICE queue
    iceCandidateQueue.current = []
  }

  const startTimer = () => {
    setStatus('connected')
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
  }

  // FIX 4: flush queued ICE candidates after remote description is set
  const flushICEQueue = async (pc) => {
    for (const candidate of iceCandidateQueue.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate))
      } catch (e) {
        console.warn('Queued ICE error:', e.message)
      }
    }
    iceCandidateQueue.current = []
  }

  const initCall = async () => {
    const socket = getSocket()
    if (!socket) return

    // FIX 1: remove any stale listeners before attaching new ones
    socket.off('callAnswered')
    socket.off('iceCandidate')
    socket.off('callEnded')
    socket.off('callRejected')

    // FIX 3: always start with a fresh MediaStream each call
    remoteStreamRef.current = new MediaStream()

    try {
      // ── Get local media with fallback ─────────────────────────
      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia(
          type === 'video'
            ? { video: { facingMode: 'user' }, audio: true }
            : { audio: true, video: false }
        )
      } catch (e) {
        console.warn('Media access denied:', e.name, e.message)
        if (e.name === 'NotReadableError' || e.name === 'AbortError') {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
          } catch {
            stream = new MediaStream()
          }
        } else {
          stream = new MediaStream()
        }
      }

      streamRef.current = stream

      if (localVideoRef.current && type === 'video') {
        localVideoRef.current.srcObject = stream
        localVideoRef.current.play().catch(() => {})
      }

      // ── Create RTCPeerConnection ───────────────────────────────
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302'  },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
        ]
      })
      pcRef.current = pc

      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      // ── Remote tracks ─────────────────────────────────────────
      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => {
          remoteStreamRef.current.addTrack(track)
        })
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStreamRef.current
          remoteVideoRef.current.play().catch(() => {})
        }
        startTimer()
      }

      // ── ICE candidates ────────────────────────────────────────
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const target = isReceiver
            ? callerSocketId
            : receiverSocketRef.current
          if (target) {
            socket.emit('iceCandidate', { targetSocketId: target, candidate: event.candidate })
          }
        }
      }

      pc.onconnectionstatechange = () => {
        console.log('WebRTC state:', pc.connectionState)
        if (pc.connectionState === 'connected') startTimer()
        if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
          setStatus('ended')
          setTimeout(onClose, 1500)
        }
      }

      // ── CALLER side ───────────────────────────────────────────
      if (!isReceiver) {
        const offerSDP = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: type === 'video'
        })
        await pc.setLocalDescription(offerSDP)

        socket.emit('callUser', {
          receiverId: user._id,
          offer:      offerSDP,
          callType:   type,
          callerName: authUser?.fullName   || 'Unknown',
          callerPic:  authUser?.profilePic || ''
        })

        socket.on('callAnswered', async ({ answer, receiverSocketId }) => {
          receiverSocketRef.current = receiverSocketId
          try {
            if (pc.signalingState !== 'stable') {
              await pc.setRemoteDescription(new RTCSessionDescription(answer))
              await flushICEQueue(pc)  // FIX 4: apply any queued candidates
            }
          } catch (e) {
            console.error('setRemoteDescription error:', e.message)
          }
        })

        // 40s timeout
        setTimeout(() => {
          if (pcRef.current?.connectionState !== 'connected') {
            setStatus('ended')
            setTimeout(onClose, 1500)
          }
        }, 40000)
      }

      // ── RECEIVER side ─────────────────────────────────────────
      if (isReceiver && offer) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(offer))
          await flushICEQueue(pc)  // FIX 4: apply any queued candidates
          const answerSDP = await pc.createAnswer()
          await pc.setLocalDescription(answerSDP)
          socket.emit('answerCall', { callerSocketId, answer: answerSDP })
          startTimer()
        } catch (e) {
          console.error('Receiver setup error:', e.message)
        }
      }

      // ── Shared listeners ──────────────────────────────────────

      // FIX 4: queue if remote description not ready yet
      socket.on('iceCandidate', async ({ candidate }) => {
        if (!candidate) return
        const pc = pcRef.current
        if (!pc) return
        if (pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate))
          } catch (e) {
            console.warn('ICE error:', e.message)
          }
        } else {
          console.log('Queuing ICE candidate — remote description not ready yet')
          iceCandidateQueue.current.push(candidate)
        }
      })

      socket.on('callEnded',    () => { setStatus('ended'); setTimeout(onClose, 1500) })
      socket.on('callRejected', () => { setStatus('ended'); setTimeout(onClose, 1500) })

    } catch (err) {
      console.error('WebRTC init error:', err)
      setStatus('ended')
      setTimeout(onClose, 2000)
    }
  }

  const handleEnd = () => {
    const socket = getSocket()
    const target = isReceiver ? callerSocketId : receiverSocketRef.current
    if (socket && target) socket.emit('endCall', { targetSocketId: target })
    cleanup()
    onClose()
  }

  const toggleMute = () => {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = muted })
    setMuted(m => !m)
  }

  const toggleVideo = () => {
    streamRef.current?.getVideoTracks().forEach(t => { t.enabled = videoOff })
    setVideoOff(v => !v)
  }

  const btn = (active, danger) => ({
    width: 56, height: 56, borderRadius: '50%', cursor: 'pointer', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
    background: danger ? '#ef4444' : active ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.12)',
    boxShadow: danger ? '0 4px 20px rgba(239,68,68,0.5)' : 'none'
  })

  // ── VIDEO CALL UI ─────────────────────────────────────────────
  if (type === 'video') return (
    <div className="call-overlay" style={{ background: '#000' }}>

      <video
        ref={remoteVideoRef}
        autoPlay playsInline
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', background: '#111'
        }}
      />

      {status !== 'connected' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 5,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.75)'
        }}>
          <div style={{
            width: 100, height: 100, borderRadius: '50%', overflow: 'hidden',
            background: '#7c3aed', border: '3px solid rgba(124,58,237,0.5)',
            marginBottom: '1rem'
          }}>
            <img src={getAvatarUrl(user?.fullName, user?.profilePic)} alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <p style={{ color: '#fff', fontWeight: 600, fontSize: '1.2rem' }}>{user?.fullName}</p>
          <p style={{ color: status === 'ended' ? '#ef4444' : '#9333ea', marginTop: 8, fontSize: '0.9rem' }}>
            {status === 'ended' ? 'Call ended' : status === 'connecting' ? 'Connecting…' : 'Calling…'}
          </p>
          {(status === 'calling' || status === 'connecting') && (
            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          )}
        </div>
      )}

      <video
        ref={localVideoRef}
        autoPlay playsInline muted
        style={{
          position: 'absolute', bottom: 110, right: 20,
          width: 150, height: 110, objectFit: 'cover',
          borderRadius: '0.875rem',
          border: '2px solid rgba(124,58,237,0.6)',
          background: '#1a1a2e', zIndex: 10
        }}
      />

      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        padding: '20px 24px',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)'
      }}>
        <p style={{ color: '#fff', fontWeight: 600, fontSize: '1.1rem', textAlign: 'center' }}>
          {user?.fullName}
        </p>
        <p style={{ fontSize: '0.85rem', textAlign: 'center', marginTop: 4,
          color: status === 'connected' ? '#22c55e' : '#9333ea' }}>
          {status === 'connected' ? fmt(duration) : status === 'ended' ? 'Call ended' : 'Connecting…'}
        </p>
      </div>

      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
        padding: '20px 24px 32px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
        display: 'flex', justifyContent: 'center', gap: '1.25rem'
      }}>
        <button style={btn(muted, false)} onClick={toggleMute}>
          {muted ? <FiMicOff size={22} color="#f87171" /> : <FiMic size={22} color="white" />}
        </button>
        <button style={btn(false, true)} onClick={handleEnd}>
          <FiPhoneOff size={24} color="white" />
        </button>
        <button style={btn(videoOff, false)} onClick={toggleVideo}>
          {videoOff ? <FiVideoOff size={22} color="#f87171" /> : <FiVideo size={22} color="white" />}
        </button>
      </div>
    </div>
  )

  // ── AUDIO CALL UI ─────────────────────────────────────────────
  return (
    <div className="call-overlay">
      <div className="call-card">

        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
          {(status === 'calling' || status === 'connecting') && [1.4, 1.8, 2.2].map((scale, i) => (
            <div key={i} style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'rgba(124,58,237,0.1)',
              animation: `pulseRing 1.8s ease-out ${i * 0.35}s infinite`,
              transform: `scale(${scale})`
            }} />
          ))}
          <div style={{
            width: 90, height: 90, borderRadius: '50%', overflow: 'hidden',
            background: '#7c3aed', border: '3px solid rgba(124,58,237,0.5)',
            position: 'relative', zIndex: 1,
            boxShadow: status === 'connected' ? '0 0 30px rgba(34,197,94,0.3)' : 'none'
          }}>
            <img src={getAvatarUrl(user?.fullName, user?.profilePic)} alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>

        <p style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff', marginBottom: 4 }}>
          {user?.fullName}
        </p>
        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>
          📞 Voice call
        </p>
        <p style={{
          fontSize: '0.95rem', fontWeight: 600, marginBottom: '2rem',
          color: status === 'connected' ? '#22c55e' : status === 'ended' ? '#ef4444' : '#9333ea'
        }}>
          {status === 'connected' ? fmt(duration) : status === 'ended' ? 'Call ended' : 'Calling…'}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button style={btn(muted, false)} onClick={toggleMute}>
            {muted
              ? <FiMicOff size={22} color="#f87171" />
              : <FiMic   size={22} color="rgba(255,255,255,0.8)" />}
          </button>
          <button style={btn(false, true)} onClick={handleEnd}>
            <FiPhoneOff size={24} color="white" />
          </button>
        </div>

        <video ref={localVideoRef}  autoPlay playsInline muted style={{ display: 'none' }} />
        <video ref={remoteVideoRef} autoPlay playsInline       style={{ display: 'none' }} />
      </div>
    </div>
  )
}