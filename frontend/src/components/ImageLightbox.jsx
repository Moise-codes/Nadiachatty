import React, { useEffect } from 'react'
import { FiX, FiDownload } from 'react-icons/fi'

export default function ImageLightbox({ src, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = src
    a.download = 'image'
    a.target = '_blank'
    a.click()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99998,
        background: 'rgba(0,0,0,0.93)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.2s ease', cursor: 'zoom-out'
      }}
    >
      {/* Top controls */}
      <div style={{
        position: 'absolute', top: 16, right: 16,
        display: 'flex', gap: '0.5rem', zIndex: 1
      }}>
        <button onClick={e => { e.stopPropagation(); handleDownload() }} style={{
          width: 38, height: 38, borderRadius: '0.5rem',
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', backdropFilter: 'blur(8px)'
        }} title="Download">
          <FiDownload size={17} color="white" />
        </button>
        <button onClick={onClose} style={{
          width: 38, height: 38, borderRadius: '0.5rem',
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', backdropFilter: 'blur(8px)'
        }} title="Close">
          <FiX size={17} color="white" />
        </button>
      </div>

      {/* Image */}
      <img
        src={src}
        alt="Preview"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '90vw', maxHeight: '90vh',
          objectFit: 'contain', borderRadius: '0.75rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
          cursor: 'default', animation: 'slideUp 0.25s ease'
        }}
      />

      <p style={{
        position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
        color: 'rgba(255,255,255,0.2)', fontSize: '0.78rem', whiteSpace: 'nowrap'
      }}>
        Press ESC or click outside to close
      </p>
    </div>
  )
}