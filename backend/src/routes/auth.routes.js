import express from 'express'
import { signup, login, logout, checkAuth, forgotPassword, resetPassword, updateProfile } from '../controllers/auth.controller.js'
import { protectRoute } from '../middleware/auth.middleware.js'

const router = express.Router()

router.post('/signup',                     signup)
router.post('/login',                      login)
router.post('/logout',                     logout)
router.get( '/check',      protectRoute,   checkAuth)
router.post('/forgot-password',            forgotPassword)
router.post('/reset-password/:token',      resetPassword)
router.put( '/update-profile', protectRoute, updateProfile)

export default router
