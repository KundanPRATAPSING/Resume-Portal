const express = require('express')
const path = require('path')
const fs = require('fs')
const requireAuth = require('../middleware/requireAuth')
const { verifySignature } = require('../utils/storage')

const router = express.Router()

router.use(requireAuth)

router.get('/signed', (req, res) => {
  const { folder, file, exp, sig } = req.query
  if (!verifySignature({ folder, file, exp, sig })) {
    return res.status(401).json({ error: 'Invalid or expired signed URL.' })
  }

  if (!['resumes', 'documents'].includes(String(folder))) {
    return res.status(400).json({ error: 'Unsupported folder.' })
  }
  const filePath = path.join(__dirname, '..', 'uploads', String(folder), String(file))
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found.' })
  }
  return res.sendFile(filePath)
})

module.exports = router
