import mongoose from 'mongoose'

let isConnected = false

const connectDB = async () => {
  if (isConnected) return
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI)
    isConnected = true
    console.log(`✅ MongoDB connected: ${conn.connection.host}`)
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message)
    process.exit(1)
  }
}

export default connectDB
