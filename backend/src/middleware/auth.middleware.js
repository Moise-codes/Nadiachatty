import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt
    if (!token) return res.status(401).json({ message: 'Unauthorized — no token' })

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId).select('-password')
    if (!user) return res.status(401).json({ message: 'Unauthorized — user not found' })

    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ message: 'Session expired — please login again' })
    return res.status(401).json({ message: 'Unauthorized — invalid token' })
  }
}
