const express = require('express')
const mongoose = require('mongoose')

const router = express.Router()

router.get('/live', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'resume-portal-api', uptimeSec: process.uptime() })
})

router.get('/ready', (req, res) => {
  const isDbReady = mongoose.connection.readyState === 1
  if (!isDbReady) {
    return res.status(503).json({ status: 'degraded', db: 'not-ready' })
  }
  res.status(200).json({ status: 'ok', db: 'ready' })
})

module.exports = router
