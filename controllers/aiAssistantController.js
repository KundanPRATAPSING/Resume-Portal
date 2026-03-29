const Data = require('../models/dataModel')
const { analyzeResumeBuffer, analyzeResumeText } = require('./parseController')

const ACTION_VERBS = [
  'built', 'developed', 'designed', 'implemented', 'led', 'optimized',
  'delivered', 'improved', 'automated', 'deployed', 'architected', 'integrated'
]

const normalizeWords = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9+\s]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean)

const unique = (arr = []) => Array.from(new Set(arr.filter(Boolean)))

const scoreFromPercent = (value) => Math.max(0, Math.min(100, Number(value || 0)))

const profileToText = (profile = {}) =>
  [
    ...(profile.skills || []),
    ...(profile.education || []),
    ...(profile.experience || []),
    ...(profile.projects || []),
    ...(profile.summary || [])
  ].join(' ')

const collectKeywordsFromJd = (jdText) => {
  const words = normalizeWords(jdText)
  return unique(words.filter((w) => w.length >= 3))
}

const buildAtsReport = ({ analysis, jdText = '' }) => {
  const profile = analysis?.profile || {}
  const resumeText = profileToText(profile).toLowerCase()
  const resumeWords = unique(normalizeWords(resumeText))
  const jdKeywords = collectKeywordsFromJd(jdText)
  const matchedKeywords = jdKeywords.filter((kw) => resumeWords.includes(kw))
  const missingKeywords = jdKeywords.filter((kw) => !resumeWords.includes(kw)).slice(0, 15)

  const keywordScore = jdKeywords.length
    ? Math.round((matchedKeywords.length / jdKeywords.length) * 100)
    : Math.min((profile.skills || []).length * 10, 100)

  const sectionChecks = {
    contact: Boolean(profile?.contact?.email || profile?.contact?.phone),
    skills: (profile.skills || []).length >= 5,
    education: (profile.education || []).length > 0,
    experience: (profile.experience || []).length > 0,
    projects: (profile.projects || []).length > 0
  }
  const sectionHits = Object.values(sectionChecks).filter(Boolean).length
  const sectionScore = Math.round((sectionHits / Object.keys(sectionChecks).length) * 100)

  const impactLineCount = (profile.experience || [])
    .concat(profile.projects || [])
    .filter((line) => /\d/.test(line) || ACTION_VERBS.some((v) => String(line).toLowerCase().includes(v))).length
  const impactScore = Math.min(100, impactLineCount * 20)

  const readabilityScore = scoreFromPercent(analysis?.completeness?.score || 0)
  const overallScore = Math.round(
    keywordScore * 0.4 +
    sectionScore * 0.25 +
    impactScore * 0.2 +
    readabilityScore * 0.15
  )

  const fixes = []
  if (keywordScore < 60) {
    fixes.push('Add more job-description keywords naturally in Skills, Experience, and Projects sections.')
  }
  if (!sectionChecks.skills) fixes.push('Include at least 5-8 technical skills relevant to your target role.')
  if (!sectionChecks.projects) fixes.push('Add a Projects section with 2-3 strong projects and measurable outcomes.')
  if (!sectionChecks.experience) fixes.push('Include internship/work experience or leadership work to improve ATS relevance.')
  if (impactScore < 60) fixes.push('Use action + impact bullets (for example: "Reduced API latency by 32%").')
  if (!sectionChecks.contact) fixes.push('Ensure email and phone are clearly present at the top of the resume.')
  if (readabilityScore < 70) fixes.push('Increase resume completeness by adding clearer section headings and concise bullets.')
  if (missingKeywords.length > 0) {
    fixes.push(`Consider adding these missing keywords where applicable: ${missingKeywords.slice(0, 8).join(', ')}.`)
  }

  return {
    overallScore,
    verdict: overallScore >= 80 ? 'Strong ATS Fit' : overallScore >= 65 ? 'Moderate ATS Fit' : 'Needs Improvement',
    breakdown: {
      keywordScore,
      sectionScore,
      impactScore,
      readabilityScore
    },
    keywordMatch: {
      totalKeywords: jdKeywords.length,
      matchedKeywords: matchedKeywords.slice(0, 20),
      missingKeywords
    },
    checks: sectionChecks,
    fixes: unique(fixes).slice(0, 10),
    gapHints: analysis?.gapHints || []
  }
}

const getUserResumeAnalysis = async (userId) => {
  const latest = await Data.findOne({ user_id: String(userId) })
    .sort({ updatedAt: -1 })
    .select('ResumeAnalysis')
  return latest?.ResumeAnalysis || null
}

const atsCheckFromStoredResume = async (req, res) => {
  try {
    const { jdText = '' } = req.body
    const analysis = await getUserResumeAnalysis(req.user._id)
    if (!analysis) {
      return res.status(400).json({ error: 'No uploaded resume found. Upload a resume first or use Upload Resume mode.' })
    }
    const report = buildAtsReport({ analysis, jdText })
    return res.status(200).json({ source: 'stored', report })
  } catch (error) {
    return res.status(400).json({ error: error.message })
  }
}

const atsCheckFromUploadedResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a resume PDF.' })
    }
    const analysis = await analyzeResumeBuffer(req.file.buffer)
    const jdText = String(req.body.jdText || '')
    const report = buildAtsReport({ analysis, jdText })
    return res.status(200).json({ source: 'uploaded', report })
  } catch (error) {
    return res.status(400).json({ error: error.message })
  }
}

const atsFixSuggestions = async (req, res) => {
  try {
    const { jdText = '', resumeText = '' } = req.body
    let analysis = null

    if (resumeText.trim()) {
      analysis = analyzeResumeText(resumeText)
    } else {
      analysis = await getUserResumeAnalysis(req.user._id)
    }
    if (!analysis) {
      return res.status(400).json({ error: 'Resume context missing. Upload or provide resume content first.' })
    }

    const report = buildAtsReport({ analysis, jdText })
    return res.status(200).json({
      fixes: report.fixes,
      gapHints: report.gapHints,
      priority: [
        ...(report.breakdown.keywordScore < 60 ? ['Improve JD keyword alignment'] : []),
        ...(report.breakdown.impactScore < 60 ? ['Add measurable achievements'] : []),
        ...(report.breakdown.sectionScore < 80 ? ['Complete all major sections'] : [])
      ]
    })
  } catch (error) {
    return res.status(400).json({ error: error.message })
  }
}

module.exports = {
  atsCheckFromStoredResume,
  atsCheckFromUploadedResume,
  atsFixSuggestions
}
