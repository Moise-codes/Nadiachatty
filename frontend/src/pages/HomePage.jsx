import React, { useEffect, useRef, useState } from 'react'
import { useChatStore } from '../store/useChatStore'
import { useAuthStore } from '../store/useAuthStore'
import { getSocket } from '../lib/socket'
import Sidebar from '../components/Sidebar'
import ChatContainer from '../components/ChatContainer'
import RightSidebar from '../components/RightSidebar'
import CallOverlay from '../components/CallOverlay'
import IncomingCall from '../components/IncomingCall'

export default function HomePage() {
  const { selectedUser } = useChatStore()
  const { authUser }     = useAuthStore()

  const [incomingCall, setIncomingCall] = useState(null)
  const [activeCall,   setActiveCall]   = useState(null)

  // Guard so listeners are never registered more than once
  const listenersAttached = useRef(false)

  useEffect(() => {
    // Wait until socket is ready — retry if not yet initialised
    let retryTimeout

    const attachListeners = () => {
      const socket = getSocket()

      if (!socket) {
        // Socket not ready yet — retry in 300ms
        retryTimeout = setTimeout(attachListeners, 300)
        return
      }

      if (listenersAttached.current) return
      listenersAttached.current = true

      // ── Incoming call from another user ──────────────────────
      socket.on('incomingCall', (data) => {
        console.log('📲 incomingCall received:', data)
        // Don't show notification if already in a call
        setActiveCall(prev => {
          if (!prev) setIncomingCall(data)
          return prev
        })
      })

      // ── Other side ended the call ─────────────────────────────
      socket.on('callEnded', () => {
        console.log('📴 callEnded received')
        setActiveCall(null)
        setIncomingCall(null)
      })

      // ── Other side rejected the call ──────────────────────────
      socket.on('callRejected', () => {
        console.log('❌ callRejected received')
        setActiveCall(null)
        setIncomingCall(null)
      })
    }

    attachListeners()

    return () => {
      clearTimeout(retryTimeout)
      const socket = getSocket()
      if (socket && listenersAttached.current) {
        socket.off('incomingCall')
        socket.off('callEnded')
        socket.off('callRejected')
        listenersAttached.current = false
      }
    }
  }, [authUser]) // re-attach if user changes (login/logout)

  const handleAccept = () => {
    if (!incomingCall) return
    setActiveCall({
      type:           incomingCall.callType,
      user: {
        _id:        incomingCall.callerId,
        fullName:   incomingCall.callerName,
        profilePic: incomingCall.callerPic
      },
      offer:          incomingCall.offer,
      callerSocketId: incomingCall.callerSocketId,
      isReceiver:     true
    })
    setIncomingCall(null)
  }

  const handleReject = () => {
    const socket = getSocket()
    if (socket && incomingCall) {
      socket.emit('rejectCall', { callerSocketId: incomingCall.callerSocketId })
    }
    setIncomingCall(null)
  }

  const handleStartCall = (type, user) => {
    // Don't allow starting a call if already in one
    if (activeCall) return
    setActiveCall({ type, user, isReceiver: false })
  }

  const handleCloseCall = () => {
    setActiveCall(null)
    setIncomingCall(null)
  }

  return (
    <div className="chat-layout">
      <div className={`chat-window${selectedUser ? ' with-right' : ''}`}>
        <Sidebar />
        <ChatContainer onStartCall={handleStartCall} />
        {selectedUser && <RightSidebar />}
      </div>

      {/* Incoming call notification — only show when not already in a call */}
      {incomingCall && !activeCall && (
        <IncomingCall
          call={incomingCall}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      )}

      {/* Active call overlay */}
      {activeCall && (
        <CallOverlay
          type={activeCall.type}
          user={activeCall.user}
          offer={activeCall.offer}
          callerSocketId={activeCall.callerSocketId}
          isReceiver={activeCall.isReceiver}
          onClose={handleCloseCall}
        />
      )}
    </div>
  )
}