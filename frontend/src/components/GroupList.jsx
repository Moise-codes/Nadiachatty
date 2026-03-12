import React, { useState } from 'react'
import { FiPlus, FiX, FiUsers } from 'react-icons/fi'
import { useAuthStore } from '../store/useAuthStore'

export default function GroupList() {
  const { authUser } = useAuthStore()
  const [groups,     setGroups]     = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [groupName,  setGroupName]  = useState('')
  const [selected,   setSelected]   = useState(null)

  const createGroup = () => {
    if (!groupName.trim()) return
    const newGroup = {
      _id:      Date.now().toString(),
      name:     groupName.trim(),
      members:  [authUser],
      createdAt: new Date().toISOString()
    }
    setGroups(g => [newGroup, ...g])
    setGroupName('')
    setShowCreate(false)
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Create button */}
      <div style={{ padding: '0.5rem 0.75rem' }}>
        <button
          onClick={() => setShowCreate(!showCreate)}
          style={{
            width: '100%', padding: '0.45rem', borderRadius: '0.5rem',
            background: 'rgba(124,58,237,0.15)',
            border: '1px solid rgba(124,58,237,0.28)',
            color: '#c084fc', fontSize: '0.78rem', fontWeight: 500,
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '0.375rem', fontFamily: 'Inter,sans-serif'
          }}
        >
          <FiPlus size={13} /> New Group
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div style={{
          margin: '0 0.75rem 0.5rem',
          background: 'rgba(124,58,237,0.08)',
          border: '1px solid rgba(124,58,237,0.2)',
          borderRadius: '0.5rem', padding: '0.75rem'
        }}>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem' }}>
            Group name
          </p>
          <input
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createGroup()}
            placeholder="e.g. Family, Work, Friends..."
            autoFocus
            style={{
              width: '100%', background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.375rem',
              color: '#fff', padding: '0.5rem 0.625rem', fontSize: '0.82rem',
              outline: 'none', marginBottom: '0.5rem', fontFamily: 'Inter,sans-serif',
              boxSizing: 'border-box'
            }}
          />
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            <button onClick={createGroup} style={{
              flex: 1, padding: '0.4rem', borderRadius: '0.375rem',
              background: 'linear-gradient(135deg,#7c3aed,#9333ea)',
              border: 'none', color: '#fff', fontSize: '0.8rem',
              fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif'
            }}>
              Create
            </button>
            <button onClick={() => { setShowCreate(false); setGroupName('') }} style={{
              padding: '0.4rem 0.625rem', borderRadius: '0.375rem',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.4)', cursor: 'pointer'
            }}>
              <FiX size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Groups list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.25rem 0.375rem' }}>
        {groups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(124,58,237,0.1)',
              border: '1px solid rgba(124,58,237,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 0.75rem'
            }}>
              <FiUsers size={22} color="rgba(124,58,237,0.5)" />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: '0.82rem', fontWeight: 500 }}>
              No groups yet
            </p>
            <p style={{ color: 'rgba(255,255,255,0.14)', fontSize: '0.74rem', marginTop: 4 }}>
              Tap "New Group" to create one
            </p>
          </div>
        ) : (
          groups.map(group => (
            <button
              key={group._id}
              onClick={() => setSelected(group._id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.55rem 0.7rem', borderRadius: '0.6rem',
                width: '100%', textAlign: 'left', color: 'inherit',
                background: selected === group._id ? 'rgba(124,58,237,0.18)' : 'none',
                border: selected === group._id ? '1px solid rgba(124,58,237,0.24)' : '1px solid transparent',
                cursor: 'pointer', transition: 'background 0.15s', fontFamily: 'Inter,sans-serif'
              }}
              onMouseEnter={e => { if (selected !== group._id) e.currentTarget.style.background = 'rgba(124,58,237,0.08)' }}
              onMouseLeave={e => { if (selected !== group._id) e.currentTarget.style.background = 'none' }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg,#7c3aed,#9333ea)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(124,58,237,0.3)'
              }}>
                <FiUsers size={16} color="white" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: '0.85rem', fontWeight: 500, color: '#e2e8f0',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                  {group.name}
                </p>
                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.28)', marginTop: 1 }}>
                  {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}