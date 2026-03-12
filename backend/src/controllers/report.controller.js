import Report from '../models/Report.js'

export const submitReport = async (req, res) => {
  try {
    const { reportedUserId, reason } = req.body
    if (!reportedUserId || !reason)
      return res.status(400).json({ message: 'Reported user and reason are required' })

    const report = await Report.create({
      reportedBy: req.user._id,
      reportedUser: reportedUserId,
      reason,
    })

    res.status(201).json({ message: 'Report submitted successfully', report })
  } catch (err) {
    console.error('Report error:', err)
    res.status(500).json({ message: 'Failed to submit report' })
  }
}