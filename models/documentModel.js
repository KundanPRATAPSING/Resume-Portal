const mongoose = require('mongoose')

const Schema = mongoose.Schema

const documentSchema = new Schema(
  {
    userId: { type: String, required: true },
    docType: {
      type: String,
      enum: ['Resume', 'SOP', 'Marksheet', 'Offer Letter', 'Other'],
      required: true
    },
    version: { type: Number, default: 1 },
    fileUrl: { type: String, required: true },
    filePublicId: { type: String },
    storageProvider: { type: String, default: 'local' },
    fileName: { type: String, required: true },
    visibility: { type: String, enum: ['Private', 'Admin'], default: 'Admin' }
  },
  { timestamps: true }
)

documentSchema.index({ userId: 1, docType: 1, version: -1 })
documentSchema.index({ createdAt: -1 })

module.exports = mongoose.model('Document', documentSchema)
