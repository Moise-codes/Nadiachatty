import express from 'express'
import { getUsersForSidebar, getMessages, sendMessage, deleteMessage, reactToMessage } from '../controllers/message.controller.js'
import { protectRoute } from '../middleware/auth.middleware.js'

const router = express.Router()

router.get(  '/users',              protectRoute, getUsersForSidebar)
router.get(  '/:userId',            protectRoute, getMessages)
router.post( '/send/:userId',       protectRoute, sendMessage)
router.delete('/:messageId',        protectRoute, deleteMessage)
router.post( '/:messageId/react',   protectRoute, reactToMessage)

export default router
