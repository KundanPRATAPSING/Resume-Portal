const mongoose = require('mongoose')
const InterviewSlot = require('../models/interviewSlotModel')
const Company = require('../models/companyModel')

const getSlots = async (req, res) => {
  try {
    const { companyId } = req.params
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(404).json({ error: 'No such company.' })
    }
    const slots = await InterviewSlot.find({ companyId }).sort({ slotStart: 1 })
    res.status(200).json(slots)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const createSlot = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can create slots.' })
    }
    const { companyId } = req.params
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(404).json({ error: 'No such company.' })
    }
    const company = await Company.findById(companyId)
    if (!company) return res.status(404).json({ error: 'No such company.' })

    const { title, slotStart, slotEnd, location, capacity } = req.body
    if (!title || !slotStart || !slotEnd) {
      return res.status(400).json({ error: 'title, slotStart and slotEnd are required.' })
    }
    const created = await InterviewSlot.create({
      companyId,
      title,
      slotStart,
      slotEnd,
      location: location || 'Virtual',
      capacity: Number(capacity || 1),
      createdBy: req.user._id
    })
    res.status(200).json(created)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const bookSlot = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ error: 'Admin cannot book interview slots.' })
    }
    const { slotId } = req.params
    if (!mongoose.Types.ObjectId.isValid(slotId)) {
      return res.status(404).json({ error: 'No such slot.' })
    }
    const slot = await InterviewSlot.findById(slotId)
    if (!slot) return res.status(404).json({ error: 'No such slot.' })

    if (slot.bookedUsers.includes(req.user._id.toString())) {
      return res.status(200).json(slot)
    }
    if (slot.bookedUsers.length >= slot.capacity) {
      return res.status(400).json({ error: 'Slot is already full.' })
    }

    slot.bookedUsers.push(req.user._id.toString())
    await slot.save()
    res.status(200).json(slot)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const unbookSlot = async (req, res) => {
  try {
    const { slotId } = req.params
    if (!mongoose.Types.ObjectId.isValid(slotId)) {
      return res.status(404).json({ error: 'No such slot.' })
    }
    const slot = await InterviewSlot.findById(slotId)
    if (!slot) return res.status(404).json({ error: 'No such slot.' })

    slot.bookedUsers = slot.bookedUsers.filter((id) => id !== req.user._id.toString())
    await slot.save()
    res.status(200).json(slot)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

module.exports = {
  getSlots,
  createSlot,
  bookSlot,
  unbookSlot
}
