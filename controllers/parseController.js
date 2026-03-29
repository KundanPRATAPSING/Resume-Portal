const pdfParseLib = require('pdf-parse')
const pdfParse = typeof pdfParseLib === 'function' ? pdfParseLib : pdfParseLib.default
const PDFParseV2 = typeof pdfParseLib?.PDFParse === 'function' ? pdfParseLib.PDFParse : null

// Lightweight heuristics to pull structured data from resume text.
const SKILL_KEYWORDS = [
  'javascript', 'typescript', 'react', 'node', 'express', 'mongodb', 'sql', 'python', 'java',
  'c++', 'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'git', 'html', 'css', 'tailwind',
  'bootstrap', 'redux', 'next.js', 'rest', 'graphql', 'jest', 'cypress'
]

const EDUCATION_KEYWORDS = [
  'b.tech', 'btech', 'b.e', 'b.e.', 'bachelor', 'master', 'm.tech', 'mtech', 'm.s', 'm.s.',
  'university', 'college', 'institute', 'degree', 'cgpa', 'gpa'
]

const EXPERIENCE_KEYWORDS = [
  'experience', 'intern', 'internship', 'engineer', 'developer', 'project', 'company', 'organization'
]

const PROJECT_KEYWORDS = ['project', 'projects', 'built', 'developed', 'implemented', 'designed']

const SECTION_BOUNDARY = /(education|experience|projects|skills|technical|work)/i

const cleanLines = (text) =>
  text
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

const extractContact = (text) => {
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  const phoneMatch = text.match(/(\+?\d[\d\s().-]{8,}\d)/)
  return {
    email: emailMatch ? emailMatch[0] : null,
    phone: phoneMatch ? phoneMatch[0].replace(/[^+\d]/g, '') : null
  }
}

const extractSkills = (text) => {
  const lower = text.toLowerCase()
  const found = new Set()
  SKILL_KEYWORDS.forEach((kw) => {
    if (lower.includes(kw)) found.add(kw)
  })
  return Array.from(found).sort()
}

const collectSectionAfterHeader = (lines, headerRegex) => {
  const idx = lines.findIndex((l) => headerRegex.test(l))
  if (idx === -1) return []

  const collected = []
  for (let i = idx + 1; i < lines.length; i++) {
    const line = lines[i]
    if (SECTION_BOUNDARY.test(line.toLowerCase()) && collected.length) break
    collected.push(line)
  }
  return collected.slice(0, 12) // keep it concise
}

const extractEducation = (lines) => {
  const section = collectSectionAfterHeader(lines, /education/i)
  if (section.length) return section

  // fallback: pick lines that look like education even without header
  return lines.filter((l) => EDUCATION_KEYWORDS.some((k) => l.toLowerCase().includes(k))).slice(0, 8)
}

const extractExperience = (lines) => {
  const section = collectSectionAfterHeader(lines, /experience|work/i)
  if (section.length) return section

  return lines.filter((l) => EXPERIENCE_KEYWORDS.some((k) => l.toLowerCase().includes(k))).slice(0, 10)
}

const extractProjects = (lines) => {
  const section = collectSectionAfterHeader(lines, /project/i)
  if (section.length) return section
  return lines.filter((l) => PROJECT_KEYWORDS.some((k) => l.toLowerCase().includes(k))).slice(0, 10)
}

const computeCompleteness = ({ contact, skills, education, experience, projects }) => {
  const criteria = [
    { key: 'contact', met: Boolean(contact.email || contact.phone) },
    { key: 'skills', met: skills.length >= 5 },
    { key: 'education', met: education.length > 0 },
    { key: 'experience', met: experience.length > 0 },
    { key: 'projects', met: projects.length > 0 },
    { key: 'resume_length', met: skills.length + education.length + experience.length + projects.length >= 8 }
  ]

  const met = criteria.filter((c) => c.met).length
  const score = Math.round((met / criteria.length) * 100)
  return { score, missing: criteria.filter((c) => !c.met).map((c) => c.key) }
}

const buildGapHints = ({ skills, experience, projects, completeness }) => {
  const hints = []
  const coreSkills = ['javascript', 'react', 'node', 'mongodb', 'sql', 'git']
  const missingCore = coreSkills.filter((skill) => !skills.includes(skill))

  if (missingCore.length > 0) {
    hints.push(`Consider adding evidence for these common hiring skills: ${missingCore.join(', ')}.`)
  }
  if (projects.length === 0) {
    hints.push('Add a dedicated Projects section with impact-focused bullet points.')
  }
  if (experience.length === 0) {
    hints.push('Include internships, freelance work, or relevant responsibilities to strengthen experience.')
  }
  if (completeness.score < 70) {
    hints.push('Resume completeness is below 70%. Add richer content in skills, projects, and achievements.')
  }
  return hints
}

const analyzeResumeText = (text) => {
  const lines = cleanLines(text)
  const contact = extractContact(text)
  const skills = extractSkills(text)
  const education = extractEducation(lines)
  const experience = extractExperience(lines)
  const projects = extractProjects(lines)
  const completeness = computeCompleteness({ contact, skills, education, experience, projects })
  const gapHints = buildGapHints({ skills, experience, projects, completeness })

  return {
    profile: {
      contact,
      skills,
      education,
      experience,
      projects,
      summary: lines.slice(0, 12)
    },
    completeness,
    gapHints
  }
}

const analyzeResumeBuffer = async (buffer) => {
  let text = ''

  // Support both pdf-parse v1 (function export) and v2 (PDFParse class).
  if (typeof pdfParse === 'function') {
    const parsed = await pdfParse(buffer)
    text = parsed?.text || ''
  } else if (PDFParseV2) {
    const parser = new PDFParseV2({ data: buffer })
    try {
      const parsed = await parser.getText()
      text = parsed?.text || ''
    } finally {
      try {
        await parser.destroy()
      } catch (e) {
        // no-op
      }
    }
  } else {
    throw new Error('Unsupported pdf-parse module format')
  }

  const analysis = analyzeResumeText(text)
  return { ...analysis, rawText: text }
}

const parseResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Resume file is required (PDF).' })
    }

    const dataBuffer = req.file.buffer
    const analysis = await analyzeResumeBuffer(dataBuffer)
    return res.status(200).json(analysis)
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Could not parse resume' })
  }
}

module.exports = { parseResume, analyzeResumeBuffer, analyzeResumeText }