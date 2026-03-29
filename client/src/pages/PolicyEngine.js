import { useEffect, useState } from 'react'
import { useAuthContext } from '../hooks/useAuthContext'

const API_BASE = 'http://localhost:4000'

const PolicyEngine = () => {
  const { user } = useAuthContext()
  const [policy, setPolicy] = useState(null)
  const [error, setError] = useState('')

  const load = async () => {
    const response = await fetch(`${API_BASE}/api/policies`, {
      headers: { Authorization: `Bearer ${user.token}` }
    })
    const json = await response.json()
    if (!response.ok) {
      setError(json.error || 'Unable to fetch policy')
      return
    }
    setPolicy(json)
  }

  useEffect(() => {
    if (user?.token && user?.role === 'admin') load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token, user?.role])

  const save = async () => {
    setError('')
    const response = await fetch(`${API_BASE}/api/policies`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`
      },
      body: JSON.stringify(policy)
    })
    const json = await response.json()
    if (!response.ok) {
      setError(json.error || 'Unable to save policy')
      return
    }
    setPolicy(json)
  }

  if (user?.role !== 'admin') {
    return (
      <div className="tool-page">
        <div className="container py-4 tool-page-content">
          <div className="alert alert-warning">Policy engine is admin-only.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="tool-page">
      <div className="container py-4 tool-page-content">
      <h3 className="mb-3 text-white">Admin Policy Engine</h3>
      {error && <div className="alert alert-danger">{error}</div>}
      {policy && (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                checked={policy.dreamOfferLockoutEnabled}
                onChange={(e) => setPolicy((p) => ({ ...p, dreamOfferLockoutEnabled: e.target.checked }))}
              />
              <label className="form-check-label">Enable “1 dream offer lockout”</label>
            </div>
            <div className="mb-3">
              <label className="form-label">Dream package threshold (LPA)</label>
              <input
                type="number"
                className="form-control"
                value={policy.dreamMinPackageLPA}
                onChange={(e) => setPolicy((p) => ({ ...p, dreamMinPackageLPA: Number(e.target.value || 0) }))}
              />
            </div>
            <div className="form-check form-switch mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                checked={policy.maxActiveApplicationsEnabled}
                onChange={(e) => setPolicy((p) => ({ ...p, maxActiveApplicationsEnabled: e.target.checked }))}
              />
              <label className="form-check-label">Enable max active applications cap</label>
            </div>
            <div className="mb-3">
              <label className="form-label">Max active applications</label>
              <input
                type="number"
                className="form-control"
                value={policy.maxActiveApplications}
                onChange={(e) => setPolicy((p) => ({ ...p, maxActiveApplications: Number(e.target.value || 0) }))}
              />
            </div>
            <button className="btn btn-primary" onClick={save}>Save Policy</button>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default PolicyEngine
