const sanitizeObject = (input) => {
  if (Array.isArray(input)) {
    return input.map(sanitizeObject)
  }
  if (!input || typeof input !== 'object') {
    return input
  }

  const cleaned = {}
  Object.entries(input).forEach(([key, value]) => {
    // prevent NoSQL operator/path injection keys
    if (key.startsWith('$') || key.includes('.')) return

    if (typeof value === 'string') {
      cleaned[key] = value.replace(/[<>]/g, '').trim()
      return
    }
    cleaned[key] = sanitizeObject(value)
  })
  return cleaned
}

const sanitizeInput = (req, res, next) => {
  if (req.body) req.body = sanitizeObject(req.body)
  if (req.query) req.query = sanitizeObject(req.query)
  if (req.params) req.params = sanitizeObject(req.params)
  next()
}

module.exports = sanitizeInput
