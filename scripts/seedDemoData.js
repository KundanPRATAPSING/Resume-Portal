require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const { MONGO_URI } = require('../config/keys')

const User = require('../models/userModel')
const Data = require('../models/dataModel')
const Company = require('../models/companyModel')
const CompanyApplication = require('../models/companyApplicationModel')
const Notification = require('../models/notifModel')
const InterviewSlot = require('../models/interviewSlotModel')

const BRANCHES = [
  'Computer Science',
  'Information Technology',
  'Computer Science and Business',
  'Computer Science and Artificial Intelligence'
]

const SKILL_POOL = ['javascript', 'react', 'node', 'mongodb', 'sql', 'python', 'java', 'docker', 'aws', 'git']
const FORCED_BRANCH_BY_ROLL = {
  LCS2021048: 'Computer Science'
}
const rng = (() => {
  let seed = 1234567
  return () => {
    seed = (seed * 48271) % 0x7fffffff
    return seed / 0x7fffffff
  }
})()

const pick = (arr) => arr[Math.floor(rng() * arr.length)]
const pickMany = (arr, count) => [...arr].sort(() => rng() - 0.5).slice(0, count)
const pickWeighted = (options) => {
  const total = options.reduce((sum, item) => sum + item.weight, 0)
  const v = rng() * total
  let run = 0
  for (const item of options) {
    run += item.weight
    if (v <= run) return item.value
  }
  return options[options.length - 1].value
}

const addDays = (date, days) => {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

const BASE_COMPANIES = [
  'Google', 'Amazon', 'Microsoft', 'Adobe', 'Flipkart', 'Zomato', 'Atlassian', 'Paytm',
  'Goldman Sachs', 'Walmart Global Tech', 'Morgan Stanley', 'Sprinklr', 'Juspay',
  'CRED', 'Oracle', 'SAP Labs', 'Samsung', 'Nvidia', 'Uber', 'Swiggy'
]
const ROLE_POOL = [
  'SDE-1', 'Backend Engineer', 'Software Engineer', 'Product Engineer',
  'SWE Intern + PPO', 'Data Engineer', 'Analyst Developer'
]
const LOCATION_POOL = ['Bengaluru', 'Hyderabad', 'Noida', 'Gurugram', 'Pune', 'Remote']
const MONTH_CYCLE = [
  { year: 2025, month: 6, count: 6 }, // Jul
  { year: 2025, month: 7, count: 7 }, // Aug
  { year: 2025, month: 8, count: 5 }, // Sep
  { year: 2025, month: 9, count: 6 }, // Oct
  { year: 2025, month: 10, count: 7 }, // Nov
  { year: 2025, month: 11, count: 4 }, // Dec
  { year: 2026, month: 0, count: 6 }, // Jan
  { year: 2026, month: 1, count: 5 }, // Feb
  { year: 2026, month: 2, count: 7 } // Mar
]

const seed = async () => {
  const mongoUri = process.env.MONGO_URI || MONGO_URI
  if (!mongoUri) throw new Error('MONGO_URI missing')
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 })

  const adminEmail = 'lcs2021048@iiitl.ac.in'
  const adminPassword = 'abcd#123'
  let admin = await User.findOne({ email: adminEmail })
  if (!admin) {
    const hash = await bcrypt.hash(adminPassword, 10)
    admin = await User.create({ email: adminEmail, password: hash, role: 'admin' })
  }

  const studentUsers = []
  const studentData = []
  for (let i = 1; i <= 120; i += 1) {
    const roll = `LCS20${String(1000 + i)}`
    const email = `${roll.toLowerCase()}@iiitl.ac.in`
    let user = await User.findOne({ email })
    if (!user) {
      const hash = await bcrypt.hash('Student@123', 10)
      user = await User.create({ email, password: hash, role: 'user' })
    }
    studentUsers.push(user)

    const branch = FORCED_BRANCH_BY_ROLL[roll] || pick(BRANCHES)
    const batchYear = i % 2 === 0 ? 2021 : 2022
    const cgpa = Number((7 + rng() * 3).toFixed(2))
    const skills = pickMany(SKILL_POOL, 4 + Math.floor(rng() * 4))
    const fullName = `Student ${String(i).padStart(3, '0')}`
    const photoUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${roll}`
    const existingData = await Data.findOne({ user_id: user._id })
    if (!existingData) {
      const created = await Data.create({
        FullName: fullName,
        Rollno: roll,
        Branch: branch,
        BatchYear: batchYear,
        Cgpa: cgpa,
        PhotoUrl: photoUrl,
        ResumeUrl: `https://example.com/resumes/${roll}.pdf`,
        ResumeFileName: `${roll}_resume.pdf`,
        ResumeStorageProvider: 'seed',
        ResumeAnalysis: {
          profile: {
            contact: { email, phone: '9999999999' },
            skills,
            education: ['B.Tech - IIIT Lucknow'],
            experience: ['Summer Internship'],
            projects: ['Placement Analytics Dashboard'],
            summary: ['Consistent performer with strong DSA and MERN skills']
          },
          completeness: { score: 90, missing: [] },
          gapHints: []
        },
        user_id: String(user._id)
      })
      studentData.push(created)
    } else {
      existingData.FullName = existingData.FullName || fullName
      existingData.PhotoUrl = existingData.PhotoUrl || photoUrl
      existingData.Branch = branch
      existingData.BatchYear = batchYear
      existingData.Cgpa = cgpa
      await existingData.save()
      studentData.push(existingData)
    }
  }

  // Reset and regenerate companies in deterministic way
  await CompanyApplication.deleteMany({})
  await InterviewSlot.deleteMany({})
  await Company.deleteMany({})
  await Notification.deleteMany({})

  const today = new Date()
  const companies = []
  let sequence = 1
  for (const cycle of MONTH_CYCLE) {
    for (let i = 0; i < cycle.count; i += 1) {
      const companyName = `${pick(BASE_COMPANIES)} ${sequence}`
      const roleOffered = pick(ROLE_POOL)
      const packageLPA = Number((16 + rng() * 35).toFixed(2))
      const driveDay = 3 + Math.floor(rng() * 24)
      const driveDate = new Date(cycle.year, cycle.month, driveDay, 10 + (i % 4), 0, 0)
      const appDeadline = addDays(driveDate, -2)
      const rounds = rng() > 0.25 ? ['OA', 'Round 1', 'Round 2', 'HR'] : ['OA', 'Round 1', 'HR']
      const shortlist = pickMany(studentData, 18 + Math.floor(rng() * 18)).map((s) => s.Rollno)

      const company = await Company.create({
        companyName,
        roleOffered,
        packageLPA,
        location: pick(LOCATION_POOL),
        hiringType: rng() > 0.35 ? 'Placement' : 'Internship + PPO',
        driveDate,
        applicationDeadline: appDeadline,
        eligibility: 'CS/IT/CSB with DSA + OOP fundamentals',
        minCgpa: Number((6.8 + rng() * 1.6).toFixed(2)),
        eligibleBranches: ['Computer Science', 'Information Technology', 'Computer Science and Business'],
        eligibleBatchYears: [2021, 2022],
        requiredSkills: pickMany(SKILL_POOL, 3),
        autoEligibleRollNos: shortlist.slice(0, 20),
        openings: 6 + Math.floor(rng() * 12),
        rounds,
        description: `${companyName} campus hiring process`,
        shortlistedRollNos: shortlist,
        createdBy: String(admin._id)
      })
      companies.push(company)
      sequence += 1
    }
  }

  // Make sure at least 3 drives are exactly "today" for Today page.
  const marchCompanies = companies.filter(
    (c) => c.driveDate.getFullYear() === today.getFullYear() && c.driveDate.getMonth() === today.getMonth()
  )
  for (const c of marchCompanies.slice(0, 3)) {
    c.driveDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10 + Math.floor(rng() * 5), 0, 0)
    c.applicationDeadline = addDays(c.driveDate, -2)
    await c.save()
  }

  const allApplications = []
  for (const company of companies) {
    const participants = pickMany(studentData, 52 + Math.floor(rng() * 28))
    for (const student of participants) {
      const status = pickWeighted([
        { value: 'Applied', weight: 30 },
        { value: 'OA Cleared', weight: 22 },
        { value: 'Interview', weight: 20 },
        { value: 'Offer', weight: 12 },
        { value: 'Rejected', weight: 16 }
      ])
      const rounds = company.rounds || []
      const round = status === 'Applied'
        ? 'OA'
        : status === 'OA Cleared'
          ? 'Round 1'
          : status === 'Interview'
            ? 'Round 2'
            : status === 'Offer'
              ? 'HR'
              : pick(['OA', 'Round 1', 'Round 2'])

      allApplications.push({
        companyId: String(company._id),
        userId: String(student.user_id),
        status,
        currentRound: round,
        notes: status === 'Offer' ? 'Final offer released' : '',
        statusHistory: [
          { status: 'Applied', currentRound: rounds[0] || '', notes: '', updatedAt: addDays(today, -10) },
          { status, currentRound: round, notes: '', updatedAt: addDays(today, -1) }
        ]
      })
    }
  }
  await CompanyApplication.insertMany(allApplications)

  const todayCompanies = companies
    .filter((c) => c.driveDate.toDateString() === today.toDateString())
    .slice(0, 4)
  for (const c of todayCompanies) {
    for (let s = 0; s < 3; s += 1) {
      await InterviewSlot.create({
        companyId: String(c._id),
        title: `${c.companyName} Round ${s + 1}`,
        slotStart: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10 + s * 2, 0, 0),
        slotEnd: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11 + s * 2, 0, 0),
        location: s % 2 === 0 ? 'Online' : 'Placement Cell',
        capacity: 10,
        bookedUsers: pickMany(studentUsers, 6 + s).map((u) => String(u._id)),
        createdBy: String(admin._id)
      })
    }
  }

  await Notification.insertMany([
    { title: 'Google OA Today', description: 'Google OA starts at 10:00 AM. Be ready with webcam enabled.', targetRoles: ['user'] },
    { title: 'Amazon Interview Schedule', description: 'Interview panel and room mapping uploaded on portal.', targetRoles: ['user'] },
    { title: 'Resume Freeze', description: 'All resumes frozen for today’s drives at 9:00 AM.', targetRoles: ['user'] },
    { title: 'Admin Ops Note', description: 'Please verify attendance and shortlist publishing before 6 PM.', targetRoles: ['admin'] }
  ])

  console.log('Seed complete:')
  console.log('- Admin login:', adminEmail, '/', adminPassword)
  console.log('- Student login:', 'lcs201001@iiitl.ac.in', '/', 'Student@123')
  console.log('- Students:', studentData.length)
  console.log('- Companies:', companies.length)
  await mongoose.disconnect()
}

seed().catch(async (err) => {
  console.error(err)
  await mongoose.disconnect()
  process.exit(1)
})
