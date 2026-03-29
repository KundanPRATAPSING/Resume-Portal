const log = (level, message, meta = {}) => {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...meta
  }
  if (level === 'error') {
    console.error(JSON.stringify(payload))
    return
  }
  console.log(JSON.stringify(payload))
}

const info = (message, meta = {}) => log('info', message, meta)
const warn = (message, meta = {}) => log('warn', message, meta)
const error = (message, meta = {}) => log('error', message, meta)

const requestLogger = (req, res, next) => {
  const start = Date.now()
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  req.requestId = requestId
  res.setHeader('x-request-id', requestId)

  res.on('finish', () => {
    info('http_request', {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - start
    })
  })
  next()
}

module.exports = { info, warn, error, requestLogger }
