const multer = require('multer')
const allowed = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg'
])

const uploadDocument = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (!allowed.has(file.mimetype)) {
      return cb(new Error('Only PDF/JPG/PNG documents are allowed'))
    }
    cb(null, true)
  },
  limits: {
    fileSize: 10 * 1024 * 1024
  }
})

module.exports = uploadDocument
