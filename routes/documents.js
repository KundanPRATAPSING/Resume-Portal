const express = require('express')
const requireAuth = require('../middleware/requireAuth')
const uploadDocument = require('../middleware/uploadDocument')
const { getDocuments, uploadDocument: createDoc, deleteDocument } = require('../controllers/documentController')

const router = express.Router()

router.use(requireAuth)

router.get('/', getDocuments)
router.post('/', (req, res, next) => {
  uploadDocument.single('document')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message })
    next()
  })
}, createDoc)
router.delete('/:id', deleteDocument)

module.exports = router
