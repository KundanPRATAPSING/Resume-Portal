import React, { useEffect, useState } from 'react'
import { useAuthContext } from "../hooks/useAuthContext"
import formatDistanceToNow from 'date-fns/formatDistanceToNow'

const API_BASE_CANDIDATES = [
  process.env.REACT_APP_API_URL,
  'http://localhost:4000',
  'http://localhost:4001',
  ''
].filter(Boolean)

const apiFetch = async (path, options = {}) => {
  let lastError = null
  for (const base of API_BASE_CANDIDATES) {
    try {
      return await fetch(`${base}${path}`, options)
    } catch (e) {
      lastError = e
    }
  }
  throw lastError || new Error('Failed to fetch')
}

const readJson = async (response) => {
  try {
    return await response.json()
  } catch (e) {
    return {}
  }
}

function NotificationsList({ refreshTick = 0 }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { user } = useAuthContext()

  const load = async () => {
    if (!user?.token) return
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '12'
      })
      if (search.trim()) params.set('search', search.trim())
      const response = await apiFetch(`/api/notifications?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      })
      const json = await readJson(response)
      if (!response.ok) throw new Error(json.error || 'Unable to fetch notifications.')
      const nextItems = Array.isArray(json) ? json : (json.items || [])
      setItems(nextItems)
      setTotalPages(json.totalPages || 1)

      if (user.role !== 'admin') {
        apiFetch('/api/notifications/mark-read', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          }
        }).catch(() => {})
      }
    } catch (e) {
      setError(e.message || 'Unable to fetch notifications.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token, user?.role, page, refreshTick])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    load()
  }

  const handleDelete = async (id) => {
    if (!user?.token || user.role !== 'admin') return
    try {
      const response = await apiFetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        }
      })
      const json = await readJson(response)
      if (!response.ok) throw new Error(json.error || 'Delete failed.')
      setItems((prev) => prev.filter((x) => x._id !== id))
    } catch (e) {
      setError(e.message || 'Delete failed.')
    }
  }

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <h5 className="mb-0">{user?.role === 'admin' ? 'Published Notifications' : 'Latest Notifications'}</h5>
          <form className="d-flex gap-2" onSubmit={handleSearch}>
            <input
              className="form-control"
              style={{ minWidth: '250px' }}
              placeholder="Search title or content"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn btn-outline-primary" type="submit">Search</button>
          </form>
        </div>

        {loading && <p className="text-muted mb-0">Loading notifications...</p>}
        {error && <div className="alert alert-danger mb-0">{error}</div>}

        {!loading && !error && items.length === 0 && (
          <div className="alert alert-info mb-0">No notifications found.</div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="notifications-grid">
            {items.map((item) => (
              <article key={item._id} className="notification-card">
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <h6 className="mb-1">🔵 {item.title}</h6>
                  {user?.role === 'admin' && (
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item._id)}>
                      Delete
                    </button>
                  )}
                </div>
                <p className="mb-2">{item.description}</p>
                {user?.role === 'admin' && (
                  <p className="small mb-2 text-muted">
                    <strong>Targets:</strong>{' '}
                    {(item.targetRoles?.length || item.targetBranches?.length || item.targetBatchYears?.length)
                      ? `${item.targetRoles?.length ? `Roles(${item.targetRoles.join(', ')}) ` : ''}${item.targetBranches?.length ? `Branches(${item.targetBranches.join(', ')}) ` : ''}${item.targetBatchYears?.length ? `Batch(${item.targetBatchYears.join(', ')})` : ''}`
                      : 'All students'}
                  </p>
                )}
                <p className="small text-muted mb-0">
                  Published on {new Date(item.createdAt).toLocaleDateString()} {' '}
                  ({formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })})
                </p>
              </article>
            ))}
          </div>
        )}

        <div className="d-flex justify-content-between align-items-center mt-3">
          <small className="text-muted">Page {page} of {totalPages}</small>
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Prev
            </button>
            <button className="btn btn-sm btn-outline-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotificationsList

