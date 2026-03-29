const express = require('express')
const {
  createData,
  updateData,
  getDatas,
  deleteData,
  getallDatas,
  getMyProfileOverview,
  createStudentByAdmin,
  updateStudentByAdmin,
  upsertStudentApplicationByAdmin,
  getAdminRealtimeOverview
} = require('../controllers/dataController')
const { parseResume } = require('../controllers/parseController')
const requireAuth = require('../middleware/requireAuth')
const uploadResume = require('../middleware/uploadResume')

const router = express.Router()

// require auth for all datas routes
router.use(requireAuth)

// GET all datas
router.get('/', getDatas)


// GET ALL THE DATAS FOR ADMIN
router.get('/admin', getallDatas)
router.get('/profile/overview', getMyProfileOverview)
router.get('/admin/realtime-overview', getAdminRealtimeOverview)
router.post('/admin/create-student', createStudentByAdmin)
router.put('/admin/:id', updateStudentByAdmin)
router.post('/admin/student-application', upsertStudentApplicationByAdmin)

// POST parse-only endpoint (no persistence) for resume analysis
router.post('/parse', (req, res, next) => {
  uploadResume.single('resume')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message })
    }
    next()
  })
}, parseResume)

// POST a new data
router.post('/', (req, res, next) => {
  uploadResume.single('ResumeFile')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message })
    }
    next()
  })
}, createData)

// UPDATE existing profile data/resume
router.put('/:id', (req, res, next) => {
  uploadResume.single('ResumeFile')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message })
    }
    next()
  })
}, updateData)

// DELETE a data
router.delete('/:id', deleteData)




module.exports = router