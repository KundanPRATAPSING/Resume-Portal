const { error: logError } = require('../utils/logger')
const Sentry = require('@sentry/node')

const notFoundHandler = (req, res, next) => {
  res.status(404).json({ error: 'Route not found' })
}

const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500
  logError('unhandled_error', {
    requestId: req.requestId,
    path: req.originalUrl,
    method: req.method,
    status,
    error: err.message
  })
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err)
  }
  res.status(status).json({
    error: status === 500 ? 'Internal server error' : err.message,
    requestId: req.requestId
  })
}

module.exports = { notFoundHandler, errorHandler }
