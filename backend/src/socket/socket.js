import { Server } from 'socket.io'

let io = null
const userSocketMap = {}  // { userId: socketId }

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin:      process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true
    }
  })

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId

    if (userId && userId !== 'undefined') {
      userSocketMap[userId] = socket.id
      console.log(`🟢 Connected: ${userId} → socket ${socket.id}`)
    }

    // Broadcast updated online users to everyone
    io.emit('getOnlineUsers', Object.keys(userSocketMap))

    // ── Typing indicator ──────────────────────────────────────
    socket.on('typing', ({ receiverId, isTyping }) => {
      const receiverSocketId = userSocketMap[receiverId]
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing', { senderId: userId, isTyping })
      }
    })

    // ── CALL: Caller → Receiver ───────────────────────────────
    socket.on('callUser', ({ receiverId, offer, callType, callerName, callerPic }) => {
      const receiverSocketId = userSocketMap[receiverId]

      if (receiverSocketId) {
        io.to(receiverSocketId).emit('incomingCall', {
          callerId:       userId,
          callerName:     callerName || 'Unknown',
          callerPic:      callerPic  || '',
          callerSocketId: socket.id,   // ← caller's socketId so receiver can answer back
          offer,
          callType
        })
        console.log(`📞 Call from ${userId} → ${receiverId}`)
      } else {
        // Receiver offline — tell caller immediately
        socket.emit('callRejected', { reason: 'offline' })
        console.log(`📵 ${receiverId} is offline, rejecting call`)
      }
    })

    // ── CALL: Receiver answers → send receiverSocketId back to caller ──
    socket.on('answerCall', ({ callerSocketId, answer }) => {
      io.to(callerSocketId).emit('callAnswered', {
        answer,
        receiverSocketId: socket.id   // ← critical: caller needs this for ICE candidates
      })
      console.log(`✅ Call answered, receiver socket: ${socket.id}`)
    })

    // ── ICE Candidates (both directions) ─────────────────────
    socket.on('iceCandidate', ({ targetSocketId, candidate }) => {
      if (targetSocketId && candidate) {
        io.to(targetSocketId).emit('iceCandidate', { candidate })
      }
    })

    // ── Reject call ───────────────────────────────────────────
    socket.on('rejectCall', ({ callerSocketId }) => {
      if (callerSocketId) {
        io.to(callerSocketId).emit('callRejected')
        console.log(`❌ Call rejected by ${userId}`)
      }
    })

    // ── End call (either side) ────────────────────────────────
    socket.on('endCall', ({ targetSocketId }) => {
      if (targetSocketId) {
        io.to(targetSocketId).emit('callEnded')
        console.log(`📴 Call ended by ${userId}`)
      }
    })

    // ── Disconnect ────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      if (userId) {
        delete userSocketMap[userId]
        console.log(`🔴 Disconnected: ${userId} (${reason})`)
      }
      io.emit('getOnlineUsers', Object.keys(userSocketMap))
    })
  })

  return io
}

export const getIO               = () => io
export const getReceiverSocketId = (receiverId) => userSocketMap[receiverId]