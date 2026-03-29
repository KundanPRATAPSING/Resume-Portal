const mongoose = require('mongoose')

const Schema = mongoose.Schema

const offerSchema = new Schema(
  {
    userId: { type: String, required: true },
    companyName: { type: String, required: true },
    roleType: { type: String, enum: ['SDE', 'Analyst', 'Product', 'Data', 'Core', 'Other'], default: 'Other' },
    location: { type: String, required: true },
    baseSalaryLPA: { type: Number, default: 0 },
    joiningBonusLPA: { type: Number, default: 0 },
    variablePayLPA: { type: Number, default: 0 },
    stockLPA: { type: Number, default: 0 },
    perksLPA: { type: Number, default: 0 },
    growthScore: { type: Number, min: 1, max: 10, default: 5 },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
)

offerSchema.index({ userId: 1, createdAt: -1 })
offerSchema.index({ companyName: 1 })

module.exports = mongoose.model('Offer', offerSchema)
