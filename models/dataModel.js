const mongoose = require('mongoose')

const Schema = mongoose.Schema

const dataSchema = new Schema({
  FullName: {
    type: String
  },
  Rollno: {
    type: String,
    required: true
  },
  Branch: {
    type: String,
    required: true
  },
  BatchYear: {
    type: Number,
    required: true
  },
  Cgpa: {
    type: Number
  },
  ResumeUrl:{
    type: String,
    required: true
  },
  ResumeFileName: {
    type: String
  },
  ResumePublicId: {
    type: String
  },
  ResumeStorageProvider: {
    type: String,
    default: 'local'
  },
  ResumeLink:{
    type: String
  },
  PhotoUrl: {
    type: String
  },
  ResumeAnalysis: {
    profile: {
      contact: {
        email: String,
        phone: String
      },
      skills: [String],
      education: [String],
      experience: [String],
      projects: [String],
      summary: [String]
    },
    completeness: {
      score: Number,
      missing: [String]
    },
    gapHints: [String]
  },
  user_id: {
    type: String,
    required: true
  }
}, { timestamps: true })

dataSchema.index({ user_id: 1 })
dataSchema.index({ Rollno: 1 })
dataSchema.index({ Branch: 1, BatchYear: 1 })

module.exports = mongoose.model('Data', dataSchema)