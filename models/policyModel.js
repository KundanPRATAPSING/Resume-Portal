const mongoose = require('mongoose')

const Schema = mongoose.Schema

const policySchema = new Schema(
  {
    dreamOfferLockoutEnabled: { type: Boolean, default: false },
    dreamMinPackageLPA: { type: Number, default: 25 },
    maxActiveApplicationsEnabled: { type: Boolean, default: false },
    maxActiveApplications: { type: Number, default: 8 },
    updatedBy: { type: String }
  },
  { timestamps: true }
)

policySchema.index({ updatedAt: -1 })

module.exports = mongoose.model('Policy', policySchema)
