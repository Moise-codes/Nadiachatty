import 'dotenv/config'
import express from 'express'
import http from 'http'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'

import connectDB from './config/db.js'
import { initSocket } from './socket/socket.js'
import authRoutes from './routes/auth.routes.js'
import messageRoutes from './routes/message.routes.js'

const app    = express()
const server = http.createServer(app)

// ── Init Socket.io ───────────────────────────────────────────────
initSocket(server)

// ── Middleware ───────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods:     ['GET','POST','PUT','DELETE','PATCH'],
  allowedHeaders: ['Content-Type','Authorization']
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
}

// ── Rate Limiting ────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 20,
  message: { message: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
})
app.use('/api/auth/login',           authLimiter)
app.use('/api/auth/signup',          authLimiter)
app.use('/api/auth/forgot-password', authLimiter)

// ── Routes ───────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes)
app.use('/api/messages', messageRoutes)

// ── Health Check ─────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status:'ok', time: new Date().toISOString() })
})

// ── 404 ──────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

// ── Global Error Handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err)
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  })
})

// ── Start ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
    console.log(`📡 Socket.io ready`)
    console.log(`🌐 Frontend: ${process.env.CLIENT_URL}`)
  })
})
