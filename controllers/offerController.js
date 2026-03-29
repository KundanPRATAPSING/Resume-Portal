const Offer = require('../models/offerModel')

const totalCtc = (offer) =>
  Number(offer.baseSalaryLPA || 0) +
  Number(offer.joiningBonusLPA || 0) +
  Number(offer.variablePayLPA || 0) +
  Number(offer.stockLPA || 0) +
  Number(offer.perksLPA || 0)

const getOffers = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { userId: req.user._id }
    const offers = await Offer.find(filter).sort({ createdAt: -1 })
    res.status(200).json(
      offers.map((offer) => ({
        ...offer.toObject(),
        totalCtcLPA: Number(totalCtc(offer).toFixed(2))
      }))
    )
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const createOffer = async (req, res) => {
  try {
    const payload = {
      userId: req.user._id,
      companyName: req.body.companyName,
      roleType: req.body.roleType,
      location: req.body.location,
      baseSalaryLPA: Number(req.body.baseSalaryLPA || 0),
      joiningBonusLPA: Number(req.body.joiningBonusLPA || 0),
      variablePayLPA: Number(req.body.variablePayLPA || 0),
      stockLPA: Number(req.body.stockLPA || 0),
      perksLPA: Number(req.body.perksLPA || 0),
      growthScore: Number(req.body.growthScore || 5),
      notes: req.body.notes || ''
    }
    if (!payload.companyName || !payload.location) {
      return res.status(400).json({ error: 'companyName and location are required.' })
    }
    const created = await Offer.create(payload)
    res.status(200).json({
      ...created.toObject(),
      totalCtcLPA: Number(totalCtc(created).toFixed(2))
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

const compareOffers = async (req, res) => {
  try {
    const ids = Array.isArray(req.body.offerIds) ? req.body.offerIds : []
    if (ids.length < 2) {
      return res.status(400).json({ error: 'Select at least 2 offers to compare.' })
    }

    const filter = req.user.role === 'admin' ? { _id: { $in: ids } } : { _id: { $in: ids }, userId: req.user._id }
    const offers = await Offer.find(filter)
    if (offers.length < 2) {
      return res.status(400).json({ error: 'Not enough offers available for comparison.' })
    }

    const maxCtc = Math.max(...offers.map((offer) => totalCtc(offer)), 1)
    const ranked = offers
      .map((offer) => {
        const ctc = totalCtc(offer)
        const ctcScore = (ctc / maxCtc) * 10
        const weightedScore = Number((ctcScore * 0.6 + Number(offer.growthScore || 0) * 0.4).toFixed(2))
        return {
          ...offer.toObject(),
          totalCtcLPA: Number(ctc.toFixed(2)),
          ctcScore: Number(ctcScore.toFixed(2)),
          weightedScore
        }
      })
      .sort((a, b) => b.weightedScore - a.weightedScore)

    res.status(200).json({
      winner: ranked[0],
      ranked
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

module.exports = {
  getOffers,
  createOffer,
  compareOffers
}
