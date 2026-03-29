const express = require('express')
const requireAuth = require('../middleware/requireAuth')
const {
  getCompanies,
  createCompany,
  updateShortlist,
  deleteCompany,
  getCompanyAnalytics,
  previewEligibility
} = require('../controllers/companyController')

const router = express.Router()

router.use(requireAuth)

router.get('/', getCompanies)
router.post('/', createCompany)
router.get('/:id/analytics', getCompanyAnalytics)
router.get('/:id/eligibility', previewEligibility)
router.patch('/:id/shortlist', updateShortlist)
router.delete('/:id', deleteCompany)

module.exports = router
