const mongoose = require('mongoose')

const Schema = mongoose.Schema

const companyApplicationSchema = new Schema(
  {
    companyId: {
      type: String,
      required: true
    },
    userId: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['Not Applied', 'Applied', 'OA Cleared', 'Interview', 'Offer', 'Rejected'],
      default: 'Not Applied'
    },
    currentRound: {
      type: String,
      default: ''
    },
    notes: {
      type: String,
      default: ''
    },
    statusHistory: {
      type: [
        {
          status: String,
          currentRound: String,
          notes: String,
          updatedAt: Date
        }
      ],
      default: []
    }
  },
  { timestamps: true }
)

companyApplicationSchema.index({ companyId: 1, userId: 1 }, { unique: true })
companyApplicationSchema.index({ companyId: 1, status: 1 })
companyApplicationSchema.index({ userId: 1, updatedAt: -1 })

module.exports = mongoose.model('CompanyApplication', companyApplicationSchema)
