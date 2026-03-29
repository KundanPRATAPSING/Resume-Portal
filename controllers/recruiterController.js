const Recruiter = require('../models/recruiterModel')

const getAllRecruiters = async (req, res) => {
  try {
    const recruiters = await Recruiter.find().sort({ createdAt: -1 })
    res.status(200).json(recruiters)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const createRecruiterDetails = async (req, res) => {
  try {
    const {
      companyName,
      recruiterName,
      roles,
      ctc,
      intake,
      skills,
      location,
      deadline,
      email
    } = req.body

    const emptyFields = []
    if (!companyName) emptyFields.push('companyName')
    if (!recruiterName) emptyFields.push('recruiterName')
    if (!roles) emptyFields.push('roles')
    if (!ctc) emptyFields.push('ctc')
    if (!intake && intake !== 0) emptyFields.push('intake')
    if (!skills) emptyFields.push('skills')
    if (!location) emptyFields.push('location')
    if (!deadline) emptyFields.push('deadline')

    if (emptyFields.length > 0) {
      return res.status(400).json({ error: 'Please fill all required fields.', emptyFields })
    }

    const created = await Recruiter.create({
      companyName,
      recruiterName,
      roles,
      ctc,
      intake: Number(intake),
      skills,
      location,
      deadline,
      email
    })

    res.status(200).json(created)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

module.exports = {
  getAllRecruiters,
  createRecruiterDetails
}
