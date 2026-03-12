import React, { useState } from 'react'
import { FiPhone, FiVideo, FiBell, FiBellOff, FiX } from 'react-icons/fi'
import { useChatStore } from '../store/useChatStore'
import { useAuthStore } from '../store/useAuthStore'
import { getAvatarUrl } from '../lib/utils'

const SAMPLE_MEDIA = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=120&q=70',
  'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=120&q=70',
  'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=120&q=70',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=120&q=70',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=120&q=70',
  'https://images.unsplash.com/photo-1445307806294-bff7f67ff225?w=120&q=70',
]

export default function RightSidebar() {
  const { selectedUser, setSelectedUser } = useChatStore()
  const { onlineUsers } = useAuthStore()
  const [muted, setMuted] = useState(false)

  if (!selectedUser) return null
  const isOnline = onlineUsers.includes(selectedUser._id)

  return (
    <div className="right-sidebar">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.75rem 0.875rem', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontSize:'0.8rem', fontWeight:600, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Contact Info</p>
        <button className="icon-btn" style={{ width:24, height:24 }} onClick={() => setSelectedUser(null)}>
          <FiX size={14} />
        </button>
      </div>

      {/* Profile */}
      <div style={{ padding:'1.25rem 1rem', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ position:'relative', marginBottom:'0.75rem' }}>
          <div className="user-avatar" style={{ width:72, height:72, minWidth:72, minHeight:72, border:'2px solid rgba(124,58,237,0.35)' }}>
            <img src={getAvatarUrl(selectedUser.fullName, selectedUser.profilePic)} alt={selectedUser.fullName} />
          </div>
          {isOnline && <span className="online-dot" style={{ width:11, height:11, bottom:2, right:2 }} />}
        </div>
        <p style={{ fontSize:'0.9rem', fontWeight:600, color:'#fff', marginBottom:2 }}>{selectedUser.fullName}</p>
        <p style={{ fontSize:'0.75rem', color: isOnline ? '#22c55e' : 'rgba(255,255,255,0.3)' }}>
          {isOnline ? '● Online' : 'Offline'}
        </p>
        {selectedUser.email && (
          <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.28)', marginTop:4 }}>{selectedUser.email}</p>
        )}

        {/* Quick Actions */}
        <div style={{ display:'flex', gap:'0.5rem', marginTop:'1rem' }}>
          {[
            { icon:<FiPhone size={14}/>, label:'Call' },
            { icon:<FiVideo size={14}/>, label:'Video' },
            { icon: muted ? <FiBellOff size={14}/> : <FiBell size={14}/>, label: muted ? 'Unmute' : 'Mute', action:() => setMuted(!muted) },
          ].map(({ icon, label, action }, i) => (
            <button key={i} onClick={action} style={{
              display:'flex', flexDirection:'column', alignItems:'center', gap:3,
              background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)',
              borderRadius:'0.5rem', padding:'0.5rem 0.625rem', cursor:'pointer',
              color:'rgba(255,255,255,0.5)', transition:'all 0.15s'
            }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(124,58,237,0.15)'; e.currentTarget.style.color='#c084fc' }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.color='rgba(255,255,255,0.5)' }}>
              {icon}
              <span style={{ fontSize:'0.63rem' }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Shared Media */}
      <div style={{ padding:'1rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.625rem' }}>
          <p style={{ fontSize:'0.78rem', fontWeight:600, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.07em' }}>Media</p>
          <button style={{ fontSize:'0.72rem', color:'#9333ea', background:'none', border:'none', cursor:'pointer' }}>View all</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:4 }}>
          {SAMPLE_MEDIA.map((src, i) => (
            <div key={i} style={{ aspectRatio:'1', borderRadius:'0.375rem', overflow:'hidden', background:'rgba(255,255,255,0.05)', cursor:'pointer' }}>
              <img src={src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                onError={e => e.currentTarget.style.display='none'} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
