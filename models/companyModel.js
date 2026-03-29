const mongoose = require('mongoose')

const Schema = mongoose.Schema

const companySchema = new Schema(
  {
    companyName: {
      type: String,
      required: true
    },
    roleOffered: {
      type: String,
      required: true
    },
    packageLPA: {
      type: Number,
      required: true
    },
    location: {
      type: String,
      required: true
    },
    hiringType: {
      type: String,
      enum: ['Placement', 'Internship', 'Internship + PPO'],
      default: 'Placement'
    },
    driveDate: {
      type: Date,
      required: true
    },
    applicationDeadline: {
      type: Date
    },
    eligibility: {
      type: String
    },
    minCgpa: {
      type: Number
    },
    eligibleBranches: {
      type: [String],
      default: []
    },
    eligibleBatchYears: {
      type: [Number],
      default: []
    },
    requiredSkills: {
      type: [String],
      default: []
    },
    autoEligibleRollNos: {
      type: [String],
      default: []
    },
    openings: {
      type: Number
    },
    rounds: {
      type: [String],
      default: []
    },
    description: {
      type: String
    },
    shortlistedRollNos: {
      type: [String],
      default: []
    },
    createdBy: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
)

companySchema.index({ driveDate: -1 })
companySchema.index({ companyName: 1 })
companySchema.index({ packageLPA: -1 })
companySchema.index({ hiringType: 1 })

module.exports = mongoose.model('Company', companySchema)
