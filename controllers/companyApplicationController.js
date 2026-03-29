const mongoose = require('mongoose')
const Company = require('../models/companyModel')
const CompanyApplication = require('../models/companyApplicationModel')
const { clearByPrefix } = require('../utils/cache')
const Policy = require('../models/policyModel')

const getMyApplications = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(200).json([])
    }

    const applications = await CompanyApplication.find({ userId: req.user._id }).sort({ updatedAt: -1 })
    res.status(200).json(applications)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const upsertMyApplication = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ error: 'Admin cannot set student application status.' })
    }

    const { companyId } = req.params
    const { status, currentRound = '', notes = '' } = req.body

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(404).json({ error: 'No such company.' })
    }

    const companyExists = await Company.findById(companyId)
    if (!companyExists) {
      return res.status(404).json({ error: 'No such company.' })
    }

    const policy = await Policy.findOne().sort({ createdAt: -1 })
    const applyingStatuses = new Set(['Applied', 'OA Cleared', 'Interview'])
    const nextStatus = status || 'Not Applied'

    if (policy?.dreamOfferLockoutEnabled && applyingStatuses.has(nextStatus)) {
      const allMyApplications = await CompanyApplication.find({ userId: req.user._id, status: 'Offer' }).select('companyId')
      if (allMyApplications.length > 0) {
        const offerCompanyIds = allMyApplications.map((x) => x.companyId)
        const companies = await Company.find({ _id: { $in: offerCompanyIds } }).select('packageLPA')
        const hasDreamOffer = companies.some((c) => Number(c.packageLPA || 0) >= Number(policy.dreamMinPackageLPA || 25))
        if (hasDreamOffer && nextStatus !== 'Not Applied') {
          return res.status(400).json({
            error: `Policy block: dream offer lockout active (threshold ${policy.dreamMinPackageLPA} LPA).`
          })
        }
      }
    }

    if (policy?.maxActiveApplicationsEnabled && applyingStatuses.has(nextStatus)) {
      const activeCount = await CompanyApplication.countDocuments({
        userId: req.user._id,
        status: { $in: Array.from(applyingStatuses) },
        companyId: { $ne: companyId }
      })
      if (activeCount >= Number(policy.maxActiveApplications || 8)) {
        return res.status(400).json({
          error: `Policy block: max active applications reached (${policy.maxActiveApplications}).`
        })
      }
    }

    let application = await CompanyApplication.findOne({ companyId, userId: req.user._id })
    if (!application) {
      application = new CompanyApplication({ companyId, userId: req.user._id })
    }

    const nextStatusFinal = status || application.status || 'Not Applied'
    const nextRound = currentRound || ''
    const nextNotes = notes || ''

    const last = application.statusHistory?.[application.statusHistory.length - 1]
    const changed =
      !last ||
      last.status !== nextStatusFinal ||
      (last.currentRound || '') !== nextRound ||
      (last.notes || '') !== nextNotes

    application.status = nextStatusFinal
    application.currentRound = nextRound
    application.notes = nextNotes
    if (changed) {
      application.statusHistory.push({
        status: nextStatusFinal,
        currentRound: nextRound,
        notes: nextNotes,
        updatedAt: new Date()
      })
    }
    await application.save()
    clearByPrefix('company_analytics:')
    clearByPrefix('insights:placement')

    res.status(200).json(application)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

module.exports = {
  getMyApplications,
  upsertMyApplication
}
