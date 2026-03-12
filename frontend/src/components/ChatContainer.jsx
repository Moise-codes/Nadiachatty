import React, { useEffect, useRef, useState, useCallback } from 'react'
import { FiSend, FiSmile, FiImage, FiX, FiPhone, FiVideo, FiMoreVertical, FiMic, FiArrowLeft } from 'react-icons/fi'
import EmojiPicker from 'emoji-picker-react'
import { useChatStore } from '../store/useChatStore'
import { useAuthStore } from '../store/useAuthStore'
import { getAvatarUrl, isDifferentDay, formatDateDivider } from '../lib/utils'
import MessageBubble from './MessageBubble'

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

  const [text,       setText]       = useState('')
  const [imgPreview, setImgPreview] = useState(null)
  const [showEmoji,  setShowEmoji]  = useState(false)
  const [replyTo,    setReplyTo]    = useState(null)

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
    if (!text.trim() && !imgPreview) return
    await sendMessage({ text: text.trim(), image: imgPreview, replyTo: replyTo?._id })
    setText('')
    setImgPreview(null)
    setShowEmoji(false)
    setReplyTo(null)
    emitTyping(selectedUser._id, false)
  }

  const isOnline = selectedUser && onlineUsers.includes(selectedUser._id)
  const isTyping = selectedUser && typingUsers[selectedUser._id]

  // Empty state — no chat selected (desktop only, hidden on mobile)
  if (!selectedUser) return (
    <div className="chat-main" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'3rem', marginBottom:'0.75rem', opacity:0.2 }}>💬</div>
        <p style={{ color:'rgba(255,255,255,0.22)', fontSize:'0.9rem' }}>
          Select a conversation to start chatting
        </p>
      </div>
    </div>
  )

  return (
    // visible-mobile slides the panel in from the right on mobile
    <div className={`chat-main${selectedUser ? ' visible-mobile' : ''}`}>

      {/* ── Header ── */}
      <div className="chat-header">
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>

          {/* ← Back button — only visible on mobile via CSS */}
          <button
            className="mobile-back-btn"
            onClick={() => setSelectedUser(null)}
            title="Back to chats"
          >
            <FiArrowLeft size={18} />
          </button>

          {/* Avatar + name */}
          <div style={{ position:'relative' }}>
            <div className="user-avatar" style={{ width:36, height:36, minWidth:36, minHeight:36 }}>
              <img
                src={getAvatarUrl(selectedUser.fullName, selectedUser.profilePic)}
                alt={selectedUser.fullName}
              />
            </div>
            {isOnline && <span className="online-dot" />}
          </div>
          <div>
            <p style={{ fontSize:'0.875rem', fontWeight:600, color:'#fff' }}>
              {selectedUser.fullName}
            </p>
            <p style={{ fontSize:'0.72rem', color: isTyping ? '#9333ea' : isOnline ? '#22c55e' : 'rgba(255,255,255,0.3)' }}>
              {isTyping ? 'typing…' : isOnline ? '● Online' : 'Offline'}
            </p>
          </div>
        </div>

        {/* Call buttons */}
        <div style={{ display:'flex', gap:'0.25rem' }}>
          <button
            className="icon-btn"
            onClick={() => onStartCall('audio', selectedUser)}
            title="Voice call"
          >
            <FiPhone size={16} />
          </button>
          <button
            className="icon-btn"
            onClick={() => onStartCall('video', selectedUser)}
            title="Video call"
          >
            <FiVideo size={16} />
          </button>
          <button className="icon-btn" title="More options">
            <FiMoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="chat-messages">
        {isMessagesLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} style={{ display:'flex', justifyContent: i%2 ? 'flex-end' : 'flex-start' }}>
              <div className="skeleton" style={{ height:40, width:160, borderRadius:'1rem' }} />
            </div>
          ))
        ) : messages.length === 0 ? (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <p style={{ color:'rgba(255,255,255,0.2)', fontSize:'0.85rem' }}>
              No messages yet. Say hi! 👋
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMine   = msg.senderId === authUser._id
            const showDate = idx === 0 || isDifferentDay(messages[idx-1].createdAt, msg.createdAt)
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

        {/* Typing indicator */}
        {isTyping && (
          <div style={{ display:'flex', alignItems:'flex-end', gap:'0.375rem', animation:'fadeIn 0.2s ease' }}>
            <div className="user-avatar" style={{ width:26, height:26, minWidth:26, minHeight:26 }}>
              <img src={getAvatarUrl(selectedUser.fullName, selectedUser.profilePic)} alt="" />
            </div>
            <div className="msg-in" style={{ padding:'0.5rem 0.75rem' }}>
              <div style={{ display:'flex', gap:4, alignItems:'center' }}>
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
          margin:'0 0.875rem 0.375rem', padding:'0.4rem 0.75rem',
          background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.22)',
          borderRadius:'0.5rem', display:'flex', alignItems:'center', gap:'0.5rem'
        }}>
          <span style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.4)', flex:1 }}>
            ↩ Replying to: <em>{replyTo.text || '📷 Image'}</em>
          </span>
          <button className="icon-btn" style={{ width:20, height:20 }} onClick={() => setReplyTo(null)}>
            <FiX size={12} />
          </button>
        </div>
      )}

      {/* ── Image Preview ── */}
      {imgPreview && (
        <div style={{
          margin:'0 0.875rem 0.375rem', padding:'0.5rem',
          display:'flex', alignItems:'center', gap:'0.5rem',
          background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.22)',
          borderRadius:'0.5rem'
        }}>
          <img src={imgPreview} alt="" style={{ width:48, height:48, objectFit:'cover', borderRadius:'0.375rem' }} />
          <span style={{ flex:1, fontSize:'0.78rem', color:'rgba(255,255,255,0.4)' }}>Image attached</span>
          <button className="icon-btn" style={{ width:24, height:24 }} onClick={() => setImgPreview(null)}>
            <FiX size={13} />
          </button>
        </div>
      )}

      {/* ── Emoji Picker ── */}
      {showEmoji && (
        <div ref={emojiRef} style={{ position:'absolute', bottom:70, left:8, zIndex:50 }}>
          <EmojiPicker
            onEmojiClick={(d) => setText(t => t + d.emoji)}
            theme="dark"
            height={350}
            width={300}
            searchDisabled={false}
          />
        </div>
      )}

      {/* ── Input Bar ── */}
      <div className="chat-input-area">
        <form onSubmit={handleSend} style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>

          <button
            type="button" className="icon-btn"
            onClick={() => fileRef.current.click()}
            title="Attach image"
          >
            <FiImage size={17} />
          </button>
          <input
            ref={fileRef} type="file" accept="image/*"
            style={{ display:'none' }} onChange={handleFile}
          />

          <div style={{ position:'relative', flex:1 }}>
            <input
              className="chat-input"
              type="text"
              placeholder="Send a message..."
              value={text}
              onChange={e => handleTyping(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) }
              }}
              style={{ width:'100%', paddingRight:'2.5rem' }}
            />
            <button
              type="button"
              onClick={() => setShowEmoji(!showEmoji)}
              style={{
                position:'absolute', right:'0.625rem', top:'50%', transform:'translateY(-50%)',
                background:'none', border:'none',
                color: showEmoji ? '#9333ea' : 'rgba(255,255,255,0.3)',
                cursor:'pointer', padding:0, fontSize:'1rem',
                display:'flex', alignItems:'center'
              }}
            >😊</button>
          </div>

          <button type="button" className="icon-btn" title="Voice message">
            <FiMic size={17} />
          </button>

          <button
            type="submit"
            className="send-btn"
            disabled={(!text.trim() && !imgPreview) || isSendingMessage}
          >
            {isSendingMessage
              ? <span className="spinner" style={{ width:14, height:14 }} />
              : <FiSend size={15} color="white" style={{ transform:'translateX(1px)' }} />
            }
          </button>
        </form>
      </div>

    </div>
  )
}