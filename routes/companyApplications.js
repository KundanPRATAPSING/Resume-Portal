const express = require('express')
const requireAuth = require('../middleware/requireAuth')
const { getMyApplications, upsertMyApplication } = require('../controllers/companyApplicationController')

const router = express.Router()

router.use(requireAuth)
router.get('/mine', getMyApplications)
router.post('/:companyId', upsertMyApplication)

module.exports = router
