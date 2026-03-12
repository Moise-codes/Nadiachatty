import React, { useEffect, useRef, useState, useCallback } from 'react'
import { FiSend, FiSmile, FiImage, FiX, FiPhone, FiVideo, FiMoreVertical, FiMic, FiArrowLeft, FiStopCircle } from 'react-icons/fi'
import { MdOutlineBlock, MdOutlineNotificationsOff, MdOutlineNotificationsActive, MdOutlineReport, MdOutlinePersonPin, MdOutlineColorLens, MdOutlineSearch, MdOutlineFileDownload } from 'react-icons/md'
import { HiOutlineArchive } from 'react-icons/hi'
import { BsPinAngle, BsStarFill } from 'react-icons/bs'
import EmojiPicker from 'emoji-picker-react'
import toast from 'react-hot-toast'
import { useChatStore } from '../store/useChatStore'
import { useAuthStore } from '../store/useAuthStore'
import { getAvatarUrl, isDifferentDay, formatDateDivider } from '../lib/utils'
import MessageBubble from './MessageBubble'
import axiosInstance from '../lib/axios'

export default function ChatContainer({ onStartCall }) {
  const {
    messages, getMessages, sendMessage, selectedUser, setSelectedUser,
    isMessagesLoading, isSendingMessage, typingUsers,
    subscribeToMessages, unsubscribeFromMessages, emitTyping
  } = useChatStore()
  const { authUser, onlineUsers } = useAuthStore()

  const endRef    = useRef(null)
  const fileRef   = useRef(null)
  const emojiRef  = useRef(null)
  const typingRef = useRef(null)
  const menuRef   = useRef(null)
  const mediaRef  = useRef(null)
  const chunksRef = useRef([])
  const timerRef  = useRef(null)

  const [text,           setText]           = useState('')
  const [imgPreview,     setImgPreview]     = useState(null)
  const [showEmoji,      setShowEmoji]      = useState(false)
  const [replyTo,        setReplyTo]        = useState(null)
  const [showMenu,       setShowMenu]       = useState(false)
  const [muted,          setMuted]          = useState(false)
  const [blocked,        setBlocked]        = useState(false)
  const [recording,      setRecording]      = useState(false)
  const [recSeconds,     setRecSeconds]     = useState(0)
  const [audioBlob,      setAudioBlob]      = useState(null)
  const [audioUrl,       setAudioUrl]       = useState(null)
  const [searchMode,     setSearchMode]     = useState(false)
  const [searchQuery,    setSearchQuery]    = useState('')
  const [showReport,     setShowReport]     = useState(false)
  const [reportReason,   setReportReason]   = useState('')
  const [reportSent,     setReportSent]     = useState(false)
  const [reportLoading,  setReportLoading]  = useState(false)

  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id)
      subscribeToMessages()
    }
    return () => unsubscribeFromMessages()
  }, [selectedUser?._id])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const handler = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmoji(false)
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleTyping = useCallback((val) => {
    setText(val)
    if (!selectedUser) return
    emitTyping(selectedUser._id, true)
    clearTimeout(typingRef.current)
    typingRef.current = setTimeout(() => emitTyping(selectedUser._id, false), 1500)
  }, [selectedUser, emitTyping])

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file?.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onloadend = () => setImgPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!text.trim() && !imgPreview && !audioBlob) return
    if (audioBlob) {
      const reader = new FileReader()
      reader.onloadend = async () => {
        await sendMessage({ text: '', image: null, audio: reader.result, replyTo: replyTo?._id })
        setAudioBlob(null)
        setAudioUrl(null)
        setReplyTo(null)
      }
      reader.readAsDataURL(audioBlob)
      return
    }
    await sendMessage({ text: text.trim(), image: imgPreview, replyTo: replyTo?._id })
    setText('')
    setImgPreview(null)
    setShowEmoji(false)
    setReplyTo(null)
    emitTyping(selectedUser._id, false)
  }

  // ── Voice recording ──
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRef.current = mr
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start()
      setRecording(true)
      setRecSeconds(0)
      timerRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000)
    } catch {
      alert('Microphone permission denied')
    }
  }

  const stopRecording = () => {
    mediaRef.current?.stop()
    clearInterval(timerRef.current)
    setRecording(false)
  }

  const cancelRecording = () => {
    mediaRef.current?.stop()
    clearInterval(timerRef.current)
    setRecording(false)
    setAudioBlob(null)
    setAudioUrl(null)
    chunksRef.current = []
  }

  const handleSubmitReport = async () => {
    if (!reportReason) return
    setReportLoading(true)
    try {
      await axiosInstance.post('/reports', {
        reportedUserId: selectedUser._id,
        reason: reportReason,
      })
      setReportSent(true)
    } catch {
      toast.error('Failed to submit report')
    } finally {
      setReportLoading(false)
    }
  }

  const fmtSec = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const isOnline = selectedUser && onlineUsers.includes(selectedUser._id)
  const isTyping = selectedUser && typingUsers[selectedUser._id]

  const filteredMessages = searchQuery.trim()
    ? messages.filter(m => m.text?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages

  const menuItems = [
    {
      icon: <MdOutlinePersonPin size={16} />,
      label: 'View Profile',
      action: () => { setShowMenu(false) }
    },
    {
      icon: <MdOutlineSearch size={16} />,
      label: 'Search in Chat',
      action: () => { setSearchMode(true); setShowMenu(false) }
    },
    {
      icon: <BsPinAngle size={15} />,
      label: 'Pin Conversation',
      action: () => { setShowMenu(false) }
    },
    {
      icon: muted ? <MdOutlineNotificationsActive size={16} /> : <MdOutlineNotificationsOff size={16} />,
      label: muted ? 'Unmute Notifications' : 'Mute Notifications',
      action: () => { setMuted(!muted); setShowMenu(false) }
    },
    {
      icon: <BsStarFill size={13} />,
      label: 'Starred Messages',
      action: () => { setShowMenu(false) }
    },
    {
      icon: <MdOutlineFileDownload size={16} />,
      label: 'Export Chat',
      action: () => { setShowMenu(false) }
    },
    {
      icon: <HiOutlineArchive size={15} />,
      label: 'Archive Chat',
      action: () => { setShowMenu(false) }
    },
    {
      icon: <MdOutlineColorLens size={16} />,
      label: 'Chat Theme',
      action: () => { setShowMenu(false) }
    },
    { divider: true },
    {
      icon: <MdOutlineBlock size={16} />,
      label: blocked ? 'Unblock User' : 'Block User',
      danger: !blocked,
      success: blocked,
      action: () => { setBlocked(!blocked); setShowMenu(false) }
    },
    {
      icon: <MdOutlineReport size={16} />,
      label: 'Report',
      danger: true,
      action: () => { setShowReport(true); setShowMenu(false); setReportSent(false); setReportReason('') }
    },
  ]

  if (!selectedUser) return (
    <div className="chat-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.75rem', opacity: 0.2 }}>💬</div>
        <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: '0.9rem' }}>
          Select a conversation to start chatting
        </p>
      </div>
    </div>
  )

  return (
    <div className={`chat-main${selectedUser ? ' visible-mobile' : ''}`} style={{ position: 'relative' }}>

      {/* ── Header ── */}
      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className="mobile-back-btn" onClick={() => setSelectedUser(null)} title="Back">
            <FiArrowLeft size={18} />
          </button>
          <div style={{ position: 'relative' }}>
            <div className="user-avatar" style={{ width: 36, height: 36, minWidth: 36, minHeight: 36 }}>
              <img src={getAvatarUrl(selectedUser.fullName, selectedUser.profilePic)} alt={selectedUser.fullName} />
            </div>
            {isOnline && <span className="online-dot" />}
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff' }}>{selectedUser.fullName}</p>
            <p style={{ fontSize: '0.72rem', color: isTyping ? '#9333ea' : isOnline ? '#22c55e' : 'rgba(255,255,255,0.3)' }}>
              {isTyping ? 'typing…' : isOnline ? '● Online' : 'Offline'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
          {searchMode ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <input
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(124,58,237,0.35)',
                  borderRadius: '0.5rem', color: '#fff', padding: '0.3rem 0.6rem',
                  fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', outline: 'none', width: 150
                }}
              />
              <button className="icon-btn" onClick={() => { setSearchMode(false); setSearchQuery('') }}>
                <FiX size={15} />
              </button>
            </div>
          ) : (
            <>
              <button className="icon-btn" onClick={() => onStartCall('audio', selectedUser)} title="Voice call">
                <FiPhone size={16} />
              </button>
              <button className="icon-btn" onClick={() => onStartCall('video', selectedUser)} title="Video call">
                <FiVideo size={16} />
              </button>
            </>
          )}

          {/* 3-dots menu */}
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button className="icon-btn" onClick={() => setShowMenu(!showMenu)} title="More options">
              <FiMoreVertical size={16} />
            </button>

            {showMenu && (
              <div style={{
                position: 'absolute', top: '110%', right: 0, zIndex: 200,
                background: 'rgba(14,14,26,0.98)', border: '1px solid rgba(124,58,237,0.2)',
                borderRadius: '0.75rem', padding: '0.375rem',
                minWidth: 210, boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                backdropFilter: 'blur(16px)',
              }}>
                {menuItems.map((item, i) =>
                  item.divider ? (
                    <div key={i} style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0.3rem 0.5rem' }} />
                  ) : (
                    <button
                      key={i}
                      onClick={item.action}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.625rem',
                        width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.5rem',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: item.danger ? '#f87171' : item.success ? '#22c55e' : 'rgba(255,255,255,0.75)',
                        fontSize: '0.82rem', fontFamily: 'Inter, sans-serif',
                        textAlign: 'left', transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = item.danger ? 'rgba(239,68,68,0.1)' : item.success ? 'rgba(34,197,94,0.1)' : 'rgba(124,58,237,0.12)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <span style={{ color: item.danger ? '#f87171' : item.success ? '#22c55e' : '#9333ea', flexShrink: 0 }}>
                        {item.icon}
                      </span>
                      {item.label}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="chat-messages">
        {isMessagesLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: i % 2 ? 'flex-end' : 'flex-start' }}>
              <div className="skeleton" style={{ height: 40, width: 160, borderRadius: '1rem' }} />
            </div>
          ))
        ) : filteredMessages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem' }}>
              {searchQuery ? 'No messages found' : 'No messages yet. Say hi! 👋'}
            </p>
          </div>
        ) : (
          filteredMessages.map((msg, idx) => {
            const isMine   = msg.senderId === authUser._id
            const showDate = idx === 0 || isDifferentDay(filteredMessages[idx - 1].createdAt, msg.createdAt)
            return (
              <React.Fragment key={msg._id}>
                {showDate && (
                  <div className="date-divider">
                    <div className="date-divider-line" />
                    <span className="date-divider-text">{formatDateDivider(msg.createdAt)}</span>
                    <div className="date-divider-line" />
                  </div>
                )}
                <MessageBubble
                  message={msg}
                  isMine={isMine}
                  senderName={isMine ? authUser.fullName   : selectedUser.fullName}
                  senderPic ={isMine ? authUser.profilePic : selectedUser.profilePic}
                  onReply={setReplyTo}
                />
              </React.Fragment>
            )
          })
        )}

        {isTyping && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.375rem' }}>
            <div className="user-avatar" style={{ width: 26, height: 26, minWidth: 26, minHeight: 26 }}>
              <img src={getAvatarUrl(selectedUser.fullName, selectedUser.profilePic)} alt="" />
            </div>
            <div className="msg-in" style={{ padding: '0.5rem 0.75rem' }}>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* ── Reply Preview ── */}
      {replyTo && (
        <div style={{
          margin: '0 0.875rem 0.375rem', padding: '0.4rem 0.75rem',
          background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.22)',
          borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', flex: 1 }}>
            ↩ Replying to: <em>{replyTo.text || '📷 Image'}</em>
          </span>
          <button className="icon-btn" style={{ width: 20, height: 20 }} onClick={() => setReplyTo(null)}>
            <FiX size={12} />
          </button>
        </div>
      )}

      {/* ── Image Preview ── */}
      {imgPreview && (
        <div style={{
          margin: '0 0.875rem 0.375rem', padding: '0.5rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.22)',
          borderRadius: '0.5rem'
        }}>
          <img src={imgPreview} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: '0.375rem' }} />
          <span style={{ flex: 1, fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>Image attached</span>
          <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={() => setImgPreview(null)}>
            <FiX size={13} />
          </button>
        </div>
      )}

      {/* ── Audio Preview ── */}
      {audioUrl && !recording && (
        <div style={{
          margin: '0 0.875rem 0.375rem', padding: '0.5rem 0.75rem',
          background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.22)',
          borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          <span style={{ fontSize: '0.8rem' }}>🎤</span>
          <audio src={audioUrl} controls style={{ flex: 1, height: 32, accentColor: '#9333ea' }} />
          <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={cancelRecording}>
            <FiX size={13} />
          </button>
        </div>
      )}

      {/* ── Emoji Picker ── */}
      {showEmoji && (
        <div ref={emojiRef} style={{ position: 'absolute', bottom: 70, left: 8, zIndex: 50 }}>
          <EmojiPicker
            onEmojiClick={(d) => setText(t => t + d.emoji)}
            theme="dark" height={350} width={300}
          />
        </div>
      )}

      {/* ── Input Bar ── */}
      <div className="chat-input-area">
        {recording && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.625rem',
            padding: '0.4rem 0.5rem', marginBottom: '0.4rem',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '0.5rem'
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1s infinite' }} />
            <span style={{ fontSize: '0.82rem', color: '#f87171', fontWeight: 500 }}>Recording {fmtSec(recSeconds)}</span>
            <button onClick={cancelRecording} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.75rem' }}>
              Cancel
            </button>
          </div>
        )}

        <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button type="button" className="icon-btn" onClick={() => fileRef.current.click()} title="Attach image">
            <FiImage size={17} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

          <div style={{ position: 'relative', flex: 1 }}>
            <input
              className="chat-input"
              type="text"
              placeholder={recording ? 'Recording…' : 'Send a message...'}
              value={text}
              disabled={recording}
              onChange={e => handleTyping(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) }
              }}
              style={{ width: '100%', paddingRight: '2.5rem', opacity: recording ? 0.4 : 1 }}
            />
            {!recording && (
              <button type="button"
                onClick={() => setShowEmoji(!showEmoji)}
                style={{
                  position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  color: showEmoji ? '#9333ea' : 'rgba(255,255,255,0.3)',
                  cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center'
                }}
              >😊</button>
            )}
          </div>

          <button
            type="button"
            className="icon-btn"
            title={recording ? 'Stop recording' : 'Voice message'}
            onClick={recording ? stopRecording : startRecording}
            style={{
              color: recording ? '#ef4444' : 'rgba(255,255,255,0.4)',
              background: recording ? 'rgba(239,68,68,0.15)' : 'none',
              border: recording ? '1px solid rgba(239,68,68,0.3)' : 'none',
            }}
          >
            {recording ? <FiStopCircle size={17} /> : <FiMic size={17} />}
          </button>

          <button
            type="submit"
            className="send-btn"
            disabled={(!text.trim() && !imgPreview && !audioBlob) || isSendingMessage}
          >
            {isSendingMessage
              ? <span className="spinner" style={{ width: 14, height: 14 }} />
              : <FiSend size={15} color="white" style={{ transform: 'translateX(1px)' }} />
            }
          </button>
        </form>
      </div>

      {/* ── Report Modal ── */}
      {showReport && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)', zIndex: 999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: 'rgba(14,14,26,0.98)', border: '1px solid rgba(124,58,237,0.25)',
            borderRadius: '1rem', padding: '1.5rem', width: '100%', maxWidth: 360,
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
          }}>
            {reportSent ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
                <p style={{ color: '#fff', fontWeight: 600, fontSize: '1rem', marginBottom: '0.4rem' }}>
                  Report Submitted
                </p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem', lineHeight: 1.6 }}>
                  Thanks for letting us know. We'll review this and take action if needed.
                </p>
                <button
                  onClick={() => setShowReport(false)}
                  style={{
                    marginTop: '1.25rem', width: '100%', padding: '0.65rem',
                    background: 'linear-gradient(135deg,#7c3aed,#9333ea)',
                    border: 'none', borderRadius: '0.5rem', color: '#fff',
                    fontFamily: 'Inter, sans-serif', fontWeight: 600,
                    fontSize: '0.875rem', cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <p style={{ color: '#fff', fontWeight: 600, fontSize: '1rem' }}>
                    Report {selectedUser?.fullName}
                  </p>
                  <button className="icon-btn" onClick={() => setShowReport(false)}>
                    <FiX size={16} />
                  </button>
                </div>

                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                  Why are you reporting this account?
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '1.25rem' }}>
                  {[
                    'Spam or fake account',
                    'Harassment or bullying',
                    'Inappropriate content',
                    'Hate speech',
                    'Violence or dangerous content',
                    'Scam or fraud',
                    'Impersonation',
                    'Something else',
                  ].map((reason) => (
                    <button
                      key={reason}
                      onClick={() => setReportReason(reason)}
                      style={{
                        padding: '0.6rem 0.875rem', borderRadius: '0.5rem', textAlign: 'left',
                        background: reportReason === reason ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${reportReason === reason ? 'rgba(124,58,237,0.45)' : 'rgba(255,255,255,0.07)'}`,
                        color: reportReason === reason ? '#c084fc' : 'rgba(255,255,255,0.65)',
                        fontSize: '0.82rem', fontFamily: 'Inter, sans-serif',
                        cursor: 'pointer', transition: 'all 0.15s'
                      }}
                    >
                      {reason}
                    </button>
                  ))}
                </div>

                <button
                  disabled={!reportReason || reportLoading}
                  onClick={handleSubmitReport}
                  style={{
                    width: '100%', padding: '0.65rem',
                    background: reportReason ? 'linear-gradient(135deg,#7c3aed,#9333ea)' : 'rgba(255,255,255,0.06)',
                    border: 'none', borderRadius: '0.5rem',
                    color: reportReason ? '#fff' : 'rgba(255,255,255,0.25)',
                    fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.875rem',
                    cursor: reportReason && !reportLoading ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                  }}
                >
                  {reportLoading
                    ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Submitting...</>
                    : 'Submit Report'
                  }
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}