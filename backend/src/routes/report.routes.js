import express from 'express'
import { submitReport } from '../controllers/report.controller.js'
import { protectRoute } from '../middleware/auth.middleware.js'

const router = express.Router()

router.post('/', protectRoute, submitReport)

export default router