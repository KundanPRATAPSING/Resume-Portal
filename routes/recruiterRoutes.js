const express = require('express')
const router = express.Router()
const {
  createRecruiterDetails,
  getAllRecruiters
} = require('../controllers/recruiterController')

router.get('/', getAllRecruiters)
router.post('/', createRecruiterDetails)

module.exports = router
