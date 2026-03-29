const express = require('express')
const requireAuth = require('../middleware/requireAuth')
const { getOffers, createOffer, compareOffers } = require('../controllers/offerController')

const router = express.Router()

router.use(requireAuth)
router.get('/', getOffers)
router.post('/', createOffer)
router.post('/compare', compareOffers)

module.exports = router
