const mongoose = require('mongoose')

const recruiterSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    recruiterName: { type: String, required: true },
    roles: { type: String, required: true },
    ctc: { type: String, required: true },
    intake: { type: Number, required: true },
    skills: { type: String, required: true },
    location: { type: String, required: true },
    deadline: { type: Date, required: true },
    email: { type: String }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Recruiter', recruiterSchema)
