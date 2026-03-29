const express = require('express')
const requireAuth = require('../middleware/requireAuth')
const { getSlots, createSlot, bookSlot, unbookSlot } = require('../controllers/interviewSlotController')

const router = express.Router()

router.use(requireAuth)

router.get('/company/:companyId', getSlots)
router.post('/company/:companyId', createSlot)
router.post('/:slotId/book', bookSlot)
router.post('/:slotId/unbook', unbookSlot)

module.exports = router
