const express = require('express')
const requireAuth = require('../middleware/requireAuth')
const { getTodayOverview } = require('../controllers/todayController')

const router = express.Router()

router.use(requireAuth)
router.get('/overview', getTodayOverview)

module.exports = router
