const Company = require('../models/companyModel')
const CompanyApplication = require('../models/companyApplicationModel')
const InterviewSlot = require('../models/interviewSlotModel')

const byStatus = (apps = []) =>
  apps.reduce((acc, item) => {
    const key = item.status || 'Unknown'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

const getRoundIndex = (rounds = [], currentRound = '') => {
  const idx = rounds.findIndex((r) => String(r).toLowerCase() === String(currentRound || '').toLowerCase())
  return idx
}

const getTodayOverview = async (req, res) => {
  try {
    const now = new Date()
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    const end = new Date(now)
    end.setHours(23, 59, 59, 999)

    const [todayCompanies, todaySlots] = await Promise.all([
      Company.find({ driveDate: { $gte: start, $lte: end } }).sort({ driveDate: 1 }),
      InterviewSlot.find({ slotStart: { $gte: start, $lte: end } }).sort({ slotStart: 1 })
    ])

    const companyIds = [...new Set([
      ...todayCompanies.map((c) => String(c._id)),
      ...todaySlots.map((s) => String(s.companyId))
    ])]

    const [companies, applications] = await Promise.all([
      Company.find({ _id: { $in: companyIds } }),
      CompanyApplication.find({ companyId: { $in: companyIds } })
    ])

    const slotsByCompany = todaySlots.reduce((acc, slot) => {
      const key = String(slot.companyId)
      if (!acc[key]) acc[key] = []
      acc[key].push(slot)
      return acc
    }, {})

    const appsByCompany = applications.reduce((acc, app) => {
      const key = String(app.companyId)
      if (!acc[key]) acc[key] = []
      acc[key].push(app)
      return acc
    }, {})

    const overview = companies.map((company) => {
      const id = String(company._id)
      const rounds = Array.isArray(company.rounds) ? company.rounds : []
      const apps = appsByCompany[id] || []
      const slots = slotsByCompany[id] || []

      let maxRoundIndex = -1
      for (const app of apps) {
        const idx = getRoundIndex(rounds, app.currentRound)
        if (idx > maxRoundIndex) maxRoundIndex = idx
      }
      const stagesCompleted = rounds.length === 0 ? 0 : Math.max(0, maxRoundIndex + 1)
      const stagesRemaining = Math.max(rounds.length - stagesCompleted, 0)

      const myApp = req.user.role === 'admin'
        ? null
        : apps.find((app) => String(app.userId) === String(req.user._id))

      return {
        companyId: id,
        companyName: company.companyName,
        roleOffered: company.roleOffered,
        location: company.location,
        driveDate: company.driveDate,
        rounds,
        stagesCompleted,
        stagesRemaining,
        statusBreakdown: byStatus(apps),
        totalApplications: apps.length,
        slotsToday: slots.map((slot) => ({
          title: slot.title,
          slotStart: slot.slotStart,
          slotEnd: slot.slotEnd,
          location: slot.location,
          filled: slot.bookedUsers?.length || 0,
          capacity: slot.capacity
        })),
        myStatus: myApp
          ? {
              status: myApp.status,
              currentRound: myApp.currentRound,
              notes: myApp.notes
            }
          : null
      }
    }).sort((a, b) => new Date(a.driveDate) - new Date(b.driveDate))

    res.status(200).json({
      date: now.toISOString(),
      totalCompaniesToday: overview.length,
      items: overview
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

module.exports = { getTodayOverview }
