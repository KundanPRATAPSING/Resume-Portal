const mongoose = require('mongoose')

const Schema = mongoose.Schema

const interviewSlotSchema = new Schema(
  {
    companyId: { type: String, required: true },
    title: { type: String, required: true },
    slotStart: { type: Date, required: true },
    slotEnd: { type: Date, required: true },
    location: { type: String, default: 'Virtual' },
    capacity: { type: Number, default: 1 },
    bookedUsers: { type: [String], default: [] },
    createdBy: { type: String, required: true }
  },
  { timestamps: true }
)

interviewSlotSchema.index({ companyId: 1, slotStart: 1 })
interviewSlotSchema.index({ slotStart: 1, slotEnd: 1 })

module.exports = mongoose.model('InterviewSlot', interviewSlotSchema)
