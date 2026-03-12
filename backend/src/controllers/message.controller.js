import Message from '../models/Message.js'
import User from '../models/User.js'
import cloudinary from '../config/cloudinary.js'
import { getReceiverSocketId } from '../socket/socket.js'
import { getIO } from '../socket/socket.js'

// ── GET USERS FOR SIDEBAR ───────────────────────────────────────
export const getUsersForSidebar = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } }).select('-password')
    res.json(users)
  } catch (err) {
    console.error('Get users error:', err)
    res.status(500).json({ message: 'Failed to get users' })
  }
}

// ── GET MESSAGES ────────────────────────────────────────────────
export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params
    const myId = req.user._id

    const messages = await Message.find({
      $or: [
        { senderId: myId,   receiverId: userId },
        { senderId: userId, receiverId: myId   }
      ],
      isDeleted: false
    }).sort({ createdAt: 1 })

    // Mark messages as read
    await Message.updateMany(
      { senderId: userId, receiverId: myId, isRead: false },
      { isRead: true }
    )

    res.json(messages)
  } catch (err) {
    console.error('Get messages error:', err)
    res.status(500).json({ message: 'Failed to get messages' })
  }
}

// ── SEND MESSAGE ────────────────────────────────────────────────
export const sendMessage = async (req, res) => {
  try {
    const { text, image, audio, replyTo } = req.body
    const { userId: receiverId } = req.params
    const senderId = req.user._id

    if (!text && !image && !audio) return res.status(400).json({ message: 'Message cannot be empty' })

    let imageUrl = ''
    if (image) {
      const uploaded = await cloudinary.uploader.upload(image, {
        folder: 'nadiachatty/messages',
        transformation: [{ width: 800, quality: 'auto' }]
      })
      imageUrl = uploaded.secure_url
    }

    let audioUrl = ''
    if (audio) {
      const uploaded = await cloudinary.uploader.upload(audio, {
        folder: 'nadiachatty/audio',
        resource_type: 'video'
      })
      audioUrl = uploaded.secure_url
    }

    const message = await Message.create({
      senderId, receiverId,
      text: text || '',
      image: imageUrl,
      audio: audioUrl,
      replyTo: replyTo || null
    })

    // Emit to receiver via Socket.io
    const io = getIO()
    const receiverSocketId = getReceiverSocketId(receiverId.toString())
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('newMessage', message)
    }

    res.status(201).json(message)
  } catch (err) {
    console.error('Send message error:', err)
    res.status(500).json({ message: 'Failed to send message' })
  }
}

// ── DELETE MESSAGE ──────────────────────────────────────────────
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params
    const message = await Message.findById(messageId)

    if (!message) return res.status(404).json({ message: 'Message not found' })
    if (message.senderId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized to delete this message' })

    message.isDeleted = true
    await message.save()

    // Emit deletion
    const io = getIO()
    const receiverSocketId = getReceiverSocketId(message.receiverId.toString())
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('messageDeleted', { messageId })
    }

    res.json({ message: 'Deleted' })
  } catch (err) {
    console.error('Delete message error:', err)
    res.status(500).json({ message: 'Failed to delete message' })
  }
}

// ── ADD / TOGGLE REACTION ───────────────────────────────────────
export const reactToMessage = async (req, res) => {
  try {
    const { messageId } = req.params
    const { emoji } = req.body
    const userId = req.user._id

    if (!emoji) return res.status(400).json({ message: 'Emoji is required' })

    const message = await Message.findById(messageId)
    if (!message) return res.status(404).json({ message: 'Message not found' })

    const existingIdx = message.reactions.findIndex(
      r => r.userId.toString() === userId.toString() && r.emoji === emoji
    )

    if (existingIdx !== -1) {
      // Toggle off
      message.reactions.splice(existingIdx, 1)
    } else {
      // Remove any existing reaction from this user, then add new
      message.reactions = message.reactions.filter(r => r.userId.toString() !== userId.toString())
      message.reactions.push({ userId, emoji })
    }

    await message.save()

    // Emit reaction update
    const io = getIO()
    const receiverSocketId = getReceiverSocketId(message.receiverId.toString())
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('messageReaction', message)
    }
    const senderSocketId = getReceiverSocketId(message.senderId.toString())
    if (senderSocketId) {
      io.to(senderSocketId).emit('messageReaction', message)
    }

    res.json(message)
  } catch (err) {
    console.error('React error:', err)
    res.status(500).json({ message: 'Failed to add reaction' })
  }
}