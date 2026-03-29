const Data = require('../models/dataModel')
const mongoose = require('mongoose')
const { analyzeResumeBuffer } = require('./parseController')
const { uploadBuffer, deleteObject, getSignedReadUrl } = require('../utils/storage')
const CompanyApplication = require('../models/companyApplicationModel')
const Company = require('../models/companyModel')
const User = require('../models/userModel')
const bcrypt = require('bcryptjs')

// get all datas
const getDatas = async (req, res) => {
  const user_id = req.user._id

  const datas = await Data.find({user_id}).sort({createdAt: -1})
  const signed = datas.map((item) => ({
    ...item.toObject(),
    ResumeSignedUrl: getSignedReadUrl({
      folder: 'resumes',
      publicId: item.ResumePublicId,
      fileUrl: item.ResumeUrl,
      req
    })
  }))

  res.status(200).json(signed)
}


// create new data
const createData = async (req, res) => {
  const {FullName, Rollno, BatchYear, Branch, Cgpa, PhotoUrl} = req.body

  let emptyFields = []

  if(!Rollno) {
    emptyFields.push('Rollno')
  }
  if(!BatchYear) {
    emptyFields.push('BatchYear')
  }
  if(!Branch) {
    emptyFields.push('Branch')
  }
  if(!req.file) {
    emptyFields.push('ResumeFile')
  }
  if (Cgpa !== undefined && Cgpa !== '' && (Number(Cgpa) < 0 || Number(Cgpa) > 10)) {
    return res.status(400).json({ error: 'CGPA must be between 0 and 10.' })
  }
  if(emptyFields.length > 0) {
    return res.status(400).json({ error: 'Please fill in all the fields', emptyFields })
  }

  // add doc to db
  try {
    const user_id = req.user._id
    const uploaded = await uploadBuffer({
      buffer: req.file.buffer,
      folder: 'resumes',
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      req
    })
    let analysis = null
    try {
      const parsed = await analyzeResumeBuffer(req.file.buffer)
      analysis = {
        profile: parsed.profile,
        completeness: parsed.completeness,
        gapHints: parsed.gapHints
      }
    } catch (e) {
      // Keep upload resilient even if parsing fails.
      analysis = null
    }
    const data = await Data.create({
      FullName: FullName || '',
      Rollno,
      BatchYear,
      Branch,
      Cgpa: Cgpa === '' || Cgpa === undefined ? undefined : Number(Cgpa),
      PhotoUrl: PhotoUrl || '',
      ResumeUrl: uploaded.fileUrl,
      ResumeFileName: req.file.originalname,
      ResumePublicId: uploaded.publicId,
      ResumeStorageProvider: uploaded.provider,
      ResumeAnalysis: analysis,
      user_id
    })
    res.status(200).json(data)
  } catch (error) {
    res.status(400).json({error: error.message})
  }
}

// update existing data (profile + optional resume)
const updateData = async (req, res) => {
  const { id } = req.params
  const { FullName, Rollno, BatchYear, Branch, Cgpa, PhotoUrl } = req.body

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'No such data' })
  }

  try {
    const data = await Data.findById(id)
    if (!data) {
      return res.status(404).json({ error: 'No such data' })
    }

    const isOwner = String(data.user_id) === String(req.user._id)
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this profile.' })
    }

    if (Cgpa !== undefined && Cgpa !== '' && (Number(Cgpa) < 0 || Number(Cgpa) > 10)) {
      return res.status(400).json({ error: 'CGPA must be between 0 and 10.' })
    }

    if (FullName !== undefined) data.FullName = FullName
    if (Rollno !== undefined) data.Rollno = Rollno
    if (BatchYear !== undefined) data.BatchYear = Number(BatchYear)
    if (Branch !== undefined) data.Branch = Branch
    if (Cgpa !== undefined) data.Cgpa = Cgpa === '' ? undefined : Number(Cgpa)
    if (PhotoUrl !== undefined) data.PhotoUrl = PhotoUrl

    if (req.file) {
      const uploaded = await uploadBuffer({
        buffer: req.file.buffer,
        folder: 'resumes',
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        req
      })

      await deleteObject({
        folder: 'resumes',
        publicId: data.ResumePublicId,
        fileUrl: data.ResumeUrl
      })

      data.ResumeUrl = uploaded.fileUrl
      data.ResumePublicId = uploaded.publicId
      data.ResumeStorageProvider = uploaded.provider
      data.ResumeFileName = req.file.originalname

      try {
        const parsed = await analyzeResumeBuffer(req.file.buffer)
        data.ResumeAnalysis = {
          profile: parsed.profile,
          completeness: parsed.completeness,
          gapHints: parsed.gapHints
        }
      } catch (e) {
        // Keep profile updates resilient even if parser fails.
      }
    }

    const updated = await data.save()
    res.status(200).json({
      ...updated.toObject(),
      ResumeSignedUrl: getSignedReadUrl({
        folder: 'resumes',
        publicId: updated.ResumePublicId,
        fileUrl: updated.ResumeUrl,
        req
      })
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// delete a data
const deleteData = async (req, res) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({error: 'No such data'})
  }

  const data = await Data.findOneAndDelete({_id: id})

  if (!data) {
    return res.status(400).json({error: 'No such data'})
  }

  await deleteObject({
    folder: 'resumes',
    publicId: data.ResumePublicId,
    fileUrl: data.ResumeUrl
  })

  res.status(200).json(data)
}


const getallDatas = async (req, res) => {
    try {
      const page = Math.max(Number(req.query.page || 1), 1)
      const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100)
      const skip = (page - 1) * limit
      const branch = req.query.branch ? String(req.query.branch).trim() : ''
      const batchYear = req.query.batchYear ? Number(req.query.batchYear) : null
      const q = req.query.q ? String(req.query.q).trim() : ''

      const filter = {}
      if (branch) filter.Branch = branch
      if (!Number.isNaN(batchYear) && batchYear) filter.BatchYear = batchYear
      if (q) {
        filter.$or = [
          { Rollno: { $regex: q, $options: 'i' } },
          { Branch: { $regex: q, $options: 'i' } }
        ]
      }

      const [datas, total] = await Promise.all([
        Data.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Data.countDocuments(filter)
      ])

      res.status(200).json({
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        items: datas.map((item) => ({
          ...item.toObject(),
          ResumeSignedUrl: getSignedReadUrl({
            folder: 'resumes',
            publicId: item.ResumePublicId,
            fileUrl: item.ResumeUrl,
            req
          })
        }))
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch datas from the database' });
    }
  };

const getMyProfileOverview = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ error: 'Profile overview is for student accounts only.' })
    }

    const me = await Data.findOne({ user_id: String(req.user._id) })
    if (!me) {
      return res.status(200).json({
        myStats: {
          appliedCompanies: 0,
          oaCleared: 0,
          interviewCleared: 0,
          offers: 0
        },
        myBatch: null,
        myBranch: null,
        branchBatchStats: [],
        myClassStats: null
      })
    }

    const trackedBranches = [
      'Computer Science',
      'Computer Science and Artificial Intelligence',
      'Information Technology',
      'Computer Science and Business'
    ]

    const [myApps, offerApps, companies, cohort] = await Promise.all([
      CompanyApplication.find({ userId: String(req.user._id) }).select('status'),
      CompanyApplication.find({ status: 'Offer' }).select('userId companyId'),
      Company.find().select('_id companyName packageLPA'),
      Data.find({ BatchYear: me.BatchYear, Branch: { $in: trackedBranches } }).select(
        'user_id Rollno FullName Branch BatchYear'
      )
    ])

    const appliedCompanies = myApps.filter((a) => a.status && a.status !== 'Not Applied').length
    const oaCleared = myApps.filter((a) => ['OA Cleared', 'Interview', 'Offer'].includes(a.status)).length
    const interviewCleared = myApps.filter((a) => ['Interview', 'Offer'].includes(a.status)).length
    const offers = myApps.filter((a) => a.status === 'Offer').length

    const companyById = companies.reduce((acc, c) => {
      acc[String(c._id)] = c
      return acc
    }, {})
    const studentByUserId = cohort.reduce((acc, row) => {
      acc[String(row.user_id)] = row
      return acc
    }, {})

    const branchStatsMap = {}
    trackedBranches.forEach((branch) => {
      branchStatsMap[branch] = {
        branch,
        batchYear: me.BatchYear,
        totalStudents: 0,
        placedStudents: 0,
        leftStudents: 0,
        topOfferLpa: 0,
        topOfferCompany: null,
        topOfferRollNo: null,
        topOfferStudentName: null
      }
    })

    for (const row of cohort) {
      const b = row.Branch || 'Unknown'
      if (!branchStatsMap[b]) continue
      branchStatsMap[b].totalStudents += 1
    }

    const placedByBranch = {}
    const seenPlacement = new Set()
    for (const app of offerApps) {
      const student = studentByUserId[String(app.userId)]
      if (!student) continue
      const branch = student.Branch || 'Unknown'
      const key = `${branch}:${app.userId}`
      if (!seenPlacement.has(key)) {
        seenPlacement.add(key)
        placedByBranch[branch] = (placedByBranch[branch] || 0) + 1
      }
      const company = companyById[String(app.companyId)]
      const pkg = Number(company?.packageLPA || 0)
      if (branchStatsMap[branch] && pkg >= branchStatsMap[branch].topOfferLpa) {
        branchStatsMap[branch].topOfferLpa = pkg
        branchStatsMap[branch].topOfferCompany = company?.companyName || null
        branchStatsMap[branch].topOfferRollNo = student.Rollno || null
        branchStatsMap[branch].topOfferStudentName = student.FullName || null
      }
    }

    Object.keys(branchStatsMap).forEach((branch) => {
      const stat = branchStatsMap[branch]
      stat.placedStudents = placedByBranch[branch] || 0
      stat.leftStudents = Math.max(stat.totalStudents - stat.placedStudents, 0)
      stat.placementRate = stat.totalStudents > 0
        ? Number(((stat.placedStudents / stat.totalStudents) * 100).toFixed(2))
        : 0
    })

    const branchBatchStats = Object.values(branchStatsMap).sort((a, b) => a.branch.localeCompare(b.branch))
    const myClassStats = branchBatchStats.find((item) => item.branch === me.Branch) || null

    res.status(200).json({
      myStats: {
        appliedCompanies,
        oaCleared,
        interviewCleared,
        offers
      },
      myBatch: me.BatchYear,
      myBranch: me.Branch,
      branchBatchStats,
      myClassStats
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const createStudentByAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can add students.' })
    }

    const {
      FullName = '',
      email,
      password = 'Student@123',
      Rollno,
      BatchYear,
      Branch,
      Cgpa,
      PhotoUrl = '',
      ResumeUrl = '',
      ResumeFileName = ''
    } = req.body

    if (!email || !Rollno || !BatchYear || !Branch) {
      return res.status(400).json({ error: 'Email, Rollno, BatchYear and Branch are required.' })
    }
    if (Cgpa !== undefined && Cgpa !== '' && (Number(Cgpa) < 0 || Number(Cgpa) > 10)) {
      return res.status(400).json({ error: 'CGPA must be between 0 and 10.' })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: 'Student email already exists.' })
    }
    const existingRoll = await Data.findOne({ Rollno })
    if (existingRoll) {
      return res.status(400).json({ error: 'Roll number already exists.' })
    }

    const hash = await bcrypt.hash(password, 10)
    const user = await User.create({ email, password: hash, role: 'user' })
    const data = await Data.create({
      FullName,
      Rollno,
      BatchYear: Number(BatchYear),
      Branch,
      Cgpa: Cgpa === '' || Cgpa === undefined ? undefined : Number(Cgpa),
      PhotoUrl,
      ResumeUrl: ResumeUrl || `https://example.com/resumes/${String(Rollno).toUpperCase()}.pdf`,
      ResumeFileName: ResumeFileName || `${String(Rollno).toUpperCase()}_resume.pdf`,
      ResumeStorageProvider: 'seed',
      user_id: String(user._id)
    })

    res.status(200).json(data)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const updateStudentByAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can update students.' })
    }
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'No such student profile.' })
    }

    const {
      FullName,
      Rollno,
      BatchYear,
      Branch,
      Cgpa,
      PhotoUrl,
      ResumeUrl,
      ResumeFileName
    } = req.body

    const data = await Data.findById(id)
    if (!data) {
      return res.status(404).json({ error: 'No such student profile.' })
    }
    if (Cgpa !== undefined && Cgpa !== '' && (Number(Cgpa) < 0 || Number(Cgpa) > 10)) {
      return res.status(400).json({ error: 'CGPA must be between 0 and 10.' })
    }

    if (FullName !== undefined) data.FullName = FullName
    if (Rollno !== undefined) data.Rollno = Rollno
    if (BatchYear !== undefined) data.BatchYear = Number(BatchYear)
    if (Branch !== undefined) data.Branch = Branch
    if (Cgpa !== undefined) data.Cgpa = Cgpa === '' ? undefined : Number(Cgpa)
    if (PhotoUrl !== undefined) data.PhotoUrl = PhotoUrl
    if (ResumeUrl !== undefined) data.ResumeUrl = ResumeUrl
    if (ResumeFileName !== undefined) data.ResumeFileName = ResumeFileName

    const updated = await data.save()
    res.status(200).json(updated)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const upsertStudentApplicationByAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can update student applications.' })
    }
    const { rollNo, companyId, status, currentRound = '', notes = '' } = req.body
    if (!rollNo || !companyId || !status) {
      return res.status(400).json({ error: 'rollNo, companyId, and status are required.' })
    }
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(404).json({ error: 'No such company.' })
    }
    const company = await Company.findById(companyId)
    if (!company) return res.status(404).json({ error: 'No such company.' })

    const student = await Data.findOne({ Rollno: { $regex: `^${String(rollNo).trim()}$`, $options: 'i' } })
    if (!student) {
      return res.status(404).json({ error: 'Student not found for roll number.' })
    }

    let application = await CompanyApplication.findOne({
      companyId: String(company._id),
      userId: String(student.user_id)
    })
    if (!application) {
      application = new CompanyApplication({
        companyId: String(company._id),
        userId: String(student.user_id),
        status: 'Not Applied'
      })
    }

    application.status = status
    application.currentRound = currentRound
    application.notes = notes
    application.statusHistory.push({
      status,
      currentRound,
      notes,
      updatedAt: new Date()
    })
    await application.save()

    res.status(200).json(application)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const getAdminRealtimeOverview = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can view realtime overview.' })
    }

    const [students, companies, applications] = await Promise.all([
      Data.countDocuments(),
      Company.find().select('shortlistedRollNos'),
      CompanyApplication.find().select('status')
    ])
    const offers = applications.filter((a) => a.status === 'Offer').length
    const oaCleared = applications.filter((a) => ['OA Cleared', 'Interview', 'Offer'].includes(a.status)).length
    const interviews = applications.filter((a) => ['Interview', 'Offer'].includes(a.status)).length
    const shortlists = companies.reduce((sum, c) => sum + ((c.shortlistedRollNos || []).length), 0)

    res.status(200).json({
      students,
      companies: companies.length,
      applications: applications.length,
      shortlists,
      offers,
      oaCleared,
      interviews
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}


module.exports = {
  getDatas,
  createData,
  updateData,
  deleteData,
  getallDatas,
  getMyProfileOverview,
  createStudentByAdmin,
  updateStudentByAdmin,
  upsertStudentApplicationByAdmin,
  getAdminRealtimeOverview
}