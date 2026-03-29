const cacheStore = new Map()

const setCache = (key, value, ttlMs = 60000) => {
  cacheStore.set(key, { value, expiresAt: Date.now() + ttlMs })
}

const getCache = (key) => {
  const entry = cacheStore.get(key)
  if (!entry) return null
  if (entry.expiresAt < Date.now()) {
    cacheStore.delete(key)
    return null
  }
  return entry.value
}

const delCache = (key) => {
  cacheStore.delete(key)
}

const clearByPrefix = (prefix) => {
  for (const key of cacheStore.keys()) {
    if (key.startsWith(prefix)) cacheStore.delete(key)
  }
}

module.exports = { setCache, getCache, delCache, clearByPrefix }
