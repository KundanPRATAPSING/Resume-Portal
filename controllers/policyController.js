const Policy = require('../models/policyModel')

const ensurePolicy = async () => {
  let policy = await Policy.findOne().sort({ createdAt: -1 })
  if (!policy) {
    policy = await Policy.create({
      dreamOfferLockoutEnabled: false,
      dreamMinPackageLPA: 25,
      maxActiveApplicationsEnabled: false,
      maxActiveApplications: 8
    })
  }
  return policy
}

const getPolicy = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can view policy.' })
    }
    const policy = await ensurePolicy()
    res.status(200).json(policy)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const updatePolicy = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can update policy.' })
    }
    const policy = await ensurePolicy()
    const updates = {
      dreamOfferLockoutEnabled: Boolean(req.body.dreamOfferLockoutEnabled),
      dreamMinPackageLPA: Number(req.body.dreamMinPackageLPA || 25),
      maxActiveApplicationsEnabled: Boolean(req.body.maxActiveApplicationsEnabled),
      maxActiveApplications: Number(req.body.maxActiveApplications || 8),
      updatedBy: req.user._id
    }
    const updated = await Policy.findByIdAndUpdate(policy._id, updates, { new: true })
    res.status(200).json(updated)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

module.exports = {
  getPolicy,
  updatePolicy,
  ensurePolicy
}
