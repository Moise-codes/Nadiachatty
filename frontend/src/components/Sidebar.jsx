import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiSettings, FiLogOut, FiUsers } from 'react-icons/fi'
import { HiOutlineUserGroup } from 'react-icons/hi'
import { useChatStore } from '../store/useChatStore'
import { useAuthStore } from '../store/useAuthStore'
import { getAvatarUrl } from '../lib/utils'
import NadiaLogo from './NadiaLogo'
import GroupList from './GroupList'

export default function Sidebar() {
  const { users, getUsers, selectedUser, setSelectedUser, isUsersLoading } = useChatStore()
  const { authUser, logout, onlineUsers } = useAuthStore()
  const navigate = useNavigate()
  const [search,     setSearch]     = useState('')
  const [onlineOnly, setOnlineOnly] = useState(false)
  const [tab,        setTab]        = useState('chats')

  useEffect(() => { getUsers() }, [getUsers])

  const filtered = users.filter(u => {
    const matchName   = u.fullName.toLowerCase().includes(search.toLowerCase())
    const matchOnline = onlineOnly ? onlineUsers.includes(u._id) : true
    return matchName && matchOnline
  })

  // On mobile: slide sidebar off-screen when a chat is selected
  const sidebarClass = `sidebar${selectedUser ? ' hidden-mobile' : ''}`

  return (
    <div className={sidebarClass}>

      {/* ── Header ── */}
      <div className="sidebar-header">
        <div style={{ marginBottom: '0.625rem' }}>
          <NadiaLogo size="sm" />
        </div>
        <input
          className="sidebar-search"
          type="text"
          placeholder="Search here..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginTop:'0.45rem' }}>
          <button
            onClick={() => setOnlineOnly(!onlineOnly)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              fontSize: '0.72rem', padding: '0.2rem 0.6rem',
              borderRadius: '999px', cursor: 'pointer', transition: 'all 0.15s',
              background: onlineOnly ? 'rgba(124,58,237,0.2)' : 'transparent',
              border:     onlineOnly ? '1px solid rgba(124,58,237,0.35)' : '1px solid rgba(255,255,255,0.08)',
              color:      onlineOnly ? '#c084fc' : 'rgba(255,255,255,0.3)',
              fontFamily: 'Inter,sans-serif'
            }}
          >
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e', display:'inline-block' }} />
            Online only
          </button>
          <span style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.2)' }}>
            {Math.max(0, onlineUsers.length - 1)} online
          </span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="sidebar-tabs">
        <button
          className={`sidebar-tab ${tab === 'chats' ? 'active' : 'inactive'}`}
          onClick={() => setTab('chats')}
        >
          <FiUsers size={11} /> Chats
        </button>
        <button
          className={`sidebar-tab ${tab === 'groups' ? 'active' : 'inactive'}`}
          onClick={() => setTab('groups')}
        >
          <HiOutlineUserGroup size={12} /> Groups
        </button>
      </div>

      {/* ── Groups Tab ── */}
      {tab === 'groups' && <GroupList />}

      {/* ── Chats Tab ── */}
      {tab === 'chats' && (
        <div className="sidebar-users">
          {isUsersLoading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.625rem', padding:'0.6rem 0.75rem', marginBottom:2 }}>
                <div className="skeleton" style={{ width:38, height:38, borderRadius:'50%', flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div className="skeleton" style={{ height:11, width:'70%', marginBottom:5 }} />
                  <div className="skeleton" style={{ height:9,  width:'45%' }} />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <p style={{ textAlign:'center', color:'rgba(255,255,255,0.2)', fontSize:'0.8rem', padding:'2rem 0' }}>
              {users.length === 0 ? 'No users yet' : 'No results'}
            </p>
          ) : (
            filtered.map(user => {
              const isOnline = onlineUsers.includes(user._id)
              const isActive = selectedUser?._id === user._id
              return (
                <button
                  key={user._id}
                  className={`user-item ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div style={{ position:'relative', flexShrink:0 }}>
                    <div className="user-avatar">
                      <img src={getAvatarUrl(user.fullName, user.profilePic)} alt={user.fullName} />
                    </div>
                    {isOnline && <span className="online-dot" />}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:'0.85rem', fontWeight:500, color:'#e2e8f0', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {user.fullName}
                    </p>
                    <p style={{ fontSize:'0.72rem', marginTop:1, color: isOnline ? '#22c55e' : 'rgba(255,255,255,0.28)' }}>
                      {isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      )}

      {/* ── Footer ── */}
      <div className="sidebar-footer">
        <button
          onClick={() => navigate('/profile')}
          style={{ display:'flex', alignItems:'center', gap:'0.5rem', flex:1, minWidth:0, background:'none', border:'none', cursor:'pointer', padding:0 }}
        >
          <div className="user-avatar" style={{ width:32, height:32, minWidth:32, minHeight:32 }}>
            <img src={getAvatarUrl(authUser?.fullName, authUser?.profilePic)} alt="me" />
          </div>
          <div style={{ flex:1, minWidth:0, textAlign:'left' }}>
            <p style={{ fontSize:'0.78rem', fontWeight:600, color:'#e2e8f0', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {authUser?.fullName}
            </p>
            <p style={{ fontSize:'0.7rem', color:'#22c55e' }}>Active</p>
          </div>
        </button>
        <button className="icon-btn" onClick={() => navigate('/profile')} title="Profile">
          <FiSettings size={14} />
        </button>
        <button
          className="icon-btn" onClick={logout} title="Logout"
          onMouseEnter={e => { e.currentTarget.style.color='#f87171'; e.currentTarget.style.background='rgba(239,68,68,0.1)' }}
          onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,0.38)'; e.currentTarget.style.background='none' }}
        >
          <FiLogOut size={14} />
        </button>
      </div>
    </div>
  )
}