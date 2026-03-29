const express = require('express')
const requireAuth = require('../middleware/requireAuth')
const { getPolicy, updatePolicy } = require('../controllers/policyController')

const router = express.Router()

router.use(requireAuth)
router.get('/', getPolicy)
router.put('/', updatePolicy)

module.exports = router
