const multer = require('multer')
const fileFilter = (req, file, cb) => {
  if (file.mimetype !== 'application/pdf') {
    return cb(new Error('Only PDF files are allowed'))
  }
  cb(null, true)
}

const uploadResume = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
})

module.exports = uploadResume
