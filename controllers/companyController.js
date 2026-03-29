const mongoose = require('mongoose')
const Company = require('../models/companyModel')
const Data = require('../models/dataModel')
const CompanyApplication = require('../models/companyApplicationModel')
const { getCache, setCache, clearByPrefix } = require('../utils/cache')

const normalizeRollNos = (rollNos = []) => {
  if (!Array.isArray(rollNos)) return []
  const cleaned = rollNos
    .map((roll) => String(roll || '').trim().toUpperCase())
    .filter(Boolean)
  return [...new Set(cleaned)]
}

const normalizeRounds = (rounds = []) => {
  if (!Array.isArray(rounds)) return []
  const cleaned = rounds.map((round) => String(round || '').trim()).filter(Boolean)
  return [...new Set(cleaned)]
}

const normalizeSkills = (skills = []) => {
  if (!Array.isArray(skills)) return []
  const cleaned = skills.map((skill) => String(skill || '').trim().toLowerCase()).filter(Boolean)
  return [...new Set(cleaned)]
}

const normalizeBranches = (branches = []) => {
  if (!Array.isArray(branches)) return []
  const cleaned = branches.map((branch) => String(branch || '').trim()).filter(Boolean)
  return [...new Set(cleaned)]
}

const normalizeNumberArray = (arr = []) => {
  if (!Array.isArray(arr)) return []
  return [...new Set(arr.map((x) => Number(x)).filter((x) => !Number.isNaN(x)))]
}

const groupCount = (arr = []) =>
  arr.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1
    return acc
  }, {})

const computeEligibleStudents = (students, company) => {
  const minCgpa = company.minCgpa
  const eligibleBranches = normalizeBranches(company.eligibleBranches || [])
  const eligibleBatchYears = normalizeNumberArray(company.eligibleBatchYears || [])
  const requiredSkills = normalizeSkills(company.requiredSkills || [])

  const eligible = students.filter((student) => {
    const cgpaMatch =
      minCgpa === undefined || minCgpa === null || minCgpa === '' || Number(student.Cgpa || 0) >= Number(minCgpa)
    const branchMatch = eligibleBranches.length === 0 || eligibleBranches.includes(student.Branch)
    const batchMatch = eligibleBatchYears.length === 0 || eligibleBatchYears.includes(Number(student.BatchYear))
    const studentSkills = normalizeSkills(student.ResumeAnalysis?.profile?.skills || [])
    const skillsMatch = requiredSkills.length === 0 || requiredSkills.every((skill) => studentSkills.includes(skill))
    return cgpaMatch && branchMatch && batchMatch && skillsMatch
  })

  return eligible
}

const getCompanies = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1)
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100)
    const skip = (page - 1) * limit
    const search = String(req.query.search || '').trim()
    const hiringType = String(req.query.hiringType || '').trim()
    const minPackage = req.query.minPackage !== undefined ? Number(req.query.minPackage) : null
    const sortBy = String(req.query.sortBy || 'createdAt')
    const sortDir = String(req.query.sortDir || 'desc').toLowerCase() === 'asc' ? 1 : -1

    const filter = {}
    if (search) {
      filter.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { roleOffered: { $regex: search, $options: 'i' } }
      ]
    }
    if (hiringType) filter.hiringType = hiringType
    if (!Number.isNaN(minPackage) && minPackage !== null) filter.packageLPA = { $gte: minPackage }

    const sortMap = {
      createdAt: { createdAt: sortDir },
      driveDate: { driveDate: sortDir },
      packageLPA: { packageLPA: sortDir }
    }
    const sort = sortMap[sortBy] || sortMap.createdAt

    const [companies, total] = await Promise.all([
      Company.find(filter).sort(sort).skip(skip).limit(limit),
      Company.countDocuments(filter)
    ])
    const companyIds = companies.map((company) => String(company._id))
    const applicationAgg = await CompanyApplication.aggregate([
      { $match: { companyId: { $in: companyIds } } },
      {
        $group: {
          _id: '$companyId',
          totalApplications: { $sum: 1 },
          offerCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Offer'] }, 1, 0] }
          }
        }
      }
    ])
    const applicationMap = applicationAgg.reduce((acc, item) => {
      acc[item._id] = {
        totalApplications: item.totalApplications,
        offerCount: item.offerCount
      }
      return acc
    }, {})

    if (req.user.role === 'admin') {
      return res.status(200).json({
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        items: companies.map((company) => ({
          ...company.toObject(),
          totalApplications: applicationMap[String(company._id)]?.totalApplications || 0,
          offerCount: applicationMap[String(company._id)]?.offerCount || 0
        }))
      })
    }

    const studentData = await Data.findOne({ user_id: req.user._id }).select('Rollno')
    const currentRoll = studentData?.Rollno ? String(studentData.Rollno).trim().toUpperCase() : null

    const withStatus = companies.map((company) => {
      const shortlistedRollNos = normalizeRollNos(company.shortlistedRollNos)
      return {
        ...company.toObject(),
        shortlistedRollNos,
        isShortlisted: Boolean(currentRoll && shortlistedRollNos.includes(currentRoll)),
        currentUserRollNo: currentRoll || null,
        totalApplications: applicationMap[String(company._id)]?.totalApplications || 0,
        offerCount: applicationMap[String(company._id)]?.offerCount || 0
      }
    })

    res.status(200).json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      items: withStatus
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const createCompany = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can create companies.' })
    }

    const {
      companyName,
      roleOffered,
      packageLPA,
      location,
      hiringType,
      driveDate,
      applicationDeadline,
      eligibility,
      minCgpa,
      eligibleBranches,
      eligibleBatchYears,
      requiredSkills,
      openings,
      description
    } = req.body
    const shortlistedRollNos = normalizeRollNos(req.body.shortlistedRollNos || [])
    const rounds = normalizeRounds(req.body.rounds || [])
    const eligibleBranchesList = normalizeBranches(eligibleBranches || [])
    const eligibleBatchYearsList = normalizeNumberArray(eligibleBatchYears || [])
    const requiredSkillsList = normalizeSkills(requiredSkills || [])

    const emptyFields = []
    if (!companyName) emptyFields.push('companyName')
    if (!roleOffered) emptyFields.push('roleOffered')
    if (!packageLPA && packageLPA !== 0) emptyFields.push('packageLPA')
    if (!location) emptyFields.push('location')
    if (!driveDate) emptyFields.push('driveDate')

    if (emptyFields.length > 0) {
      return res.status(400).json({ error: 'Please fill all required fields.', emptyFields })
    }

    const allStudents = await Data.find().select('Rollno Branch BatchYear Cgpa ResumeAnalysis')
    const eligible = computeEligibleStudents(allStudents, {
      minCgpa: minCgpa === '' || minCgpa === undefined ? undefined : Number(minCgpa),
      eligibleBranches: eligibleBranchesList,
      eligibleBatchYears: eligibleBatchYearsList,
      requiredSkills: requiredSkillsList
    })
    const autoEligibleRollNos = normalizeRollNos(eligible.map((s) => s.Rollno))

    const company = await Company.create({
      companyName,
      roleOffered,
      packageLPA: Number(packageLPA),
      location,
      hiringType,
      driveDate,
      applicationDeadline,
      eligibility,
      minCgpa: minCgpa === '' || minCgpa === undefined ? undefined : Number(minCgpa),
      eligibleBranches: eligibleBranchesList,
      eligibleBatchYears: eligibleBatchYearsList,
      requiredSkills: requiredSkillsList,
      autoEligibleRollNos,
      openings: openings === '' || openings === undefined ? undefined : Number(openings),
      rounds,
      description,
      shortlistedRollNos,
      createdBy: req.user._id
    })

    clearByPrefix('company_analytics:')
    clearByPrefix('insights:placement')
    res.status(200).json(company)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const updateShortlist = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can update shortlist.' })
    }

    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'No such company.' })
    }

    const shortlistedRollNos = normalizeRollNos(req.body.shortlistedRollNos || [])
    const updated = await Company.findByIdAndUpdate(
      id,
      { shortlistedRollNos },
      { new: true }
    )

    if (!updated) {
      return res.status(404).json({ error: 'No such company.' })
    }

    clearByPrefix('company_analytics:')
    res.status(200).json(updated)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const deleteCompany = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can delete companies.' })
    }

    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'No such company.' })
    }

    const company = await Company.findByIdAndDelete(id)
    if (!company) {
      return res.status(404).json({ error: 'No such company.' })
    }

    clearByPrefix('company_analytics:')
    clearByPrefix('insights:placement')
    res.status(200).json(company)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const previewEligibility = async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'No such company.' })
    }

    const company = await Company.findById(id)
    if (!company) {
      return res.status(404).json({ error: 'No such company.' })
    }

    const students = await Data.find().select('Rollno Branch BatchYear Cgpa ResumeAnalysis ResumeUrl')
    const eligibleStudents = computeEligibleStudents(students, company)
    const autoEligibleRollNos = normalizeRollNos(eligibleStudents.map((s) => s.Rollno))

    await Company.findByIdAndUpdate(id, { autoEligibleRollNos })
    clearByPrefix('company_analytics:')

    res.status(200).json({
      companyId: id,
      criteria: {
        minCgpa: company.minCgpa,
        eligibleBranches: company.eligibleBranches || [],
        eligibleBatchYears: company.eligibleBatchYears || [],
        requiredSkills: company.requiredSkills || []
      },
      eligibleCount: eligibleStudents.length,
      eligibleStudents
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const getCompanyAnalytics = async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: 'No such company.' })
    }

    const cacheKey = `company_analytics:${id}`
    const cached = getCache(cacheKey)
    if (cached) {
      return res.status(200).json({ ...cached, cache: 'hit' })
    }

    const company = await Company.findById(id)
    if (!company) {
      return res.status(404).json({ error: 'No such company.' })
    }

    const shortlistedRollNos = normalizeRollNos(company.shortlistedRollNos)
    const shortlistedProfiles = await Data.find({
      Rollno: { $in: shortlistedRollNos }
    }).select('Rollno Branch BatchYear ResumeUrl ResumeFileName createdAt')

    const allStudents = await Data.countDocuments()
    const applications = await CompanyApplication.find({ companyId: String(company._id) })
    const applicationStatusBreakdown = groupCount(applications.map((item) => item.status || 'Unknown'))
    const topRounds = groupCount(applications.map((item) => item.currentRound || 'Not Set'))
    const normalizedRound = (label = '') => String(label || '').toLowerCase()
    const roundProgress = {
      formsFilled: applications.filter((a) => (a.status || 'Not Applied') !== 'Not Applied').length,
      oaCleared: applications.filter(
        (a) => a.status === 'OA Cleared' || a.status === 'Interview' || a.status === 'Offer'
      ).length,
      round1Cleared: applications.filter((a) => {
        const r = normalizedRound(a.currentRound)
        return r.includes('round 1') || r.includes('technical 1') || r.includes('coding interview')
      }).length,
      round2Cleared: applications.filter((a) => {
        const r = normalizedRound(a.currentRound)
        return r.includes('round 2') || r.includes('technical 2') || r.includes('design')
      }).length,
      finalOffers: applications.filter((a) => a.status === 'Offer').length
    }
    const offerApplications = applications.filter((item) => item.status === 'Offer')
    const offerUserIds = [...new Set(offerApplications.map((item) => String(item.userId)))]
    const offerProfiles = await Data.find({ user_id: { $in: offerUserIds } }).select(
      'FullName PhotoUrl Rollno Branch BatchYear Cgpa ResumeUrl ResumeFileName user_id'
    )
    const offerProfileByUserId = offerProfiles.reduce((acc, row) => {
      acc[String(row.user_id)] = row
      return acc
    }, {})
    const offeredProfiles = offerApplications.map((offerApp) => {
      const profile = offerProfileByUserId[String(offerApp.userId)]
      return {
        userId: String(offerApp.userId),
        statusUpdatedAt: offerApp.updatedAt,
        currentRound: offerApp.currentRound || '',
        fullName: profile?.FullName || '',
        photoUrl: profile?.PhotoUrl || '',
        rollNo: profile?.Rollno || '',
        branch: profile?.Branch || '',
        batchYear: profile?.BatchYear,
        cgpa: profile?.Cgpa,
        resumeUrl: profile?.ResumeUrl || '',
        resumeFileName: profile?.ResumeFileName || ''
      }
    })
    const profiledRollSet = new Set(
      shortlistedProfiles.map((student) => String(student.Rollno || '').trim().toUpperCase())
    )
    const missingRollNos = shortlistedRollNos.filter((roll) => !profiledRollSet.has(roll))
    const branchBreakdown = groupCount(shortlistedProfiles.map((student) => student.Branch || 'Unknown'))
    const batchBreakdown = groupCount(
      shortlistedProfiles.map((student) =>
        student.BatchYear === undefined || student.BatchYear === null
          ? 'Unknown'
          : String(student.BatchYear)
      )
    )

    const shortlistRate = allStudents > 0
      ? Number(((shortlistedProfiles.length / allStudents) * 100).toFixed(2))
      : 0

    const payload = {
      company,
      totalStudentsInPortal: allStudents,
      shortlistedCount: shortlistedRollNos.length,
      profileMatchedCount: shortlistedProfiles.length,
      missingRollNos,
      shortlistRate,
      totalApplications: applications.length,
      applicationStatusBreakdown,
      topRounds,
      roundProgress,
      offeredProfiles,
      branchBreakdown,
      batchBreakdown,
      shortlistedProfiles
    }
    setCache(cacheKey, payload, 60 * 1000)
    res.status(200).json({ ...payload, cache: 'miss' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

module.exports = {
  getCompanies,
  createCompany,
  updateShortlist,
  deleteCompany,
  getCompanyAnalytics,
  previewEligibility
}
