const express = require('express')
const requireAuth = require('../middleware/requireAuth')
const uploadResume = require('../middleware/uploadResume')
const {
  atsCheckFromStoredResume,
  atsCheckFromUploadedResume,
  atsFixSuggestions
} = require('../controllers/aiAssistantController')

const router = express.Router()

router.use(requireAuth)
router.post('/ats-check', atsCheckFromStoredResume)
router.post('/ats-fix-suggestions', atsFixSuggestions)
router.post('/ats-check-upload', (req, res, next) => {
  uploadResume.single('resume')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message })
    }
    next()
  })
}, atsCheckFromUploadedResume)

module.exports = router
