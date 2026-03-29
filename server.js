require('dotenv').config() //loads environment variables

const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const helmet = require('helmet')
const cors = require('cors')
const Sentry = require('@sentry/node')
const dataRoutes = require('./routes/data')
const userRoutes = require('./routes/user')
const notificationRoutes = require('./routes/notifications')
const companyRoutes = require('./routes/companies')
const companyApplicationRoutes = require('./routes/companyApplications')
const recruiterRoutes = require('./routes/recruiterRoutes')
const interviewSlotRoutes = require('./routes/interviewSlots')
const documentRoutes = require('./routes/documents')
const insightsRoutes = require('./routes/insights')
const healthRoutes = require('./routes/health')
const filesRoutes = require('./routes/files')
const offerRoutes = require('./routes/offers')
const aiAssistantRoutes = require('./routes/aiAssistant')
const policyRoutes = require('./routes/policies')
const todayRoutes = require('./routes/today')
const sanitizeInput = require('./middleware/sanitizeInput')
const { authLimiter, apiLimiter } = require('./middleware/rateLimiters')
const { requestLogger, info, error: logError } = require('./utils/logger')
const { notFoundHandler, errorHandler } = require('./middleware/errorHandlers')
// allow PORT override from environment for flexible local runs
const PORT = process.env.PORT || 4000
const {MONGO_URI} =require('./config/keys')

// creating express app
const app = express() 

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1)
  })
}

// middleware setup done
app.use(express.json())
app.use(cors())
app.use(helmet())
app.use(sanitizeInput)
app.use(requestLogger)
app.use('/api', apiLimiter)
app.use('/api/user', authLimiter)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// defining API  routes
app.use('/health', healthRoutes)
app.use('/api/data', dataRoutes)
app.use('/api/user', userRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/companies', companyRoutes)
app.use('/api/company-applications', companyApplicationRoutes)
app.use('/api/recruiters', recruiterRoutes)
app.use('/api/interview-slots', interviewSlotRoutes)
app.use('/api/documents', documentRoutes)
app.use('/api/insights', insightsRoutes)
app.use('/api/files', filesRoutes)
app.use('/api/offers', offerRoutes)
app.use('/api/ai-assistant', aiAssistantRoutes)
app.use('/api/policies', policyRoutes)
app.use('/api/today', todayRoutes)
app.use(notFoundHandler)
app.use(errorHandler)

// connect to db
const connectDb = async () => {
  const mongoUri = process.env.MONGO_URI || MONGO_URI
  if (!mongoUri) {
    info('db_missing_uri')
    return
  }
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 })
    info('db_connected')
  } catch (error) {
    logError('db_connection_error', { error: error.message })
  }
}

const startServer = async () => {
  await connectDb()
  app.listen(PORT, () => {
    info('server_started', { port: PORT })
  })
}

if (require.main === module) {
  startServer()
}

module.exports = app