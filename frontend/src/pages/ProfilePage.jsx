import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiCamera } from 'react-icons/fi'
import { useAuthStore } from '../store/useAuthStore'
import { getAvatarUrl } from '../lib/utils'

export default function ProfilePage() {
  const { authUser, updateProfile, isUpdatingProfile } = useAuthStore()
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [preview, setPreview] = useState(null)

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result)
      updateProfile({ profilePic: reader.result })
    }
    reader.readAsDataURL(file)
  }

  const avatarSrc = preview || getAvatarUrl(authUser?.fullName, authUser?.profilePic)

  return (
    <div className="profile-layout">
      <div className="profile-card">
        <button onClick={() => navigate('/')} style={{
          display:'flex', alignItems:'center', gap:'0.375rem',
          background:'none', border:'none', color:'rgba(255,255,255,0.4)',
          cursor:'pointer', fontSize:'0.82rem', marginBottom:'1.5rem', padding:0
        }}>
          <FiArrowLeft size={15} /> Back to chat
        </button>

        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:'1.75rem' }}>
          <div style={{ position:'relative' }}>
            <div style={{ width:88, height:88, borderRadius:'50%', overflow:'hidden', background:'#7c3aed', border:'3px solid rgba(124,58,237,0.4)' }}>
              <img src={avatarSrc} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
            </div>
            <button onClick={() => fileRef.current.click()} style={{
              position:'absolute', bottom:0, right:0, width:28, height:28,
              borderRadius:'50%', background:'linear-gradient(135deg,#7c3aed,#9333ea)',
              border:'2px solid #000', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'
            }}>
              <FiCamera size={13} color="white" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile} />
          </div>
          <p style={{ color:'#fff', fontWeight:600, marginTop:'0.75rem', fontSize:'1rem' }}>{authUser?.fullName}</p>
          <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.8rem' }}>{authUser?.email}</p>
          {isUpdatingProfile && <p style={{ color:'#9333ea', fontSize:'0.78rem', marginTop:'0.5rem' }}>Saving…</p>}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
          {[
            ['Member Since', authUser?.createdAt ? new Date(authUser.createdAt).toLocaleDateString('en-US',{month:'short',year:'numeric'}) : 'N/A', '#9333ea'],
            ['Status', 'Active', '#22c55e']
          ].map(([label, val, color]) => (
            <div key={label} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'0.5rem', padding:'0.875rem', textAlign:'center' }}>
              <p style={{ color, fontWeight:700, fontSize:'0.9rem' }}>{val}</p>
              <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.72rem', marginTop:2 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
