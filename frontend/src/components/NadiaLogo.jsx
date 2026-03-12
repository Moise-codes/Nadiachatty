import React from 'react'

export default function NadiaLogo({ size = 'md' }) {
  const s = { sm:{box:40,r:'0.75rem',icon:20,text:'1.1rem'}, md:{box:56,r:'1rem',icon:28,text:'1.4rem'}, lg:{box:80,r:'1.4rem',icon:40,text:'2rem'} }[size]
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.875rem' }}>
      <div style={{
        width:s.box, height:s.box, background:'linear-gradient(135deg,#7c3aed,#9333ea)',
        borderRadius:s.r, display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:'0 8px 28px rgba(124,58,237,0.5)', flexShrink:0
      }}>
        <svg width={s.icon} height={s.icon} viewBox="0 0 24 24" fill="none">
          <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="white" fillOpacity="0.9"/>
          <circle cx="8" cy="10" r="1.5" fill="rgba(255,255,255,0.6)"/>
          <circle cx="12" cy="10" r="1.5" fill="rgba(255,255,255,0.6)"/>
          <circle cx="16" cy="10" r="1.5" fill="rgba(255,255,255,0.6)"/>
        </svg>
      </div>
      <span style={{ fontSize:s.text, fontWeight:600, color:'#fff', letterSpacing:'-0.02em' }}>
        NadiaChatty
      </span>
    </div>
  )
}
