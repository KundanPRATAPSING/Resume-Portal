const Document = require('../models/documentModel')
const { uploadBuffer, deleteObject, getSignedReadUrl } = require('../utils/storage')

const getDocuments = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1)
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100)
    const skip = (page - 1) * limit
    const docType = req.query.docType ? String(req.query.docType).trim() : ''

    const filter = {}
    if (docType) filter.docType = docType

    if (req.user.role === 'admin') {
      const [docs, total] = await Promise.all([
        Document.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Document.countDocuments(filter)
      ])
      return res.status(200).json({
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        items: docs.map((doc) => ({
          ...doc.toObject(),
          signedUrl: getSignedReadUrl({
            folder: 'documents',
            publicId: doc.filePublicId,
            fileUrl: doc.fileUrl,
            req
          })
        }))
      })
    }

    filter.userId = req.user._id
    const [docs, total] = await Promise.all([
      Document.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Document.countDocuments(filter)
    ])
    res.status(200).json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      items: docs.map((doc) => ({
        ...doc.toObject(),
        signedUrl: getSignedReadUrl({
          folder: 'documents',
          publicId: doc.filePublicId,
          fileUrl: doc.fileUrl,
          req
        })
      }))
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Document file is required.' })
    }
    const { docType, visibility } = req.body
    if (!docType) {
      return res.status(400).json({ error: 'docType is required.' })
    }

    const latest = await Document.findOne({ userId: req.user._id, docType }).sort({ version: -1 })
    const nextVersion = latest ? latest.version + 1 : 1
    const uploaded = await uploadBuffer({
      buffer: req.file.buffer,
      folder: 'documents',
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      req
    })

    const created = await Document.create({
      userId: req.user._id,
      docType,
      version: nextVersion,
      fileUrl: uploaded.fileUrl,
      filePublicId: uploaded.publicId,
      storageProvider: uploaded.provider,
      fileName: req.file.originalname,
      visibility: visibility || 'Admin'
    })
    res.status(200).json(created)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params
    const doc = await Document.findById(id)
    if (!doc) return res.status(404).json({ error: 'No such document.' })

    if (req.user.role !== 'admin' && doc.userId !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not allowed.' })
    }

    await Document.findByIdAndDelete(id)
    await deleteObject({
      folder: 'documents',
      publicId: doc.filePublicId,
      fileUrl: doc.fileUrl
    })
    res.status(200).json(doc)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

module.exports = {
  getDocuments,
  uploadDocument,
  deleteDocument
}
