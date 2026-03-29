const Data = require('../models/dataModel')
const Company = require('../models/companyModel')
const CompanyApplication = require('../models/companyApplicationModel')
const { getCache, setCache } = require('../utils/cache')

const getPlacementInsights = async (req, res) => {
  try {
    const cacheKey = 'insights:placement'
    const cached = getCache(cacheKey)
    if (cached) {
      return res.status(200).json({ ...cached, cache: 'hit' })
    }

    const [students, companies, applications] = await Promise.all([
      Data.find().select('Branch BatchYear user_id'),
      Company.find().select('companyName packageLPA createdAt'),
      CompanyApplication.find().select('status companyId userId')
    ])

    const totalCompanies = companies.length
    const totalStudents = students.length
    const totalApplications = applications.length
    const offers = applications.filter((a) => a.status === 'Offer')
    const offerCount = offers.length
    const conversionRate = totalApplications ? Number(((offerCount / totalApplications) * 100).toFixed(2)) : 0

    const branchOfferMap = {}
    // Branch-wise offers based on applications with offer status and company linkage.
    // Since application stores userId, we infer branch through Data's user_id-like relation by querying all user mappings.
    // Fall back to overall branch distribution when direct relation is not available.
    const branchDistribution = students.reduce((acc, s) => {
      acc[s.Branch || 'Unknown'] = (acc[s.Branch || 'Unknown'] || 0) + 1
      return acc
    }, {})
    Object.keys(branchDistribution).forEach((b) => {
      branchOfferMap[b] = 0
    })

    const userProfileMap = students.reduce((acc, row) => {
      acc[String(row.user_id)] = {
        branch: row.Branch || 'Unknown',
        batchYear: row.BatchYear === undefined || row.BatchYear === null ? 'Unknown' : String(row.BatchYear)
      }
      return acc
    }, {})
    offers.forEach((offer) => {
      const branch = userProfileMap[String(offer.userId)]?.branch || 'Unknown'
      branchOfferMap[branch] = (branchOfferMap[branch] || 0) + 1
    })

    const batchWiseOffers = {}
    const batchBranchMatrix = {}
    offers.forEach((offer) => {
      const profile = userProfileMap[String(offer.userId)] || { branch: 'Unknown', batchYear: 'Unknown' }
      batchWiseOffers[profile.batchYear] = (batchWiseOffers[profile.batchYear] || 0) + 1
      if (!batchBranchMatrix[profile.batchYear]) batchBranchMatrix[profile.batchYear] = {}
      batchBranchMatrix[profile.batchYear][profile.branch] =
        (batchBranchMatrix[profile.batchYear][profile.branch] || 0) + 1
    })

    const packageTrendByMonth = companies.reduce((acc, c) => {
      const month = new Date(c.createdAt).toLocaleString(undefined, { month: 'short', year: 'numeric' })
      if (!acc[month]) acc[month] = { total: 0, count: 0 }
      acc[month].total += Number(c.packageLPA || 0)
      acc[month].count += 1
      return acc
    }, {})

    const packageTrend = Object.entries(packageTrendByMonth).map(([month, obj]) => ({
      month,
      avgPackage: Number((obj.total / obj.count).toFixed(2))
    }))

    const topRecruiters = Object.values(
      companies.reduce((acc, c) => {
        const key = c.companyName
        if (!acc[key]) acc[key] = { companyName: key, drives: 0, maxPackage: 0 }
        acc[key].drives += 1
        acc[key].maxPackage = Math.max(acc[key].maxPackage, Number(c.packageLPA || 0))
        return acc
      }, {})
    )
      .sort((a, b) => b.maxPackage - a.maxPackage)
      .slice(0, 8)

    const avgPackage = companies.length
      ? Number((companies.reduce((sum, c) => sum + Number(c.packageLPA || 0), 0) / companies.length).toFixed(2))
      : 0
    const highestPackage = companies.length
      ? Math.max(...companies.map((c) => Number(c.packageLPA || 0)))
      : 0

    const payload = {
      totals: {
        totalCompanies,
        totalStudents,
        totalApplications,
        offerCount,
        conversionRate,
        avgPackage,
        highestPackage
      },
      branchWiseOffers: Object.entries(branchOfferMap).map(([branch, offers]) => ({ branch, offers })),
      batchWiseOffers: Object.entries(batchWiseOffers).map(([batchYear, offers]) => ({ batchYear, offers })),
      batchBranchMatrix,
      packageTrend,
      topRecruiters
    }
    setCache(cacheKey, payload, 60 * 1000)
    res.status(200).json({ ...payload, cache: 'miss' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

module.exports = { getPlacementInsights }
