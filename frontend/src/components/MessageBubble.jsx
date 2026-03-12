import React, { useState } from 'react'
import { FiSmile, FiTrash2, FiCornerUpLeft } from 'react-icons/fi'
import { useChatStore } from '../store/useChatStore'
import { useAuthStore } from '../store/useAuthStore'
import { getAvatarUrl, formatMsgTime } from '../lib/utils'
import ImageLightbox from './ImageLightbox'

const QUICK_REACTIONS = ['👍','❤️','😂','😮','😢','🔥','👏','🎉']

export default function MessageBubble({ message, isMine, senderName, senderPic, onReply }) {
  const [hover,     setHover]     = useState(false)
  const [showReact, setShowReact] = useState(false)
  const [lightbox,  setLightbox]  = useState(null)
  const { deleteMessage, addReaction } = useChatStore()
  const { authUser } = useAuthStore()

  const reactionGroups = (message.reactions || []).reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1
    return acc
  }, {})

  const handleReact = (emoji) => {
    addReaction(message._id, emoji)
    setShowReact(false)
  }

  return (
    <>
      {/* Lightbox */}
      {lightbox && <ImageLightbox src={lightbox} onClose={() => setLightbox(null)} />}

      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => { setHover(false); setShowReact(false) }}
        style={{
          display: 'flex', alignItems: 'flex-end', gap: '0.375rem',
          flexDirection: isMine ? 'row-reverse' : 'row',
          marginBottom: 2, animation: 'fadeIn 0.2s ease'
        }}
      >
        {/* Avatar */}
        <div className="user-avatar" style={{ width:26, height:26, minWidth:26, minHeight:26, marginBottom:2, flexShrink:0 }}>
          <img src={getAvatarUrl(senderName, senderPic)} alt="" />
        </div>

        <div style={{ display:'flex', flexDirection:'column', alignItems: isMine ? 'flex-end' : 'flex-start', maxWidth:'65%' }}>

          {/* Reply quote */}
          {message.replyTo && (
            <div style={{
              background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
              borderRadius: '0.5rem', padding: '0.3rem 0.6rem', marginBottom: 3, maxWidth: '100%'
            }}>
              <p style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.4)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                ↩ {message.replyTo.text || '📷 Image'}
              </p>
            </div>
          )}

          {/* Image — click to zoom */}
          {message.image && (
            <img
              src={message.image}
              alt="attachment"
              onClick={() => setLightbox(message.image)}
              style={{
                maxWidth: 220, borderRadius: '0.75rem', marginBottom: 3,
                border: '1px solid rgba(124,58,237,0.2)', display: 'block',
                cursor: 'zoom-in', transition: 'transform 0.15s, box-shadow 0.15s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.03)'
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,58,237,0.3)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          )}

          {/* Text */}
          {message.text && (
            <div className={isMine ? 'msg-out' : 'msg-in'}>
              {message.text}
            </div>
          )}

          {/* Reactions */}
          {Object.keys(reactionGroups).length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:3, marginTop:3, justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
              {Object.entries(reactionGroups).map(([emoji, count]) => (
                <button key={emoji} className="reaction-pill" onClick={() => handleReact(emoji)}>
                  {emoji}
                  {count > 1 && (
                    <span style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.7rem' }}>{count}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Time */}
          <span className="msg-time">{formatMsgTime(message.createdAt)}</span>
        </div>

        {/* Hover actions */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 2, position: 'relative',
          opacity: hover ? 1 : 0, transition: 'opacity 0.15s',
          flexDirection: isMine ? 'row-reverse' : 'row'
        }}>
          <button className="icon-btn" style={{ width:24, height:24 }} onClick={() => setShowReact(!showReact)}>
            <FiSmile size={12} />
          </button>
          <button className="icon-btn" style={{ width:24, height:24 }} onClick={() => onReply && onReply(message)}>
            <FiCornerUpLeft size={12} />
          </button>
          {isMine && (
            <button
              className="icon-btn" style={{ width:24, height:24 }}
              onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.38)'}
              onClick={() => deleteMessage(message._id)}
            >
              <FiTrash2 size={11} />
            </button>
          )}

          {/* Quick emoji picker */}
          {showReact && (
            <div style={{
              position: 'absolute', bottom: '100%', marginBottom: 4,
              [isMine ? 'right' : 'left']: 0,
              display: 'flex', gap: 3, padding: '6px 8px',
              background: 'rgba(12,12,22,0.98)',
              border: '1px solid rgba(124,58,237,0.22)',
              borderRadius: '999px', zIndex: 50,
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              whiteSpace: 'nowrap'
            }}>
              {QUICK_REACTIONS.map(e => (
                <button key={e} onClick={() => handleReact(e)} style={{
                  background: 'none', border: 'none', fontSize: '1rem',
                  cursor: 'pointer', transition: 'transform 0.1s',
                  lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                  onMouseEnter={el => el.currentTarget.style.transform = 'scale(1.3)'}
                  onMouseLeave={el => el.currentTarget.style.transform = 'scale(1)'}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}