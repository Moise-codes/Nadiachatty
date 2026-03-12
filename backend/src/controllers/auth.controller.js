import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import User from '../models/User.js'
import { sendWelcomeEmail, sendPasswordResetEmail } from '../services/email.service.js'
import cloudinary from '../config/cloudinary.js'

const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  })
  res.cookie('jwt', token, {
    maxAge:   7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'strict',
    secure:   process.env.NODE_ENV === 'production'
  })
  return token
}

// ── SIGNUP ──────────────────────────────────────────────────────
export const signup = async (req, res) => {
  const { fullName, email, password } = req.body
  try {
    if (!fullName || !email || !password)
      return res.status(400).json({ message: 'All fields are required' })

    if (password.length < 8)
      return res.status(400).json({ message: 'Password must be at least 8 characters' })

    const exists = await User.findOne({ email: email.toLowerCase() })
    if (exists) return res.status(409).json({ message: 'Email already registered' })

    const user = await User.create({ fullName, email, password })

    generateToken(user._id, res)

    // Send welcome email (non-blocking)
    sendWelcomeEmail({ to: user.email, fullName: user.fullName }).catch(console.error)

    res.status(201).json(user.toSafeObject())
  } catch (err) {
    console.error('Signup error:', err)
    res.status(500).json({ message: 'Server error during signup' })
  }
}

// ── LOGIN ───────────────────────────────────────────────────────
export const login = async (req, res) => {
  const { email, password } = req.body
  try {
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' })

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) return res.status(401).json({ message: 'Invalid credentials' })

    const isMatch = await user.comparePassword(password)
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' })

    generateToken(user._id, res)
    res.json(user.toSafeObject())
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ message: 'Server error during login' })
  }
}

// ── LOGOUT ──────────────────────────────────────────────────────
export const logout = (req, res) => {
  res.clearCookie('jwt')
  res.json({ message: 'Logged out successfully' })
}

// ── CHECK AUTH ──────────────────────────────────────────────────
export const checkAuth = (req, res) => {
  res.json(req.user.toSafeObject())
}

// ── FORGOT PASSWORD ─────────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  const { email } = req.body
  try {
    if (!email) return res.status(400).json({ message: 'Email is required' })

    const user = await User.findOne({ email: email.toLowerCase() })
    // Always return 200 to prevent email enumeration
    if (!user) return res.json({ message: 'If that email exists, a reset link was sent' })

    const token = crypto.randomBytes(32).toString('hex')
    user.resetPasswordToken   = crypto.createHash('sha256').update(token).digest('hex')
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000 // 1 hour
    await user.save({ validateModifiedOnly: true })

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`
    await sendPasswordResetEmail({ to: user.email, fullName: user.fullName, resetUrl })

    res.json({ message: 'Reset link sent to your email' })
  } catch (err) {
    console.error('Forgot password error:', err)
    res.status(500).json({ message: 'Failed to send reset email' })
  }
}

// ── RESET PASSWORD ──────────────────────────────────────────────
export const resetPassword = async (req, res) => {
  const { token } = req.params
  const { password } = req.body
  try {
    if (!password || password.length < 8)
      return res.status(400).json({ message: 'Password must be at least 8 characters' })

    const hashed = crypto.createHash('sha256').update(token).digest('hex')
    const user = await User.findOne({
      resetPasswordToken:   hashed,
      resetPasswordExpires: { $gt: Date.now() }
    })

    if (!user) return res.status(400).json({ message: 'Reset link is invalid or has expired' })

    user.password             = password
    user.resetPasswordToken   = undefined
    user.resetPasswordExpires = undefined
    await user.save({ validateModifiedOnly: true })

    res.json({ message: 'Password reset successfully. Please login.' })
  } catch (err) {
    console.error('Reset password error:', err)
    res.status(500).json({ message: 'Server error during password reset' })
  }
}

// ── UPDATE PROFILE ──────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  const { profilePic, bio, fullName } = req.body
  try {
    const user = await User.findById(req.user._id)

    if (profilePic) {
      if (user.profilePic) {
        // Extract public_id and delete old image
        const oldPublicId = user.profilePic.split('/').slice(-1)[0].split('.')[0]
        await cloudinary.uploader.destroy(`nadiachatty/${oldPublicId}`).catch(() => {})
      }
      const uploaded = await cloudinary.uploader.upload(profilePic, {
        folder: 'nadiachatty', transformation: [{ width:400, height:400, crop:'fill' }]
      })
      user.profilePic = uploaded.secure_url
    }

    if (bio      !== undefined) user.bio      = bio
    if (fullName !== undefined) user.fullName = fullName

    await user.save({ validateModifiedOnly: true })
    res.json(user.toSafeObject())
  } catch (err) {
    console.error('Update profile error:', err)
    res.status(500).json({ message: 'Failed to update profile' })
  }
}