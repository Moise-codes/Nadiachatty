import mongoose from 'mongoose'

const reactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  emoji:  { type: String, required: true }
}, { _id: false })

const messageSchema = new mongoose.Schema({
  senderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:       { type: String, default: '' },
  image:      { type: String, default: '' },
  reactions:  { type: [reactionSchema], default: [] },
  replyTo:    { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  isRead:     { type: Boolean, default: false },
  isDeleted:  { type: Boolean, default: false },
}, { timestamps: true })

const Message = mongoose.model('Message', messageSchema)
export default Message
