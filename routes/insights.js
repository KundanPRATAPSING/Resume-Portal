const express = require('express')
const requireAuth = require('../middleware/requireAuth')
const { getPlacementInsights } = require('../controllers/insightsController')

const router = express.Router()

router.use(requireAuth)
router.get('/placement', getPlacementInsights)

module.exports = router
